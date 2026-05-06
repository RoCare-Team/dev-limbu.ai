"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  CircularProgress,
  Switch,
  Tooltip,
  ThemeProvider,
  createTheme,
  CssBaseline
} from "@mui/material";
import { Add, Edit, Delete, Visibility } from "@mui/icons-material";

import Lottie from "lottie-react";
import animationData from "@/assets/animation/Loading.json"; 

// Define a blue theme
const theme = createTheme({
  palette: {
    primary: {
      main: "#1976d2", // Standard MUI Blue
    },
    secondary: {
      main: "#f50057",
    },
    background: {
      default: "#f4f6f8",
    },
  },
  typography: {
    fontFamily: "inherit", // Inherit Next.js font
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          borderRadius: "8px",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: "12px",
          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
        },
      },
    },
  },
});

export default function AdminCityServices() {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    try {
      const res = await axios.get("/api/admin/city-services");
      setPages(res.data.data);
    } catch (error) {
      toast.error("Failed to fetch pages");
    } finally {
      setLoading(false);
    }
  };

  const deletePage = async (slug) => {
    if (!confirm("Are you sure you want to delete this page?")) return;
    try {
      await axios.delete(`/api/admin/city-services/${slug}`);
      toast.success("Page deleted successfully");
      fetchPages();
    } catch (error) {
      toast.error("Failed to delete page");
    }
  };

  const toggleStatus = async (slug, currentStatus) => {
    try {
      // Optimistic update
      setPages((prevPages) =>
        prevPages.map((p) =>
          p.citySlug === slug ? { ...p, isActive: !currentStatus } : p
        )
      );

      await axios.put(`/api/admin/city-services/${slug}`, {
        isActive: !currentStatus,
      });
      toast.success(`Page ${!currentStatus ? "activated" : "deactivated"}`);
    } catch (error) {
      toast.error("Failed to update status");
      // Revert on error
      fetchPages();
    }
  };

  const toggleIndexing = async (slug, currentAllowIndex) => {
    const nextAllowIndex = currentAllowIndex === false;

    try {
      setPages((prevPages) =>
        prevPages.map((p) =>
          p.citySlug === slug ? { ...p, allowIndex: nextAllowIndex } : p
        )
      );

      await axios.put(`/api/admin/city-services/${slug}`, {
        allowIndex: nextAllowIndex,
      });
      toast.success(`Page set to ${nextAllowIndex ? "index" : "noindex"}`);
    } catch (error) {
      toast.error("Failed to update indexing");
      fetchPages();
    }
  };

  if (loading) {
     return (
       <div className="flex items-center justify-center h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
         <div className="text-center">
           <div className="w-84 h-84 mx-auto">
             <Lottie animationData={animationData} loop={true} />
           </div>
           {/* <p className="text-gray-600 font-medium">Loading users.</p> */}
         </div>
       </div>
     );
   }

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ p: 4, maxWidth: "1200px", mx: "auto" }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Typography variant="h4" fontWeight="bold" color="text.primary">
            City Service Pages
          </Typography>
          <Button
            component={Link}
            href="/admin/citys/new"
            variant="contained"
            color="primary"
            startIcon={<Add />}
            disableElevation
          >
            Add New Page
          </Button>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead sx={{ backgroundColor: "rgba(25, 118, 210, 0.08)" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: "bold" }}>City Name</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Slug</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Status (Active)</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Indexing</TableCell>
                <TableCell align="right" sx={{ fontWeight: "bold" }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pages?.length > 0 ? (
                pages.map((page) => (
                  <TableRow key={page?._id} hover>
                    <TableCell sx={{ fontWeight: 500 }}>{page.cityName}</TableCell>
                    <TableCell
                      sx={{
                        color: "text.secondary",
                        maxWidth: 420,
                        wordBreak: "break-all",
                      }}
                    >
                      {page.citySlug}
                    </TableCell>
                    <TableCell>
                      <Tooltip title={page.isActive ? "Deactivate" : "Activate"} placement="top">
                        <Switch
                          checked={page.isActive}
                          onChange={() => toggleStatus(page.citySlug, page.isActive)}
                          color="primary"
                        />
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Tooltip title={page.allowIndex !== false ? "Set noindex" : "Allow indexing"} placement="top">
                        <Switch
                          checked={page.allowIndex !== false}
                          onChange={() => toggleIndexing(page.citySlug, page.allowIndex)}
                          color="success"
                        />
                      </Tooltip>
                      <Typography variant="caption" color={page.allowIndex !== false ? "success.main" : "error.main"} fontWeight={700}>
                        {page.allowIndex !== false ? "Index" : "Noindex"}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Box display="flex" justifyContent="flex-end" gap={1}>
                        <Tooltip title="View Public Page">
                          <IconButton
                            component={Link}
                            href={`/services/${page.citySlug}`}
                            target="_blank"
                            color="info"
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit Page">
                          <IconButton
                            component={Link}
                            href={`/admin/citys/edit/${page.citySlug}`}
                            color="primary"
                          >
                            <Edit />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Page">
                          <IconButton
                            onClick={() => deletePage(page.citySlug)}
                            color="error"
                          >
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                    <Typography variant="body1" color="text.secondary">
                      No city service pages found. Create one to get started!
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </ThemeProvider>
  );
}
