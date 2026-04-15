"use client";

import React from "react";
import { useWallet } from "@/hooks/useWallet";

import WalletHeader from "./wallet/WalletHeader";
import WalletBenefits from "./wallet/WalletBenefits";
import RechargeEngine from "./wallet/RechargeEngine";
import TransactionHistoryModal from "./wallet/TransactionHistoryModal";
import SuccessModal from "./wallet/SuccessModal";

export default function SmartWalletRecharge() {
  const {
    amount,
    setAmount,
    gstNumber,
    setGstNumber,
    loading,
    showSuccess,
    setShowSuccess,
    loadingTx,
    filterType,
    setFilterType,
    showTransactions,
    setShowTransactions,
    presetAmounts,
    coins,
    gstAmount,
    totalAmount,
    filteredTransactions,
    handleRecharge,
    goBack,
    router
  } = useWallet();

  return (
    <div className="min-h-screen bg-slate-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 py-8">

        {/* Header Section */}
        <WalletHeader
          goBack={goBack}
          onHistoryClick={() => setShowTransactions(true)}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left Side - Benefits */}
          <WalletBenefits />

          {/* Right Side - Recharge Engine */}
          <RechargeEngine
            presetAmounts={presetAmounts}
            amount={amount}
            setAmount={setAmount}
            gstNumber={gstNumber}
            setGstNumber={setGstNumber}
            gstAmount={gstAmount}
            totalAmount={totalAmount}
            coins={coins}
            loading={loading}
            handleRecharge={handleRecharge}
          />
        </div>
      </div>

      {/* Transaction History Modal */}
      <TransactionHistoryModal
        showTransactions={showTransactions}
        setShowTransactions={setShowTransactions}
        filterType={filterType}
        setFilterType={setFilterType}
        loadingTx={loadingTx}
        filteredTransactions={filteredTransactions}
      />

      {/* Success Modal */}
      <SuccessModal
        showSuccess={showSuccess}
        totalAmount={totalAmount}
        coins={coins}
        onDashboardRedirect={() => {
          setShowSuccess(false);
          router.push("/dashboard");
        }}
      />
    </div>
  );
}