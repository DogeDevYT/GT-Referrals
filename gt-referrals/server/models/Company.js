import mongoose from 'mongoose';

const companySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    // Email domain(s) used to verify employee emails (e.g. "google.com", "amazon.com")
    emailDomains: [{ type: String, lowercase: true }],
    logoUrl: String,
    website: String,
    industry: String,
    size: {
      type: String,
      enum: ['1-50', '51-200', '201-500', '501-1000', '1001-5000', '5000+'],
    },
  },
  { timestamps: true }
);

companySchema.index({ emailDomains: 1 });

const Company = mongoose.model('Company', companySchema);
export default Company;
