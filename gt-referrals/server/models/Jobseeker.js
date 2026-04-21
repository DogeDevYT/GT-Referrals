import mongoose from 'mongoose';
import User from './User.js';

const resumeSchema = new mongoose.Schema(
  {
    source: { type: String, enum: ['linkedin', 'manual'], default: 'manual' },
    summary: String,
    experience: [
      {
        title: String,
        company: String,
        startDate: Date,
        endDate: Date,
        current: Boolean,
        description: String,
      },
    ],
    education: [
      {
        school: String,
        degree: String,
        fieldOfStudy: String,
        startYear: Number,
        endYear: Number,
        gpa: Number,
      },
    ],
    skills: [String],
    projects: [
      {
        name: String,
        description: String,
        url: String,
        technologies: [String],
      },
    ],
    resumeFileUrl: String,   // optional uploaded PDF/DOCX
  },
  { _id: false }
);

const jobseekerSchema = new mongoose.Schema({
  // GT email for identity verification
  gtEmail: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    match: [/^[a-zA-Z0-9._%+-]+@gatech\.edu$/, 'Must be a valid GT email'],
  },
  isGtEmailVerified: { type: Boolean, default: false },

  // Credits spent to request referrals
  credits: { type: Number, default: 100000 },

  // GT clubs — used for priority scoring
  clubs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Club' }],

  // Resume — either from LinkedIn or manually entered
  resume: resumeSchema,

  // Referrals this jobseeker has requested
  referrals: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Referral' }],

  // Target companies / roles for the recommendation algorithm
  targetCompanies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Company' }],
  targetRoles: [String],
});

const Jobseeker = User.discriminator('jobseeker', jobseekerSchema);
export default Jobseeker;
