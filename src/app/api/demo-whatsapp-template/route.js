import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { name, phone, selectedDate, seminarTime } = await request.json();

    if (!name || !phone || !selectedDate || !seminarTime) {
      return NextResponse.json(
        {
          success: false,
          message: "name, phone, selectedDate and seminarTime are required",
        },
        { status: 400 },
      );
    }

    const whatsappNumber = phone.startsWith("91") ? phone : `91${phone}`;

    const response = await fetch(
      "https://whatsapp.limbu.ai/api/campaigns/send",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          apiKey: process.env.LIMBU_AI_WHATSAPP_KEY,

          campaignName: "demo_book",

          destination: whatsappNumber,

          userName: "Limbu AI",

          templateParams: [name, selectedDate, seminarTime],

          source: "api",

          media: {},
          buttons: [],
          carouselCards: [],
          location: {},
          attributes: {},

          paramsFallbackValue: {
            FirstName: name,
            DemoDate: selectedDate,
            DemoTime: seminarTime,
          },
        }),
      },
    );

    const result = await response.json();

    return NextResponse.json({
      success: response.ok,
      data: result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: 500 },
    );
  }
}
