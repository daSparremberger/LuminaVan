import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { pool } from './db/pool';
import { setupSocket } from './socket';
import authRouter from './routes/auth';
import escolasRouter from './routes/escolas';
import alunosRouter from './routes/alunos';
import motoristasRouter from './routes/motoristas';
import rotasRouter from './routes/rotas';
import execucaoRouter from './routes/execucao';
import conviteRouter from './routes/convite';
import motoristaAppRouter from './routes/motorista';
import financeiroRouter from './routes/financeiro';
import veiculosRouter from './routes/veiculos';
import mensagensRouter from './routes/mensagens';
import dashboardRouter from './routes/dashboard';
import adminRoutes from './routes/admin';
import downloadRoutes from './routes/download';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected', ts: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ status: 'error', db: 'disconnected' });
  }
});

app.use('/auth', authRouter);
app.use('/escolas', escolasRouter);
app.use('/alunos', alunosRouter);
app.use('/motoristas', motoristasRouter);
app.use('/rotas', rotasRouter);
app.use('/execucao', execucaoRouter);
app.use('/convite', conviteRouter);
app.use('/motorista', motoristaAppRouter);
app.use('/financeiro', financeiroRouter);
app.use('/veiculos', veiculosRouter);
app.use('/mensagens', mensagensRouter);
app.use('/dashboard', dashboardRouter);
app.use('/admin', adminRoutes);
app.use('/download', downloadRoutes);

const PORT = process.env.PORT || 3001;

const httpServer = createServer(app);
setupSocket(httpServer);

httpServer.listen(PORT, () => console.log(`API rodando em http://localhost:${PORT}`));

export default app;
