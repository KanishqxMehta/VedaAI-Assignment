import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes';
import assignmentRoutes from './routes/assignmentRoutes';

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/assignments', assignmentRoutes);

export default app;
