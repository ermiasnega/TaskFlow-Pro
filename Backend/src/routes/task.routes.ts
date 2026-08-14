import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';

export const taskRouter = Router();
taskRouter.use(requireAuth);
taskRouter.get('/', (_req, res) => res.json({ items: [], message: 'Task CRUD foundation ready' }));
taskRouter.post('/', (req, res) => res.status(201).json({ task: req.body, message: 'Task creation route reserved for Iteration 2' }));
