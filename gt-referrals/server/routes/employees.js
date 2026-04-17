import { Router } from 'express';
import Employee from '../models/Employee.js';
import Referral from '../models/Referral.js';
import { protect, requireRole } from '../middleware/auth.js';
import { uploadProfilePhoto } from '../middleware/upload.js';
import {
  deleteCloudinaryAsset,
  isCloudinaryConfigured,
  uploadProfilePhotoToCloudinary,
} from '../config/cloudinary.js';
import { normalizeCommonProfileFields, pickAllowedFields } from '../utils/profile.js';

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
  const allowed = ['name', 'jobTitle', 'department', 'companyEmail', 'tagline'];
  const updates = pickAllowedFields(req.body, allowed);
  const { updates: normalizedUpdates, error } = normalizeCommonProfileFields(updates);

  if (error) {
    return res.status(400).json({ message: error });
  }

  if (Object.prototype.hasOwnProperty.call(normalizedUpdates, 'companyEmail')) {
    if (typeof normalizedUpdates.companyEmail !== 'string') {
      return res.status(400).json({ message: 'companyEmail must be a string' });
    }

    const normalizedEmail = normalizedUpdates.companyEmail.trim().toLowerCase();
    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      return res.status(400).json({ message: 'companyEmail must be a valid email address' });
    }
    normalizedUpdates.companyEmail = normalizedEmail;
  }

  if (Object.keys(normalizedUpdates).length === 0) {
    return res.status(400).json({ message: 'No profile fields provided to update' });
  }

  const employee = await Employee.findByIdAndUpdate(req.user._id, normalizedUpdates, {
    new: true,
    runValidators: true,
  })
    .populate('company', 'name logoUrl')
    .populate('referrals');

  res.json(employee);
});

router.post('/me/photo', protect, requireRole('employee'), uploadProfilePhoto, async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Please attach a photo file using the "photo" field' });
  }

  if (!isCloudinaryConfigured()) {
    return res.status(503).json({ message: 'Profile photo uploads are not configured on this server' });
  }

  const employee = await Employee.findById(req.user._id).select('+profilePhotoPublicId');
  if (!employee) {
    return res.status(404).json({ message: 'Employee profile not found' });
  }

  const oldPublicId = employee.profilePhotoPublicId;

  try {
    const { url, publicId } = await uploadProfilePhotoToCloudinary({
      buffer: req.file.buffer,
      mimeType: req.file.mimetype,
      userId: req.user._id.toString(),
    });

    employee.profilePhoto = url;
    employee.profilePhotoPublicId = publicId;
    await employee.save();

    if (oldPublicId && oldPublicId !== publicId) {
      await deleteCloudinaryAsset(oldPublicId);
    }

    const updatedEmployee = await Employee.findById(req.user._id)
      .populate('company', 'name logoUrl')
      .populate('referrals');

    res.json({
      photoUrl: updatedEmployee.profilePhoto,
      user: updatedEmployee,
    });
  } catch {
    res.status(500).json({ message: 'Could not upload profile photo right now' });
  }
});

// Get pending referral requests for this employee
router.get('/referrals/pending', protect, requireRole('employee'), async (req, res) => {
  const referrals = await Referral.find({ employee: req.user._id, status: 'pending' })
    .populate('jobseeker', 'name linkedin profilePhoto gtEmail clubs')
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
  referral.employeeNote = req.body?.note || '';
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
  referral.employeeNote = req.body?.note || '';
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
