import mongoose from "mongoose";

const FaqSchema = new mongoose.Schema({
  question: { type: String, required: true },
  answer: { type: String, required: true },
});

const TestimonialSchema = new mongoose.Schema({
  name: { type: String, required: true },
  role: { type: String, required: true },
  text: { type: String, required: true },
  rating: { type: Number, default: 5 },
  verified: { type: Boolean, default: true },
});

const CaseStudySchema = new mongoose.Schema({
  category: { type: String },
  location: { type: String },
  name: { type: String },
  result: { type: String },
  desc: { type: String },
  imgUrl: { type: String },
});

const CityServicePageSchema = new mongoose.Schema(
  {
    citySlug: { 
      type: String, 
      required: true, 
      unique: true, 
      trim: true,
      index: true
    },
    cityName: { type: String, required: true, trim: true },
    metaTitle: { type: String },
    metaDescription: { type: String },
    
    // Hero Section
    heroHeading: { type: String },
    heroSubheading: { type: String },
    
    // Stats Section
    postsAutomated: { type: Number, default: 10000 },
    reviewsGenerated: { type: Number, default: 50000 },
    businessesServed: { type: Number, default: 500 },
    avgProfileGrowth: { type: Number, default: 340 },

    // Dynamic Arrays
    faqs: [FaqSchema],
    testimonials: [TestimonialSchema],
    caseStudies: [CaseStudySchema],

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.CityServicePage || mongoose.model("CityServicePage", CityServicePageSchema);
