import mongoose from 'mongoose';
import User from './User.js';

const employeeSchema = new mongoose.Schema({
  // Email — can register with company email directly, or personal + verify via company
  companyEmail: { type: String, lowercase: true },
  isCompanyEmailVerified: { type: Boolean, default: false },

  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  jobTitle: String,
  department: String,

  // Credits earned by approving referrals
  credits: { type: Number, default: 0 },

  // Referrals this employee has given / is reviewing
  referrals: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Referral' }],
});

const Employee = User.discriminator('employee', employeeSchema);
export default Employee;
