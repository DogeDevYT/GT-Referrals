import { Router } from 'express';
import Employee from '../models/Employee.js';
import Referral from '../models/Referral.js';
import Company from '../models/Company.js';
import { protect, requireRole } from '../middleware/auth.js';
import { uploadProfilePhoto } from '../middleware/upload.js';
import {
  deleteCloudinaryAsset,
  isCloudinaryConfigured,
  uploadProfilePhotoToCloudinary,
} from '../config/cloudinary.js';
import { normalizeCommonProfileFields, pickAllowedFields } from '../utils/profile.js';

const router = Router();
const COMPANY_NAME_MIN_LENGTH = 2;
const COMPANY_NAME_MAX_LENGTH = 120;

const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);
const normalizeWhitespace = (value) => value.replace(/\s+/g, ' ').trim();
const normalizeCompanyName = (value) => normalizeWhitespace(value);
const normalizeCompanyDomain = (value) => value.replace(/^@/, '').trim().toLowerCase();
const getEmailDomain = (value) => {
  const atIndex = typeof value === 'string' ? value.lastIndexOf('@') : -1;
  if (atIndex < 0) {
    return '';
  }

  return value.slice(atIndex + 1).trim().toLowerCase();
};
const companyHasMatchingDomain = (company, email) => {
  const domain = getEmailDomain(email);
  if (!domain || !company) {
    return false;
  }

  const domains = Array.isArray(company.emailDomains)
    ? company.emailDomains.map((item) => String(item).toLowerCase())
    : [];

  return domains.includes(domain);
};
const isValidObjectId = (value) => /^[a-f\d]{24}$/i.test(value);
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

router.get('/companies', protect, requireRole('employee'), async (req, res) => {
  const rawQuery = typeof req.query.q === 'string' ? req.query.q : '';
  const query = normalizeCompanyName(rawQuery);

  const filter = query
    ? { name: { $regex: escapeRegex(query), $options: 'i' } }
    : {};

  const companies = await Company.find(filter)
    .select('name logoUrl website industry emailDomains')
    .sort({ name: 1 })
    .limit(12)
    .lean();

  res.json(companies);
});

router.post('/companies', protect, requireRole('employee'), async (req, res) => {
  const rawName = typeof req.body?.name === 'string' ? req.body.name : '';
  const name = normalizeCompanyName(rawName);

  if (name.length < COMPANY_NAME_MIN_LENGTH || name.length > COMPANY_NAME_MAX_LENGTH) {
    return res.status(400).json({
      message: `Company name must be between ${COMPANY_NAME_MIN_LENGTH} and ${COMPANY_NAME_MAX_LENGTH} characters`,
    });
  }

  const rawEmailDomain = typeof req.body?.emailDomain === 'string' ? req.body.emailDomain : '';
  const emailDomain = rawEmailDomain ? normalizeCompanyDomain(rawEmailDomain) : '';

  if (emailDomain && !/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(emailDomain)) {
    return res.status(400).json({ message: 'emailDomain must be a valid domain' });
  }

  const existing = await Company.findOne({
    name: { $regex: `^${escapeRegex(name)}$`, $options: 'i' },
  });

  if (existing) {
    if (emailDomain && !existing.emailDomains?.includes(emailDomain)) {
      existing.emailDomains = [...(existing.emailDomains || []), emailDomain];
      await existing.save();
    }

    return res.json({ company: existing, created: false });
  }

  const company = await Company.create({
    name,
    emailDomains: emailDomain ? [emailDomain] : [],
  });

  res.status(201).json({ company, created: true });
});

// Get current employee profile (with connections prioritized)
router.get('/me', protect, requireRole('employee'), async (req, res) => {
  const employee = await Employee.findById(req.user._id)
    .populate('company', 'name logoUrl')
    .populate('referrals');
  res.json(employee);
});

// Update employee profile
router.patch('/me', protect, requireRole('employee'), async (req, res) => {
  const allowed = ['name', 'jobTitle', 'department', 'companyEmail', 'companyId', 'tagline', 'themePreference'];
  const updates = pickAllowedFields(req.body, allowed);
  const { updates: normalizedUpdates, error } = normalizeCommonProfileFields(updates);

  if (error) {
    return res.status(400).json({ message: error });
  }

  if (hasOwn(normalizedUpdates, 'companyId')) {
    if (typeof normalizedUpdates.companyId !== 'string' || !isValidObjectId(normalizedUpdates.companyId)) {
      return res.status(400).json({ message: 'companyId must be a valid company id' });
    }

    const company = await Company.findById(normalizedUpdates.companyId).select('_id');
    if (!company) {
      return res.status(404).json({ message: 'Selected company was not found' });
    }

    normalizedUpdates.company = company._id;
    delete normalizedUpdates.companyId;
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

  if (hasOwn(normalizedUpdates, 'company') || hasOwn(normalizedUpdates, 'companyEmail')) {
    const currentEmployee = await Employee.findById(req.user._id).select('company companyEmail');
    if (!currentEmployee) {
      return res.status(404).json({ message: 'Employee profile not found' });
    }

    const nextCompanyId = hasOwn(normalizedUpdates, 'company')
      ? normalizedUpdates.company
      : currentEmployee.company;
    const nextCompanyEmail = hasOwn(normalizedUpdates, 'companyEmail')
      ? normalizedUpdates.companyEmail
      : currentEmployee.companyEmail;

    const company = nextCompanyId
      ? await Company.findById(nextCompanyId).select('emailDomains')
      : null;

    normalizedUpdates.isCompanyEmailVerified = companyHasMatchingDomain(company, nextCompanyEmail);
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
