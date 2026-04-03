
// ye Next.js ka built-in response helper || kya kamm API se JSON response bhejne ke liye. || Agar hata diya? || NextResponse.json() ka use nahi kar paoge.
import { NextResponse } from "next/server";

// MongoDB ke saath kaam karne ki library. || Kya kaam?  Schema define karne, model banane, DB connect karne ke liye.
import mongoose from "mongoose";
import { mongooseConnectionUri } from "@/lib/mongoConnectionUri";

// ye Environment variable se database URL le raha hai. || Kabhi bhi database URL code mein hardcode nahi karte.
const MONGODB_URI = process.env.MONGODB_URI;

// 🧩 Notification Schema
const NotificationSchema = new mongoose.Schema({ // Ye structure define karta hai notification ka.
  // Data type → String || Required → empty nahi ho sakta || Agar required hata dein → empty notification save ho sakti hai.
  title: { type: String, required: true }, 
  message: { type: String, required: true }, // Notification ka main content.
  createdAt: { type: Date, default: Date.now }, // Agar date pass nahi karo → automatically current time set ho jayega
  isRead: { type: Boolean, default: false }, // By default unread rahega. || Agar default true kar do → sab notification already read dikhenge.
});

// Prevent model overwrite
const Notification = // Next.js development mode mein hot reload hota hai.
  mongoose.models.notifications ||
  // To error aayega: || Cannot overwrite model once compiled || Isliye pehle check karta hai model already exist karta hai ya nahi.
  mongoose.model("notifications", NotificationSchema);

// 🔗 Connect to MongoDB
async function connectDB() { // Custom DB connect function.
  if (mongoose.connection.readyState === 0) { // Agar connection already open nahi hai to hi connect karo. || Agar ye check hata do: || Har request pe naya connection banega → performance issue.
    await mongoose.connect(mongooseConnectionUri(MONGODB_URI), {
      bufferCommands: false,
    });
  }
}

//
// ✅ GET: Fetch all notifications
//
export async function GET() { // Ye notifications fetch karega.
  try {
    await connectDB(); // DB connection ensure.
    const notifications = await Notification.find({}) // Sab notifications fetch karo. Agar filter lagao:
      .sort({ createdAt: -1 }) // 1 → ascending || 1 → ascending
      .limit(50); // limit to 50 latest || Agar limit na lagao:  Performance slow ho sakti hai agar 10,000 records ho.
    return NextResponse.json({ success: true, notifications });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

//
// ✅ POST: Add a new notification (Admin use)
//
export async function POST(req) { // New notification add karta hai.
  try {
    await connectDB();
    const { title, message } = await req.json(); // Frontend se data read.

    if (!title || !message) { // Agar validation na ho: || Empty data DB mein store ho sakta hai.
      return NextResponse.json(
        { success: false, error: "Title and message are required" },
        { status: 400 }
      );
    }

    const newNotification = await Notification.create({
      title,
      message,
    }); // Direct DB mein insert kar raha hai.

    return NextResponse.json({
      success: true,
      message: "Notification created successfully",
      notification: newNotification,
    });
  } catch (error) {
    console.error("Error creating notification:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

//
// ✅ PUT: Mark a notification as read
//
export async function PUT(req) { // Notification ko read mark karta hai.
  try {
    await connectDB();
    const { id } = await req.json(); // Client se notification ID le raha hai.

    if (!id) { // id match karo
      return NextResponse.json(
        { success: false, error: "Notification ID is required" },
        { status: 400 }
      );
    }

    const updated = await Notification.findByIdAndUpdate( // isRead true set karo
      id,
      { isRead: true },
      { new: true }
    );

    if (!updated) { // updated document return karo
      return NextResponse.json(
        { success: false, error: "Notification not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Notification marked as read",
      notification: updated,
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

//
// ✅ DELETE: Remove a notification
//
export async function DELETE(req) { // Notification delete karta hai.
  try {
    await connectDB();
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Notification ID is required" },
        { status: 400 }
      );
    }

    const deleted = await Notification.findByIdAndDelete(id); // ID match hone par document delete. || Agar id galat ho: || null return karega.

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Notification not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting notification:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
