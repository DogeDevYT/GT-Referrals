import mongoose from 'mongoose';

const referralSchema = new mongoose.Schema(
  {
    jobseeker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },

    jobTitle: { type: String, required: true },
    jobUrl: String,
    jobId: String,          // internal job requisition ID if available

    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'submitted', 'expired'],
      default: 'pending',
    },

    creditsUsed: { type: Number, required: true },
    creditsAwarded: { type: Number, default: 0 }, // credits employee earns on approval

    message: String,        // jobseeker's message to employee
    employeeNote: String,   // employee's note on approval/rejection

    // Priority boost from shared club membership
    priorityScore: { type: Number, default: 0 },
    sharedClubs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Club' }],

    approvedAt: Date,
    rejectedAt: Date,
    submittedAt: Date,
    expiresAt: Date,
  },
  { timestamps: true }
);

//Index to optimize range queries or sorting results
referralSchema.index({ employee: 1, status: 1 });
referralSchema.index({ jobseeker: 1, status: 1 });

const Referral = mongoose.model('Referral', referralSchema);
export default Referral;
