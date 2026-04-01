import { Router } from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Employee from '../models/Employee.js';
import Jobseeker from '../models/Jobseeker.js';
import Company from '../models/Company.js';

const router = Router();

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// --- LinkedIn OAuth ---
router.get('/linkedin', passport.authenticate('linkedin'));

router.get(
  '/linkedin/callback',
  passport.authenticate('linkedin', { session: false, failureRedirect: '/login' }),
  (req, res) => {
    const token = signToken(req.user._id);
    // Redirect to frontend with token; role selection happens on first login if role not set
    res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${token}`);
  }
);

// --- Email/Password Registration ---
// Employee registration
router.post('/register/employee', async (req, res) => {
  const { name, companyEmail, personalEmail, password, companyId, jobTitle } = req.body;

  const email = companyEmail || personalEmail;
  if (!email || !password || !name) {
    return res.status(400).json({ message: 'name, email, and password are required' });
  }

  const existing = await User.findOne({ email });
  if (existing) return res.status(409).json({ message: 'Email already in use' });

  const passwordHash = await bcrypt.hash(password, 12);

  const employee = await Employee.create({
    name,
    email,
    passwordHash,
    companyEmail,
    company: companyId,
    jobTitle,
  });

  res.status(201).json({ token: signToken(employee._id), user: employee });
});

// Jobseeker registration
router.post('/register/jobseeker', async (req, res) => {
  const { name, gtEmail, password } = req.body;

  if (!name || !gtEmail || !password) {
    return res.status(400).json({ message: 'name, gtEmail, and password are required' });
  }

  const existing = await User.findOne({ $or: [{ email: gtEmail }, { 'gtEmail': gtEmail }] });
  if (existing) return res.status(409).json({ message: 'Email already in use' });

  const passwordHash = await bcrypt.hash(password, 12);

  const jobseeker = await Jobseeker.create({
    name,
    email: gtEmail,
    gtEmail,
    passwordHash,
  });

  res.status(201).json({ token: signToken(jobseeker._id), user: jobseeker });
});

// --- Login ---
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'email and password required' });

  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user || !user.passwordHash) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) return res.status(401).json({ message: 'Invalid credentials' });

  res.json({ token: signToken(user._id), user });
});

// --- Verify company email domain ---
router.post('/verify-company-email', async (req, res) => {
  const { companyEmail, companyId } = req.body;
  const company = await Company.findById(companyId);
  if (!company) return res.status(404).json({ message: 'Company not found' });

  const domain = companyEmail.split('@')[1]?.toLowerCase();
  if (!company.emailDomains.includes(domain)) {
    return res.status(400).json({ message: 'Email domain does not match company' });
  }

  // TODO: send verification email to companyEmail
  res.json({ message: 'Verification email sent' });
});

export default router;
