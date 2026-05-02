import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { prisma } from './db';
import authRoutes from './routes/auth';
import notesRoutes from './routes/notes';
import casesRoutes from './routes/cases';
import adminRoutes from './routes/admin';
import assignmentsRoutes from './routes/assignments';
import facultyRoutes from './routes/faculty';
import filesRoutes from './routes/files';
import studentRoutes from './routes/student';
import { uploadsRoot } from './routes/uploads';

dotenv.config({ override: true });

const app = express();
const PORT = process.env.PORT || 3000;
fs.mkdirSync(uploadsRoot, { recursive: true });

const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:5174')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// Middleware
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', filesRoutes);

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'Server is running' });
});

// Test the connection to the database
app.get('/api/db-test', async (req: Request, res: Response) => {
  try {
    const userCount = await prisma.user.count();
    res.json({ status: 'Database connected', userCount });
  } catch (error) {
    res.status(500).json({
      error: 'Database connection failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/cases', casesRoutes);
app.use('/api/assignments', assignmentsRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/admin', adminRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err);
  const isMulterError = err?.name === 'MulterError';
  const status = isMulterError ? 400 : err.status || 500;
  const errorMessage =
    err?.code === 'LIMIT_FILE_SIZE'
      ? 'Uploaded file is too large.'
      : err?.message || 'Internal server error';

  res.status(status).json({
    error: errorMessage,
  });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

export default app;
