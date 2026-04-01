import { Router } from 'express';
import Employee from '../models/Employee.js';
import Referral from '../models/Referral.js';
import { protect, requireRole } from '../middleware/auth.js';

const router = Router();

// Get current employee profile (with connections prioritized)
router.get('/me', protect, requireRole('employee'), async (req, res) => {
  const employee = await Employee.findById(req.user._id)
    .populate('company', 'name logoUrl')
    .populate('referrals');
  res.json(employee);
});

// Update employee profile
router.patch('/me', protect, requireRole('employee'), async (req, res) => {
  const allowed = ['name', 'jobTitle', 'department', 'companyEmail'];
  const updates = Object.fromEntries(
    Object.entries(req.body).filter(([k]) => allowed.includes(k))
  );
  const employee = await Employee.findByIdAndUpdate(req.user._id, updates, { new: true });
  res.json(employee);
});

// Get pending referral requests for this employee
router.get('/referrals/pending', protect, requireRole('employee'), async (req, res) => {
  const referrals = await Referral.find({ employee: req.user._id, status: 'pending' })
    .populate('jobseeker', 'name linkedin gtEmail clubs')
    .populate('company', 'name logoUrl')
    .populate('sharedClubs', 'name')
    .sort({ priorityScore: -1, createdAt: 1 });
  res.json(referrals);
});

// Approve a referral — awards credits to employee
router.patch('/referrals/:id/approve', protect, requireRole('employee'), async (req, res) => {
  const referral = await Referral.findOne({ _id: req.params.id, employee: req.user._id });
  if (!referral) return res.status(404).json({ message: 'Referral not found' });
  if (referral.status !== 'pending') {
    return res.status(400).json({ message: 'Referral is not pending' });
  }

  referral.status = 'approved';
  referral.approvedAt = new Date();
  referral.employeeNote = req.body.note;
  referral.creditsAwarded = referral.creditsUsed; // employee earns what jobseeker spent
  await referral.save();

  await Employee.findByIdAndUpdate(req.user._id, {
    $inc: { credits: referral.creditsAwarded },
  });

  res.json(referral);
});

// Reject a referral
router.patch('/referrals/:id/reject', protect, requireRole('employee'), async (req, res) => {
  const referral = await Referral.findOne({ _id: req.params.id, employee: req.user._id });
  if (!referral) return res.status(404).json({ message: 'Referral not found' });

  referral.status = 'rejected';
  referral.rejectedAt = new Date();
  referral.employeeNote = req.body.note;
  await referral.save();

  // Refund credits to jobseeker
  const { default: Jobseeker } = await import('../models/Jobseeker.js');
  await Jobseeker.findByIdAndUpdate(referral.jobseeker, {
    $inc: { credits: referral.creditsUsed },
  });

  res.json(referral);
});

// Get employee's LinkedIn connections (sorted to top by default via model)
router.get('/me/connections', protect, requireRole('employee'), async (req, res) => {
  const employee = await Employee.findById(req.user._id).select('connections');
  res.json(employee.connections);
});

export default router;
