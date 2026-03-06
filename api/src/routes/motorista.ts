import { Router } from 'express';
import { pool } from '../db/pool';
import { requireAuth, AuthRequest } from '../middleware/auth';
import crypto from 'crypto';
import { signMotoristaAppToken } from '../lib/appToken';

const router = Router();

function hashPin(pin: string) {
  return crypto.createHash('sha256').update(pin).digest('hex');
}

function isValidPin(pin: string) {
  return /^\d{4,6}$/.test(pin);
}

// Login rapido por PIN (sem Google)
router.post('/login-pin', async (req, res) => {
  const { motorista_id, pin } = req.body;

  if (!motorista_id || !pin) {
    return res.status(400).json({ error: 'motorista_id e pin sao obrigatorios' });
  }
  if (!isValidPin(String(pin))) {
    return res.status(400).json({ error: 'PIN deve ter entre 4 e 6 digitos numericos' });
  }

  const pinHash = hashPin(String(pin));
  const { rows } = await pool.query(
    `SELECT id, tenant_id, nome, firebase_uid, pin_hash
     FROM motoristas
     WHERE id = $1 AND ativo = true AND cadastro_completo = true`,
    [motorista_id]
  );

  if (rows.length === 0) {
    return res.status(404).json({ error: 'Motorista nao encontrado' });
  }

  const motorista = rows[0];
  if (!motorista.pin_hash || motorista.pin_hash !== pinHash) {
    return res.status(401).json({ error: 'PIN incorreto' });
  }

  const app_token = signMotoristaAppToken({
    sub: motorista.id,
    tenant_id: motorista.tenant_id,
    role: 'motorista',
  });

  return res.json({
    app_token,
    user: {
      id: motorista.id,
      tenant_id: motorista.tenant_id,
      firebase_uid: motorista.firebase_uid,
      nome: motorista.nome,
    },
  });
});

router.use(requireAuth as any);

router.post('/definir-pin', async (req: AuthRequest, res) => {
  if (req.user!.role !== 'motorista') {
    return res.status(403).json({ error: 'Apenas motoristas' });
  }

  const { pin } = req.body;
  if (!pin || !isValidPin(String(pin))) {
    return res.status(400).json({ error: 'PIN deve ter entre 4 e 6 digitos numericos' });
  }

  const pinHash = hashPin(String(pin));
  await pool.query('UPDATE motoristas SET pin_hash = $1 WHERE id = $2', [pinHash, req.user!.id]);

  res.json({ ok: true });
});

// Verificar PIN
router.post('/verificar-pin', async (req: AuthRequest, res) => {
  if (req.user!.role !== 'motorista') {
    return res.status(403).json({ error: 'Apenas motoristas' });
  }

  const { pin } = req.body;
  if (!pin || !isValidPin(String(pin))) {
    return res.status(400).json({ error: 'PIN deve ter entre 4 e 6 digitos numericos' });
  }

  const pinHash = hashPin(String(pin));

  const { rows } = await pool.query(
    'SELECT id FROM motoristas WHERE id = $1 AND pin_hash = $2',
    [req.user!.id, pinHash]
  );

  if (rows.length === 0) {
    return res.status(401).json({ error: 'PIN incorreto' });
  }

  res.json({ ok: true });
});

router.get('/veiculos-tablet', async (req: AuthRequest, res) => {
  if (req.user!.role !== 'motorista') {
    return res.status(403).json({ error: 'Apenas motoristas' });
  }

  const deviceId = String(req.query.device_id || '');
  if (!deviceId) {
    return res.status(400).json({ error: 'device_id obrigatorio' });
  }

  const { rows } = await pool.query(
    `SELECT
      v.id,
      v.placa,
      v.modelo,
      tv.device_id as vinculo_device_id,
      tv.device_nome as vinculo_device_nome,
      tv.motorista_id as vinculo_motorista_id,
      CASE
        WHEN vm.motorista_id IS NULL THEN false
        ELSE true
      END as motorista_habilitado
    FROM veiculos v
    LEFT JOIN tablet_vinculos tv ON tv.veiculo_id = v.id AND tv.ativo = true
    LEFT JOIN veiculo_motoristas vm
      ON vm.veiculo_id = v.id
      AND vm.motorista_id = $1
      AND vm.ativo = true
    WHERE v.tenant_id = $2 AND v.ativo = true
    ORDER BY v.placa`,
    [req.user!.id, req.user!.tenant_id]
  );

  res.json(
    rows.map((row) => {
      const vinculado = Boolean(row.vinculo_device_id);
      const vinculado_neste_tablet = vinculado && row.vinculo_device_id === deviceId;
      return {
        id: row.id,
        placa: row.placa,
        modelo: row.modelo,
        motorista_habilitado: row.motorista_habilitado,
        status: vinculado
          ? (vinculado_neste_tablet ? 'vinculado_neste_tablet' : 'vinculado_em_outro_tablet')
          : 'livre',
        vinculo: vinculado
          ? {
              device_id: row.vinculo_device_id,
              device_nome: row.vinculo_device_nome,
              motorista_id: row.vinculo_motorista_id,
            }
          : null,
      };
    })
  );
});

router.get('/tablet-vinculo', async (req: AuthRequest, res) => {
  if (req.user!.role !== 'motorista') {
    return res.status(403).json({ error: 'Apenas motoristas' });
  }

  const deviceId = String(req.query.device_id || '');
  if (!deviceId) {
    return res.status(400).json({ error: 'device_id obrigatorio' });
  }

  const { rows } = await pool.query(
    `SELECT tv.id, tv.veiculo_id, v.placa, v.modelo
     FROM tablet_vinculos tv
     JOIN veiculos v ON v.id = tv.veiculo_id
     WHERE tv.tenant_id = $1 AND tv.device_id = $2 AND tv.ativo = true
     LIMIT 1`,
    [req.user!.tenant_id, deviceId]
  );

  res.json(rows[0] || null);
});

router.post('/vincular-tablet', async (req: AuthRequest, res) => {
  if (req.user!.role !== 'motorista') {
    return res.status(403).json({ error: 'Apenas motoristas' });
  }

  const { veiculo_id, device_id, device_nome } = req.body;
  if (!veiculo_id || !device_id) {
    return res.status(400).json({ error: 'veiculo_id e device_id sao obrigatorios' });
  }

  await pool.query('BEGIN');
  try {
    const veiculoResult = await pool.query(
      'SELECT id, placa FROM veiculos WHERE id = $1 AND tenant_id = $2 AND ativo = true',
      [veiculo_id, req.user!.tenant_id]
    );
    if (veiculoResult.rows.length === 0) {
      await pool.query('ROLLBACK');
      return res.status(404).json({ error: 'Veiculo nao encontrado' });
    }

    const habilitadoResult = await pool.query(
      'SELECT 1 FROM veiculo_motoristas WHERE veiculo_id = $1 AND motorista_id = $2 AND ativo = true',
      [veiculo_id, req.user!.id]
    );
    if (habilitadoResult.rows.length === 0) {
      await pool.query('ROLLBACK');
      return res.status(403).json({ error: 'Motorista nao habilitado para este veiculo' });
    }

    const bloqueioResult = await pool.query(
      'SELECT id FROM tablet_vinculos WHERE veiculo_id = $1 AND ativo = true AND device_id <> $2',
      [veiculo_id, device_id]
    );
    if (bloqueioResult.rows.length > 0) {
      await pool.query('ROLLBACK');
      return res.status(409).json({ error: 'Este veiculo ja esta vinculado a outro tablet' });
    }

    await pool.query(
      'UPDATE tablet_vinculos SET ativo = false, atualizado_em = now() WHERE tenant_id = $1 AND device_id = $2 AND ativo = true',
      [req.user!.tenant_id, device_id]
    );

    await pool.query(
      `INSERT INTO tablet_vinculos (tenant_id, veiculo_id, motorista_id, device_id, device_nome, ativo)
       VALUES ($1, $2, $3, $4, $5, true)
       ON CONFLICT (veiculo_id) WHERE ativo = true
       DO UPDATE SET
         motorista_id = EXCLUDED.motorista_id,
         device_id = EXCLUDED.device_id,
         device_nome = EXCLUDED.device_nome,
         ativo = true,
         atualizado_em = now()`,
      [req.user!.tenant_id, veiculo_id, req.user!.id, device_id, device_nome ?? null]
    );

    await pool.query('COMMIT');
    return res.json({ ok: true });
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('Vincular tablet error:', err);
    return res.status(500).json({ error: 'Erro ao vincular tablet' });
  }
});

// Listar rotas do motorista
router.get('/rotas', async (req: AuthRequest, res) => {
  if (req.user!.role !== 'motorista') {
    return res.status(403).json({ error: 'Apenas motoristas' });
  }

  const { rows } = await pool.query(`
    SELECT r.*,
      (SELECT COUNT(*) FROM rota_paradas rp WHERE rp.rota_id = r.id) as paradas_count
    FROM rotas r
    WHERE r.motorista_id = $1 AND r.ativo = true
    ORDER BY r.turno, r.nome
  `, [req.user!.id]);

  res.json(rows);
});

// Detalhes de uma rota
router.get('/rotas/:id', async (req: AuthRequest, res) => {
  if (req.user!.role !== 'motorista') {
    return res.status(403).json({ error: 'Apenas motoristas' });
  }

  const { id } = req.params;

  const rotaResult = await pool.query(
    'SELECT * FROM rotas WHERE id = $1 AND motorista_id = $2',
    [id, req.user!.id]
  );

  if (rotaResult.rows.length === 0) {
    return res.status(404).json({ error: 'Rota nao encontrada' });
  }

  const rota = rotaResult.rows[0];

  // Buscar paradas com dados dos alunos
  const paradasResult = await pool.query(`
    SELECT rp.*, a.nome as aluno_nome, a.endereco as aluno_endereco, a.lat, a.lng
    FROM rota_paradas rp
    LEFT JOIN alunos a ON a.id = rp.aluno_id
    WHERE rp.rota_id = $1
    ORDER BY rp.ordem
  `, [id]);

  rota.paradas = paradasResult.rows;
  res.json(rota);
});

export default router;
