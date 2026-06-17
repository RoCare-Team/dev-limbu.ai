import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";
import FranchisePanel from "@/models/franchisePanel";
import FranchiseTeam from "@/models/FranchiseTeam";
import { escapeRegex } from "@/lib/franchiseLeadsQuery";

const WEBHOOK_URL = "https://n8n.limbutech.in/webhook/data-gmb-scrapper";

// ── Google API Keys — rotate every 10 days in a loop ──────────────────────
const GOOGLE_API_KEYS = [
  process.env.GOOGLE_MAPS_API_KEY_1 || "AIzaSyA5Th1Wf2PiX80m8miVcK1ooHGqs_IoYoA",
  process.env.GOOGLE_MAPS_API_KEY_2 || "AIzaSyBFBrkcFEapAR7b1AuWovzq-fy4MsjmIfI",
  process.env.GOOGLE_MAPS_API_KEY_3 || "AIzaSyC_0PEZfC748ly9kdndYuhY7sE4nCL8ecY",
];

function getActiveGoogleApiKey() {
  const dayOfMonth = new Date().getDate();
  const index = Math.floor((dayOfMonth - 1) / 10) % GOOGLE_API_KEYS.length;
  return GOOGLE_API_KEYS[index];
}

async function getRoundRobinTeamMember(franchiseCode) {
  const teamMembers = await FranchiseTeam.find({
    franchiseId: franchiseCode,
    isActive: true,
    role: { $in: ["agent", "manager", "superFranchiseAdmin"] },
  })
    .select("fullName email assignedLeads createdAt")
    .lean();

  if (!teamMembers.length) return null;

  return teamMembers.sort((a, b) => {
    const aCount = Array.isArray(a.assignedLeads) ? a.assignedLeads.length : 0;
    const bCount = Array.isArray(b.assignedLeads) ? b.assignedLeads.length : 0;
    if (aCount !== bCount) return aCount - bCount;
    return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
  })[0];
}

export async function POST(req) {
  console.log("\n========== [GMB Scraper] NEW REQUEST ==========");

  try {
    await dbConnect();
    console.log("[GMB Scraper] ✅ DB Connected");

    const body = await req.json();
    const { city, category, limit, franchiseeCode } = body;

    // ── Basic Validations ──────────────────────────────────────────────────
    if (!franchiseeCode || !category || !city) {
      return NextResponse.json(
        { success: false, error: "FranchiseeCode, Category and City are required" },
        { status: 400 }
      );
    }

    // ── Validate Franchise ─────────────────────────────────────────────────
    const franchise = await FranchisePanel.findOne({
      franchiseCode: { $regex: new RegExp(`^${escapeRegex(franchiseeCode)}$`, "i") },
      isActive: true,
    }).lean();

    if (!franchise) {
      return NextResponse.json(
        { success: false, error: "Invalid or inactive franchise code" },
        { status: 400 }
      );
    }

    const franchiseCode_ = franchise.franchiseCode;

    // ── Monthly 2000 leads limit check ─────────────────────────────────────
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const currentMonthCount = await User.countDocuments({
      franchiseId: franchiseCode_,
      source: "gmb-scraper",
      createdAt: { $gte: startOfMonth, $lte: endOfMonth },
    });

    if (currentMonthCount >= 2000) {
      return NextResponse.json(
        { success: false, error: "Data limit reached: 2000 leads/month limit exceeded." },
        { status: 403 }
      );
    }

    const allowedLimit = Math.min(limit || 100, 2000 - currentMonthCount);

    // ── Call Webhook ───────────────────────────────────────────────────────
    const activeApiKey = getActiveGoogleApiKey();
    const webhookRes = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        city,
        category,
        limit: allowedLimit,
        GogleApiKey: activeApiKey,
      }),
    });

    if (!webhookRes.ok) {
      throw new Error(`Webhook Error: ${webhookRes.statusText}`);
    }

    const scrapedData = await webhookRes.json();

    if (!Array.isArray(scrapedData) || scrapedData.length === 0) {
      return NextResponse.json({ success: true, saved: 0, message: "No data found" });
    }

    // ── Save Leads with Validations ────────────────────────────────────────
    let saved = 0;
    let skipped = 0;

    for (const item of scrapedData) {
      try {
        const rawPhone = item.phone ? String(item.phone).replace(/\D/g, "") : null;
        const businessName = item.name || "N/A";
        const placeId = item.place_id || "";

        // 1. VALIDATION: Check if phone already exists in DB
        if (rawPhone) {
          const existingUserByPhone = await User.findOne({ phone: rawPhone }).lean();
          if (existingUserByPhone) {
            console.log(`[GMB Scraper] ⏭️ SKIPPED: Phone ${rawPhone} already exists.`);
            skipped++;
            continue;
          }
        }

        // 2. VALIDATION: Check if this specific Google Place was already scraped
        if (placeId) {
          const existingUserByPlace = await User.findOne({ "gmbScraperData.placeId": placeId }).lean();
          if (existingUserByPlace) {
            console.log(`[GMB Scraper] ⏭️ SKIPPED: PlaceId ${placeId} already exists.`);
            skipped++;
            continue;
          }
        }

        // 3. Generate unique identifiers
        const userId = `USR${Date.now()}${Math.floor(Math.random() * 1000)}`;
        
        // Generate Email: Use phone if available, else use userId
        const generatedEmail = rawPhone 
          ? `${rawPhone}@scrape.com` 
          : `${userId}@scrape.com`;

        // Round-robin agent assignment
        const assignedMember = await getRoundRobinTeamMember(franchiseCode_);

        // 4. Create Payload
        const userPayload = {
          userId,
          fullName: businessName,
          email: generatedEmail, 
          phone: rawPhone || undefined,
          referCode: franchiseCode_,
          franchiseId: franchiseCode_,
          assignedAgentId: assignedMember?._id || undefined,
          referredByAgentId: assignedMember?._id || undefined,
          referredByAgentName: assignedMember?.fullName || null,
          leadTags: ["franchise-panel", "gmb-scraper"],
          leadStage: "Active",
          wallet: 500,
          leadStatus: "",
          source: "gmb-scraper",
          gmbScraperData: {
            address: item.address || "",
            website: item.website || "",
            rating: item.rating ? parseFloat(item.rating) : null,
            reviews: item.reviews ? parseInt(item.reviews) : 0,
            mapsUrl: item.maps_url || "",
            placeId: placeId,
            city: city || "",
            category: category || "",
          },
          subscription: { status: "inactive" },
        };

        const user = await User.create(userPayload);

        // Update agent assignment count
        if (assignedMember?._id) {
          await FranchiseTeam.findByIdAndUpdate(assignedMember._id, {
            $addToSet: { assignedLeads: user._id },
          });
        }

        saved++;
      } catch (err) {
        if (err?.code === 11000) {
          skipped++;
          continue;
        }
        console.error(`[GMB Scraper] ❌ Save Error:`, err.message);
        skipped++;
      }
    }

    return NextResponse.json({
      success: true,
      saved,
      skipped,
      totalMonthlyLeads: currentMonthCount + saved,
    });
  } catch (error) {
    console.error("[GMB Scraper] 💥 FATAL ERROR:", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}