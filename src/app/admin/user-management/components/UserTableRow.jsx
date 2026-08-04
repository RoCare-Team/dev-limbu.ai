"use client";

import { Fragment } from "react";
import {
  Activity,
  BarChart3,
  Calendar,
  CheckCircle,
  ChevronDown,
  Crown,
  Edit2,
  Eye,
  FileText,
  Globe2,
  Mail,
  MessageCircle,
  MessageSquare,
  MoveRight,
  Phone,
  QrCode,
  RefreshCw,
  Sparkles,
  Trash2,
  User2Icon,
  Wallet,
} from "lucide-react";
import {
  USER_SOURCE_OPTIONS,
  userAcquisitionLabel,
  formatLeadTagLabel,
  leadTagPillClassName,
} from "@/lib/bookingSource";
import { getAvatarColor, getLimbuBotHistoryUserId } from "../utils";

// Extracted verbatim from user-management/page.jsx (a single user table row).
// The JSX body is exactly the original `users.map((user, rowIndex) => { ... })`
// callback body — behaviour is unchanged; state/handlers arrive as props.
export default function UserTableRow({
  user,
  rowIndex,
  role,
  agents,
  userPostsData,
  paidUsersStatus,
  aiAnalysisStatusMap,
  handleOpenAiAnalysisModal,
  bulkWaSelectedUserIds,
  chatbotMetricFilter,
  getAgentName,
  getConversationStageDisplay,
  AdminPanelButton,
  handleAssignChange,
  handleLeadStageChange,
  handleLeadStatusChange,
  handleOpenRemarksModal,
  handleOpenServiceModal,
  handleOpenWalletModal,
  handleRoundRobinAssign,
  handleUpgradePlan,
  handleUserSourceChange,
  handleViewPosts,
  handleVoiceCall,
  handleOpenEditUserModal,
  handleOpenReportModal,
  handleSendReportWhatsApp,
  fetchChatHistoryForUser,
  toggleBulkWaUserId,
  setDeleteUserModal,
  setFullViewImage,
}) {
  const postData = userPostsData[user.userId] || {
    total: 0,
    posted: 0,
    rejected: 0,
  };

  // Present only when this lead already has a saved AI analysis.
  const aiAnalysisSummary = aiAnalysisStatusMap?.[user.userId] || null;

  // --- CONVERSATION STEPS LOGIC ---
  const stage = getConversationStageDisplay(user);
  const botUserId = getLimbuBotHistoryUserId(user);

  // 1. FIXED ROADMAP DEFINITION (Order as per your requirement)
  const FIXED_JOURNEY_STEPS = [
    {
      id: "Initial Conversation",
      icon: <MessageCircle size={10} />,
    },
    {
      id: "GMB Connected",
      icon: <CheckCircle size={10} />,
    },
    {
      id: "GMB Health",
      icon: <Activity size={10} />,
    },
    {
      id: "Magic QR",
      icon: <QrCode size={10} />,
    },
    {
      id: "GMB Insight",
      icon: <BarChart3 size={10} />,
    },
    {
      id: "Build Website",
      icon: <Globe2 size={10} />,
    },
  ];

  // 2. PARSE COMPLETED STEPS FROM LABEL
  const completedSteps = String(stage?.label || "")
    .split("➔")
    .map((item) => item.trim())
    .filter((item) => item && item !== "No Activity" && item !== "Not Loaded");

  const lastCompletedStep = completedSteps[completedSteps.length - 1];
  const hasAnyProgress = completedSteps.length > 0;
  // -------------------------------

  return (
    <Fragment key={user._id || user.userId}>
      {/* 1. FIXED HORIZONTAL STEPS STRIP (Upper Row) */}
      {botUserId && (
        <tr className={`${rowIndex % 2 === 0 ? "bg-white" : "bg-slate-50/40"}`}>
          <td
            colSpan={role === "superAdmin" ? 15 : 14}
            className="px-6 pt-3 pb-1 border-b-0"
          >
            <div className="flex items-center gap-3">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                User Journey:
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                {FIXED_JOURNEY_STEPS.map((step, index) => {
                  const isDone = completedSteps.includes(step.id);
                  const isLastActive = step.id === lastCompletedStep;

                  return (
                    <Fragment key={step.id}>
                      <div
                        className={`
                                   inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[9px] font-bold shadow-sm transition-all
                                     ${
                                       isDone
                                         ? "border-emerald-200 bg-emerald-50 text-emerald-700" // GREEN if completed
                                         : "border-blue-300 bg-blue-50 text-blue-600 opacity-80" // Blue if pending
                                     }
                                 `}
                      >
                        {step.icon}
                        <span>{step.id}</span>
                      </div>

                      {/* Arrow Logic */}
                      {index !== FIXED_JOURNEY_STEPS.length - 1 && (
                        <MoveRight
                          size={10}
                          className={
                            isDone ? "text-emerald-400" : "text-slate-300"
                          }
                        />
                      )}
                    </Fragment>
                  );
                })}
              </div>
            </div>
          </td>
        </tr>
      )}

      {/* 2. MAIN DATA ROW (Bottom Row) */}
      <tr
        onClick={() => handleViewPosts(user)}
        className={`cursor-pointer ${
          rowIndex % 2 === 0 ? "bg-white" : "bg-slate-50/40"
        } ${botUserId ? "border-t-0" : ""}`}
      >
        {role === "superAdmin" && (
          <td
            className="px-3 py-5 w-14 align-middle"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="checkbox"
              checked={bulkWaSelectedUserIds.includes(String(user.userId))}
              onChange={() => toggleBulkWaUserId(user.userId)}
              className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer"
            />
          </td>
        )}

        {/* DATE / FOLLOW UP */}
        <td className="px-6 py-5">
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-gray-400" />
            <div className="text-sm text-gray-700">
              {user.createdAt ? (
                <div className="font-medium">
                  {new Date(user.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </div>
              ) : (
                <span className="text-gray-400 italic">N/A</span>
              )}
            </div>
          </div>
        </td>

        {/* USER INFO & STATUS */}
        <td className="px-6 py-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {user.fullName && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <User2Icon size={14} className="text-gray-400" />
                  {user.fullName}
                </div>
              )}
              {chatbotMetricFilter?.metricId === "demoBooked" &&
                user.demoBooking && (
                  <span
                    className="inline-block px-2 py-0.5 text-[10px] font-semibold text-rose-800 bg-rose-100 rounded-full border border-rose-200"
                    title={`Demo: ${user.demoBooking.selectedDateLabel || user.demoBooking.selectedDate} · ${user.demoBooking.seminarTime} · ${user.demoBooking.status}`}
                  >
                    Demo {user.demoBooking.seminarTime}
                  </span>
                )}
              {paidUsersStatus[user.userId] && ( // A URL exists for this user
                <>
                  <span className="inline-block px-2 py-0.5 text-[10px] font-semibold text-green-700 bg-green-100 rounded-full border border-green-200">
                    Paid
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setFullViewImage(paidUsersStatus[user.userId]);
                    }}
                    className="p-1 hover:bg-gray-200 rounded-full"
                    title="View Payment Screenshot"
                  >
                    <Eye size={14} className="text-gray-500" />
                  </button>
                </>
              )}
            </div>
            {chatbotMetricFilter?.metricId === "demoBooked" &&
              user.demoBooking && (
                <div className="text-[10px] text-rose-700 font-medium space-y-0.5">
                  <div>
                    Demo Date:{" "}
                    {user.demoBooking.selectedDateLabel ||
                      user.demoBooking.selectedDate ||
                      "—"}{" "}
                    · {user.demoBooking.seminarTime} · {user.demoBooking.status}
                  </div>
                  <div className="text-indigo-700">
                    Agent: {getAgentName(user.assignedAgentId)}
                  </div>
                </div>
              )}
            <div onClick={(e) => e.stopPropagation()}>
              <select
                value={user.leadStatus || ""}
                onChange={(e) =>
                  handleLeadStatusChange(user.userId, e.target.value)
                }
                className={`mt-1 px-2 py-0.5 rounded text-[10px] font-semibold border outline-none cursor-pointer transition-all ${
                  user.leadStatus === "Hot"
                    ? "bg-red-50 text-red-700 border-red-200"
                    : user.leadStatus === "Warm"
                      ? "bg-orange-50 text-orange-700 border-orange-200"
                      : user.leadStatus === "Cold"
                        ? "bg-blue-50 text-blue-700 border-blue-200"
                        : "bg-gray-50 text-gray-600 border-gray-200"
                }`}
              >
                <option value="">Untagged</option>
                <option value="Hot">Hot</option>
                <option value="Warm">Warm</option>
                <option value="Cold">Cold</option>
              </select>
            </div>
            {!user.franchiseId && (
              <div onClick={(e) => e.stopPropagation()}>
                <select
                  value={
                    USER_SOURCE_OPTIONS.some(
                      (o) => o.value === (user.source || ""),
                    )
                      ? user.source || "signup"
                      : "signup"
                  }
                  onChange={(e) =>
                    handleUserSourceChange(user.userId, e.target.value)
                  }
                  className="mt-1 w-full max-w-[140px] px-2 py-0.5 rounded text-[10px] font-semibold border border-gray-200 bg-white text-gray-700 outline-none"
                  title="Lead source (website, chatbot, manual upload, …)"
                >
                  {USER_SOURCE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            )}{" "}
            <div className="flex flex-wrap gap-1 mt-1">
              {user.franchiseId ? (
                <span
                  className="inline-block px-2 py-0.5 text-[10px] font-semibold text-purple-700 bg-purple-100 rounded-full"
                  title={`Franchise code: ${user.franchiseId}`}
                >
                  Franchise: {user.franchiseName || user.franchiseId}
                </span>
              ) : (
                <span className="inline-block px-2 py-0.5 text-[10px] font-semibold text-slate-700 bg-slate-100 rounded-full">
                  {/* {userAcquisitionLabel(
                                                  user.source,
                                                )} */}
                  {""}
                </span>
              )}

              {user.paidPackage && (
                <span className="inline-block px-2 py-0.5 text-[10px] font-semibold text-amber-700 bg-amber-100 rounded-full">
                  {user.paidPackage}
                </span>
              )}

              {Array.isArray(user.leadTags) &&
                user.leadTags.map((tag) => (
                  <span
                    key={`${user.userId || user._id}-${tag}`}
                    className={`inline-block px-2 py-0.5 text-[10px] font-semibold rounded-full border ${leadTagPillClassName(tag)}`}
                  >
                    {formatLeadTagLabel(tag)}
                  </span>
                ))}
            </div>
          </div>
        </td>

        {/* BUSINESS REPORT */}
        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
          <div className="flex flex-col items-start gap-1.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleOpenReportModal(user);
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-xs font-bold hover:bg-purple-100 whitespace-nowrap"
              title="Generate Business Report"
            >
              <FileText size={14} />
              {user.businessReport?.pdfUrl ? "View / Regenerate" : "Generate"}
            </button>

            {/* Sirf tab dikhta hai jab is lead ki analysis ho chuki ho */}
            {aiAnalysisSummary && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenAiAnalysisModal?.(user);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-violet-50 text-violet-700 rounded-lg text-xs font-bold hover:bg-violet-100 whitespace-nowrap"
                title={`AI analysis · ${new Date(aiAnalysisSummary.aiAnalysedAt).toLocaleDateString("en-IN")}`}
              >
                <Sparkles size={14} />
                AI Analysis
                {aiAnalysisSummary.overallScore != null && (
                  <span className="rounded-full bg-violet-600 px-1.5 py-0.5 text-[10px] font-black text-white">
                    {aiAnalysisSummary.overallScore}
                  </span>
                )}
              </button>
            )}

            {user.businessReport?.pdfUrl && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSendReportWhatsApp(user);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-bold hover:bg-green-100 whitespace-nowrap"
                title="Send report on WhatsApp"
              >
                <MessageCircle size={14} />
                WhatsApp
              </button>
            )}
          </div>
        </td>

        {/* CHAT BUTTON & PROGRESS COUNT */}
        <td className="px-6 py-5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              fetchChatHistoryForUser(user);
            }}
            disabled={!botUserId}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-[10px] font-bold uppercase tracking-wider transition shadow-sm disabled:opacity-40 ${
              hasAnyProgress
                ? "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                : "border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
            }`}
          >
            <MessageCircle size={14} />
            <span>Chat</span>
            {hasAnyProgress && (
              <div className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-emerald-200 px-1.5 text-[9px] font-bold text-emerald-800">
                {completedSteps.length}
              </div>
            )}
          </button>
        </td>

        {/* CONTACT INFO */}
        <td className="px-6 py-5">
          <div className="text-xs space-y-1">
            <div className="flex items-center gap-2 text-gray-600">
              <Mail size={12} /> {user.email || "N/A"}
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Phone size={12} /> {user.phone || user.mobileNumber || "N/A"}
            </div>
          </div>
        </td>

        {/* AGENT ASSIGNMENT */}
        <td
          className="px-6 py-5 whitespace-nowrap"
          onClick={(e) => e.stopPropagation()}
        >
          {role === "superAdmin" ||
          role === "admin" ||
          role === "superfranchiseAdmin" ? (
            <div
              className={`relative inline-flex items-center rounded-full border ${getAvatarColor(
                getAgentName(user.assignedAgentId),
              )}`}
            >
              <select
                className="
                         appearance-none bg-transparent 
                         px-4 py-1.5 pr-8 
                         text-xs font-bold 
                         focus:outline-none 
                         cursor-pointer
                        "
                value={
                  // ✅ Handle populated object, string ID, null, and undefined
                  user.assignedAgentId?._id ||
                  (typeof user.assignedAgentId === "string" &&
                    user.assignedAgentId) ||
                  ""
                }
                onChange={(e) =>
                  handleAssignChange(user.userId, e.target.value)
                }
              >
                <option value="">-- Unassigned --</option>

                {agents.map((agent) => (
                  <option key={agent._id} value={agent._id}>
                    {agent.fullName}
                  </option>
                ))}
              </select>

              {!user.assignedAgentId && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRoundRobinAssign(user.userId);
                  }}
                  className="absolute -right-8 p-1 bg-indigo-100 text-indigo-600 rounded-full hover:bg-indigo-200 transition-colors"
                  title="Auto Assign (Round Robin)"
                >
                  <RefreshCw size={12} />
                </button>
              )}

              <span className="pointer-events-none absolute right-2 flex items-center">
                <ChevronDown className="h-3 w-3" />
              </span>
            </div>
          ) : (
            <span
              className={`inline-block px-4 py-1.5 rounded-full text-xs font-bold border ${getAvatarColor(
                getAgentName(user.assignedAgentId),
              )}`}
            >
              {getAgentName(user.assignedAgentId)}
            </span>
          )}
        </td>

        {/* REMARKS */}
        <td className="px-6 py-4">
          <div
            onClick={(e) => {
              e.stopPropagation();
              handleOpenRemarksModal(user);
            }}
            className="cursor-pointer"
          >
            <div className="flex items-center h-7 px-2.5 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100 w-fit">
              <MessageSquare size={14} className="mr-1.5" />
              <span className="font-bold text-xs">
                {user.remarksHistory?.length || 0}
              </span>
            </div>

            {/* ✅ Last remark date/time */}
            {user.remarksHistory?.length > 0 &&
              (() => {
                const lastRemark =
                  user.remarksHistory[user.remarksHistory.length - 1];
                const date = lastRemark?.createdAt
                  ? new Date(lastRemark.createdAt)
                  : null;
                return date ? (
                  <div className="text-[10px] text-blue-400 font-bold mt-1">
                    {date.toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "2-digit",
                    })}{" "}
                    {date.toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </div>
                ) : null;
              })()}

            {user.Remarks && (
              <div className="text-[10px] text-gray-500 truncate max-w-[150px] mt-1 italic">
                {user.Remarks}
              </div>
            )}
          </div>
        </td>

        {/* LEAD STAGE */}
        <td className="px-6 py-5">
          <select
            value={user.leadStage || "Active"}
            onChange={(e) => handleLeadStageChange(user.userId, e.target.value)}
            onClick={(e) => e.stopPropagation()}
            className="px-3 py-1.5 rounded-lg text-xs font-medium border bg-white"
          >
            <option value="Active">Active</option>
            <option value="Follow Up">Follow Up</option>
            <option value="Inactive">Inactive</option>
            <option value="Onboard">Onboard</option>
          </select>
        </td>

        <td className="px-6 py-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleUpgradePlan(user);
            }}
            className="p-1.5 bg-yellow-50 text-yellow-600 rounded-lg hover:bg-yellow-100 transition-all"
            title="Change Plan"
          >
            <Crown size={16} />
          </button>
        </td>

        <td className="px-6 py-4">
          <button
            onClick={(e) => {
              e.stopPropagation();

              handleOpenServiceModal(user);
            }}
            className="p-2 hover:bg-gray-100 rounded-lg cursor-pointer"
            title="Add Service "
          >
            🛡️
          </button>
        </td>

        {/* WALLET */}
        <td className="px-6 py-5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleOpenWalletModal(user);
            }}
            className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100"
          >
            <Wallet size={14} />
            <span className="font-bold text-sm">{user.wallet || 0}</span>
          </button>
        </td>

        {/* POSTS DATA */}
        <td className="px-6 py-5">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg px-3 py-2 border border-indigo-200">
              <div className="flex items-center gap-3">
                <div className="text-center">
                  <p className="text-xs text-gray-600">Total</p>
                  <p className="text-lg font-bold text-indigo-600">
                    {postData.total}
                  </p>
                </div>
                <div className="w-px h-8 bg-gray-300"></div>
                <div className="text-center">
                  <p className="text-xs text-green-600">Posted</p>
                  <p className="text-lg font-bold text-green-600">
                    {postData.posted}
                  </p>
                </div>
                <div className="w-px h-8 bg-gray-300"></div>
                <div className="text-center">
                  <p className="text-xs text-red-600">Rejected</p>
                  <p className="text-lg font-bold text-red-600">
                    {postData.rejected}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </td>

        {/* LISTING INFO */}
        <td className="px-6 py-4">
          {user.businessListings?.[0] ? (
            <div className="text-xs font-medium max-w-[150px] truncate">
              {user.businessListings[0].title}
            </div>
          ) : (
            <span className="text-[10px] text-gray-400 italic">No Listing</span>
          )}
        </td>

        {/* ACTIONS */}
        <td className="px-6 py-4">
          <div className="flex items-center gap-1.5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                AdminPanelButton(user.userId);
              }}
              className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold"
            >
              Login
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleVoiceCall(user.phone);
              }}
              className="p-1.5 bg-blue-50 text-blue-600 rounded-lg"
            >
              <Phone size={14} />
            </button>
            {(role === "superAdmin" || role === "admin" || role === "agent") && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenEditUserModal(user);
                }}
                className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg"
                title="Edit Name & Email"
              >
                <Edit2 size={14} />
              </button>
            )}
            {role === "superAdmin" && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteUserModal(user);
                }}
                className="p-1.5 bg-red-50 text-red-600 rounded-lg"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </td>
      </tr>
    </Fragment>
  );
}
