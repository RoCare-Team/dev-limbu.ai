"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  Box,
  Button,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  CircularProgress,
} from "@mui/material";
import { Add, Edit, Delete, OpenInNew } from "@mui/icons-material";
import { useBlogs } from "@/hooks/useBlogs";

export default function AdminBlogList() {
  const { blogs, loading, fetchBlogs, deleteBlog } = useBlogs();

  useEffect(() => {
    fetchBlogs();
  }, [fetchBlogs]);

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", p: { xs: 2, md: 3 } }}>
      <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, justifyContent: "space-between", alignItems: { sm: "center" }, mb: 4, gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" color="text.primary">
            Blog Management
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Manage all your website&apos;s blog posts.
          </Typography>
        </Box>
        <Button
          component={Link}
          href="/admin/blog/create"
          variant="contained"
          color="primary"
          startIcon={<Add />}
          sx={{ borderRadius: 2, textTransform: "none", px: 3, py: 1 }}
        >
          Create New Post
        </Button>
      </Box>

      {loading && blogs.length === 0 ? (
        <Box sx={{ display: "flex", justifyItems: "center", justifyContent: "center", py: 10 }}>
          <CircularProgress />
        </Box>
      ) : blogs.length === 0 ? (
        <Paper sx={{ textAlign: "center", py: 10, borderRadius: 3, border: "1px dashed", borderColor: "divider", boxShadow: "none", bgcolor: "transparent" }}>
          <Typography color="text.secondary">No blog posts found. Create your first post!</Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: 2 }}>
          <Table sx={{ minWidth: 650 }}>
            <TableHead sx={{ bgcolor: "grey.50" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: "bold" }}>Title</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Category</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Status</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Date</TableCell>
                <TableCell align="right" sx={{ fontWeight: "bold" }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {blogs.map((blog) => (
                <TableRow key={blog._id} hover>
                  <TableCell>
                    <Typography variant="body1" fontWeight="medium" sx={{ display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {blog.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      /{blog.slug}
                    </Typography>
                  </TableCell>
                  <TableCell>{blog.category || "—"}</TableCell>
                  <TableCell>
                    <Chip
                      label={blog.status === "published" ? "Published" : "Draft"}
                      color={blog.status === "published" ? "success" : "warning"}
                      size="small"
                      sx={{ fontWeight: "medium" }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(blog.createdAt).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
                      {blog.status === "published" && (
                        <IconButton
                          component={Link}
                          href={`/blog/${blog.slug}`}
                          target="_blank"
                          size="small"
                          color="info"
                          title="View Live"
                        >
                          <OpenInNew fontSize="small" />
                        </IconButton>
                      )}
                      <IconButton
                        component={Link}
                        href={`/admin/blog/edit/${blog._id}`}
                        size="small"
                        color="primary"
                        title="Edit"
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton
                        onClick={() => deleteBlog(blog._id)}
                        size="small"
                        color="error"
                        title="Delete"
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
