



export async function POST(req) {
  try {
    const body = await req.json();

    const response = await fetch(
      "https://n8n.limbutech.in/webhook/keyword-rank-checker",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    const data = await response.json();

    return Response.json({
      success: true,
      data,
    });
  } catch (error) {
    return Response.json({
      success: false,
      message: error.message,
    });
  }
}