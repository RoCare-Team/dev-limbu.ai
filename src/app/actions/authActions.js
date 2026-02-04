"use server";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://limbu.ai";


export async function sendOtpAction(phone) {
  try {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    const data = await res.json();
    
    return { ok: res.ok, data };
  } catch (error) {
    return { ok: false, data: { error: "Network error. Please try again." } };
  }
}

export async function verifyOtpAction(phone, otp) {
  try {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, otp }),
    });
    const data = await res.json();
    return { ok: res.ok, data };
  } catch (error) {
    return { ok: false, data: { error: "Network error. Please try again." } };
  }
}

export async function completeRegistrationAction(phone, otp, name, email,referCode) {
  try {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, otp, name, email,referCode }),
    });
    const data = await res.json();
    return { ok: res.ok, data };
  } catch (error) {
    return { ok: false, data: { error: "Network error. Please try again." } };
  }
}