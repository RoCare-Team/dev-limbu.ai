import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";

const LIMBU_URL =
  "https://whatsapp.limbu.ai/api/campaigns/send";

export async function POST(req) {
  try {
    console.log("🚀 API HIT");

    await dbConnect();

    const body = await req.json();

    console.log("📦 BODY =>", body);

    const { selectedRows, templateName } = body;

    // ✅ CHECK USERS
    if (!selectedRows?.length) {
      console.log("❌ NO USERS SELECTED");

      return NextResponse.json({
        success: false,
        message: "No users selected",
      });
    }

    // ✅ FIND USERS
  const users = await User.find({
  userId: { $in: selectedRows },
});


    console.log("👥 USERS FOUND =>", users.length);

    // ✅ LOOP USERS
    for (const user of users) {

  console.log("FULL USER =>", user);

  console.log(
    "WHATSAPP NUMBER =>",
    user.whatsappNumber
  );

  console.log(
    "MOBILE =>",
    user.mobile
  );

  console.log(
    "PHONE =>",
    user.phone
  );

  let mobile =
    user.mobile ||
    user.phone ||
    user.whatsappNumber;

      

      console.log("📱 ORIGINAL MOBILE =>", mobile);

      // ❌ NO NUMBER
      if (!mobile) {
        console.log("❌ MOBILE NOT FOUND");
        continue;
      }

      // ✅ CLEAN NUMBER
      mobile = String(mobile).replace(/\D/g, "");

      if (!mobile.startsWith("91")) {
        mobile = `91${mobile}`;
      }

      console.log("✅ FINAL MOBILE =>", mobile);

      // =========================
      // TEMPLATE PARAMS
      // =========================

      let templateParams = [];

      // 🔥 TEMPLATE 1
      if (templateName === "plan_expired_comdown") {

  const expiryDate = new Date(
    user.packageExpiryDate
  );

  const today = new Date();

  const diffTime =
    expiryDate.getTime() - today.getTime();

  const daysLeft = Math.ceil(
    diffTime / (1000 * 60 * 60 * 24)
  );

  console.log("⏳ DAYS LEFT =>", daysLeft);

  // ❌ IF MORE THAN 7 DAYS
  if (daysLeft > 7) {

    console.log(
      "⛔ MORE THAN 7 DAYS LEFT - NOT SENDING"
    );

    continue;
  }

  // ❌ ALREADY EXPIRED
  if (daysLeft <= 0) {

    console.log(
      "⛔ PLAN ALREADY EXPIRED"
    );

    continue;
  }

  // ✅ SEND TEMPLATE
  templateParams = [
    user.fullName || "User",
    String(daysLeft),
  ];
}

      // 🔥 TEMPLATE 2
      else if (
        templateName === "limbu_ai_plan_expired"
      ) {

        console.log("📨 TEMPLATE => limbu_ai_plan_expired");

        const expiryDateText =
          user.userPackageExpiryDate
            ? new Date(
                user.userPackageExpiryDate
              ).toLocaleDateString("en-IN")
            : "N/A";

        console.log(
          "📅 EXPIRY DATE =>",
          expiryDateText
        );

       templateParams = [
    user.fullName || "User",
    String(daysLeft),
  ];
      }

      console.log(
        "📨 TEMPLATE PARAMS =>",
        templateParams
      );

      // =========================
      // FINAL PAYLOAD
      // =========================

      const payload = {

  apiKey:
    "ws_2870c7f6bc8510381dc45e74df26a870d69f0512b17abade",

  campaignName: templateName,

  destination: mobile,

  userName: "Limbu AI",

  templateParams: templateParams,

  source: "api",

  media: {},

  buttons: [],

  carouselCards: [],

  location: {},

  attributes: {},

  paramsFallbackValue: {

    FirstName:
      user.fullName || "User",

    LastName: "Customer",
  },
};

      console.log(
        "📤 FINAL PAYLOAD =>",
        JSON.stringify(payload, null, 2)
      );

      // =========================
      // SEND REQUEST
      // =========================

      const response = await fetch(LIMBU_URL, {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(payload),
      });

      // =========================
      // RESPONSE TEXT
      // =========================

      const responseText =
        await response.text();

      console.log(
        "📥 RAW RESPONSE =>",
        responseText
      );

      // ✅ JSON PARSE
      let result = {};

      try {
        result = JSON.parse(responseText);
      } catch (err) {
        console.log(
          "❌ JSON PARSE ERROR =>",
          err
        );
      }

      console.log(
        "✅ STATUS =>",
        response.status
      );

      console.log(
        "📨 LIMBU RESPONSE =>",
        result
      );

      // ❌ FAILED
      if (!response.ok) {
        console.log(
          "❌ WHATSAPP FAILED =>",
          result
        );
      } else {
        console.log(
          "✅ WHATSAPP SENT SUCCESSFULLY"
        );
      }

      console.log("================================");
    }

    return NextResponse.json({
      success: true,
      message: "Templates processed",
    });

  } catch (error) {

    console.log(
      "🔥 SERVER ERROR =>",
      error
    );

    return NextResponse.json({
      success: false,
      message: "Server error",
    });
  }
}