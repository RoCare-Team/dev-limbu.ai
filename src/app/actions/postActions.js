"use server";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXTAUTH_URL ||
  "http://localhost:3000";


export async function createDefaultAssetsAction(userId) {
    return await fetch(`${API_URL}/api/assets-manage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            userId: userId,
            size: "3:4",
            colourPalette: "warm, yellow, orange, red",
        }),
    }).then(res => res.json());
}

export async function updateAssetAction(assetId, fieldName, value) {
    return await fetch(`${API_URL}/api/assets-manage`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            id: assetId,
            [fieldName]: value
        }),
    }).then(res => res.json());
}

export async function fetchPostsAction(userId, status) {
    const url = status === "total"
        ? `${API_URL}/api/post-status?userId=${userId}`
        : `${API_URL}/api/post-status?userId=${userId}&status=${status}`;
    const res = await fetch(url, { cache: "no-store" });
    return await res.json();
}

export async function fetchAllPostsAction(userId) {
    const res = await fetch(`${API_URL}/api/post-status?userId=${userId}`, { cache: "no-store" });
    return await res.json();
}

export async function getUserWalletAction(userId) {
    const userRes = await fetch(`${API_URL}/api/auth/signup?userId=${userId}`);
    return await userRes.json();
}

export async function generateWithAiAgentAction(prompt, logoBase64, selectedAssets) {
    const res = await fetch(`${API_URL}/api/aiAgent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            prompt: prompt,
            logo: logoBase64,
            assets: selectedAssets,
        }),
    });
    return await res.json();
}

export async function savePostAction(postPayload) {
    const postRes = await fetch(`${API_URL}/api/post-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(postPayload),
    });
    return await postRes.json();
}

export async function deductFromWalletAction(userId, payload) {
    const walletRes = await fetch(`${API_URL}/api/auth/signup?userId=${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    return await walletRes.json();
}

export async function generateWithAssetsAction(payload) {
    const res = await fetch(`${API_URL}/api/aiAssetsGenerate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    console.log("reeeeeeeeeeeeeeeeeee",res);
    
    return await res.json();
}

export async function updatePostStatusAction(payload) {
    const res = await fetch(`${API_URL}/api/post-status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    
    return await res.json();
}

export async function postToGmbAction(payload) {
    const response = await fetch(
        "https://n8n.srv968758.hstgr.cloud/webhook/cc144420-81ab-43e6-8995-9367e92363b0",
        {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify(payload),
        }
    );
    const text = await response.text();
    try {
        const data = text ? JSON.parse(text) : {};
        return { ok: response.ok, data };
    } catch (error) {
        return { ok: response.ok, data: text };
    }
}

export async function deletePostFromGmbAction(payload) {
    try {
        const response = await fetch(
            "https://n8n.srv968758.hstgr.cloud/webhook/95aebb9c-1d04-4318-8de2-58940405f007",
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            }
        );
        if (!response.ok) {
            throw new Error(`Webhook failed with status ${response.status}`);
        }
        return { success: true, data: await response.json() };
    } catch (error) {
        console.error("Delete GMB Post Action Error:", error);
        return { success: false, error: "Network error during post deletion." };
    }
}

export const downloadImageAction = async (imageUrl) => {
  return await fetch(`/api/downloadImage?url=${encodeURIComponent(imageUrl)}`);
};

export async function generateVideoAction(payload) {
  try {
    const res = await fetch("/api/video-generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    return data; // contains { success, data, error }
  } catch (error) {
    return { success: false, error: error.message };
  }
}