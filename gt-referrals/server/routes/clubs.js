import { Router } from 'express';
import Club from '../models/Club.js';
import Jobseeker from '../models/Jobseeker.js';
import Employee from '../models/Employee.js';
import { protect } from '../middleware/auth.js';

const router = Router();
const DEFAULT_PRIORITY_WEIGHT = 1;
const normalizeClubName = (value) => value.replace(/\s+/g, ' ').trim();
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const getModelByRole = (role) => {
  if (role === 'jobseeker') return Jobseeker;
  if (role === 'employee') return Employee;
  return null;
};

router.get('/', protect, async (_req, res) => {
  const clubs = await Club.find({})
    .select('name logoUrl description priorityWeight')
    .sort({ priorityWeight: -1, name: 1 })
    .lean();

  res.json(clubs);
});

router.post('/', protect, async (req, res) => {
  const rawName = typeof req.body?.name === 'string' ? req.body.name : '';
  const name = normalizeClubName(rawName);

  if (!name) {
    return res.status(400).json({ message: 'Club name is required' });
  }

  const existingClub = await Club.findOne({
    name: { $regex: `^${escapeRegex(name)}$`, $options: 'i' },
  });

  if (existingClub) {
    return res.json({ club: existingClub, created: false });
  }

  const club = await Club.create({
    name,
    priorityWeight: DEFAULT_PRIORITY_WEIGHT,
  });

  return res.status(201).json({ club, created: true });
});

router.post('/:clubId/join', protect, async (req, res) => {
  const Model = getModelByRole(req.user.role);
  if (!Model) {
    return res.status(403).json({ message: 'Only employees and jobseekers can join clubs' });
  }

  const club = await Club.findById(req.params.clubId).select('_id');
  if (!club) {
    return res.status(404).json({ message: 'Club not found' });
  }

  await Model.findByIdAndUpdate(req.user._id, {
    $addToSet: { clubs: club._id },
  });
  await Club.findByIdAndUpdate(club._id, {
    $addToSet: { members: req.user._id },
  });

  res.json({ message: 'Joined club' });
});

router.delete('/:clubId/leave', protect, async (req, res) => {
  const Model = getModelByRole(req.user.role);
  if (!Model) {
    return res.status(403).json({ message: 'Only employees and jobseekers can leave clubs' });
  }

  const club = await Club.findById(req.params.clubId).select('_id');
  if (!club) {
    return res.status(404).json({ message: 'Club not found' });
  }

  await Model.findByIdAndUpdate(req.user._id, {
    $pull: { clubs: club._id },
  });
  await Club.findByIdAndUpdate(club._id, {
    $pull: { members: req.user._id },
  });

  res.json({ message: 'Left club' });
});

export default router;
