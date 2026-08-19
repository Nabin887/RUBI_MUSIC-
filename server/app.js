import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import passport from 'passport';
import authRoutes from './routes/auth.js';
import './config/passport.js';

dotenv.config();

const app = express();
app.disable('x-powered-by');

app.use(helmet());
app.use(express.json());
app.use(cookieParser());

const FRONTEND = process.env.FRONTEND_URL || 'http://localhost:3000';
app.use(
  cors({
    origin: FRONTEND,
    credentials: true,
  })
);

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use('/api/', limiter);

app.use(passport.initialize());

app.use('/api/auth', authRoutes);
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.get('/', (req, res) => res.send('Music app auth server running'));

const PORT = process.env.PORT || 5000;

// Connect to Mongo
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/nabify_auth';

mongoose
  .connect(MONGO_URI)
.then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
})
.catch((err) => console.error('MongoDB connection error:', err));
