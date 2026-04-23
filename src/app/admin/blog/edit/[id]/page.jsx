"use client";

import { useEffect, useState, use } from "react";
import BlogEditor from "@/components/admin/BlogEditor";
import toast from "react-hot-toast";
import { Box, CircularProgress, Typography } from "@mui/material";

export default function EditBlogPage({ params }) {
  const unwrappedParams = use(params);
  const id = unwrappedParams.id;
  
  const [initialData, setInitialData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        const res = await fetch(`/api/blog/${id}`);
        const data = await res.json();
        
        if (data.success) {
          setInitialData(data.blog);
        } else {
          toast.error("Failed to fetch blog details");
        }
      } catch (error) {
        console.error(error);
        toast.error("Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchBlog();
    }
  }, [id]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!initialData) {
    return (
      <Box sx={{ textAlign: "center", py: 10 }}>
        <Typography color="error" variant="h6">Blog not found.</Typography>
      </Box>
    );
  }

  return <BlogEditor isEdit={true} initialData={initialData} />;
}
