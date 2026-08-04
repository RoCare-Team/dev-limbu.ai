"use client";

import { Fragment } from "react";

/* user-management */
import {
  Search,
  X,
  Crown,
  Mail,
  Phone,
  Calendar,
  Edit2,
  Trash2,
  Plus,
  User,
  User2Icon,
  Eye,
  Wallet,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  MessageSquare,
  ChevronDown,
  CheckCircle,
  UserCheck,
  Send,
  Smartphone,
  MessageCircle,
  BarChart3,
  Globe2,
  QrCode,
  Activity,
  Facebook,
  Instagram,
  MoveRight,
} from "lucide-react";
import { USER_SOURCE_OPTIONS } from "@/lib/bookingSource";
import FollowUpDueAlertModal from "@/components/FollowUpDueAlertModal";
import Lottie from "lottie-react";
import animationData from "@/assets/animation/Loading.json"; // if not using public

import AdminServicepaneModal from "../../../components/modals/AdminServicePlaneModal";

import AddExpoLeadUserModal from "./components/AddExpoLeadUserModal";

import WhatsappModal from "./components/WhatsAppTemplateModel";
import ChatHistoryModal from "./components/ChatHistoryModal";
import ChatbotSummaryMetrics from "./components/ChatbotSummaryMetrics";
import WalletUpdateModal from "./components/WalletUpdateModal";
import RemarksModal from "./components/RemarksModal";
import AddUserModal from "./components/AddUserModal";
import BulkDeleteModal from "./components/BulkDeleteModal";
import DeleteUserModal from "./components/DeleteUserModal";
import EditUserModal from "./components/EditUserModal";
import GenerateReportModal from "./components/GenerateReportModal";
import BusinessAiAnalysisModal from "./components/BusinessAiAnalysisModal";
import OnboardClientModal from "./components/OnboardClientModal";
import MeetingModal from "./components/MeetingModal";
import PlanUpgradeModal from "./components/PlanUpgradeModal";
import FullViewImageModal from "./components/FullViewImageModal";
import IssuesModal from "./components/IssuesModal";
import UserPostsModal from "./components/UserPostsModal";
import UserTableRow from "./components/UserTableRow";
import AgentPerformanceDashboard from "./components/AgentPerformanceDashboard";
import UserFiltersPanel from "./components/UserFiltersPanel";
import useUserManagementLogic from "./useUserManagementLogic";

// import { uploadToS3Action } from "../../../app/actions/uploadS3Actions";

import {
  alpha,
  Box,
  Button,
  FormControl,
  InputAdornment,
  MenuItem,
  Paper,
  Select,
  Stack,
  TableContainer,
  TextField,
  Typography,
} from "@mui/material";

export default function UserManagement() {
  const {
    users,
    loading,
    updating,
    selectedUser,
    setSelectedUser,
    selectedPlan,
    setSelectedPlan,
    addingUser,
    setAddingUser,
    showAddExpoLeadModal,
    setShowAddExpoLeadModal,
    newUser,
    setNewUser,
    viewingUserPosts,
    setViewingUserPosts,
    userPosts,
    setUserPosts,
    loadingPosts,
    fullViewImage,
    setFullViewImage,
    pagination,
    updatingWallet,
    walletModalUser,
    setWalletModalUser,
    walletUpdate,
    setWalletUpdate,
    toast,
    setToast,
    userPostsData,
    remarksModalUser,
    setRemarksModalUser,
    remarksInput,
    setRemarksInput,
    remarksHistory,
    loadingRemarks,
    chatHistoryModal,
    subscriptionPlans,
    selectedCycle,
    setSelectedCycle,
    planStartDate,
    setPlanStartDate,
    utrNumber,
    setUtrNumber,
    planAmount,
    setPlanAmount,
    planExpiryDate,
    gstNumber,
    setGstNumber,
    planScreenshot,
    setPlanScreenshot,
    chatbotSummaryMetrics,
    chatbotMetricFilter,
    chatbotMetricTableActive,
    chatbotMetricLoading,
    agentTodayDemos,
    chatbotChatDayFilter,
    setChatbotChatDayFilter,
    issues,
    showIssuesModal,
    setShowIssuesModal,
    role,
    deleteUserModal,
    setDeleteUserModal,
    editUserModal,
    setEditUserModal,
    editUserData,
    setEditUserData,
    savingEditUser,
    handleOpenEditUserModal,
    handleUpdateUserInfo,
    reportModalUser,
    setReportModalUser,
    handleSendReportWhatsApp,
    applyUserReport,
    showToast,
    bulkDeleteModalOpen,
    setBulkDeleteModalOpen,
    isDeleting,
    agents,
    assigneeFilter,
    setAssigneeFilter,
    stageStats,
    showMeetingModal,
    setShowMeetingModal,
    meetingData,
    setMeetingData,
    todayStats,
    agentTodayLeads,
    leadStatusStats,
    leadStatusFilter,
    setLeadStatusFilter,
    leadStageFilter,
    setLeadStageFilter,
    conversationStageFilter,
    setConversationStageUsers,
    selectedConversationStage,
    setSelectedConversationStage,
    conversationStageTableActive,
    setConversationStageTableActive,
    isRefreshingWhatsAppData,
    callStats,
    followUpDate,
    setFollowUpDate,
    followUpTime,
    setFollowUpTime,
    followUpStats,
    isOpen,
    setIsOpen,
    followUpFilter,
    setFollowUpFilter,
    loadingFollowUpTable,
    followUpDueAlert,
    setFollowUpDueAlert,
    showOnboardModal,
    setShowOnboardModal,
    onboardModalUser,
    setOnboardModalUser,
    onboardData,
    setOnboardData,
    uploadingOnboard,
    paidUsersStatus,
    aiAnalysisStatusMap,
    aiAnalysisModalUser,
    setAiAnalysisModalUser,
    handleOpenAiAnalysisModal,
    fetchAiAnalysisStatuses,
    searchQuery,
    setSearchQuery,
    filterStatus,
    filterDate,
    setFilterDate,
    leadSourceFilter,
    setLeadSourceFilter,
    remarkCountFilter,
    setRemarkCountFilter,
    franchiseLeadsFilter,
    setFranchiseLeadsFilter,
    franchiseCodeFilter,
    setFranchiseCodeFilter,
    franchiseOptions,
    customStartDate,
    setCustomStartDate,
    customEndDate,
    setCustomEndDate,
    currentPage,
    activeModal,
    setActiveModal,
    serviceUser,
    setServiceUser,
    isRefreshingMetaLeads,
    bulkWaSelectedUserIds,
    bulkWaSendDate,
    setBulkWaSendDate,
    bulkWaSending,
    templateWaSendingId,
    bulkWaResult,
    setBulkWaResult,
    allUserIds,
    planRemarks,
    setplanRemarks,
    handleOpenServiceModal,
    getConversationStageDisplay,
    isAgent,
    filteredUsers,
    agentFollowUpFilterLabel,
    defaultRemarks,
    FOLLOW_UP_REMARKS,
    handleDefaultRemarkClick,
    stageOptions,
    fetchChatHistoryForUser,
    closeChatHistoryModal,
    handleSearch,
    handleRefreshMetaLeads,
    stats,
    fetchUsers,
    handleRefreshWhatsAppData,
    clearChatbotMetricFilter,
    handleChatbotMetricCardClick,
    handleConversationStageFilterChange,
    handleAssignChange,
    handleRoundRobinAssign,
    handleLeadStageChange,
    handleLeadStatusChange,
    handleUserSourceChange,
    getAgentName,
    handleUpgradePlan,
    confirmPlanChange,
    confirmDeleteUser,
    confirmBulkDeleteUsers,
    toggleBulkWaUserId,
    selectAllBulkWaOnPage,
    sendBulkUserManagementWhatsApp,
    sendTemplateWhatsApp,
    handleAddUser,
    handleViewPosts,
    handleOpenWalletModal,
    handleUpdateWallet,
    AdminPanelButton,
    handleOpenRemarksModal,
    handleAddRemark,
    handleVoiceCall,
    handleMeetingSubmit,
    handleOnboardSubmit,
    clearFilters,
    handlePageChange,
    groupedUsers,
    currentLeadTotal,
  } = useUserManagementLogic();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="text-center">
          <div className="w-84 h-84 mx-auto">
            <Lottie animationData={animationData} loop={true} />
          </div>
          {/* <p className="text-gray-600 font-medium">Loading users.</p> */}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-2 sm:p-3">
        {/* Toast Notification */}
        {toast && (
          <div className="fixed top-4 right-4 z-[100] animate-in slide-in-from-top-5">
            <div
              className={`px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 min-w-[300px] ${
                toast.type === "success"
                  ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white"
                  : "bg-gradient-to-r from-red-500 to-rose-500 text-white"
              }`}
            >
              {toast.type === "success" ? (
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              ) : (
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              )}
              <div className="flex-1">
                <p className="font-semibold text-sm">{toast.message}</p>
              </div>
              <button
                onClick={() => setToast(null)}
                className="hover:bg-white/10 rounded-full p-1 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        <div className="max-w-[98vw] mx-auto">
          {/* ── Agent Performance Dashboard ──────────────────────────────── */}
          {isAgent && (
            <AgentPerformanceDashboard
              agentTodayLeads={agentTodayLeads}
              stats={stats}
              callStats={callStats}
              followUpStats={followUpStats}
              agentTodayDemos={agentTodayDemos}
              leadStatusStats={leadStatusStats}
              followUpFilter={followUpFilter}
              setFollowUpFilter={setFollowUpFilter}
              handleChatbotMetricCardClick={handleChatbotMetricCardClick}
              chatbotMetricFilter={chatbotMetricFilter}
              stageStats={stageStats}
            />
          )}

          {(role === "superAdmin" ||
            role === "admin" ||
            role === "superfranchiseAdmin" ||
            role === "agent") && (
            <Box sx={{ mb: 1 }}>
              <ChatbotSummaryMetrics
                totals={chatbotSummaryMetrics.totals}
                today={chatbotSummaryMetrics.today}
                loading={
                  chatbotSummaryMetrics.loading ||
                  chatbotMetricLoading ||
                  isRefreshingWhatsAppData
                }
                activeCardKey={chatbotMetricFilter?.cardKey || ""}
                onRefresh={handleRefreshWhatsAppData}
                onSelectCard={handleChatbotMetricCardClick}
                agentTodayLeads={agentTodayLeads}
                role={role}
              />
            </Box>
          )}

          {/* Chat stats + revenue (My Revenue / User Onboard Revenue in this row for agent & superAdmin) */}

          {/* ── Today's Lead Assignments per Agent (superAdmin / admin) ───── */}

          <UserFiltersPanel
            agentFollowUpFilterLabel={agentFollowUpFilterLabel}
            agents={agents}
            assigneeFilter={assigneeFilter}
            clearFilters={clearFilters}
            conversationStageFilter={conversationStageFilter}
            customEndDate={customEndDate}
            customStartDate={customStartDate}
            filterDate={filterDate}
            filterStatus={filterStatus}
            followUpFilter={followUpFilter}
            franchiseLeadsFilter={franchiseLeadsFilter}
            franchiseCodeFilter={franchiseCodeFilter}
            franchiseOptions={franchiseOptions}
            setFranchiseCodeFilter={setFranchiseCodeFilter}
            handleConversationStageFilterChange={
              handleConversationStageFilterChange
            }
            handleSearch={handleSearch}
            isAgent={isAgent}
            leadSourceFilter={leadSourceFilter}
            leadStageFilter={leadStageFilter}
            leadStatusFilter={leadStatusFilter}
            remarkCountFilter={remarkCountFilter}
            role={role}
            searchQuery={searchQuery}
            setAssigneeFilter={setAssigneeFilter}
            setCustomEndDate={setCustomEndDate}
            setCustomStartDate={setCustomStartDate}
            setFilterDate={setFilterDate}
            setFranchiseLeadsFilter={setFranchiseLeadsFilter}
            setLeadSourceFilter={setLeadSourceFilter}
            setLeadStageFilter={setLeadStageFilter}
            setLeadStatusFilter={setLeadStatusFilter}
            setRemarkCountFilter={setRemarkCountFilter}
            setSearchQuery={setSearchQuery}
            stageOptions={stageOptions}
          />

          <Paper
            elevation={0}
            sx={{
              border: "1px solid #dbe1ea",
              borderRadius: "16px",
              overflow: "hidden",
              backgroundColor: "#fff",
            }}
          >
            {(role === "superAdmin" ||
              role === "admin" ||
              role === "agent" ||
              role === "superfranchiseAdmin") && (
              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 2,
                  px: { xs: 2, sm: 2.5 },
                  py: { xs: 1.75, sm: 2 },
                  borderBottom: "1px solid",
                  borderColor: "divider",
                  background: (theme) =>
                    `linear-gradient(120deg, ${alpha(theme.palette.primary.main, 0.06)} 0%, ${alpha(theme.palette.success.main, 0.05)} 50%, ${alpha(theme.palette.primary.main, 0.04)} 100%)`,
                }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      display: "flex",
                      flexWrap: "wrap",
                      alignItems: "center",
                      gap: 1,
                      fontWeight: 800,
                      letterSpacing: "-0.02em",
                      color: "text.primary",
                      lineHeight: 1.3,
                    }}
                  >
                    <span>Leads</span>
                    <Box
                      component="span"
                      sx={{
                        display: "inline-flex",
                        alignItems: "center",
                        minHeight: 22,
                        px: 1,
                        borderRadius: "999px",
                        bgcolor: (theme) =>
                          alpha(theme.palette.primary.main, 0.1),
                        border: "1px solid",
                        borderColor: (theme) =>
                          alpha(theme.palette.primary.main, 0.18),
                        color: "primary.main",
                        fontSize: 12,
                        fontWeight: 800,
                        lineHeight: 1,
                      }}
                    >
                      Total: {currentLeadTotal.toLocaleString("en-IN")}
                    </Box>
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block", mt: 0.25 }}
                  >
                    {chatbotChatDayFilter
                      ? `Chatbot chats · ${chatbotChatDayFilter === "today" ? "Today" : "Yesterday"}`
                      : "Manage records and sync from Meta"}
                  </Typography>
                </Box>
                <Stack
                  direction="row"
                  spacing={1.25}
                  alignItems="center"
                  flexWrap="wrap"
                  useFlexGap
                >
                  <button
                    onClick={() => setShowAddExpoLeadModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 text-white rounded-lg shadow hover:bg-blue-700"
                  >
                    + Add Expo Lead
                  </button>

                  <Button
                    variant="contained"
                    onClick={() => setAddingUser(true)}
                    startIcon={<Plus size={18} strokeWidth={2.5} />}
                    sx={{
                      textTransform: "none",
                      fontWeight: 700,
                      borderRadius: 2,
                      px: 2.5,
                      py: 1,
                      boxShadow: (theme) =>
                        `0 4px 14px ${alpha(theme.palette.success.main, 0.35)}`,
                      background: (theme) =>
                        `linear-gradient(135deg, ${theme.palette.success.dark} 0%, ${theme.palette.success.main} 100%)`,
                      "&:hover": {
                        background: (theme) =>
                          `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.light} 100%)`,
                        boxShadow: (theme) =>
                          `0 6px 20px ${alpha(theme.palette.success.main, 0.4)}`,
                      },
                    }}
                  >
                    Add Lead
                  </Button>
                  <Button
                    variant="outlined"
                    disabled={isRefreshingMetaLeads}
                    onClick={() => handleRefreshMetaLeads({ silent: false })}
                    startIcon={
                      <RefreshCw
                        size={16}
                        className={isRefreshingMetaLeads ? "animate-spin" : ""}
                      />
                    }
                    sx={{
                      textTransform: "none",
                      fontWeight: 700,
                      borderRadius: 2,
                      px: 2.25,
                      py: 1,
                      borderWidth: 2,
                      borderColor: "primary.main",
                      color: "primary.main",
                      "&:hover": {
                        borderWidth: 2,
                        bgcolor: (theme) =>
                          alpha(theme.palette.primary.main, 0.08),
                        borderColor: "primary.dark",
                      },
                      "&.Mui-disabled": {
                        borderWidth: 2,
                      },
                    }}
                  >
                    Refresh
                  </Button>
                </Stack>
              </Box>
            )}
            {chatbotMetricTableActive && chatbotMetricFilter && (
              <div className="mx-3 mt-2 mb-0 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-blue-200/80 bg-blue-50/60 px-4 py-2.5">
                <p className="text-sm font-semibold text-blue-900">
                  Showing:{" "}
                  <span className="font-black">
                    {chatbotMetricFilter.title}
                  </span>
                  {pagination?.totalUsers != null && (
                    <span className="text-blue-700 font-bold">
                      {" "}
                      · {pagination.totalUsers} leads
                    </span>
                  )}
                  {chatbotMetricFilter?.metricId === "demoBooked" &&
                    chatbotMetricFilter?.period === "today" &&
                    chatbotMetricFilter?.calendarDate && (
                      <span className="text-rose-700 font-semibold">
                        {" "}
                        · scheduled {chatbotMetricFilter.calendarDate}
                      </span>
                    )}
                </p>
                <button
                  type="button"
                  onClick={clearChatbotMetricFilter}
                  className="text-xs font-bold text-blue-800 hover:text-blue-950 underline"
                >
                  Clear
                </button>
              </div>
            )}
            {chatbotChatDayFilter && (
              <div className="mx-3 mt-2 mb-0 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-emerald-200/80 bg-emerald-50/60 px-4 py-2.5">
                <p className="text-sm font-semibold text-emerald-900">
                  Filter:{" "}
                  <span className="font-black">
                    {chatbotChatDayFilter === "today" ? "Today" : "Yesterday"}
                  </span>
                  {pagination?.totalUsers != null && (
                    <span className="text-emerald-700 font-bold">
                      {" "}
                      · {pagination.totalUsers} leads
                    </span>
                  )}
                </p>
                <button
                  type="button"
                  onClick={() => setChatbotChatDayFilter(null)}
                  className="text-xs font-bold text-emerald-800 hover:text-emerald-950 underline"
                >
                  Clear
                </button>
              </div>
            )}
            {conversationStageTableActive && (
              <div className="mx-3 mt-2 mb-0 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-fuchsia-200/80 bg-fuchsia-50/60 px-4 py-2.5">
                <p className="text-sm font-semibold text-fuchsia-900">
                  Stage filter:{" "}
                  <span className="font-black">
                    {selectedConversationStage}
                  </span>
                  {pagination?.totalUsers != null && (
                    <span className="text-fuchsia-700 font-bold">
                      {" "}
                      · {pagination.totalUsers} WhatsApp leads
                    </span>
                  )}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setConversationStageTableActive(false);
                    setConversationStageUsers([]);
                    setSelectedConversationStage("All");
                  }}
                  className="text-xs font-bold text-fuchsia-800 hover:text-fuchsia-950 underline"
                >
                  Clear
                </button>
              </div>
            )}
            {role === "superAdmin" && (
              <>
                {bulkWaSelectedUserIds.length > 0 && (
                  <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-4 py-5 md:px-8 border-b border-white/10">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                      <div className="flex items-center gap-3 text-white">
                        <div className="bg-white/20 rounded-full p-3">
                          <MessageSquare className="text-white" size={24} />
                        </div>
                        <div>
                          <p className="text-sm opacity-90">Selected leads</p>
                          <p className="text-2xl font-bold">
                            {bulkWaSelectedUserIds.length}
                          </p>
                        </div>
                      </div>
                      <div className="flex-1 flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => setIsOpen(true)}
                            className="group bg-white px-6 py-3 rounded-2xl
                            flex items-center gap-2 text-green-600 font-semibold
                            shadow-md hover:shadow-xl hover:-translate-y-1
                            hover:scale-105 active:scale-95
                            transition-all duration-300"
                        >
                          <MessageCircle
                            size={20}
                            className="group-hover:rotate-12 transition"
                          />
                          WhatsApp
                        </button>

                        <button
                           className="group bg-white px-6 py-3 rounded-2xl
                           flex items-center gap-2 text-blue-600 font-semibold
                           shadow-md hover:shadow-xl hover:-translate-y-1
                           hover:scale-105 active:scale-95
                           transition-all duration-300"
                        >
                          <Send
                            size={20}
                            className="group-hover:-rotate-12 transition"
                          />
                          RCS
                        </button>

                        <button
                          className="
                           group bg-white px-6 py-3 rounded-2xl
                           flex items-center gap-2 text-purple-600 font-semibold
                           shadow-md hover:shadow-xl hover:-translate-y-1
                           hover:scale-105 active:scale-95
                           transition-all duration-300"
                        >
                          <Mail
                            size={20}
                            className="group-hover:scale-110 transition"
                          />
                          Email
                        </button>

                        <button
                           className="group bg-white px-6 py-3 rounded-2xl
                           flex items-center gap-2 text-orange-600 font-semibold
                           shadow-md hover:shadow-xl hover:-translate-y-1
                           hover:scale-105 active:scale-95
                           transition-all duration-300"
                        >
                          <Smartphone
                            size={20}
                            className="group-hover:rotate-6 transition"
                          />
                          SMS
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <WhatsappModal
                  isOpen={isOpen}
                  setIsOpen={setIsOpen}
                  selectedCount={bulkWaSelectedUserIds.length}
                  bulkWaSendDate={bulkWaSendDate}
                  setBulkWaSendDate={setBulkWaSendDate}
                  onBulkSend={sendBulkUserManagementWhatsApp}
                  bulkWaSending={bulkWaSending}
                  onSendTemplate={sendTemplateWhatsApp}
                  sendingTemplateId={templateWaSendingId}
                />

                {bulkWaResult && (
                  <div
                    className={`mx-4 md:mx-8 mb-4 p-5 rounded-2xl shadow-lg border-l-4 ${
                      bulkWaResult.success
                        ? "bg-green-50 text-green-800 border-green-500"
                        : "bg-red-50 text-red-800 border-red-500"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <p className="font-bold text-lg mb-1">
                          {bulkWaResult.success ? "✓ Success" : "✗ Error"}
                        </p>
                        <p>{bulkWaResult.message}</p>
                        {bulkWaResult.sent !== undefined && (
                          <p className="mt-2 font-semibold">
                            . Messages sent: {bulkWaResult.sent}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setBulkWaResult(null)}
                        className="text-gray-500 hover:text-gray-700 p-1"
                        aria-label="Dismiss"
                      >
                        <X size={20} />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            <TableContainer
              sx={{
                maxHeight: { xs: "60vh", md: "72vh" },
                overflowX: "auto",
              }}
            >
              <div className="max-h-[500px] overflow-x-auto pb-1">
                <table className="min-w-full">
                  <thead className="sticky top-0 z-20 bg-slate-100/95 backdrop-blur">
                    <tr>
                      {role === "superAdmin" && (
                        <th className="px-3 py-3 text-left text-[11px] font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200 w-14">
                          <input
                            type="checkbox"
                            title="Select all leads on this page"
                            checked={
                              allUserIds.length > 0 &&
                              allUserIds.every((id) =>
                                bulkWaSelectedUserIds.includes(id),
                              )
                            }
                            onChange={selectAllBulkWaOnPage}
                            className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer"
                          />
                        </th>
                      )}
                      <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200 min-w-[120px]">
                        {isAgent && followUpFilter !== "all"
                          ? "Follow-up"
                          : "Joined Date"}
                      </th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200 min-w-[180px]">
                        User Name
                      </th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200 min-w-[150px]">
                        Business Report
                      </th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200 min-w-[90px]">
                        Chat
                      </th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200 min-w-[180px]">
                        Contact
                      </th>
                      {/* <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                      Plan
                    </th> */}
                      <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200 min-w-[150px]">
                        Assign To
                      </th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200 min-w-[150px]">
                        Remarks
                      </th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                        Lead Stage
                      </th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                        Plan
                      </th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                        Service
                      </th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                        Wallet
                      </th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                        Posts
                      </th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                        Business Name
                      </th>
                      <th className="px-4 py-3 text-left text-[11px] font-semibold text-slate-700 uppercase tracking-wider border-b border-slate-200">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">
                    {(loadingFollowUpTable &&
                      isAgent &&
                      followUpFilter !== "all") ||
                    (chatbotMetricLoading && chatbotMetricTableActive) ? (
                      <tr>
                        <td
                          colSpan={role === "superAdmin" ? 15 : 14}
                          className="text-center py-14"
                        >
                          <div className="flex flex-col items-center justify-center gap-2 text-indigo-600">
                            <RefreshCw
                              size={28}
                              className="animate-spin opacity-80"
                            />
                            <p className="text-sm font-semibold text-gray-700">
                              {chatbotMetricLoading && chatbotMetricTableActive
                                ? "Loading WhatsApp leads…"
                                : `Loading follow-ups (${agentFollowUpFilterLabel})…`}
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      <>
                        {Object.entries(groupedUsers).map(([date, users]) => {
                          return (
                            <Fragment key={date}>
                              {/* 🔥 DATE HEADING */}
                              <tr>
                                <td
                                  colSpan={role === "superAdmin" ? 15 : 14}
                                  className="bg-gray-100 font-bold px-6 py-3 text-gray-700"
                                >
                                  {date} (Total: {users.length})
                                </td>
                              </tr>
                              {/* 🔥 USERS */}
                              {users.map((user, rowIndex) => (
                                <UserTableRow
                                  key={user._id || user.userId}
                                  user={user}
                                  rowIndex={rowIndex}
                                  role={role}
                                  agents={agents}
                                  userPostsData={userPostsData}
                                  paidUsersStatus={paidUsersStatus}
                                  aiAnalysisStatusMap={aiAnalysisStatusMap}
                                  handleOpenAiAnalysisModal={
                                    handleOpenAiAnalysisModal
                                  }
                                  bulkWaSelectedUserIds={bulkWaSelectedUserIds}
                                  chatbotMetricFilter={chatbotMetricFilter}
                                  getAgentName={getAgentName}
                                  getConversationStageDisplay={
                                    getConversationStageDisplay
                                  }
                                  AdminPanelButton={AdminPanelButton}
                                  handleAssignChange={handleAssignChange}
                                  handleLeadStageChange={handleLeadStageChange}
                                  handleLeadStatusChange={
                                    handleLeadStatusChange
                                  }
                                  handleOpenRemarksModal={
                                    handleOpenRemarksModal
                                  }
                                  handleOpenServiceModal={
                                    handleOpenServiceModal
                                  }
                                  handleOpenWalletModal={handleOpenWalletModal}
                                  handleRoundRobinAssign={
                                    handleRoundRobinAssign
                                  }
                                  handleUpgradePlan={handleUpgradePlan}
                                  handleUserSourceChange={
                                    handleUserSourceChange
                                  }
                                  handleViewPosts={handleViewPosts}
                                  handleVoiceCall={handleVoiceCall}
                                  handleOpenEditUserModal={
                                    handleOpenEditUserModal
                                  }
                                  handleOpenReportModal={setReportModalUser}
                                  handleSendReportWhatsApp={
                                    handleSendReportWhatsApp
                                  }
                                  fetchChatHistoryForUser={
                                    fetchChatHistoryForUser
                                  }
                                  toggleBulkWaUserId={toggleBulkWaUserId}
                                  setDeleteUserModal={setDeleteUserModal}
                                  setFullViewImage={setFullViewImage}
                                />
                              ))}
                            </Fragment>
                          );
                        })}

                        {!loadingFollowUpTable &&
                          !(chatbotMetricLoading && chatbotMetricTableActive) &&
                          filteredUsers.length === 0 && (
                            <tr>
                              <td
                                colSpan={role === "superAdmin" ? 15 : 14}
                                className="text-center py-12"
                              >
                                No users found
                              </td>
                            </tr>
                          )}
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </TableContainer>
          </Paper>
          {/* Pagination Controls */}
          {isAgent && followUpFilter !== "all" ? (
            <div className="mt-2 flex items-center justify-center sm:justify-between gap-2 px-3 py-2 bg-white rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
                <span className="font-semibold text-gray-800">
                  Showing {filteredUsers.length} users
                </span>
                <span className="text-gray-400"> · </span>
                <span className="text-indigo-700 font-medium">
                  follow-up: {agentFollowUpFilterLabel}
                </span>
              </p>
            </div>
          ) : (
            pagination &&
            pagination.totalPages > 1 && (
              <div className="mt-2 flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
                <span className="text-sm text-gray-600">
                  Page{" "}
                  <span className="font-semibold">
                    {pagination.currentPage}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold">{pagination.totalPages}</span>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    <ChevronLeft size={16} />
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === pagination.totalPages}
                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                  >
                    Next
                    <ChevronRight size={16} />
                  </button>
                </div>
                <span className="text-sm text-gray-600">
                  Total Users:{" "}
                  <span className="font-semibold">{pagination.totalUsers}</span>
                </span>
              </div>
            )
          )}
        </div>

        {/* Wallet Update Modal */}
        <WalletUpdateModal
          walletModalUser={walletModalUser}
          walletUpdate={walletUpdate}
          setWalletUpdate={setWalletUpdate}
          setWalletModalUser={setWalletModalUser}
          updatingWallet={updatingWallet}
          handleUpdateWallet={handleUpdateWallet}
        />

        {/* Upgrade Plan Modal */}
        <PlanUpgradeModal
          selectedUser={selectedUser}
          setSelectedUser={setSelectedUser}
          subscriptionPlans={subscriptionPlans}
          selectedCycle={selectedCycle}
          setSelectedCycle={setSelectedCycle}
          selectedPlan={selectedPlan}
          setSelectedPlan={setSelectedPlan}
          planAmount={planAmount}
          setPlanAmount={setPlanAmount}
          planStartDate={planStartDate}
          setPlanStartDate={setPlanStartDate}
          planExpiryDate={planExpiryDate}
          planScreenshot={planScreenshot}
          setPlanScreenshot={setPlanScreenshot}
          utrNumber={utrNumber}
          setUtrNumber={setUtrNumber}
          planRemarks={planRemarks}
          setplanRemarks={setplanRemarks}
          gstNumber={gstNumber}
          setGstNumber={setGstNumber}
          updating={updating}
          confirmPlanChange={confirmPlanChange}
        />

        <ChatHistoryModal
          open={chatHistoryModal.open}
          onClose={closeChatHistoryModal}
          user={chatHistoryModal.user}
          userId={chatHistoryModal.userId}
          history={chatHistoryModal.history}
          loading={chatHistoryModal.loading}
          error={chatHistoryModal.error}
          onRetry={() =>
            chatHistoryModal.user &&
            fetchChatHistoryForUser(chatHistoryModal.user)
          }
        />

        {/* Remarks Modal */}
        <RemarksModal
          remarksModalUser={remarksModalUser}
          setRemarksModalUser={setRemarksModalUser}
          remarksInput={remarksInput}
          setRemarksInput={setRemarksInput}
          followUpDate={followUpDate}
          setFollowUpDate={setFollowUpDate}
          followUpTime={followUpTime}
          setFollowUpTime={setFollowUpTime}
          loadingRemarks={loadingRemarks}
          remarksHistory={remarksHistory}
          handleAddRemark={handleAddRemark}
          handleDefaultRemarkClick={handleDefaultRemarkClick}
          FOLLOW_UP_REMARKS={FOLLOW_UP_REMARKS}
          defaultRemarks={defaultRemarks}
        />

        {/* Add New User Modal */}
        <AddUserModal
          addingUser={addingUser}
          setAddingUser={setAddingUser}
          newUser={newUser}
          setNewUser={setNewUser}
          handleAddUser={handleAddUser}
        />
        {/* User Posts Modal (primary — gated by activeModal === "posts") */}
        <UserPostsModal
          open={activeModal === "posts" && !!viewingUserPosts}
          user={viewingUserPosts || {}}
          loadingPosts={loadingPosts}
          userPosts={userPosts}
          totalCount={userPosts.length}
          postedCount={userPosts.filter((p) => p.status === "posted").length}
          rejectedCount={
            userPosts.filter((p) => p.status === "rejected").length
          }
          onCloseX={() => {
            setViewingUserPosts(null);
            setActiveModal(null);
            setUserPosts([]);
          }}
          onCloseFooter={() => {
            setViewingUserPosts(null);
            setUserPosts([]);
          }}
          setFullViewImage={setFullViewImage}
        />

        <FullViewImageModal
          fullViewImage={fullViewImage}
          setFullViewImage={setFullViewImage}
        />

        {/* Reported Issues Modal */}
        <IssuesModal
          showIssuesModal={showIssuesModal}
          setShowIssuesModal={setShowIssuesModal}
          issues={issues}
        />

        {/* Bulk Delete Confirmation Modal */}
        <BulkDeleteModal
          bulkDeleteModalOpen={bulkDeleteModalOpen}
          bulkWaSelectedUserIds={bulkWaSelectedUserIds}
          setBulkDeleteModalOpen={setBulkDeleteModalOpen}
          confirmBulkDeleteUsers={confirmBulkDeleteUsers}
          isDeleting={isDeleting}
        />

        {/* Generate Business Report Modal */}
        <GenerateReportModal
          reportModalUser={reportModalUser}
          setReportModalUser={setReportModalUser}
          showToast={showToast}
          onReportGenerated={applyUserReport}
          onAiAnalysisSaved={fetchAiAnalysisStatuses}
        />

        {/* Saved AI Sales Analysis (opened from the table) */}
        <BusinessAiAnalysisModal
          aiAnalysisModalUser={aiAnalysisModalUser}
          setAiAnalysisModalUser={setAiAnalysisModalUser}
          showToast={showToast}
        />

        {/* Edit User (Name & Email) Modal */}
        <EditUserModal
          editUserModal={editUserModal}
          setEditUserModal={setEditUserModal}
          editUserData={editUserData}
          setEditUserData={setEditUserData}
          savingEditUser={savingEditUser}
          handleUpdateUserInfo={handleUpdateUserInfo}
        />

        {/* Delete User Confirmation Modal */}
        <DeleteUserModal
          deleteUserModal={deleteUserModal}
          setDeleteUserModal={setDeleteUserModal}
          confirmDeleteUser={confirmDeleteUser}
          isDeleting={isDeleting}
        />

        {/* User Onboard Revenue Details Modal ✅ NEW */}

        {/* Onboard Client Modal */}
        <OnboardClientModal
          showOnboardModal={showOnboardModal}
          onboardModalUser={onboardModalUser}
          setShowOnboardModal={setShowOnboardModal}
          setOnboardModalUser={setOnboardModalUser}
          onboardData={onboardData}
          setOnboardData={setOnboardData}
          uploadingOnboard={uploadingOnboard}
          handleOnboardSubmit={handleOnboardSubmit}
        />

        {/* 💰 USER ONBOARD REVENUE USERS MODAL ✅ NEW */}
        {/* Meeting Schedule Modal (NOTE: pre-existing duplicate of the modal above — kept to preserve original behaviour) */}
        <MeetingModal
          showMeetingModal={showMeetingModal}
          setShowMeetingModal={setShowMeetingModal}
          meetingData={meetingData}
          setMeetingData={setMeetingData}
          handleMeetingSubmit={handleMeetingSubmit}
        />

        <FollowUpDueAlertModal
          alert={followUpDueAlert}
          onDismiss={() => setFollowUpDueAlert(null)}
          onVoiceCall={
            followUpDueAlert?.kind === "user" ? handleVoiceCall : undefined
          }
        />

        {activeModal === "service" && serviceUser && (
          <AdminServicepaneModal
            service={serviceUser}
            onClose={() => {
              setActiveModal(null);
              setServiceUser(null);
            }}
          />
        )}
      </div>

      {/* User Posts Modal (secondary — gated by viewingUserPosts; stats from userPostsData) */}
      <UserPostsModal
        open={!!viewingUserPosts}
        user={viewingUserPosts || {}}
        loadingPosts={loadingPosts}
        userPosts={userPosts}
        totalCount={
          userPostsData?.[viewingUserPosts?.userId]?.total ||
          viewingUserPosts?.totalPosts ||
          viewingUserPosts?.postsCount ||
          userPosts.length ||
          0
        }
        postedCount={
          userPostsData?.[viewingUserPosts?.userId]?.posted ||
          userPosts.filter((p) => p.status === "posted").length ||
          0
        }
        rejectedCount={
          userPostsData?.[viewingUserPosts?.userId]?.rejected ||
          userPosts.filter((p) => p.status === "rejected").length ||
          0
        }
        onCloseX={() => {
          setViewingUserPosts(null);
          setUserPosts([]);
        }}
        onCloseFooter={() => {
          setViewingUserPosts(null);
          setUserPosts([]);
        }}
        setFullViewImage={setFullViewImage}
      />

      <FullViewImageModal
        fullViewImage={fullViewImage}
        setFullViewImage={setFullViewImage}
      />

      <AddExpoLeadUserModal
        open={showAddExpoLeadModal}
        onClose={() => setShowAddExpoLeadModal(false)}
        onSuccess={fetchUsers}
      />
    </>
  );
}

export const getTodayUsersData = async () => {
  const adminEmail = (localStorage.getItem("adminEmail") || localStorage.getItem("email"));
  if (!adminEmail) return null;

  try {
    const res = await fetch(
      `/api/users?email=${adminEmail}&getTodayUsersCount=true`,
    );
    const data = await res.json();

    return data; // 🔥 yaha return kar rahe
  } catch (err) {
    console.error(err);
    return null;
  }
};
