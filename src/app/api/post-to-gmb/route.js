    export async function POST(req) {
    try {
        const body = await req.json();

        const response = await fetch(
        "https://n8n.srv968758.hstgr.cloud/webhook/cc144420-81ab-43e6-8995-9367e92363b0",
        {
            method: "POST",
            headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            },
            body: JSON.stringify(body),
        }
        );

        const text = await response.text();

        let data;
        try {
        data = text ? JSON.parse(text) : {};
        } catch (err) {
        data = text;
        }

        return Response.json({
        ok: response.ok,
        data,
        });

    } catch (error) {
        console.error("POST TO GMB ERROR:", error);

        return Response.json(
        {
            ok: false,
            error: error.message,
        },
        { status: 500 }
        );
    }
    }