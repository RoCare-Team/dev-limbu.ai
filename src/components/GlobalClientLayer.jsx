"use client";
import VideoModal from "./modals/VideoModal";
import SignupPopup from "./modals/SignupPopup";
import WhatsAppButton from "./WhatsAppButton";
import DemoBookingModal from "./modals/DemoBookingModal";



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