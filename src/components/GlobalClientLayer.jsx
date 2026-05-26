"use client";
import VideoModal from "./modals/VideoModal";
import SignupPopup from "./modals/SignupPopup";
import WhatsAppButton from "./WhatsAppButton";



export default function GlobalClientLayer() {
  return (
    <>
      <VideoModal />
      <SignupPopup />
      <WhatsAppButton />
    </>
  );
}