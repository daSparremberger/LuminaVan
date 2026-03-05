import { Router } from 'express';
import { pool } from '../db/pool';
import { auth } from '../lib/firebase';

const router = Router();

// Validar token de convite (publico)
router.get('/:token', async (req, res) => {
  const { rows } = await pool.query(
    'SELECT id, nome, tenant_id, convite_expira_em FROM motoristas WHERE convite_token = $1 AND cadastro_completo = false',
    [req.params.token]
  );

  if (rows.length === 0) {
    return res.status(404).json({ error: 'Convite nao encontrado ou ja utilizado' });
  }

  const motorista = rows[0];
  if (new Date(motorista.convite_expira_em) < new Date()) {
    return res.status(410).json({ error: 'Convite expirado' });
  }

  res.json({ nome: motorista.nome });
});

// Completar cadastro do motorista (com Firebase ID Token)
router.post('/:token/completar', async (req, res) => {
  const { firebase_id_token, foto_url, documento_url } = req.body;

  if (!firebase_id_token) {
    return res.status(400).json({ error: 'firebase_id_token obrigatorio' });
  }

  // Validar token do Firebase
  let firebaseUid: string;
  try {
    const decoded = await auth.verifyIdToken(firebase_id_token);
    firebaseUid = decoded.uid;
  } catch (err) {
    return res.status(401).json({ error: 'Token Firebase invalido' });
  }

  // Buscar motorista pelo convite
  const { rows } = await pool.query(
    'SELECT id, convite_expira_em FROM motoristas WHERE convite_token = $1 AND cadastro_completo = false',
    [req.params.token]
  );

  if (rows.length === 0) {
    return res.status(404).json({ error: 'Convite nao encontrado ou ja utilizado' });
  }

  const motorista = rows[0];
  if (new Date(motorista.convite_expira_em) < new Date()) {
    return res.status(410).json({ error: 'Convite expirado' });
  }

  // Atualizar motorista com dados do Firebase
  await pool.query(`
    UPDATE motoristas SET firebase_uid = $1, foto_url = $2, documento_url = $3,
      cadastro_completo = true, convite_token = NULL, convite_expira_em = NULL
    WHERE id = $4
  `, [firebaseUid, foto_url ?? null, documento_url ?? null, motorista.id]);

  res.json({ ok: true, message: 'Cadastro completo! Baixe o app RotaVans.' });
});

export default router;
