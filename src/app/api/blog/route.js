import dbConnect from "@/lib/dbConnect";
import Blog from "@/models/Blog";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");
    const status = searchParams.get("status"); // e.g., "published" for frontend
    const limit = parseInt(searchParams.get("limit")) || 0;

    // Filter query
    const query = {};
    if (status) query.status = status;

    // If fetching a single blog by slug
    if (slug) {
      const blog = await Blog.findOne({ slug, ...query });
      if (!blog) {
        return NextResponse.json({ error: "Blog not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, blog });
    }

    // Otherwise fetch list of blogs
    const blogs = await Blog.find(query).sort({ createdAt: -1 }).limit(limit);
    return NextResponse.json({ success: true, blogs });
  } catch (error) {
    console.error("Error fetching blogs:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await dbConnect();

    const body = await req.json();
    const { title, slug, content } = body;

    if (!title || !slug || !content) {
      return NextResponse.json(
        { error: "Title, slug, and content are required fields" },
        { status: 400 }
      );
    }

    // Check if slug exists
    const existingBlog = await Blog.findOne({ slug });
    if (existingBlog) {
      return NextResponse.json(
        { error: "A blog with this slug already exists. Please choose a different title or slug." },
        { status: 400 }
      );
    }

    const newBlog = await Blog.create(body);

    return NextResponse.json({
      success: true,
      message: "Blog created successfully",
      blog: newBlog,
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating blog:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
