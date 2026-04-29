"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { uploadToS3Action } from "@/app/actions/uploadS3Actions";

import {
  Box, Typography, Button, TextField, Checkbox, FormControlLabel,
  Card, CardContent, IconButton, Grid, CircularProgress,
  ThemeProvider, createTheme, styled, Paper, Stack, InputAdornment
} from "@mui/material";
import { 
  ArrowBack, Save, Add, Delete, CloudUpload, Image as ImageIcon,
  Info, BarChart, QuestionAnswer, FormatQuote, Work, Search
} from "@mui/icons-material";
import Switch from '@mui/material/Switch';

const PREFIX = "google-bussiness-service-";

const theme = createTheme({
  palette: {
    primary: { main: "#1976d2", light: "#e3f2fd" },
    secondary: { main: "#ff9800", light: "#fff3e0" },
    background: { default: "#f4f7fa", paper: "#ffffff" },
    text: { primary: "#1e293b", secondary: "#64748b" },
    error: { main: "#ef4444", light: "#fef2f2" }
  },
  typography: { fontFamily: "inherit" },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: { 
      styleOverrides: { 
        root: { textTransform: "none", fontWeight: 600, padding: "8px 16px" } 
      } 
    },
    MuiCard: { 
      styleOverrides: { 
        root: { boxShadow: "0 4px 20px -2px rgba(0,0,0,0.05)", border: "1px solid #f1f5f9", overflow: "visible" } 
      } 
    },
    MuiTextField: { 
      styleOverrides: { 
        root: { '& .MuiOutlinedInput-root': { borderRadius: "8px" } } 
      } 
    }
  },
});

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

const SectionHeader = ({ icon, title, subtitle, action }) => (
  <Box mb={4} display="flex" justifyContent="space-between" alignItems="flex-start">
    <Box>
      <Box display="flex" alignItems="center" gap={1.5} mb={0.5}>
        <Box display="flex" alignItems="center" justifyContent="center" p={1} bgcolor="primary.light" color="primary.main" borderRadius={2}>
          {icon}
        </Box>
        <Typography variant="h6" fontWeight="bold" color="text.primary">{title}</Typography>
      </Box>
      {subtitle && <Typography variant="body2" color="text.secondary" ml={6}>{subtitle}</Typography>}
    </Box>
    {action && <Box>{action}</Box>}
  </Box>
);

export default function CityServiceForm() {
  const router = useRouter();
  const params = useParams();
  const isEdit = !!params?.slug;

  const [formData, setFormData] = useState({
    citySlug: "",
    cityName: "",
    metaTitle: "",
    metaDescription: "",
    heroHeading: "",
    heroSubheading: "",
    heroImageUrl: "",
    postsAutomated: 10000,
    reviewsGenerated: 50000,
    businessesServed: 500,
    avgProfileGrowth: 340,
    faqs: [],
    testimonials: [],
    caseStudies: [],
    isActive: true,
  });

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingCSIndex, setUploadingCSIndex] = useState(null);
  const [slugExists, setSlugExists] = useState(false);
  const [checkingSlug, setCheckingSlug] = useState(false);

  useEffect(() => {
    if (isEdit && params.slug) {
      fetchPage(params.slug);
    }
  }, [isEdit, params]);

  // Real-time slug duplicate check
  useEffect(() => {
    if (!formData.citySlug || isEdit) return;

    const checkSlug = async () => {
      setCheckingSlug(true);
      try {
        const res = await axios.get(`/api/admin/city-services/${formData.citySlug}`);
        if (res.data.success) {
          setSlugExists(true);
        }
      } catch (error) {
        if (error.response?.status === 404) {
          setSlugExists(false); // Slug is available
        }
      } finally {
        setCheckingSlug(false);
      }
    };

    const timer = setTimeout(() => {
      checkSlug();
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.citySlug, isEdit]);

  const fetchPage = async (slug) => {
    try {
      const res = await axios.get(`/api/admin/city-services/${slug}`);
      if (res.data.success) {
        setFormData(res.data.data);
      }
    } catch (error) {
      toast.error("Failed to load page data");
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (text) => {
    return text.toString().toLowerCase().trim()
      .replace(/\s+/g, '-')        // Replace spaces with -
      .replace(/[^\w\-]+/g, '')    // Remove all non-word chars
      .replace(/\-\-+/g, '-');     // Replace multiple - with single -
  };

  const handleHeroImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    const data = new FormData();
    data.append("file", file);
    try {
      const res = await uploadToS3Action(data);
      if (res.success && res.url) {
        setFormData((prev) => ({ ...prev, heroImageUrl: res.url }));
        toast.success("Image uploaded successfully");
      } else {
        toast.error(res.error || "Failed to upload image");
      }
    } catch (error) {
      toast.error("An error occurred during upload");
    } finally {
      setUploadingImage(false);
      e.target.value = ''; // Reset input
    }
  };

  const handleCaseStudyImageUpload = async (e, index) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCSIndex(index);
    const data = new FormData();
    data.append("file", file);
    try {
      const res = await uploadToS3Action(data);
      if (res.success && res.url) {
        handleArrayChange(index, "imgUrl", res.url, "caseStudies");
        toast.success("Case study image uploaded");
      } else {
        toast.error(res.error || "Failed to upload image");
      }
    } catch (error) {
      toast.error("An error occurred during upload");
    } finally {
      setUploadingCSIndex(null);
      e.target.value = ''; // Reset input
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: type === "checkbox" ? checked : value };
      
      // Auto-generate slug when cityName changes (only if it's a new page)
      if (name === "cityName" && !isEdit) {
        updated.citySlug = PREFIX + generateSlug(value);
      }
      
      return updated;
    });
  };

  const handleSlugChange = (e) => {
    const baseSlug = generateSlug(e.target.value);
    setFormData((prev) => ({ ...prev, citySlug: PREFIX + baseSlug }));
  };

  const handleArrayChange = (index, field, value, arrayName) => {
    const newArray = [...formData[arrayName]];
    newArray[index][field] = value;
    setFormData({ ...formData, [arrayName]: newArray });
  };

  const addArrayItem = (arrayName, emptyItem) => {
    setFormData({ ...formData, [arrayName]: [...formData[arrayName], emptyItem] });
  };

  const removeArrayItem = (index, arrayName) => {
    const newArray = [...formData[arrayName]];
    newArray.splice(index, 1);
    setFormData({ ...formData, [arrayName]: newArray });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (slugExists && !isEdit) {
      toast.error("A page for this city already exists.");
      return;
    }

    setSaving(true);
    try {
      if (isEdit) {
        await axios.put(`/api/admin/city-services/${params.slug}`, formData);
        toast.success("Page updated successfully");
        router.push("/admin/citys");
      } else {
        await axios.post("/api/admin/city-services", formData);
        toast.success("Page created successfully");
        router.push("/admin/citys");
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress color="primary" />
      </Box>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ bgcolor: "background.default", minHeight: "100vh", pb: 12 }}>
        
        {/* Sticky Top Bar for Header & Quick Save */}
        <Paper elevation={0} sx={{ position: 'sticky', top: 0, zIndex: 1100, borderBottom: '1px solid #e2e8f0', borderRadius: 0, bgcolor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)' }}>
          <Box px={{ xs: 2, md: 4 }} py={2} maxWidth="1200px" mx="auto" display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center" gap={2}>
              <IconButton component={Link} href="/admin/citys" color="primary" sx={{ bgcolor: "primary.light" }}>
                <ArrowBack />
              </IconButton>
              <Typography variant="h5" fontWeight="bold" color="text.primary">
                {isEdit ? "Edit City Page" : "New City Page"}
              </Typography>
            </Box>
            <Button onClick={handleSubmit} variant="contained" color="primary" size="large" startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <Save />} disabled={saving || (slugExists && !isEdit) || checkingSlug} sx={{ px: 4, borderRadius: "50px" }}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </Box>
        </Paper>

        <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: "1000px", mx: "auto", mt: 2 }}>
          <form onSubmit={handleSubmit}>
            <Stack spacing={4}>
              
              {/* Basic Info */}
              <Card>
                <CardContent sx={{ p: 4 }}>
                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={4}>
                    <Box>
                      <Box display="flex" alignItems="center" gap={1.5} mb={0.5}>
                        <Box display="flex" alignItems="center" justifyContent="center" p={1} bgcolor="primary.light" color="primary.main" borderRadius={2}>
                          <Info />
                        </Box>
                        <Typography variant="h6" fontWeight="bold" color="text.primary">Basic Information</Typography>
                        <Box ml={2}>
                           <FormControlLabel 
                             control={<Switch checked={formData.isActive} onChange={(e) => setFormData({...formData, isActive: e.target.checked})} color="primary" />} 
                             label={<Typography fontWeight="bold" color={formData.isActive ? "primary.main" : "text.secondary"}>{formData.isActive ? "Active (Public)" : "Draft"}</Typography>} 
                             sx={{ m: 0, bgcolor: formData.isActive ? "primary.light" : "grey.200", pr: 2, borderRadius: 5 }} 
                           />
                        </Box>
                      </Box>
                      <Typography variant="body2" color="text.secondary" ml={6}>Core details and SEO metadata for the city page.</Typography>
                    </Box>
                  </Box>

                  {/* ✅ FIXED GRID USING MUI v6 size prop */}
                  <Grid container spacing={3}>
                    {/* Row 1 */}
                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField fullWidth label="City Name *" name="cityName" value={formData.cityName} onChange={handleChange} required placeholder="e.g. Gurugram" helperText="The primary name displayed on the page." />
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <TextField 
                        fullWidth 
                        label="City Slug *" 
                        name="citySlug" 
                        value={formData.citySlug ? formData.citySlug.replace(PREFIX, '') : ''} 
                        onChange={handleSlugChange} 
                        required 
                        disabled={isEdit} 
                        placeholder="gurugram" 
                        error={slugExists && !isEdit}
                        helperText={
                          checkingSlug ? "Checking availability..." : 
                          (slugExists && !isEdit ? "⚠️ This city page already exists!" : 
                          (isEdit ? "Changing this will break existing links." : "Auto-generated. You can modify the city part."))
                        }
                        InputProps={{
                          startAdornment: <InputAdornment position="start">{PREFIX}</InputAdornment>,
                        }}
                      />
                    </Grid>
                    <Grid size={12}>
                      <Stack spacing={3}>
                        <TextField fullWidth label="Meta Title" name="metaTitle" value={formData.metaTitle || ""} onChange={handleChange} placeholder="SEO Page Title" />
                        <TextField fullWidth label="Meta Description" name="metaDescription" value={formData.metaDescription || ""} onChange={handleChange} multiline rows={3} placeholder="SEO Description" />
                      </Stack>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Hero Section */}
              <Card>
                <CardContent sx={{ p: 4 }}>
                  <SectionHeader icon={<ImageIcon />} title="Hero Section (Optional)" subtitle="Override the default dynamic heading and background image." />
                  <Grid container spacing={3}>
                    <Grid size={12}>
                      <TextField fullWidth label="Custom Hero Heading" name="heroHeading" value={formData.heroHeading || ""} onChange={handleChange} placeholder="e.g. Rank #1 on Google in {cityName} — Automatically" />
                    </Grid>
                    <Grid size={12}>
                      <TextField fullWidth label="Custom Hero Subheading" name="heroSubheading" value={formData.heroSubheading || ""} onChange={handleChange} multiline rows={2} />
                    </Grid>
                    <Grid size={12}>
                      <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} gap={2} alignItems={{ xs: 'stretch', sm: 'flex-start' }}>
                        <Box flex={1}>
                          <TextField fullWidth label="Custom Hero Image URL" name="heroImageUrl" value={formData.heroImageUrl || ""} onChange={handleChange} placeholder="Paste image URL or upload to S3" />
                        </Box>
                        <Button component="label" variant="outlined" color="primary" startIcon={uploadingImage ? <CircularProgress size={20} color="inherit" /> : <CloudUpload />} disabled={uploadingImage} sx={{ height: '56px', px: 3, whiteSpace: "nowrap" }}>
                          {uploadingImage ? "Uploading..." : "Upload Image"}
                          <VisuallyHiddenInput type="file" accept="image/*" onChange={handleHeroImageUpload} />
                        </Button>
                      </Box>
                      {formData.heroImageUrl && (
                        <Box mt={2} p={1} bgcolor="#f8fafc" borderRadius={2} border="1px dashed #cbd5e1" display="inline-block">
                          <Typography variant="caption" color="text.secondary" display="block" mb={1}>Image Preview</Typography>
                          <img src={formData.heroImageUrl} alt="Hero Preview" style={{ height: 160, borderRadius: 8, objectFit: 'cover' }} />
                        </Box>
                      )}
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Stats Section */}
              <Card>
                <CardContent sx={{ p: 4 }}>
                  <SectionHeader icon={<BarChart />} title="Performance Stats" subtitle="Dynamic counters displayed on the page." />
                  <Grid container spacing={3}>
                    <Grid size={{ xs: 6, md: 3 }}><TextField fullWidth type="number" label="Posts Automated" name="postsAutomated" value={formData.postsAutomated} onChange={handleChange} /></Grid>
                    <Grid size={{ xs: 6, md: 3 }}><TextField fullWidth type="number" label="Reviews Gen." name="reviewsGenerated" value={formData.reviewsGenerated} onChange={handleChange} /></Grid>
                    <Grid size={{ xs: 6, md: 3 }}><TextField fullWidth type="number" label="Businesses Served" name="businessesServed" value={formData.businessesServed} onChange={handleChange} /></Grid>
                    <Grid size={{ xs: 6, md: 3 }}><TextField fullWidth type="number" label="Avg Growth %" name="avgProfileGrowth" value={formData.avgProfileGrowth} onChange={handleChange} /></Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* FAQs */}
              <Card>
                <CardContent sx={{ p: 4 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                    <SectionHeader icon={<QuestionAnswer />} title="FAQs" subtitle="City-specific frequently asked questions." />
                    <Button variant="contained" color="secondary" size="small" startIcon={<Add />} onClick={() => addArrayItem("faqs", { question: "", answer: "" })} sx={{ borderRadius: "50px", mb: 4 }}>Add FAQ</Button>
                  </Box>
                  
                  {formData.faqs.length === 0 && (
                    <Box textAlign="center" py={4} bgcolor="#f8fafc" borderRadius={2} border="1px dashed #cbd5e1">
                      <Typography color="text.secondary">No FAQs added. The default ones will be used.</Typography>
                    </Box>
                  )}

                  <Stack spacing={2}>
                    {formData.faqs.map((faq, index) => (
                      <Paper key={index} elevation={0} sx={{ p: 3, border: "1px solid #e2e8f0", bgcolor: "#f8fafc", position: "relative" }}>
                        <IconButton onClick={() => removeArrayItem(index, "faqs")} color="error" sx={{ position: "absolute", top: 12, right: 12, bgcolor: "error.light" }} size="small">
                          <Delete fontSize="small" />
                        </IconButton>
                        <Typography variant="subtitle2" color="primary" fontWeight="bold" mb={2}>FAQ #{index + 1}</Typography>
                        <Stack spacing={3} mt={1}>
                          <TextField fullWidth label="Question *" value={faq.question} onChange={(e) => handleArrayChange(index, "question", e.target.value, "faqs")} required />
                          <TextField fullWidth label="Answer *" value={faq.answer} onChange={(e) => handleArrayChange(index, "answer", e.target.value, "faqs")} required multiline rows={3} />
                        </Stack>
                      </Paper>
                    ))}
                  </Stack>
                </CardContent>
              </Card>

              {/* Testimonials */}
              <Card>
                <CardContent sx={{ p: 4 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                    <SectionHeader icon={<FormatQuote />} title="Testimonials" subtitle="Local customer reviews to build trust." />
                    <Button variant="contained" color="secondary" size="small" startIcon={<Add />} onClick={() => addArrayItem("testimonials", { name: "", role: "", text: "", rating: 5, verified: true })} sx={{ borderRadius: "50px", mb: 4 }}>Add Testimonial</Button>
                  </Box>

                  {formData.testimonials.length === 0 && (
                    <Box textAlign="center" py={4} bgcolor="#f8fafc" borderRadius={2} border="1px dashed #cbd5e1">
                      <Typography color="text.secondary">No testimonials added. Default local reviews will be used.</Typography>
                    </Box>
                  )}

                  <Grid container spacing={3}>
                    {formData.testimonials.map((test, index) => (
                      <Grid size={{ xs: 12, md: 6 }} key={index}>
                        <Paper elevation={0} sx={{ p: 3, border: "1px solid #e2e8f0", bgcolor: "#ffffff", position: "relative", height: '100%' }}>
                          <IconButton onClick={() => removeArrayItem(index, "testimonials")} color="error" sx={{ position: "absolute", top: 8, right: 8 }} size="small">
                            <Delete fontSize="small" />
                          </IconButton>
                          <Stack spacing={2} mt={1}>
                            <TextField fullWidth label="Customer Name *" value={test.name} onChange={(e) => handleArrayChange(index, "name", e.target.value, "testimonials")} required size="small" />
                            <TextField fullWidth label="Role / Location *" value={test.role} onChange={(e) => handleArrayChange(index, "role", e.target.value, "testimonials")} required size="small" />
                            <TextField fullWidth label="Review Text *" value={test.text} onChange={(e) => handleArrayChange(index, "text", e.target.value, "testimonials")} required multiline rows={3} size="small" />
                            <Box display="flex" alignItems="center" justifyContent="space-between">
                              <TextField type="number" label="Rating (1-5)" inputProps={{ min: 1, max: 5 }} value={test.rating} onChange={(e) => handleArrayChange(index, "rating", Number(e.target.value), "testimonials")} size="small" sx={{ width: 100 }} />
                              <FormControlLabel control={<Checkbox checked={test.verified} onChange={(e) => handleArrayChange(index, "verified", e.target.checked, "testimonials")} color="success" />} label="Verified Tag" />
                            </Box>
                          </Stack>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>

              {/* Case Studies */}
              <Card>
                <CardContent sx={{ p: 4 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                    <SectionHeader icon={<Work />} title="Case Studies" subtitle="Showcase real results for businesses in this city." />
                    <Button variant="contained" color="secondary" size="small" startIcon={<Add />} onClick={() => addArrayItem("caseStudies", { category: "", location: "", name: "", result: "", desc: "", imgUrl: "" })} sx={{ borderRadius: "50px", mb: 4 }}>Add Case Study</Button>
                  </Box>

                  {formData.caseStudies.length === 0 && (
                    <Box textAlign="center" py={4} bgcolor="#f8fafc" borderRadius={2} border="1px dashed #cbd5e1">
                      <Typography color="text.secondary">No case studies added. Default examples will be shown.</Typography>
                    </Box>
                  )}

                  <Stack spacing={3}>
                    {formData.caseStudies.map((cs, index) => (
                      <Paper key={index} elevation={0} sx={{ p: 3, border: "1px solid #e2e8f0", bgcolor: "#ffffff", position: "relative" }}>
                        <IconButton onClick={() => removeArrayItem(index, "caseStudies")} color="error" sx={{ position: "absolute", top: 12, right: 12, bgcolor: "error.light" }} size="small">
                          <Delete fontSize="small" />
                        </IconButton>
                        <Typography variant="subtitle2" color="primary" fontWeight="bold" mb={2}>Case Study #{index + 1}</Typography>
                        
                        <Grid container spacing={2}>
                          <Grid size={{ xs: 12, sm: 4 }}><TextField fullWidth label="Business Name *" value={cs.name} onChange={(e) => handleArrayChange(index, "name", e.target.value, "caseStudies")} required size="small" /></Grid>
                          <Grid size={{ xs: 12, sm: 4 }}><TextField fullWidth label="Category *" value={cs.category} onChange={(e) => handleArrayChange(index, "category", e.target.value, "caseStudies")} required placeholder="e.g. Restaurant" size="small" /></Grid>
                          <Grid size={{ xs: 12, sm: 4 }}><TextField fullWidth label="Location *" value={cs.location} onChange={(e) => handleArrayChange(index, "location", e.target.value, "caseStudies")} required placeholder="e.g. Cyber Hub" size="small" /></Grid>
                          
                          <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label="Result Metric *" value={cs.result} onChange={(e) => handleArrayChange(index, "result", e.target.value, "caseStudies")} required placeholder="e.g. +340% walk-ins" size="small" /></Grid>
                          
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <Box display="flex" gap={1}>
                              <TextField fullWidth label="Image URL (Optional)" value={cs.imgUrl} onChange={(e) => handleArrayChange(index, "imgUrl", e.target.value, "caseStudies")} size="small" />
                              <Button component="label" variant="outlined" color="primary" disabled={uploadingCSIndex === index} sx={{ minWidth: 100, p: 0 }}>
                                {uploadingCSIndex === index ? <CircularProgress size={16} /> : <CloudUpload />}
                                <VisuallyHiddenInput type="file" accept="image/*" onChange={(e) => handleCaseStudyImageUpload(e, index)} />
                              </Button>
                            </Box>
                          </Grid>
                          
                          {cs.imgUrl && (
                            <Grid size={12}>
                               <Box p={1} bgcolor="#f8fafc" borderRadius={2} border="1px dashed #cbd5e1" display="inline-block">
                                <img src={cs.imgUrl} alt="CS Preview" style={{ height: 100, borderRadius: 6, objectFit: 'cover' }} />
                               </Box>
                            </Grid>
                          )}

                          <Grid size={12}><TextField fullWidth label="Description *" value={cs.desc} onChange={(e) => handleArrayChange(index, "desc", e.target.value, "caseStudies")} required multiline rows={2} size="small" /></Grid>
                        </Grid>
                      </Paper>
                    ))}
                  </Stack>
                </CardContent>
              </Card>

              {/* Google Search Preview */}
              <Card>
                <CardContent sx={{ p: 4 }}>
                  <SectionHeader icon={<Search />} title="Google Search Preview" subtitle="See how this page might appear in Google search results." />
                  <Box p={3} bgcolor="#ffffff" borderRadius={2} border="1px solid #dfe1e5" maxWidth="650px" sx={{ fontFamily: 'Arial, sans-serif' }}>
                    <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                      <Box component="img" src="/favicon.ico" alt="Limbu AI" sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: '#f1f3f4', p: 0.5 }} />
                      <Typography variant="body2" sx={{ color: '#202124', fontSize: '14px', fontFamily: 'Arial, sans-serif' }}>
                        limbu.ai <span style={{ color: '#5f6368' }}>› services › {formData.citySlug ? formData.citySlug.replace(PREFIX, '') : 'city-slug'}</span>
                      </Typography>
                    </Box>
                    <Typography variant="h6" sx={{ color: '#1a0dab', fontSize: '20px', lineHeight: 1.3, mb: 0.5, cursor: 'pointer', fontFamily: 'Arial, sans-serif', '&:hover': { textDecoration: 'underline' } }}>
                      {formData.metaTitle || `${formData.cityName || 'City'} | Google Business Management Service`}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#4d5156', fontSize: '14px', lineHeight: 1.58, fontFamily: 'Arial, sans-serif' }}>
                      {formData.metaDescription || `Rank #1 on Google Maps in ${formData.cityName || 'your city'}. Get automated GMB posts, 5-star reviews, and local SEO services with Limbu AI.`}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>

            </Stack>
          </form>
        </Box>
      </Box>
    </ThemeProvider>
  );
}
