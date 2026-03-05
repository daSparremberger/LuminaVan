import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';

const router = Router();

// Retorna perfil do usuario logado
router.get('/perfil', requireAuth, (req: AuthRequest, res) => {
  res.json(req.user);
});

export default router;
