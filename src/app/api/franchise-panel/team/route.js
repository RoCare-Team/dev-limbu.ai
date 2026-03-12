import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/dbConnect";
import FranchiseTeam from "@/models/FranchiseTeam";
import jwt from "jsonwebtoken";

export async function GET(req) {
  try {
    await dbConnect();
    
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, message: "No token provided" }, { status: 401 });
    }
    
    const token = authHeader.replace("Bearer ", "");
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return NextResponse.json({ success: false, message: "Invalid token" }, { status: 401 });
    }
    
    const franchiseId = decoded.franchiseCode;
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role");
    const status = searchParams.get("status");
    
    const query = { franchiseId };
    
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { mobile: { $regex: search, $options: "i" } },
      ];
    }
    
    if (role && role !== "all") query.role = role;
    if (status && status !== "all") query.isActive = status === "active";
    
    const teamMembers = await FranchiseTeam.find(query).select("-password").sort({ createdAt: -1 });
    
    const totalMembers = await FranchiseTeam.countDocuments({ franchiseId });
    const activeMembers = await FranchiseTeam.countDocuments({ franchiseId, isActive: true });
    const pendingMembers = await FranchiseTeam.countDocuments({ franchiseId, isActive: false });
    
    const roleCounts = {
      superFranchiseAdmin: await FranchiseTeam.countDocuments({ franchiseId, role: "superFranchiseAdmin" }),
      manager: await FranchiseTeam.countDocuments({ franchiseId, role: "manager" }),
      agent: await FranchiseTeam.countDocuments({ franchiseId, role: "agent" }),
    };
    
    return NextResponse.json({
      success: true,
      data: teamMembers,
      stats: { totalMembers, activeMembers, pendingMembers, roleCounts },
    });
    
  } catch (error) {
    console.error("Error fetching team:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await dbConnect();
    
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, message: "No token provided" }, { status: 401 });
    }
    
    const token = authHeader.replace("Bearer ", "");
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return NextResponse.json({ success: false, message: "Invalid token" }, { status: 401 });
    }
    
    if (decoded.role !== "franchise" && decoded.role !== "superFranchiseAdmin") {
      return NextResponse.json({ success: false, message: "Permission denied" }, { status: 403 });
    }
    
    const body = await req.json();
    const { fullName, email, mobile, password, role, city, address } = body;
    
    if (!fullName || !email || !mobile || !password) {
      return NextResponse.json({ success: false, message: "All fields are required" }, { status: 400 });
    }
    
    const existingUser = await FranchiseTeam.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json({ success: false, message: "Email already exists" }, { status: 400 });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    // Generate referral code for agents (and superFranchiseAdmin/manager too — useful for tracking)
    const referralCode = FranchiseTeam.generateReferralCode(fullName);
    
    const teamMember = await FranchiseTeam.create({
      fullName,
      email: email.toLowerCase(),
      mobile,
      password: hashedPassword,
      role: role || "agent",
      franchiseId: decoded.franchiseCode,
      referralCode,
      city: city || null,
      address: address || null,
    });
    
    return NextResponse.json({
      success: true,
      message: "Team member created successfully",
      data: {
        _id: teamMember._id,
        fullName: teamMember.fullName,
        email: teamMember.email,
        mobile: teamMember.mobile,
        role: teamMember.role,
        referralCode: teamMember.referralCode,
        franchiseId: teamMember.franchiseId,
        city: teamMember.city,
        address: teamMember.address,
        isActive: teamMember.isActive,
        createdAt: teamMember.createdAt,
      },
    });
    
  } catch (error) {
    console.error("Error creating team member:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    await dbConnect();
    
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, message: "No token provided" }, { status: 401 });
    }
    
    const token = authHeader.replace("Bearer ", "");
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return NextResponse.json({ success: false, message: "Invalid token" }, { status: 401 });
    }
    
    const body = await req.json();
    const { id, fullName, mobile, role, isActive, address, city, password } = body;
    
    if (!id) {
      return NextResponse.json({ success: false, message: "Team member ID is required" }, { status: 400 });
    }
    
    const updateData = {};
    if (fullName) updateData.fullName = fullName;
    if (mobile) updateData.mobile = mobile;
    if (role) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (address !== undefined) updateData.address = address;
    if (city !== undefined) updateData.city = city;
    if (password) updateData.password = await bcrypt.hash(password, 10);
    
    const updatedMember = await FranchiseTeam.findByIdAndUpdate(id, updateData, { new: true }).select("-password");
    
    if (!updatedMember) {
      return NextResponse.json({ success: false, message: "Team member not found" }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, message: "Team member updated successfully", data: updatedMember });
    
  } catch (error) {
    console.error("Error updating team member:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    await dbConnect();
    
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, message: "No token provided" }, { status: 401 });
    }
    
    const token = authHeader.replace("Bearer ", "");
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return NextResponse.json({ success: false, message: "Invalid token" }, { status: 401 });
    }
    
    if (decoded.role !== "franchise" && decoded.role !== "superFranchiseAdmin") {
      return NextResponse.json({ success: false, message: "Permission denied" }, { status: 403 });
    }
    
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    
    if (!id) {
      return NextResponse.json({ success: false, message: "Team member ID is required" }, { status: 400 });
    }
    
    const deletedMember = await FranchiseTeam.findByIdAndDelete(id);
    
    if (!deletedMember) {
      return NextResponse.json({ success: false, message: "Team member not found" }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, message: "Team member deleted successfully" });
    
  } catch (error) {
    console.error("Error deleting team member:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
