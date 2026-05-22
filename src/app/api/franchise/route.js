import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Franchise from "@/models/Franchise";

export async function POST(request) {
  try {
    await dbConnect();

    const body = await request.json();
    const {
      name,
      email,
      phone,
      city,
      gstNumber,
      plan,
      investment,
      totalAmount,
      status,
      leadType,
    } = body;
    const applicationTotal = Number(totalAmount);

    if (!name || !email || !phone || !city) {
      return NextResponse.json(
        {
          success: false,
          message: "Name, email, phone, and city are required",
        },
        { status: 400 },
      );
    }

    if (!applicationTotal || isNaN(applicationTotal) || applicationTotal <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Valid total amount is required",
        },
        { status: 400 },
      );
    }

    const franchise = await Franchise.create({
      name,
      email,
      phone,
      city,
      gstNumber,
      plan,
      investment,
      totalAmount: applicationTotal,
      status: status || "pending",
      leadType: leadType || "Website",
      payments: [],
    });

    return NextResponse.json(
      {
        success: true,
        message: "Franchise application saved successfully",
        data: franchise,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Franchise POST API Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Internal Server Error",
      },
      { status: 500 },
    );
  }
}

export async function PUT(req) {
  try {
    await dbConnect();

    const body = await req.json();
    const { id, paymentId, orderId, amount, installment, status } = body;
    const paidAmount = Number(amount);
    const installmentNumber = Number(installment);

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "Franchise ID is required",
        },
        { status: 400 },
      );
    }

    if (!paidAmount || isNaN(paidAmount) || paidAmount <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Valid payment amount is required",
        },
        { status: 400 },
      );
    }

    if (!installmentNumber || isNaN(installmentNumber)) {
      return NextResponse.json(
        {
          success: false,
          message: "Valid installment number is required",
        },
        { status: 400 },
      );
    }

    if (!paymentId || !orderId) {
      return NextResponse.json(
        {
          success: false,
          message: "Payment ID and order ID are required",
        },
        { status: 400 },
      );
    }

    const franchise = await Franchise.findById(id);

    if (!franchise) {
      return NextResponse.json(
        {
          success: false,
          message: "Franchise record not found",
        },
        { status: 404 },
      );
    }

    franchise.payments.push({
      installment: installmentNumber,
      amount: paidAmount,
      paymentId,
      orderId,
      status: "paid",
      paidAt: new Date(),
    });

    franchise.status = status || "partial_paid";

    await franchise.save();

    return NextResponse.json(
      {
        success: true,
        message: "Payment updated successfully",
        data: franchise,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Franchise PUT API Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Internal Server Error",
      },
      { status: 500 },
    );
  }
}

export async function GET(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (id) {
      const franchise = await Franchise.findById(id);

      if (!franchise) {
        return NextResponse.json(
          { success: false, message: "Not found" },
          { status: 404 },
        );
      }

      return NextResponse.json(
        { success: true, data: franchise },
        { status: 200 },
      );
    }

    const franchises = await Franchise.find().sort({ createdAt: -1 });

    return NextResponse.json(
      { success: true, data: franchises },
      { status: 200 },
    );
  } catch (error) {
    console.error("Franchise GET API Error:", error);

    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Internal Server Error",
      },
      { status: 500 },
    );
  }
}
