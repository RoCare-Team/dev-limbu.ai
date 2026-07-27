// src/utils/googleMeet.js
// Har franchise demo booking pe ek UNIQUE Google Meet link generate karta hai
// via Google Calendar API. GMB se poori tarah alag — ye sirf
// DEMO_CALENDAR_REFRESH_TOKEN use karta hai (GMB DB tokens ko touch nahi karta).

import { google } from "googleapis";

const CALENDAR_ID = process.env.DEMO_CALENDAR_ID || "primary";
// Client ko invite email jaaye ya nahi: "all" | "none"
const SEND_UPDATES = process.env.DEMO_CALENDAR_SEND_UPDATES || "all";

function isConfigured() {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET &&
      process.env.DEMO_CALENDAR_REFRESH_TOKEN
  );
}

function getCalendar() {
  const oauth2 = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  // Sirf refresh token set — access token har call pe auto-refresh ho jaata hai
  oauth2.setCredentials({
    refresh_token: process.env.DEMO_CALENDAR_REFRESH_TOKEN,
  });
  return google.calendar({ version: "v3", auth: oauth2 });
}

function isValidEmail(e) {
  return typeof e === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

/**
 * Booking ke liye Calendar event + Meet link banata hai.
 * @returns {{ meetLink: string, eventId: string } | null}  null = fail (caller fallback use kare)
 */
export async function createDemoMeetEvent({
  bookingId,
  clientName,
  clientEmail,
  agentName,
  agentEmail,
  date, // "YYYY-MM-DD"
  slotTime, // "10:00-11:00"
}) {
  if (!isConfigured()) {
    console.warn("[googleMeet] DEMO_CALENDAR_REFRESH_TOKEN missing — skipping Meet generation");
    return null;
  }

  try {
    const [from, to] = String(slotTime).split("-");
    if (!from || !to) throw new Error(`invalid slotTime: ${slotTime}`);

    const attendees = [];
    if (isValidEmail(clientEmail)) attendees.push({ email: clientEmail });
    if (isValidEmail(agentEmail)) attendees.push({ email: agentEmail });

    const calendar = getCalendar();
    const res = await calendar.events.insert({
      calendarId: CALENDAR_ID,
      conferenceDataVersion: 1, // Meet link generate karne ke liye zaroori
      sendUpdates: SEND_UPDATES,
      requestBody: {
        summary: `Franchise Demo – ${clientName || "Client"}`,
        description:
          `Franchise demo booking\n` +
          `Client: ${clientName || "-"}\n` +
          `Agent: ${agentName || "-"}\n` +
          `Booking: ${bookingId || "-"}`,
        start: { dateTime: `${date}T${from}:00`, timeZone: "Asia/Kolkata" },
        end: { dateTime: `${date}T${to}:00`, timeZone: "Asia/Kolkata" },
        attendees,
        conferenceData: {
          createRequest: {
            requestId: `fdemo-${bookingId || Date.now()}`,
            conferenceSolutionKey: { type: "hangoutsMeet" },
          },
        },
      },
    });

    const meetLink =
      res.data.hangoutLink ||
      res.data.conferenceData?.entryPoints?.find((e) => e.entryPointType === "video")
        ?.uri ||
      "";

    if (!meetLink) {
      console.warn("[googleMeet] event bana par Meet link nahi mila", res.data?.id);
      return null;
    }

    return { meetLink, eventId: res.data.id || "" };
  } catch (err) {
    console.error("[googleMeet] createDemoMeetEvent failed:", err?.message || err);
    return null;
  }
}

/** Booking cancel hone pe calendar event delete (best-effort). */
export async function deleteDemoMeetEvent(eventId) {
  if (!eventId || !isConfigured()) return false;
  try {
    const calendar = getCalendar();
    await calendar.events.delete({
      calendarId: CALENDAR_ID,
      eventId,
      sendUpdates: SEND_UPDATES,
    });
    return true;
  } catch (err) {
    console.error("[googleMeet] deleteDemoMeetEvent failed:", err?.message || err);
    return false;
  }
}
