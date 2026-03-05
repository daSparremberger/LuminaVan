import { Router } from 'express';
import { pool } from '../db/pool';
import { requireAuth, requireGestor, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(requireAuth, requireGestor);

// Listar transacoes
router.get('/', async (req: AuthRequest, res) => {
  const { tipo, categoria, data_inicio, data_fim, aluno_id, pago } = req.query;

  let sql = `SELECT t.*, a.nome as aluno_nome FROM transacoes t
    LEFT JOIN alunos a ON a.id = t.aluno_id
    WHERE t.tenant_id = $1`;
  const params: any[] = [req.user!.tenant_id];

  if (tipo) { sql += ` AND t.tipo = $${params.length + 1}`; params.push(tipo); }
  if (categoria) { sql += ` AND t.categoria = $${params.length + 1}`; params.push(categoria); }
  if (data_inicio) { sql += ` AND t.data >= $${params.length + 1}`; params.push(data_inicio); }
  if (data_fim) { sql += ` AND t.data <= $${params.length + 1}`; params.push(data_fim); }
  if (aluno_id) { sql += ` AND t.aluno_id = $${params.length + 1}`; params.push(aluno_id); }
  if (pago !== undefined) { sql += ` AND t.pago = $${params.length + 1}`; params.push(pago === 'true'); }

  sql += ' ORDER BY t.data DESC, t.criado_em DESC LIMIT 500';

  const { rows } = await pool.query(sql, params);
  res.json(rows);
});

// Resumo financeiro
router.get('/resumo', async (req: AuthRequest, res) => {
  const { mes, ano } = req.query;

  let dateFilter = '';
  const params: any[] = [req.user!.tenant_id];

  if (mes && ano) {
    dateFilter = ` AND EXTRACT(MONTH FROM data) = $2 AND EXTRACT(YEAR FROM data) = $3`;
    params.push(mes, ano);
  } else if (ano) {
    dateFilter = ` AND EXTRACT(YEAR FROM data) = $2`;
    params.push(ano);
  }

  const receitasResult = await pool.query(
    `SELECT COALESCE(SUM(valor), 0) as total FROM transacoes WHERE tenant_id = $1 AND tipo = 'receita'${dateFilter}`,
    params
  );

  const despesasResult = await pool.query(
    `SELECT COALESCE(SUM(valor), 0) as total FROM transacoes WHERE tenant_id = $1 AND tipo = 'despesa'${dateFilter}`,
    params
  );

  const inadimplentesResult = await pool.query(
    `SELECT COUNT(DISTINCT aluno_id) as total FROM transacoes WHERE tenant_id = $1 AND tipo = 'receita' AND pago = false AND aluno_id IS NOT NULL`,
    [req.user!.tenant_id]
  );

  const receitas = parseFloat(receitasResult.rows[0].total);
  const despesas = parseFloat(despesasResult.rows[0].total);

  res.json({
    receitas,
    despesas,
    saldo: receitas - despesas,
    inadimplentes: parseInt(inadimplentesResult.rows[0].total)
  });
});

// Criar transacao
router.post('/', async (req: AuthRequest, res) => {
  const { tipo, categoria, descricao, valor, data, aluno_id, pago } = req.body;

  if (!tipo || !categoria || !valor || !data) {
    return res.status(400).json({ error: 'Campos obrigatorios: tipo, categoria, valor, data' });
  }

  const { rows } = await pool.query(`
    INSERT INTO transacoes (tenant_id, tipo, categoria, descricao, valor, data, aluno_id, pago)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
  `, [req.user!.tenant_id, tipo, categoria, descricao ?? null, valor, data, aluno_id ?? null, pago ?? false]);

  res.status(201).json(rows[0]);
});

// Atualizar transacao
router.put('/:id', async (req: AuthRequest, res) => {
  const { tipo, categoria, descricao, valor, data, aluno_id, pago } = req.body;

  await pool.query(`
    UPDATE transacoes SET tipo=$1, categoria=$2, descricao=$3, valor=$4, data=$5, aluno_id=$6, pago=$7
    WHERE id=$8 AND tenant_id=$9
  `, [tipo, categoria, descricao ?? null, valor, data, aluno_id ?? null, pago ?? false, req.params.id, req.user!.tenant_id]);

  res.json({ ok: true });
});

// Marcar como pago
router.patch('/:id/pagar', async (req: AuthRequest, res) => {
  await pool.query(
    'UPDATE transacoes SET pago = true WHERE id = $1 AND tenant_id = $2',
    [req.params.id, req.user!.tenant_id]
  );
  res.json({ ok: true });
});

// Deletar transacao
router.delete('/:id', async (req: AuthRequest, res) => {
  await pool.query(
    'DELETE FROM transacoes WHERE id = $1 AND tenant_id = $2',
    [req.params.id, req.user!.tenant_id]
  );
  res.json({ ok: true });
});

// Gerar mensalidades para todos os alunos ativos
router.post('/gerar-mensalidades', async (req: AuthRequest, res) => {
  const { mes, ano } = req.body;

  if (!mes || !ano) {
    return res.status(400).json({ error: 'Campos obrigatorios: mes, ano' });
  }

  // Buscar alunos ativos com valor de mensalidade
  const alunosResult = await pool.query(
    `SELECT id, nome, valor_mensalidade FROM alunos
     WHERE tenant_id = $1 AND ativo = true AND valor_mensalidade IS NOT NULL AND valor_mensalidade > 0`,
    [req.user!.tenant_id]
  );

  const dataVencimento = `${ano}-${String(mes).padStart(2, '0')}-10`;
  let criadas = 0;

  for (const aluno of alunosResult.rows) {
    // Verificar se ja existe mensalidade para este mes
    const existeResult = await pool.query(
      `SELECT id FROM transacoes WHERE tenant_id = $1 AND aluno_id = $2 AND categoria = 'mensalidade'
       AND EXTRACT(MONTH FROM data) = $3 AND EXTRACT(YEAR FROM data) = $4`,
      [req.user!.tenant_id, aluno.id, mes, ano]
    );

    if (existeResult.rows.length === 0) {
      await pool.query(`
        INSERT INTO transacoes (tenant_id, tipo, categoria, descricao, valor, data, aluno_id, pago)
        VALUES ($1, 'receita', 'mensalidade', $2, $3, $4, $5, false)
      `, [req.user!.tenant_id, `Mensalidade ${mes}/${ano} - ${aluno.nome}`, aluno.valor_mensalidade, dataVencimento, aluno.id]);
      criadas++;
    }
  }

  res.json({ criadas, total_alunos: alunosResult.rows.length });
});

export default router;
