import { Router } from 'express';
import Referral from '../models/Referral.js';
import { protect } from '../middleware/auth.js';

const router = Router();

// Get a single referral (accessible to both parties)
router.get('/:id', protect, async (req, res) => {
  const referral = await Referral.findById(req.params.id)
    .populate('jobseeker', 'name linkedin profilePhoto gtEmail')
    .populate('employee', 'name linkedin profilePhoto jobTitle')
    .populate('company', 'name logoUrl')
    .populate('sharedClubs', 'name');

  if (!referral) return res.status(404).json({ message: 'Not found' });

  const userId = req.user._id.toString();
  const isParty =
    referral.jobseeker._id.toString() === userId ||
    referral.employee._id.toString() === userId;

  if (!isParty) return res.status(403).json({ message: 'Forbidden' });

  res.json(referral);
});

export default router;
