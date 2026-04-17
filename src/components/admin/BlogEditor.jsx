"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import toast from "react-hot-toast";
import { useBlogs } from "@/hooks/useBlogs";
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  FormControl,
  Select,
  MenuItem,
  InputAdornment,
  Divider,
  CircularProgress,
} from "@mui/material";
import { ArrowBack, Save, Delete, CloudUpload, Public, EditNote } from "@mui/icons-material";
import "react-quill-new/dist/quill.snow.css";

// Dynamically import react-quill to avoid SSR issues
const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

export default function BlogEditor({ initialData = null, isEdit = false }) {
  const router = useRouter();
  const { loading, uploading, createBlog, updateBlog, uploadBlogImage } = useBlogs();

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    content: "",
    excerpt: "",
    featuredImage: "",
    category: "General",
    tags: "",
    status: "draft",
    seoTitle: "",
    seoDescription: "",
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        tags: Array.isArray(initialData.tags) ? initialData.tags.join(", ") : initialData.tags,
      });
    }
  }, [initialData]);

  // Auto-generate slug from title (only if not editing)
  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setFormData((prev) => {
      const updates = { title: newTitle };
      if (!isEdit) {
        updates.slug = newTitle
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)+/g, "");
      }
      return { ...prev, ...updates };
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleContentChange = (content) => {
    setFormData((prev) => ({ ...prev, content }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const uploadedUrl = await uploadBlogImage(file);
    if (uploadedUrl) {
      setFormData((prev) => ({ ...prev, featuredImage: uploadedUrl }));
    }
    e.target.value = null; // reset file input
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.slug || !formData.content) {
      return toast.error("Title, Slug, and Content are required!");
    }

    const payload = {
      ...formData,
      tags: formData.tags.split(",").map((tag) => tag.trim()).filter((tag) => tag),
    };

    const success = isEdit
      ? await updateBlog(initialData._id, payload)
      : await createBlog(payload);

    if (success) {
      router.push("/admin/blog");
    }
  };

  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, 4, 5, 6, false] }],
      ["bold", "italic", "underline", "strike", "blockquote"],
      [{ list: "ordered" }, { list: "bullet" }],
      ["link", "image", "video"],
      [{ color: [] }, { background: [] }],
      ["clean"],
    ],
  };

  return (
    <Box sx={{ maxWidth: 1400, mx: "auto", pb: 10 }}>
      {/* Sticky Header Action Bar */}
      <Box
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          bgcolor: "rgba(243, 244, 246, 0.9)",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid",
          borderColor: "grey.300",
          px: { xs: 2, md: 4 },
          py: 2,
          mb: 4,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mx: -3, // Offset the default layout padding if any
        }}
      >
        <Button
          startIcon={<ArrowBack />}
          onClick={() => router.push("/admin/blog")}
          sx={{ color: "text.primary", fontWeight: 600, textTransform: "none" }}
        >
          Back
        </Button>
        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          {/* Status Indicator */}
          <Box sx={{ display: { xs: "none", sm: "flex" }, alignItems: "center", gap: 1, mr: 2 }}>
            <Typography variant="body2" color="text.secondary">Status:</Typography>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <Select
                name="status"
                value={formData.status}
                onChange={handleChange}
                sx={{
                  bgcolor: formData.status === "published" ? "success.50" : "warning.50",
                  color: formData.status === "published" ? "success.800" : "warning.800",
                  fontWeight: "bold",
                  "& fieldset": { border: "none" },
                }}
              >
                <MenuItem value="draft"><EditNote sx={{ mr: 1, fontSize: 18 }} /> Draft</MenuItem>
                <MenuItem value="published"><Public sx={{ mr: 1, fontSize: 18 }} /> Published</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Button
            variant="contained"
            color="primary"
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Save />}
            onClick={handleSubmit}
            disabled={loading}
            sx={{ borderRadius: 2, textTransform: "none", px: 4, py: 1, fontWeight: "bold", boxShadow: 2 }}
          >
            {loading ? "Saving..." : (isEdit ? "Update Post" : "Publish Post")}
          </Button>
        </Box>
      </Box>

      <Box sx={{ px: { xs: 2, md: 4 }, display: "grid", gridTemplateColumns: { xs: "1fr", lg: "2.5fr 1fr" }, gap: 4 }}>

        {/* LEFT COLUMN: Main Editor */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>

          <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: "1px solid", borderColor: "grey.200" }}>
            <TextField
              fullWidth
              placeholder="Post Title..."
              name="title"
              value={formData.title}
              onChange={handleTitleChange}
              variant="standard"
              InputProps={{
                disableUnderline: true,
                style: { fontSize: "1.8rem", fontWeight: 800, lineHeight: 1.2 },
              }}
              sx={{ mb: 3 }}
            />

            <Box sx={{
              "& .ql-container": { minHeight: 500, fontSize: "1.1rem", border: "none !important", fontFamily: "inherit" },
              "& .ql-toolbar": { border: "none !important", borderBottom: "1px solid #e5e7eb !important", mb: 2, pb: 2 },
              "& .ql-editor": { px: 0 }
            }}>
              <ReactQuill
                theme="snow"
                value={formData.content}
                onChange={handleContentChange}
                modules={modules}
                placeholder="Start writing your amazing story here..."
              />
            </Box>
          </Paper>

          {/* SEO Section inside Main Column for space */}
          <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: "1px solid", borderColor: "grey.200" }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: "bold", display: "flex", alignItems: "center", gap: 1 }}>
              Search Engine Optimization (SEO)
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <TextField
              fullWidth
              label="SEO Title"
              name="seoTitle"
              value={formData.seoTitle}
              onChange={handleChange}
              variant="outlined"
              helperText="Ideally between 50-60 characters."
              sx={{ mb: 3 }}
            />
            <TextField
              fullWidth
              multiline
              rows={3}
              label="SEO Description"
              name="seoDescription"
              value={formData.seoDescription}
              onChange={handleChange}
              variant="outlined"
              helperText="Ideally between 150-160 characters. This appears in Google search results."
              sx={{ mb: 4 }}
            />

            {/* Google Search Preview */}
            <Box sx={{ mt: 2, p: 3, borderRadius: 2, bgcolor: "#f8f9fa", border: "1px solid", borderColor: "grey.200" }}>
              <Typography variant="subtitle2" sx={{ mb: 2, color: "text.secondary", fontWeight: "bold", textTransform: "uppercase", letterSpacing: 0.5 }}>
                Google Search Preview
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, maxWidth: 600 }}>
                {/* URL */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box
                    component="img"
                    src="/favicon.ico"
                    alt="favicon"
                    sx={{ width: 16, height: 16, borderRadius: "50%", bgcolor: "grey.300" }}
                    onError={(e) => { e.target.style.display = 'none' }}
                  />
                  <Typography sx={{ color: "#202124", fontSize: "14px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {typeof window !== "undefined" ? window.location.origin : "https://limbu.ai"}
                    <span style={{ color: "#5f6368" }}> &rsaquo; blog &rsaquo; {formData.slug || "your-post-slug"}</span>
                  </Typography>
                </Box>
                {/* Title */}
                <Typography sx={{ color: "#1a0dab", fontSize: "20px", fontWeight: 400, lineHeight: 1.3, cursor: "pointer", "&:hover": { textDecoration: "underline" }, display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {formData.seoTitle || formData.title || "Your Post Title Will Appear Here"}
                </Typography>
                {/* Description */}
                <Typography sx={{ color: "#4d5156", fontSize: "14px", lineHeight: 1.58, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {formData.seoDescription || formData.excerpt || "Write a meta description or an excerpt to see how it will appear in search results. This helps users understand what your post is about before clicking."}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Box>

        {/* RIGHT COLUMN: Sidebar Settings */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>

          <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: "1px solid", borderColor: "grey.200", bgcolor: "grey.50" }}>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: "bold" }}>
              Publishing Details
            </Typography>

            <Box sx={{ display: { xs: "block", sm: "none" }, mb: 3 }}>
              {/* Mobile Status dropdown */}
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Status</Typography>
              <Select
                fullWidth
                size="small"
                name="status"
                value={formData.status}
                onChange={handleChange}
                sx={{ bgcolor: "white" }}
              >
                <MenuItem value="draft">Draft</MenuItem>
                <MenuItem value="published">Published</MenuItem>
              </Select>
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>URL Slug *</Typography>
            <TextField
              fullWidth
              size="small"
              name="slug"
              value={formData.slug}
              onChange={handleChange}
              variant="outlined"
              sx={{ bgcolor: "white", mb: 3 }}
              InputProps={{
                startAdornment: <InputAdornment position="start">/blog/</InputAdornment>,
              }}
            />

            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Category</Typography>
            <TextField
              fullWidth
              size="small"
              placeholder="e.g. Marketing, Case Study"
              name="category"
              value={formData.category}
              onChange={handleChange}
              variant="outlined"
              sx={{ bgcolor: "white", mb: 3 }}
            />

            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Tags</Typography>
            <TextField
              fullWidth
              size="small"
              placeholder="seo, digital marketing, ads"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              variant="outlined"
              sx={{ bgcolor: "white", mb: 3 }}
              helperText="Separate multiple tags with commas."
            />
          </Paper>

          <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: "1px solid", borderColor: "grey.200", bgcolor: "grey.50" }}>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: "bold" }}>
              Featured Image
            </Typography>

            {formData.featuredImage ? (
              <Box sx={{ position: "relative", mb: 2, borderRadius: 3, overflow: "hidden", border: "1px solid", borderColor: "grey.300" }}>
                <Box
                  component="img"
                  src={formData.featuredImage}
                  alt="Featured"
                  sx={{ width: "100%", height: 200, objectFit: "cover", display: "block" }}
                />
                <Button
                  size="small"
                  color="error"
                  variant="contained"
                  sx={{ position: "absolute", top: 8, right: 8, minWidth: "auto", p: 1, borderRadius: 2 }}
                  onClick={() => setFormData((prev) => ({ ...prev, featuredImage: "" }))}
                >
                  <Delete fontSize="small" />
                </Button>
              </Box>
            ) : (
              <Button
                component="label"
                fullWidth
                sx={{
                  py: 4,
                  border: "2px dashed",
                  borderColor: "grey.400",
                  borderRadius: 3,
                  bgcolor: "white",
                  color: "text.secondary",
                  display: "flex",
                  flexDirection: "column",
                  gap: 1,
                  "&:hover": { borderColor: "primary.main", bgcolor: "primary.50", color: "primary.main" }
                }}
                disabled={uploading}
              >
                {uploading ? (
                  <CircularProgress size={28} />
                ) : (
                  <>
                    <CloudUpload fontSize="large" />
                    <Typography variant="body2" fontWeight="medium">
                      Click to upload image
                    </Typography>
                  </>
                )}
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handleImageUpload}
                />
              </Button>
            )}
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1, textAlign: "center" }}>
              Recommended size: 1200 x 630 px
            </Typography>
          </Paper>

          <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: "1px solid", borderColor: "grey.200", bgcolor: "grey.50" }}>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: "bold" }}>
              Post Excerpt
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              placeholder="Write a brief summary of this post..."
              name="excerpt"
              value={formData.excerpt}
              onChange={handleChange}
              variant="outlined"
              sx={{ bgcolor: "white" }}
              helperText="This text will appear on the blog grid and social media previews."
            />
          </Paper>

        </Box>
      </Box>
    </Box>
  );
}
