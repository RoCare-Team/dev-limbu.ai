const N8N_GMB_WEBHOOK = "https://n8n.srv968758.hstgr.cloud/webhook/cc144420-81ab-43e6-8995-9367e92363b0";

export async function POST(req) {
  try {
    const body = await req.json();

    if (!body) {
      return new Response(
        JSON.stringify({ ok: false, error: "Payload missing" }),
        { status: 400 }
      );
    }

    console.log('[post-to-gmb] ▶ Incoming payload:', JSON.stringify({
      account:        body.account,
      locationDataCount: Array.isArray(body.locationData) ? body.locationData.length : 0,
      locationData:   body.locationData,
      hasOutput:      !!body.output,
      outputUrl:      typeof body.output === 'string' ? body.output.slice(0, 100) : null,
      description:    body.description?.slice(0, 80),
      checkmark:      body.checkmark,
      accessTokenLen: body.accessToken?.length || 0,
      userId:         body.userId,
    }, null, 2));

    console.log('[GMB-POST] 🔍 FULL INCOMING PAYLOAD TO GMB:', JSON.stringify(body, null, 2));
    console.log('[GMB-POST] 📍 FULL LOCATIONS ARRAY:', JSON.stringify(body.locations || body.locationData || [], null, 2));

    console.log('[post-to-gmb] ▶ Calling n8n webhook:', N8N_GMB_WEBHOOK);

    console.log('[GMB-POST] 🚀 FULL PAYLOAD SENT TO N8N:', JSON.stringify(body, null, 2));

    const response = await fetch(N8N_GMB_WEBHOOK, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });

    console.log('[post-to-gmb] n8n HTTP status:', response.status, response.statusText);

    const text = await response.text();
    console.log('[post-to-gmb] n8n raw response:', text.slice(0, 800));

    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { raw: text };
    }

    console.log('[post-to-gmb] ✅ Parsed n8n response:', JSON.stringify(data).slice(0, 400));
    console.log('[post-to-gmb] Final ok:', response.ok, '| status:', response.status);

    return new Response(
      JSON.stringify({ ok: response.ok, data }),
      { status: response.status }
    );
  } catch (error) {
    console.error('[post-to-gmb] ❌ EXCEPTION:', error.message, error.stack?.slice(0, 300));
    return new Response(
      JSON.stringify({ ok: false, error: error.message }),
      { status: 500 }
    );
  }
}