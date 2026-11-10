"use client";
import dynamic from "next/dynamic";
import WhatsAppButton from "./WhatsAppButton";

// Popups are hidden until opened (demo modal opens itself after a few seconds),
// so load them as separate chunks after the page is interactive.
const VideoModal = dynamic(() => import("./modals/VideoModal"), { ssr: false });
const SignupPopup = dynamic(() => import("./modals/SignupPopup"), { ssr: false });
const DemoBookingModal = dynamic(() => import("./modals/DemoBookingModal"), { ssr: false });

export default function GlobalClientLayer() {
  return (
    <>
      <VideoModal />
      <SignupPopup />
      <WhatsAppButton />
      <DemoBookingModal />
    </>
  );
}
