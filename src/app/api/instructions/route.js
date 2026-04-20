import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { mongooseConnectionUri } from "@/lib/mongoConnectionUri";

const MONGODB_URI = process.env.MONGODB_URI;

const InstructionSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  category: { type: String, default: "General", trim: true },
  priority: {
    type: String,
    enum: ["low", "medium", "high"],
    default: "medium",
  },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Instruction =
  mongoose.models.instructions ||
  mongoose.model("instructions", InstructionSchema);

async function connectDB() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongooseConnectionUri(MONGODB_URI), {
      bufferCommands: false,
    });
  }
}

export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const category = searchParams.get("category");

    if (id) {
      const instruction = await Instruction.findById(id);
      if (!instruction) {
        return NextResponse.json(
          { success: false, error: "Instruction not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, instruction });
    }

    const filter = {};
    if (category) filter.category = category;

    const instructions = await Instruction.find(filter).sort({ createdAt: -1 });
    return NextResponse.json({
      success: true,
      count: instructions.length,
      instructions,
    });
  } catch (error) {
    console.error("Error fetching instructions:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();
    const { title, description, category, priority, isActive } = body;

    if (!title || !description) {
      return NextResponse.json(
        { success: false, error: "Title and description are required" },
        { status: 400 }
      );
    }

    const newInstruction = await Instruction.create({
      title,
      description,
      category: category || "General",
      priority: priority || "medium",
      isActive: isActive !== undefined ? isActive : true,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Instruction created successfully",
        instruction: newInstruction,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating instruction:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(req) {
  try {
    await connectDB();
    const body = await req.json();
    const { id, title, description, category, priority, isActive } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Instruction ID is required" },
        { status: 400 }
      );
    }

    const updateData = { updatedAt: new Date() };
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (priority !== undefined) updateData.priority = priority;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updated = await Instruction.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Instruction not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Instruction updated successfully",
      instruction: updated,
    });
  } catch (error) {
    console.error("Error updating instruction:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req) {
  try {
    await connectDB();

    let id;
    try {
      const body = await req.json();
      id = body.id;
    } catch {
      const { searchParams } = new URL(req.url);
      id = searchParams.get("id");
    }

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Instruction ID is required" },
        { status: 400 }
      );
    }

    const deleted = await Instruction.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Instruction not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Instruction deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting instruction:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
