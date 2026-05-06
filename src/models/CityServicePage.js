import mongoose from "mongoose";

const CITY_SERVICE_PREFIX = "google-bussiness-profile-management-";
const OLD_CITY_SERVICE_PREFIXES = ["google-bussiness-service-"];

const slugifyCity = (value = "") =>
  value
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+|-+$/g, "");

const normalizeCityServiceSlug = (slug = "", cityName = "") => {
  const source = slug || cityName;
  let cityPart = slugifyCity(source);

  [CITY_SERVICE_PREFIX, ...OLD_CITY_SERVICE_PREFIXES].forEach((prefix) => {
    if (cityPart.startsWith(prefix)) {
      cityPart = cityPart.slice(prefix.length);
    }
  });

  return cityPart ? `${CITY_SERVICE_PREFIX}${cityPart}` : "";
};

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
    heroImageUrl: { type: String },
    
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
    allowIndex: { type: Boolean, default: true },
  },
  { timestamps: true }
);

CityServicePageSchema.pre("validate", function normalizeSlug(next) {
  this.citySlug = normalizeCityServiceSlug(this.citySlug, this.cityName);
  next();
});

if (
  mongoose.models.CityServicePage &&
  !mongoose.models.CityServicePage.schema.path("allowIndex")
) {
  delete mongoose.models.CityServicePage;
}

export default mongoose.models.CityServicePage || mongoose.model("CityServicePage", CityServicePageSchema);
