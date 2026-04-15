import mongoose from 'mongoose';

const linkedinDataSchema = new mongoose.Schema(
  {
    accessToken: { type: String, select: false },
    displayName: String,
    photo: String,
    profileUrl: String,
    headline: String,       // job title / tagline from LinkedIn
    summary: String,
    positions: [
      {
        title: String,
        company: String,
        startDate: Date,
        endDate: Date,
        current: Boolean,
        description: String,
      },
    ],
    educations: [
      {
        school: String,
        degree: String,
        fieldOfStudy: String,
        startYear: Number,
        endYear: Number,
      },
    ],
    skills: [String],
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    // Shared identity
    name: { type: String, required: true },
    email: { type: String, unique: true, sparse: true, lowercase: true },
    passwordHash: { type: String, select: false },
    role: { type: String, enum: ['employee', 'jobseeker'] },

    // LinkedIn OAuth
    linkedinId: { type: String, unique: true, sparse: true },
    linkedin: linkedinDataSchema,

    // Connections pulled from LinkedIn
    connections: [
      {
        linkedinId: String,
        name: String,
        headline: String,
        photo: String,
        profileUrl: String,
        company: String,
      },
    ],

    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String, select: false },
  },
  {
    timestamps: true,
    discriminatorKey: 'role',
  }
);

const User = mongoose.model('User', userSchema);
export default User;
