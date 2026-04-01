import { Router } from 'express';
import Jobseeker from '../models/Jobseeker.js';
import Employee from '../models/Employee.js';
import Referral from '../models/Referral.js';
import Club from '../models/Club.js';
import { protect, requireRole } from '../middleware/auth.js';

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
  const allowed = ['name', 'targetRoles', 'resume'];
  const updates = Object.fromEntries(
    Object.entries(req.body).filter(([k]) => allowed.includes(k))
  );
  if (updates.resume) updates['resume.source'] = 'manual';
  const jobseeker = await Jobseeker.findByIdAndUpdate(req.user._id, updates, { new: true });
  res.json(jobseeker);
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

  // Priority score: base + club overlap bonus
  const jsClubIds = new Set(jobseeker.clubs.map((c) => c._id.toString()));
  const sharedClubs = (employee.clubs || []).filter((c) => jsClubIds.has(c._id.toString()));
  const priorityScore =
    creditsToSpend + sharedClubs.reduce((sum, c) => sum + c.priorityWeight, 0);

  const referral = await Referral.create({
    jobseeker: req.user._id,
    employee: employeeId,
    company: companyId,
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
// Ranks employees by: shared clubs > shared LinkedIn connections > company match
router.get('/recommendations', protect, requireRole('jobseeker'), async (req, res) => {
  const jobseeker = await Jobseeker.findById(req.user._id).populate('clubs targetCompanies');

  const jsClubIds = new Set(jobseeker.clubs.map((c) => c._id.toString()));
  const jsConnectionIds = new Set(jobseeker.connections.map((c) => c.linkedinId));
  const targetCompanyIds = new Set(jobseeker.targetCompanies.map((c) => c._id.toString()));

  const employees = await Employee.find({
    company: { $in: [...targetCompanyIds] },
  })
    .populate('company', 'name logoUrl')
    .lean();

  const scored = employees.map((emp) => {
    const clubOverlap = (emp.clubs || []).filter((id) =>
      jsClubIds.has(id.toString())
    ).length;
    const isConnection = jsConnectionIds.has(emp.linkedinId);
    const score = clubOverlap * 3 + (isConnection ? 5 : 0);
    return { ...emp, recommendationScore: score };
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
