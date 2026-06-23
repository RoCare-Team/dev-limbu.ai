"use server";

import dbConnect from "@/lib/dbConnect";
import Transaction from "@/models/Transaction";
import User from "@/models/User";

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

export async function fetchAllPostsAction(userId, page = 1, limit = 12, status = "total") {
    let url = `${API_URL}/api/post-status?userId=${userId}&page=${page}&limit=${limit}`;
    if (status && status !== "total") {
        url += `&status=${status}`;
    }
    const res = await fetch(url);
    const data = await res.json();

    // Fetch counts across all posts for this user for the tabs
    if (data.success && page === 1) {
        try {
            const countsRes = await fetch(`${API_URL}/api/post-status`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userIds: [userId] })
            });
            const countsData = await countsRes.json();
            if (countsData.success && countsData.data && countsData.data[userId]) {
                data.counts = countsData.data[userId];
            }
        } catch (e) {
            console.error("Failed to fetch counts", e);
        }
    }

    return data;
}

export async function getUserWalletAction(userId) {
    const userRes = await fetch(`${API_URL}/api/auth/signup?userId=${userId}`);
    return await userRes.json();
}

export async function generateWithAiAgentAction(
    prompt,
    logoBase64,
    selectedAssets,
    meta = {},
) {
    const { mode = "ai", instructions = "" } = meta;
    const res = await fetch(`${API_URL}/api/aiAgent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            prompt: prompt,
            logo: logoBase64,
            assets: selectedAssets,
            mode,
            instructions,
        }),
    });
    return await res.json();
}

export async function savePostAction(postPayload) {
    // console.log("Saving post with payload for menual post:", postPayload);
    const postRes = await fetch(`${API_URL}/api/post-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(postPayload),
    });
    return await postRes.json();
}

export async function deductFromWalletAction(userId, { amount, reason, metadata }) {
  try {
    await dbConnect();

    const updated = await User.findOneAndUpdate(
      { userId, wallet: { $gte: amount } },
      { $inc: { wallet: -amount } },
      { new: true }
    );

    if (!updated) {
      return { error: "Insufficient balance" };
    }

    await Transaction.create({
      userId,
      type: "debit",
      amount,
      balanceAfter: updated.wallet,
      reason: reason || "wallet_deduct",
      metadata: metadata || {},
    });

    return { message: "Wallet debited", wallet: updated.wallet };
  } catch (err) {
    console.error("❌ deductFromWalletAction error:", err.message);
    return { error: err.message };
  }
}

export async function generateWithAssetsAction(payload) {
    const res = await fetch(`${API_URL}/api/aiAssetsGenerate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

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
    try {
        const response = await fetch(
            `${API_URL}/api/gmb/publish`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify(payload),
            }
        );
        console.log("GMB publish API response status:", response.status);
        const text = await response.text();
        try {
            const data = text ? JSON.parse(text) : {};
            return { ok: response.ok && data?.ok !== false, data: data?.data ?? data };
        } catch (error) {
            return { ok: response.ok, data: text };
        }
    } catch (error) {
        console.error("Fetch failed in postToGmbAction:", error.message);
        return { ok: false, data: { error: "API Unreachable", details: error.message } };
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
