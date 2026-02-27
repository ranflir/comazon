import * as dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const app = express();
app.use(express.json());

app.get('/users', async (req, res, next) => {
  try {
    const users = await prisma.user.findMany();
    res.send(users);
  } catch (error) {
    next(error);
  }
});

app.get('/users/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id },
    });
    if (!user) {
      return res.status(404).send({ message: '사용자를 찾을 수 없습니다.' });
    }
    res.send(user);
  } catch (error) {
    next(error);
  }
});

app.post('/users', async (req, res, next) => {
  try {
    // 요청 본문 데이터로 사용자 생성
    const user = await prisma.user.create({
      data: req.body,
    });
    res.status(201).send(user);
  } catch (error) {
    next(error);
  }
});

app.patch('/users/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    // 요청 본문 데이터로 해당 ID의 사용자 수정
    const user = await prisma.user.update({
      where: { id },
      data: req.body,
    });
    res.send(user);
  } catch (error) {
    // Prisma에서 레코드를 찾지 못했을 때의 에러 코드
    if (error.code === 'P2025') {
      return res.status(404).send({ message: '사용자를 찾을 수 없습니다.' });
    }
    next(error);
  }
});

app.delete('/users/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    // 해당 ID의 사용자 삭제
    await prisma.user.delete({
      where: { id },
    });
    res.sendStatus(204);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).send({ message: '사용자를 찾을 수 없습니다.' });
    }
    next(error);
  }
});

// 글로벌 에러 핸들러 미들웨어
app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).send({ 
    message: err.message || '서버 내부 오류가 발생했습니다.',
    code: err.code 
  });
});

app.listen(process.env.PORT || 3000, () => console.log('서버가 시작되었습니다.'));
