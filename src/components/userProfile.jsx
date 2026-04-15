"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { useUserProfile } from "@/hooks/useUserProfile";
import ProfileHeader from "./user-profile/ProfileHeader";
import AccountDetails from "./user-profile/AccountDetails";
import StatsSection from "./user-profile/StatsSection";
import ImageGallery from "./user-profile/ImageGallery";
import ImageModal from "./user-profile/ImageModal";

export default function ProfileWithStats() {
  const router = useRouter();
  const {
    userData,
    transactions,
    loadingTx,
    aiImages,
    loadingImages,
    allCounts
  } = useUserProfile();

  const [selectedImage, setSelectedImage] = useState(null);

  const handleActivityClick = useCallback(() => router.push("/user-activity"), [router]);
  const handleWalletClick = useCallback(() => router.push("/wallet"), [router]);
  const handleImageClick = useCallback((img) => setSelectedImage(img), []);
  const handleCloseModal = useCallback(() => setSelectedImage(null), []);

  if (!userData) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-10 h-10 text-lemon-hover animate-spin" />
      </div>
    );
  }

  const paidPackage = userData.paidPackage || userData.subscription?.plan || "No active plan";
  const planDuration = userData.planDuration || "-";
  const expiry = userData.subscription?.expiry
    ? new Date(userData.subscription.expiry).toLocaleDateString()
    : "-";

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 pb-12">

      {/* 1. Header Section */}
      <ProfileHeader
        fullName={userData.fullName}
        wallet={userData.wallet}
        onActivityClick={handleActivityClick}
        onWalletClick={handleWalletClick}
      />

      <div className="grid lg:grid-cols-12 gap-8">

        {/* 2. Left Column - Contact & Plan */}
        <AccountDetails
          email={userData.email}
          phone={userData.phone}
          paidPackage={paidPackage}
          planDuration={planDuration}
          expiry={expiry}
        />

        {/* 3. Right Column - Stats & History */}
        <StatsSection
          allCounts={allCounts}
          transactions={transactions}
          loadingTx={loadingTx}
        />
      </div>

      {/* 4. AI Image Gallery */}
      <ImageGallery
        images={aiImages}
        loading={loadingImages}
        onImageClick={handleImageClick}
      />

      {/* 5. Modals */}
      {selectedImage && (
        <ImageModal
          image={selectedImage}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
