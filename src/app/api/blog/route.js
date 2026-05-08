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

    const newBlog = await Blog.create({
      ...body,
      author:
        typeof body.author === "string" && body.author.trim()
          ? body.author.trim()
          : "Admin",
    });

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

export async function PUT(req) {
  try {
    await dbConnect();

    const body = await req.json();
    const {
      id,
      slug,
      title,
      content,
      excerpt,
      featuredImage,
      author,
      tags,
      category,
      status,
      seoTitle,
      seoDescription,
    } = body;

    if (!id && !slug) {
      return NextResponse.json(
        { error: "Blog id or slug is required to update a blog." },
        { status: 400 }
      );
    }

    const query = id ? { _id: id } : { slug };
    const existingBlog = await Blog.findOne(query);
    if (!existingBlog) {
      return NextResponse.json(
        { error: "Blog not found." },
        { status: 404 }
      );
    }

    if (slug && slug !== existingBlog.slug) {
      const slugExists = await Blog.findOne({ slug, _id: { $ne: existingBlog._id } });
      if (slugExists) {
        return NextResponse.json(
          { error: "Slug already in use. Please choose a different slug." },
          { status: 409 }
        );
      }
      existingBlog.slug = slug;
    }

    if (typeof title === "string" && title.trim()) {
      existingBlog.title = title.trim();
    }
    if (typeof content === "string" && content.trim()) {
      existingBlog.content = content.trim();
    }
    if (typeof excerpt === "string") {
      existingBlog.excerpt = excerpt;
    }
    if (typeof featuredImage === "string") {
      existingBlog.featuredImage = featuredImage;
    }
    if (typeof author === "string") {
      existingBlog.author = author.trim() || "Admin";
    }
    if (Array.isArray(tags)) {
      existingBlog.tags = tags;
    }
    if (typeof category === "string") {
      existingBlog.category = category;
    }
    if (typeof status === "string") {
      existingBlog.status = status;
    }
    if (typeof seoTitle === "string") {
      existingBlog.seoTitle = seoTitle;
    }
    if (typeof seoDescription === "string") {
      existingBlog.seoDescription = seoDescription;
    }

    await existingBlog.save();

    return NextResponse.json({ success: true, message: "Blog updated successfully", blog: existingBlog }, { status: 200 });
  } catch (error) {
    console.error("Error updating blog:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
