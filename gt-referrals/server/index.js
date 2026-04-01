import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import connectDB from './config/db.js';
import './config/passport.js';

import authRoutes from './routes/auth.js';
import employeeRoutes from './routes/employees.js';
import jobseekerRoutes from './routes/jobseekers.js';
import referralRoutes from './routes/referrals.js';

dotenv.config();

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/jobseekers', jobseekerRoutes);
app.use('/api/referrals', referralRoutes);

app.get('/', (_req, res) => res.send('Backend Running'));

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`Server on port ${PORT}`));
});
