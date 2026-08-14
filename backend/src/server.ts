import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const app = express();
const port = Number(process.env.PORT ?? 4000);
const mongoUri = process.env.MONGODB_URI;
const jwtSecret = process.env.JWT_SECRET ?? 'taskflow-development-secret';

app.use(cors());
app.use(express.json());
app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'taskflow-backend' }));
app.get('/api/config', (_req, res) => res.json({ name: 'TaskFlow', auth: 'jwt+bcrypt', database: 'mongodb' }));

export async function hashPassword(password: string) { return bcrypt.hash(password, 12); }
export function signToken(userId: string) { return jwt.sign({ sub: userId }, jwtSecret, { expiresIn: '7d' }); }

async function start() {
  if (mongoUri) await mongoose.connect(mongoUri);
  app.listen(port, () => console.log(`TaskFlow API listening on port ${port}`));
}

start().catch((error) => { console.error(error); process.exitCode = 1; });
