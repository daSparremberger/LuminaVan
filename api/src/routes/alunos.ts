import { Router } from 'express';
import { pool } from '../db/pool';
import { requireAuth, requireGestor, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(requireAuth, requireGestor);

router.get('/', async (req: AuthRequest, res) => {
  const { escola_id, turno } = req.query;
  let sql = `SELECT a.*, e.nome as escola_nome FROM alunos a
    LEFT JOIN escolas e ON e.id = a.escola_id
    WHERE a.tenant_id = $1 AND a.ativo = true`;
  const params: any[] = [req.user!.tenant_id];

  if (escola_id) { sql += ` AND a.escola_id = $${params.length + 1}`; params.push(escola_id); }
  if (turno) { sql += ` AND a.turno = $${params.length + 1}`; params.push(turno); }
  sql += ' ORDER BY a.nome';

  const { rows } = await pool.query(sql, params);
  res.json(rows);
});

router.post('/', async (req: AuthRequest, res) => {
  const {
    nome, nascimento, telefone, endereco, lat, lng, escola_id, turno, turma, ano,
    nome_responsavel, cpf_responsavel, nascimento_responsavel, telefone_responsavel,
    valor_mensalidade, meses_contrato, inicio_contrato, restricoes, observacoes
  } = req.body;

  if (!nome || !endereco || !escola_id || !turno) {
    return res.status(400).json({ error: 'Campos obrigatorios: nome, endereco, escola_id, turno' });
  }

  const { rows } = await pool.query(`
    INSERT INTO alunos (
      tenant_id, nome, nascimento, telefone, endereco, lat, lng, escola_id, turno, turma, ano,
      nome_responsavel, cpf_responsavel, nascimento_responsavel, telefone_responsavel,
      valor_mensalidade, meses_contrato, inicio_contrato, restricoes, observacoes
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
    RETURNING *
  `, [
    req.user!.tenant_id, nome, nascimento ?? null, telefone ?? null,
    endereco, lat ?? null, lng ?? null, escola_id, turno, turma ?? null, ano ?? null,
    nome_responsavel ?? null, cpf_responsavel ?? null, nascimento_responsavel ?? null, telefone_responsavel ?? null,
    valor_mensalidade ?? null, meses_contrato ?? null, inicio_contrato ?? null, restricoes ?? null, observacoes ?? null
  ]);

  res.status(201).json(rows[0]);
});

router.put('/:id', async (req: AuthRequest, res) => {
  const {
    nome, nascimento, telefone, endereco, lat, lng, escola_id, turno, turma, ano,
    nome_responsavel, cpf_responsavel, nascimento_responsavel, telefone_responsavel,
    valor_mensalidade, meses_contrato, inicio_contrato, restricoes, observacoes, ativo
  } = req.body;

  await pool.query(`
    UPDATE alunos SET
      nome=$1, nascimento=$2, telefone=$3, endereco=$4, lat=$5, lng=$6, escola_id=$7, turno=$8,
      turma=$9, ano=$10, nome_responsavel=$11, cpf_responsavel=$12, nascimento_responsavel=$13,
      telefone_responsavel=$14, valor_mensalidade=$15, meses_contrato=$16, inicio_contrato=$17,
      restricoes=$18, observacoes=$19, ativo=$20
    WHERE id=$21 AND tenant_id=$22
  `, [
    nome, nascimento ?? null, telefone ?? null, endereco, lat ?? null, lng ?? null, escola_id, turno,
    turma ?? null, ano ?? null, nome_responsavel ?? null, cpf_responsavel ?? null, nascimento_responsavel ?? null,
    telefone_responsavel ?? null, valor_mensalidade ?? null, meses_contrato ?? null, inicio_contrato ?? null,
    restricoes ?? null, observacoes ?? null, ativo ?? true,
    req.params.id, req.user!.tenant_id
  ]);
  res.json({ ok: true });
});

router.delete('/:id', async (req: AuthRequest, res) => {
  await pool.query('UPDATE alunos SET ativo = false WHERE id = $1 AND tenant_id = $2',
    [req.params.id, req.user!.tenant_id]);
  res.json({ ok: true });
});

export default router;
