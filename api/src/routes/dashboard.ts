import { Router } from 'express';
import { pool } from '../db/pool';
import { requireAuth, requireGestor, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(requireAuth, requireGestor);

// GET /stats - Dashboard stats
router.get('/stats', async (req: AuthRequest, res) => {
  const tenantId = req.user!.tenant_id;

  try {
    // veiculos_total: COUNT from veiculos WHERE ativo=true
    const veiculosTotalResult = await pool.query(
      'SELECT COUNT(*) as total FROM veiculos WHERE tenant_id = $1 AND ativo = true',
      [tenantId]
    );

    // veiculos_ativos: vehicles with active route (rota_historico where data_fim IS NULL)
    const veiculosAtivosResult = await pool.query(`
      SELECT COUNT(DISTINCT r.veiculo_id) as total
      FROM rota_historico rh
      JOIN rotas r ON r.id = rh.rota_id
      WHERE rh.tenant_id = $1 AND rh.data_fim IS NULL AND r.veiculo_id IS NOT NULL
    `, [tenantId]);

    // motoristas_em_acao: distinct motoristas with active route
    const motoristasEmAcaoResult = await pool.query(
      'SELECT COUNT(DISTINCT motorista_id) as total FROM rota_historico WHERE tenant_id = $1 AND data_fim IS NULL',
      [tenantId]
    );

    // rotas_hoje: rota_historico WHERE DATE(data_inicio) = CURRENT_DATE
    const rotasHojeResult = await pool.query(
      'SELECT COUNT(*) as total FROM rota_historico WHERE tenant_id = $1 AND DATE(data_inicio) = CURRENT_DATE',
      [tenantId]
    );

    // alunos_total: COUNT from alunos WHERE ativo=true
    const alunosTotalResult = await pool.query(
      'SELECT COUNT(*) as total FROM alunos WHERE tenant_id = $1 AND ativo = true',
      [tenantId]
    );

    res.json({
      veiculos_total: parseInt(veiculosTotalResult.rows[0].total),
      veiculos_ativos: parseInt(veiculosAtivosResult.rows[0].total),
      motoristas_em_acao: parseInt(motoristasEmAcaoResult.rows[0].total),
      rotas_hoje: parseInt(rotasHojeResult.rows[0].total),
      alunos_total: parseInt(alunosTotalResult.rows[0].total)
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ error: 'Erro ao buscar estatisticas' });
  }
});

// GET /charts - Chart data
router.get('/charts', async (req: AuthRequest, res) => {
  const tenantId = req.user!.tenant_id;

  try {
    // rotas_por_dia: last 7 days
    const rotasPorDiaResult = await pool.query(`
      SELECT DATE(data_inicio) as data, COUNT(*) as total
      FROM rota_historico
      WHERE tenant_id = $1 AND data_inicio >= CURRENT_DATE - INTERVAL '6 days'
      GROUP BY DATE(data_inicio)
      ORDER BY data
    `, [tenantId]);

    // alunos_por_escola: top 10
    const alunosPorEscolaResult = await pool.query(`
      SELECT e.nome as escola, COUNT(a.id) as total
      FROM escolas e
      LEFT JOIN alunos a ON a.escola_id = e.id AND a.ativo = true
      WHERE e.tenant_id = $1
      GROUP BY e.id, e.nome
      ORDER BY total DESC
      LIMIT 10
    `, [tenantId]);

    // financeiro_mensal: last 6 months
    const financeiroMensalResult = await pool.query(`
      SELECT
        TO_CHAR(data, 'YYYY-MM') as mes,
        COALESCE(SUM(CASE WHEN tipo = 'receita' THEN valor ELSE 0 END), 0) as receitas,
        COALESCE(SUM(CASE WHEN tipo = 'despesa' THEN valor ELSE 0 END), 0) as despesas
      FROM transacoes
      WHERE tenant_id = $1 AND data >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '5 months'
      GROUP BY TO_CHAR(data, 'YYYY-MM')
      ORDER BY mes
    `, [tenantId]);

    // atividade_por_turno: last 30 days
    const atividadePorTurnoResult = await pool.query(`
      SELECT r.turno, COUNT(rh.id) as rotas
      FROM rota_historico rh
      JOIN rotas r ON r.id = rh.rota_id
      WHERE rh.tenant_id = $1 AND rh.data_inicio >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY r.turno
      ORDER BY r.turno
    `, [tenantId]);

    res.json({
      rotas_por_dia: rotasPorDiaResult.rows.map(row => ({
        data: row.data ? row.data.toISOString().split('T')[0] : null,
        total: parseInt(row.total)
      })),
      alunos_por_escola: alunosPorEscolaResult.rows.map(row => ({
        escola: row.escola,
        total: parseInt(row.total)
      })),
      financeiro_mensal: financeiroMensalResult.rows.map(row => ({
        mes: row.mes,
        receitas: parseFloat(row.receitas),
        despesas: parseFloat(row.despesas)
      })),
      atividade_por_turno: atividadePorTurnoResult.rows.map(row => ({
        turno: row.turno || 'indefinido',
        rotas: parseInt(row.rotas)
      }))
    });
  } catch (err) {
    console.error('Dashboard charts error:', err);
    res.status(500).json({ error: 'Erro ao buscar dados dos graficos' });
  }
});

export default router;
