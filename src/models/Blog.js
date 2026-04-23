import mongoose from "mongoose";

const BlogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    content: {
      type: String,
      required: true, // HTML or Markdown content
    },
    excerpt: {
      type: String,
      default: "",
    },
    featuredImage: {
      type: String, // URL of the image (Cloudinary, etc.)
      default: "",
    },
    author: {
      type: String,
      default: "Admin",
    },
    tags: {
      type: [String],
      default: [],
    },
    category: {
      type: String,
      default: "General",
    },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
    },
    seoTitle: {
      type: String,
      default: "",
    },
    seoDescription: {
      type: String,
      default: "",
    },
    views: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Blog || mongoose.model("Blog", BlogSchema);
