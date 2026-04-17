import dbConnect from "@/lib/dbConnect";
import Blog from "@/models/Blog";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  try {
    await dbConnect();

    // We await params as per Next.js 15+ routing requirements
    const { id } = await params;

    const blog = await Blog.findById(id);
    if (!blog) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, blog });
  } catch (error) {
    console.error("Error fetching blog:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    await dbConnect();

    const { id } = await params;
    const body = await req.json();

    // Prevent modifying the ID
    delete body._id;

    // Check if updating to an existing slug
    if (body.slug) {
      const existingBlog = await Blog.findOne({ slug: body.slug, _id: { $ne: id } });
      if (existingBlog) {
        return NextResponse.json(
          { error: "A blog with this slug already exists." },
          { status: 400 }
        );
      }
    }

    const updatedBlog = await Blog.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });

    if (!updatedBlog) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Blog updated successfully",
      blog: updatedBlog,
    });
  } catch (error) {
    console.error("Error updating blog:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    await dbConnect();

    const { id } = await params;

    const deletedBlog = await Blog.findByIdAndDelete(id);

    if (!deletedBlog) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Blog deleted successfully" });
  } catch (error) {
    console.error("Error deleting blog:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
