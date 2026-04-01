import mongoose from 'mongoose';

const clubSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    description: String,
    logoUrl: String,

    // Weight applied to referral priority score when jobseeker shares this club with employee
    priorityWeight: { type: Number, default: 1.0 },

    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    officerEmails: [String],  // GT emails of club officers who can verify membership
  },
  { timestamps: true }
);

const Club = mongoose.model('Club', clubSchema);
export default Club;
