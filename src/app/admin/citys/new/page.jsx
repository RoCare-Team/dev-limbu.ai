"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Save, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

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

  useEffect(() => {
    if (isEdit && params.slug) {
      fetchPage(params.slug);
    }
  }, [isEdit, params]);

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

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
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
    setSaving(true);
    try {
      if (isEdit) {
        await axios.put(`/api/admin/city-services/${params.slug}`, formData);
        toast.success("Page updated successfully");
        router.push("/admin/city-services");
      } else {
        await axios.post("/api/admin/city-services", formData);
        toast.success("Page created successfully");
        router.push("/admin/city-services");
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto mb-20">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/city-services" className="text-slate-500 hover:text-slate-800">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-3xl font-bold text-slate-800">
          {isEdit ? "Edit City Service Page" : "Create New City Service Page"}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Info */}
        <div className="bg-white p-6 rounded-lg shadow space-y-4">
          <h2 className="text-xl font-bold border-b pb-2 mb-4">Basic Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">City Name *</label>
              <input
                type="text"
                name="cityName"
                value={formData.cityName}
                onChange={handleChange}
                required
                className="w-full p-2 border rounded"
                placeholder="e.g. Gurugram"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">City Slug *</label>
              <input
                type="text"
                name="citySlug"
                value={formData.citySlug}
                onChange={handleChange}
                required
                disabled={isEdit}
                className="w-full p-2 border rounded disabled:bg-slate-100 disabled:cursor-not-allowed"
                placeholder="e.g. google-bussiness-service-gurugram"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Meta Title</label>
              <input
                type="text"
                name="metaTitle"
                value={formData.metaTitle || ""}
                onChange={handleChange}
                className="w-full p-2 border rounded"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Meta Description</label>
              <textarea
                name="metaDescription"
                value={formData.metaDescription || ""}
                onChange={handleChange}
                rows={3}
                className="w-full p-2 border rounded"
              />
            </div>
            <div className="col-span-2 flex items-center gap-2 mt-2">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                id="isActive"
              />
              <label htmlFor="isActive" className="text-sm font-medium">Page is Active (Public)</label>
            </div>
          </div>
        </div>

        {/* Hero Section */}
        <div className="bg-white p-6 rounded-lg shadow space-y-4">
          <h2 className="text-xl font-bold border-b pb-2 mb-4">Hero Section overrides (Optional)</h2>
          <p className="text-xs text-slate-500 -mt-2 mb-4">If left blank, the default dynamic hero content will be used.</p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Custom Hero Heading</label>
              <input
                type="text"
                name="heroHeading"
                value={formData.heroHeading || ""}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                placeholder="e.g. Rank #1 on Google in {cityName} — Automatically"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Custom Hero Subheading</label>
              <textarea
                name="heroSubheading"
                value={formData.heroSubheading || ""}
                onChange={handleChange}
                rows={2}
                className="w-full p-2 border rounded"
              />
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="bg-white p-6 rounded-lg shadow space-y-4">
          <h2 className="text-xl font-bold border-b pb-2 mb-4">Stats Counter</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             <div>
              <label className="block text-sm font-medium mb-1">Posts Automated</label>
              <input type="number" name="postsAutomated" value={formData.postsAutomated} onChange={handleChange} className="w-full p-2 border rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Reviews Gen.</label>
              <input type="number" name="reviewsGenerated" value={formData.reviewsGenerated} onChange={handleChange} className="w-full p-2 border rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Businesses</label>
              <input type="number" name="businessesServed" value={formData.businessesServed} onChange={handleChange} className="w-full p-2 border rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Avg Growth %</label>
              <input type="number" name="avgProfileGrowth" value={formData.avgProfileGrowth} onChange={handleChange} className="w-full p-2 border rounded" />
            </div>
          </div>
        </div>

        {/* FAQs */}
        <div className="bg-white p-6 rounded-lg shadow space-y-4">
          <div className="flex justify-between items-center border-b pb-2 mb-4">
            <h2 className="text-xl font-bold">FAQs</h2>
            <button type="button" onClick={() => addArrayItem("faqs", { question: "", answer: "" })} className="text-sm bg-blue-50 text-blue-600 px-3 py-1 rounded font-medium flex items-center gap-1">
              <Plus className="w-4 h-4" /> Add FAQ
            </button>
          </div>
          {formData.faqs.map((faq, index) => (
            <div key={index} className="p-4 border rounded bg-slate-50 relative">
               <button type="button" onClick={() => removeArrayItem(index, "faqs")} className="absolute top-2 right-2 text-red-500"><Trash2 className="w-4 h-4" /></button>
               <input type="text" value={faq.question} onChange={(e) => handleArrayChange(index, "question", e.target.value, "faqs")} placeholder="Question" className="w-full p-2 mb-2 border rounded" required />
               <textarea value={faq.answer} onChange={(e) => handleArrayChange(index, "answer", e.target.value, "faqs")} placeholder="Answer" rows={2} className="w-full p-2 border rounded" required />
            </div>
          ))}
          {formData.faqs.length === 0 && <p className="text-sm text-slate-500">No FAQs added yet.</p>}
        </div>

        {/* Testimonials */}
        <div className="bg-white p-6 rounded-lg shadow space-y-4">
          <div className="flex justify-between items-center border-b pb-2 mb-4">
            <h2 className="text-xl font-bold">Testimonials</h2>
            <button type="button" onClick={() => addArrayItem("testimonials", { name: "", role: "", text: "", rating: 5, verified: true })} className="text-sm bg-blue-50 text-blue-600 px-3 py-1 rounded font-medium flex items-center gap-1">
              <Plus className="w-4 h-4" /> Add Testimonial
            </button>
          </div>
          {formData.testimonials.map((test, index) => (
            <div key={index} className="p-4 border rounded bg-slate-50 relative grid grid-cols-2 gap-2">
               <button type="button" onClick={() => removeArrayItem(index, "testimonials")} className="absolute top-2 right-2 text-red-500"><Trash2 className="w-4 h-4" /></button>
               <input type="text" value={test.name} onChange={(e) => handleArrayChange(index, "name", e.target.value, "testimonials")} placeholder="Name" className="w-full p-2 border rounded" required />
               <input type="text" value={test.role} onChange={(e) => handleArrayChange(index, "role", e.target.value, "testimonials")} placeholder="Role / Location" className="w-full p-2 border rounded" required />
               <textarea value={test.text} onChange={(e) => handleArrayChange(index, "text", e.target.value, "testimonials")} placeholder="Review Text" rows={2} className="w-full p-2 border rounded col-span-2" required />
               <div className="col-span-2 flex items-center gap-4 text-sm mt-1">
                 <label>Rating: <input type="number" min="1" max="5" value={test.rating} onChange={(e) => handleArrayChange(index, "rating", Number(e.target.value), "testimonials")} className="w-16 p-1 border rounded ml-1" /></label>
                 <label className="flex items-center gap-1"><input type="checkbox" checked={test.verified} onChange={(e) => handleArrayChange(index, "verified", e.target.checked, "testimonials")} /> Verified</label>
               </div>
            </div>
          ))}
           {formData.testimonials.length === 0 && <p className="text-sm text-slate-500">No testimonials added yet.</p>}
        </div>

        {/* Case Studies */}
        <div className="bg-white p-6 rounded-lg shadow space-y-4">
          <div className="flex justify-between items-center border-b pb-2 mb-4">
            <h2 className="text-xl font-bold">Case Studies</h2>
            <button type="button" onClick={() => addArrayItem("caseStudies", { category: "", location: "", name: "", result: "", desc: "", imgUrl: "" })} className="text-sm bg-blue-50 text-blue-600 px-3 py-1 rounded font-medium flex items-center gap-1">
              <Plus className="w-4 h-4" /> Add Case Study
            </button>
          </div>
          {formData.caseStudies.map((cs, index) => (
            <div key={index} className="p-4 border rounded bg-slate-50 relative grid grid-cols-2 gap-2">
               <button type="button" onClick={() => removeArrayItem(index, "caseStudies")} className="absolute top-2 right-2 text-red-500"><Trash2 className="w-4 h-4" /></button>
               <input type="text" value={cs.name} onChange={(e) => handleArrayChange(index, "name", e.target.value, "caseStudies")} placeholder="Business Name" className="w-full p-2 border rounded" required />
               <input type="text" value={cs.category} onChange={(e) => handleArrayChange(index, "category", e.target.value, "caseStudies")} placeholder="Category (e.g. Restaurant)" className="w-full p-2 border rounded" required />
               <input type="text" value={cs.location} onChange={(e) => handleArrayChange(index, "location", e.target.value, "caseStudies")} placeholder="Location (e.g. Cyber Hub)" className="w-full p-2 border rounded" required />
               <input type="text" value={cs.result} onChange={(e) => handleArrayChange(index, "result", e.target.value, "caseStudies")} placeholder="Result (e.g. +340% walk-ins)" className="w-full p-2 border rounded" required />
               <input type="text" value={cs.imgUrl} onChange={(e) => handleArrayChange(index, "imgUrl", e.target.value, "caseStudies")} placeholder="Image URL (Optional)" className="w-full p-2 border rounded col-span-2" />
               <textarea value={cs.desc} onChange={(e) => handleArrayChange(index, "desc", e.target.value, "caseStudies")} placeholder="Description" rows={2} className="w-full p-2 border rounded col-span-2" required />
            </div>
          ))}
           {formData.caseStudies.length === 0 && <p className="text-sm text-slate-500">No case studies added yet.</p>}
        </div>

        <div className="flex justify-end pt-4 border-t">
          <button
            type="submit"
            disabled={saving}
            className="bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-bold py-3 px-8 rounded-lg flex items-center gap-2 shadow-lg"
          >
            <Save className="w-5 h-5" /> {saving ? "Saving..." : "Save Page"}
          </button>
        </div>
      </form>
    </div>
  );
}
