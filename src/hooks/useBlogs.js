"use client";

import { useState, useCallback } from "react";
import toast from "react-hot-toast";

export const useBlogs = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // 1. Fetch all blogs
  const fetchBlogs = useCallback(async (status = "") => {
    setLoading(true);
    try {
      const url = status ? `/api/blog?status=${status}` : "/api/blog";
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setBlogs(data.blogs);
        return data.blogs;
      } else {
        toast.error(data.error || "Failed to fetch blogs");
        return [];
      }
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("An error occurred while fetching blogs");
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // 2. Get single blog by ID
  const getBlogById = async (id) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/blog/${id}`);
      const data = await res.json();
      if (data.success) {
        return data.blog;
      } else {
        toast.error(data.error || "Blog not found");
        return null;
      }
    } catch (error) {
      console.error("Get error:", error);
      toast.error("Error fetching blog details");
      return null;
    } finally {
      setLoading(false);
    }
  };

  // 3. Create a new blog
  const createBlog = async (blogData) => {
    setLoading(true);
    try {
      const res = await fetch("/api/blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(blogData),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Blog created successfully!");
        return data.blog;
      } else {
        toast.error(data.error || "Failed to create blog");
        return null;
      }
    } catch (error) {
      console.error("Create error:", error);
      toast.error("An error occurred while creating the blog");
      return null;
    } finally {
      setLoading(false);
    }
  };

  // 4. Update an existing blog
  const updateBlog = async (id, blogData) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/blog/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(blogData),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Blog updated successfully!");
        return data.blog;
      } else {
        toast.error(data.error || "Failed to update blog");
        return null;
      }
    } catch (error) {
      console.error("Update error:", error);
      toast.error("An error occurred while updating the blog");
      return null;
    } finally {
      setLoading(false);
    }
  };

  // 5. Delete a blog
  const deleteBlog = async (id) => {
    if (!window.confirm("Are you sure you want to delete this blog post?")) return false;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/blog/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success("Blog deleted successfully");
        setBlogs((prev) => prev.filter((b) => b._id !== id));
        return true;
      } else {
        toast.error(data.error || "Failed to delete");
        return false;
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Error deleting blog");
      return false;
    } finally {
      setLoading(false);
    }
  };

  // 6. Handle Image Upload
  const uploadBlogImage = async (file) => {
    if (!file) return null;
    setUploading(true);
    const formPayload = new FormData();
    formPayload.append("image", file);

    try {
      const res = await fetch("/api/manual-upload", {
        method: "POST",
        body: formPayload,
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Image uploaded!");
        return data.url;
      } else {
        toast.error(data.message || "Upload failed");
        return null;
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Upload error occurred");
      return null;
    } finally {
      setUploading(false);
    }
  };

  return {
    blogs,
    loading,
    uploading,
    fetchBlogs,
    getBlogById,
    createBlog,
    updateBlog,
    deleteBlog,
    uploadBlogImage,
  };
};
