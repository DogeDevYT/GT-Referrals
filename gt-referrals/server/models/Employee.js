import mongoose from 'mongoose';
import User from './User.js';

const employeeSchema = new mongoose.Schema({
  // Email — can register with company email directly, or personal + verify via company
  companyEmail: { type: String, lowercase: true },
  isCompanyEmailVerified: { type: Boolean, default: false },

  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  jobTitle: String,
  department: String,

  // GT clubs — used for priority scoring algorithm
  clubs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Club' }],

  // Credits earned by approving referrals
  credits: { type: Number, default: 100000 },

  // Referrals this employee has given / is reviewing
  referrals: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Referral' }],
});

const Employee = User.discriminator('employee', employeeSchema);
export default Employee;
