import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  const user = await User.findOne({ email: 'sundar@google.com' }).select('+passwordHash');
  console.log('User found:', user ? user.email : 'No user found');
  if (user) {
    console.log('Has passwordHash:', !!user.passwordHash);
    if (user.passwordHash) {
      const match = await bcrypt.compare('password123', user.passwordHash);
      console.log('password123 matches:', match);
    }
  }
  process.exit();
}

check();
