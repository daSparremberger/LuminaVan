import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { auth } from './lib/firebase';
import { pool } from './db/pool';
import { verifyAppToken } from './lib/appToken';

interface MotoristaLocation {
  motorista_id: number;
  tenant_id: number;
  nome: string;
  lat: number;
  lng: number;
  speed: number;
  heading: number;
  rota_id?: number;
  rota_nome?: string;
  timestamp: number;
}

// Store de localizacoes em memoria
const locations = new Map<number, MotoristaLocation>();

export function setupSocket(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  // Middleware de autenticacao
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Token ausente'));
    }

    try {
      // Buscar usuario (gestor ou motorista)
      let user: any = null;

      const appToken = verifyAppToken(token);
      if (appToken) {
        const motoristaResult = await pool.query(
          'SELECT id, tenant_id, nome FROM motoristas WHERE id = $1 AND tenant_id = $2 AND ativo = true',
          [appToken.sub, appToken.tenant_id]
        );
        if (motoristaResult.rows.length > 0) {
          user = { ...motoristaResult.rows[0], role: 'motorista' };
        }
      }
      if (!user) {
        const decoded = await auth.verifyIdToken(token);
        const uid = decoded.uid;

        const gestorResult = await pool.query(
          'SELECT id, tenant_id, nome FROM gestores WHERE firebase_uid = $1 AND ativo = true',
          [uid]
        );
        if (gestorResult.rows.length > 0) {
          user = { ...gestorResult.rows[0], role: 'gestor' };
        }

        if (!user) {
          const motoristaResult = await pool.query(
            'SELECT id, tenant_id, nome FROM motoristas WHERE firebase_uid = $1 AND ativo = true',
            [uid]
          );
          if (motoristaResult.rows.length > 0) {
            user = { ...motoristaResult.rows[0], role: 'motorista' };
          }
        }
      }

      if (!user) {
        return next(new Error('Usuario nao encontrado'));
      }

      socket.data.user = user;
      next();
    } catch (err) {
      next(new Error('Token invalido'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = socket.data.user;
    console.log(`[Socket] ${user.role} conectado: ${user.nome} (tenant ${user.tenant_id})`);

    // Entrar na sala do tenant
    socket.join(`tenant:${user.tenant_id}`);

    // Gestor solicita localizacoes atuais
    if (user.role === 'gestor') {
      socket.on('get_locations', () => {
        const tenantLocations = Array.from(locations.values())
          .filter(l => l.tenant_id === user.tenant_id);
        socket.emit('all_locations', tenantLocations);
      });
    }

    // Motorista envia localizacao
    if (user.role === 'motorista') {
      socket.on('location_update', async (data: { lat: number; lng: number; speed?: number; heading?: number; rota_id?: number }) => {
        // Buscar nome da rota se houver
        let rota_nome: string | undefined;
        if (data.rota_id) {
          const rotaResult = await pool.query('SELECT nome FROM rotas WHERE id = $1', [data.rota_id]);
          if (rotaResult.rows.length > 0) {
            rota_nome = rotaResult.rows[0].nome;
          }
        }

        const location: MotoristaLocation = {
          motorista_id: user.id,
          tenant_id: user.tenant_id,
          nome: user.nome,
          lat: data.lat,
          lng: data.lng,
          speed: data.speed ?? 0,
          heading: data.heading ?? 0,
          rota_id: data.rota_id,
          rota_nome,
          timestamp: Date.now()
        };

        // Salvar no store
        locations.set(user.id, location);

        // Broadcast para gestores do mesmo tenant
        io.to(`tenant:${user.tenant_id}`).emit('location_update', location);
      });

      // Motorista desconecta
      socket.on('disconnect', () => {
        console.log(`[Socket] Motorista desconectado: ${user.nome}`);
        // Manter localizacao por 5 minutos apos desconexao
        setTimeout(() => {
          const loc = locations.get(user.id);
          if (loc && Date.now() - loc.timestamp > 5 * 60 * 1000) {
            locations.delete(user.id);
            io.to(`tenant:${user.tenant_id}`).emit('motorista_offline', { motorista_id: user.id });
          }
        }, 5 * 60 * 1000);
      });
    }

    // Chat: enviar mensagem
    socket.on('chat:message', async (data: { destinatario_id: number; destinatario_tipo: string; conteudo: string }) => {
      const { destinatario_id, destinatario_tipo, conteudo } = data;

      // Salvar no banco
      const result = await pool.query(`
        INSERT INTO mensagens (tenant_id, remetente_id, remetente_tipo, destinatario_id, destinatario_tipo, conteudo)
        VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
      `, [user.tenant_id, user.id, user.role, destinatario_id, destinatario_tipo, conteudo]);

      const mensagem = { ...result.rows[0], remetente_nome: user.nome };

      // Emitir para o remetente (confirmacao)
      socket.emit('chat:message', mensagem);

      // Emitir para o destinatario se estiver online
      io.to(`tenant:${user.tenant_id}`).emit('chat:message', mensagem);
    });

    // Chat: marcar como lido
    socket.on('chat:read', async (data: { remetente_id: number; remetente_tipo: string }) => {
      await pool.query(`
        UPDATE mensagens SET lido = true
        WHERE destinatario_id = $1 AND destinatario_tipo = $2
          AND remetente_id = $3 AND remetente_tipo = $4
          AND lido = false
      `, [user.id, user.role, data.remetente_id, data.remetente_tipo]);

      // Notificar o remetente que as mensagens foram lidas
      io.to(`tenant:${user.tenant_id}`).emit('chat:read', {
        reader_id: user.id,
        reader_tipo: user.role
      });
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] ${user.role} desconectado: ${user.nome}`);
    });
  });

  return io;
}
