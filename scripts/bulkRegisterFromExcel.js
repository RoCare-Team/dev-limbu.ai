import mongoose from "mongoose";
import fetch from "node-fetch";
import User from "../src/models/User.js";

/* ================= DB CONFIG ================= */
const MONGODB_URI =
  "mongodb+srv://robin3dlogic_db_user:Robin433400@mannubhai.tkrzttu.mongodb.net/test?retryWrites=true&w=majority&appName=mannuBhai";

/* ================= API CONFIG ================= */
const API_URL =
  "http://localhost:3000/api/meta/leads?formId=1344734835382149";

/* ================= DB CONNECT ================= */
async function connectDB() {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(MONGODB_URI);
  console.log("✅ MongoDB Connected");
}

/* ================= HELPERS ================= */
function getField(fieldData, name) {
  const field = fieldData.find(f => f.name === name);
  return field?.values?.[0] || "";
}

function cleanPhone(phone) {
  if (!phone) return "";

  phone = String(phone).replace(/\D/g, "");

  if (phone.startsWith("0091")) phone = phone.slice(4);
  if (phone.startsWith("91") && phone.length === 12) phone = phone.slice(2);

  return phone.length === 10 ? phone : "";
}

/* ================= MAIN ================= */
async function importLeads() {
  await connectDB();

  const res = await fetch(API_URL);
  const json = await res.json();

  if (!json.success) {
    console.error("❌ API Failed");
    process.exit(1);
  }

  const leads = json.leads;
  console.log("📄 Total leads found:", leads.length);

  let inserted = 0;
  let skipped = 0;

  for (const lead of leads) {
    const fields = lead.field_data;

    const fullName = getField(fields, "full_name");
    const email = getField(fields, "email").toLowerCase().trim();
    const rawPhone = getField(fields, "phone_number");
    const phone = cleanPhone(rawPhone);
    const city = getField(fields, "city");

    if (!email || !phone) {
      console.log("❌ SKIPPED: invalid email/phone");
      skipped++;
      continue;
    }

  // 🔁 DUPLICATE CHECK (EMAIL OR PHONE)
const exists = await User.findOne({
  $or: [{ email }, { phone }],
});

if (exists) {
  console.log("⚠️ SKIPPED (duplicate):", email, phone);
  skipped++;
  continue;
}

// 🔐 SAFE INSERT (catch duplicate race condition)
try {
  await User.create({
    userId: `USR${Date.now()}${Math.floor(Math.random() * 1000)}`,
    fullName,
    email,
    phone,
    city,
    wallet: 500,
    freeUsedCount: 2,
    subscription: {
      status: "inactive",
      plan: "Free",
    },
    source: "bulk-upload",
    remarks: "Imported from Meta Lead Form",
  });

  console.log("✅ INSERTED:", email);
  inserted++;

} catch (err) {
  if (err.code === 11000) {
    console.log("⚠️ SKIPPED (Mongo duplicate):", phone);
    skipped++;
  } else {
    console.error("❌ ERROR:", err.message);
  }
}
  }

  console.log("\n=========== FINAL RESULT ===========");
  console.log("✅ Inserted:", inserted);
  console.log("⚠️ Skipped:", skipped);

  process.exit(0);
}

/* ================= RUN ================= */
importLeads();
