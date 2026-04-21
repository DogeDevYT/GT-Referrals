import { Router } from 'express';
import Jobseeker from '../models/Jobseeker.js';
import Employee from '../models/Employee.js';
import Referral from '../models/Referral.js';
import Club from '../models/Club.js';
import { protect, requireRole } from '../middleware/auth.js';
import { uploadProfilePhoto } from '../middleware/upload.js';
import {
  deleteCloudinaryAsset,
  isCloudinaryConfigured,
  uploadProfilePhotoToCloudinary,
} from '../config/cloudinary.js';
import {
  normalizeCommonProfileFields,
  normalizeTargetRoles,
  pickAllowedFields,
} from '../utils/profile.js';

const router = Router();

// Get current jobseeker profile
router.get('/me', protect, requireRole('jobseeker'), async (req, res) => {
  const jobseeker = await Jobseeker.findById(req.user._id)
    .populate('clubs', 'name logoUrl')
    .populate('targetCompanies', 'name logoUrl');
  res.json(jobseeker);
});

// Update profile / manual resume
router.patch('/me', protect, requireRole('jobseeker'), async (req, res) => {
  const allowed = ['name', 'tagline', 'targetRoles', 'resume', 'themePreference'];
  const updates = pickAllowedFields(req.body, allowed);
  const { updates: normalizedUpdates, error } = normalizeCommonProfileFields(updates);

  if (error) {
    return res.status(400).json({ message: error });
  }

  if (Object.prototype.hasOwnProperty.call(normalizedUpdates, 'targetRoles')) {
    const { roles, error: targetRolesError } = normalizeTargetRoles(normalizedUpdates.targetRoles);
    if (targetRolesError) {
      return res.status(400).json({ message: targetRolesError });
    }
    normalizedUpdates.targetRoles = roles;
  }

  if (Object.prototype.hasOwnProperty.call(normalizedUpdates, 'resume')) {
    if (!normalizedUpdates.resume || typeof normalizedUpdates.resume !== 'object' || Array.isArray(normalizedUpdates.resume)) {
      return res.status(400).json({ message: 'resume must be an object' });
    }

    normalizedUpdates.resume = {
      ...normalizedUpdates.resume,
      source: 'manual',
    };
  }

  if (Object.keys(normalizedUpdates).length === 0) {
    return res.status(400).json({ message: 'No profile fields provided to update' });
  }

  const jobseeker = await Jobseeker.findByIdAndUpdate(req.user._id, normalizedUpdates, {
    new: true,
    runValidators: true,
  })
    .populate('clubs', 'name logoUrl')
    .populate('targetCompanies', 'name logoUrl');

  res.json(jobseeker);
});

router.post('/me/photo', protect, requireRole('jobseeker'), uploadProfilePhoto, async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Please attach a photo file using the "photo" field' });
  }

  if (!isCloudinaryConfigured()) {
    return res.status(503).json({ message: 'Profile photo uploads are not configured on this server' });
  }

  const jobseeker = await Jobseeker.findById(req.user._id).select('+profilePhotoPublicId');
  if (!jobseeker) {
    return res.status(404).json({ message: 'Jobseeker profile not found' });
  }

  const oldPublicId = jobseeker.profilePhotoPublicId;

  try {
    const { url, publicId } = await uploadProfilePhotoToCloudinary({
      buffer: req.file.buffer,
      mimeType: req.file.mimetype,
      userId: req.user._id.toString(),
    });

    jobseeker.profilePhoto = url;
    jobseeker.profilePhotoPublicId = publicId;
    await jobseeker.save();

    if (oldPublicId && oldPublicId !== publicId) {
      await deleteCloudinaryAsset(oldPublicId);
    }

    const updatedJobseeker = await Jobseeker.findById(req.user._id)
      .populate('clubs', 'name logoUrl')
      .populate('targetCompanies', 'name logoUrl');

    res.json({
      photoUrl: updatedJobseeker.profilePhoto,
      user: updatedJobseeker,
    });
  } catch {
    res.status(500).json({ message: 'Could not upload profile photo right now' });
  }
});

// Populate resume from LinkedIn data (already stored on user.linkedin)
router.post('/me/resume/from-linkedin', protect, requireRole('jobseeker'), async (req, res) => {
  const jobseeker = await Jobseeker.findById(req.user._id);
  const li = jobseeker.linkedin;
  if (!li) return res.status(400).json({ message: 'No LinkedIn data on file' });

  jobseeker.resume = {
    source: 'linkedin',
    summary: li.summary,
    experience: li.positions,
    education: li.educations,
    skills: li.skills,
  };
  await jobseeker.save();
  res.json(jobseeker.resume);
});

// Request a referral
router.post('/referrals', protect, requireRole('jobseeker'), async (req, res) => {
  const { employeeId, companyId, jobTitle, jobUrl, jobId, message, creditsToSpend } = req.body;

  const jobseeker = await Jobseeker.findById(req.user._id).populate('clubs');
  if (jobseeker.credits < creditsToSpend) {
    return res.status(400).json({ message: 'Insufficient credits' });
  }

  const employee = await Employee.findById(employeeId).populate('clubs');
  if (!employee) {
    return res.status(404).json({ message: 'Employee not found' });
  }

  if (!employee.isCompanyEmailVerified) {
    return res.status(403).json({
      message: 'This employee is not yet verified and cannot receive referral requests right now.',
    });
  }

  const resolvedCompanyId = companyId || employee.company?._id || employee.company;
  if (!resolvedCompanyId) {
    return res.status(400).json({ message: 'This employee profile is missing a company. Ask them to update their company first.' });
  }

  // Priority score: base + club overlap bonus
  const jsClubIds = new Set(jobseeker.clubs.map((c) => c._id.toString()));
  const sharedClubs = (employee.clubs || []).filter((c) => jsClubIds.has(c._id.toString()));
  const priorityScore =
    creditsToSpend + sharedClubs.reduce((sum, c) => sum + c.priorityWeight, 0);

  const referral = await Referral.create({
    jobseeker: req.user._id,
    employee: employeeId,
    company: resolvedCompanyId,
    jobTitle,
    jobUrl,
    jobId,
    message,
    creditsUsed: creditsToSpend,
    priorityScore,
    sharedClubs: sharedClubs.map((c) => c._id),
  });

  // Deduct credits
  jobseeker.credits -= creditsToSpend;
  jobseeker.referrals.push(referral._id);
  await jobseeker.save();

  await Employee.findByIdAndUpdate(employeeId, { $push: { referrals: referral._id } });

  res.status(201).json(referral);
});

// Get recommended employees (connections algorithm)
// Ranks employees by: shared clubs > shared LinkedIn connections > target company match
router.get('/recommendations', protect, requireRole('jobseeker'), async (req, res) => {
  const jobseeker = await Jobseeker.findById(req.user._id).populate('clubs targetCompanies');

  const jsClubIds = new Set(jobseeker.clubs.map((c) => c._id.toString()));
  const jsConnectionIds = new Set(jobseeker.connections.map((c) => c.linkedinId));
  const targetCompanyIds = new Set(jobseeker.targetCompanies.map((c) => c._id.toString()));

  const employees = await Employee.find({
    company: { $exists: true, $ne: null },
    isCompanyEmailVerified: true,
  })
    .populate('company', 'name logoUrl')
    .populate('clubs', 'name priorityWeight')
    .lean();

  const scored = employees.map((emp) => {
    const sharedClubs = (emp.clubs || []).filter((club) =>
      jsClubIds.has(club._id.toString())
    );
    const sharedClubWeight = sharedClubs.reduce((sum, club) => sum + (club.priorityWeight || 0), 0);
    const isConnection = jsConnectionIds.has(emp.linkedinId);
    const isTarget = emp.company && targetCompanyIds.has(emp.company._id.toString());
    
    // Shared clubs should boost recommendations, alongside connection + target matches
    const score = sharedClubWeight + (isConnection ? 5 : 0) + (isTarget ? 4 : 0);
    return { ...emp, recommendationScore: score, sharedClubs };
  });

  scored.sort((a, b) => b.recommendationScore - a.recommendationScore);
  res.json(scored);
});

// Join / leave a club
router.post('/me/clubs/:clubId', protect, requireRole('jobseeker'), async (req, res) => {
  await Jobseeker.findByIdAndUpdate(req.user._id, {
    $addToSet: { clubs: req.params.clubId },
  });
  await Club.findByIdAndUpdate(req.params.clubId, {
    $addToSet: { members: req.user._id },
  });
  res.json({ message: 'Joined club' });
});

router.delete('/me/clubs/:clubId', protect, requireRole('jobseeker'), async (req, res) => {
  await Jobseeker.findByIdAndUpdate(req.user._id, {
    $pull: { clubs: req.params.clubId },
  });
  await Club.findByIdAndUpdate(req.params.clubId, {
    $pull: { members: req.user._id },
  });
  res.json({ message: 'Left club' });
});

export default router;
