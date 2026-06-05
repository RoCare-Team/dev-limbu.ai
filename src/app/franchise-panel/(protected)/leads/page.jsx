"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle,
  Crown,
  Mail,
  MessageCircle,
  Phone,
  Search,
  Trash2,
  UserRound,
  Wallet,
  X,
} from "lucide-react";

import DashboardStats from "../../../../components/FranchiseLeads/DashboardStats";
import RemarksModal from "../../../../components/FranchiseLeads/RemarksModal";
import FienchiesePlanUpgradeModel from "../../components/FienchiesePlanUpgradeModel";
import FrienchieseServiceBookingModel from "../../components/FrienchieseServiceBookingModel";

const STAGES = ["Active", "Follow Up", "Inactive", "Onboard"];
const STATUSES = ["", "Hot", "Warm", "Cold"];
const SOURCES = [
  "manual-upload",
  "chatbot",
  "website",
  "Meta Lead",
  "expolead",
];

const statusClass = {
  Hot: "bg-red-50 text-red-700 border-red-200",
  Warm: "bg-amber-50 text-amber-700 border-amber-200",
  Cold: "bg-blue-50 text-blue-700 border-blue-200",
};

const stageClass = {
  Active: "bg-blue-50 text-blue-700 border-blue-200",
  "Follow Up": "bg-yellow-50 text-yellow-800 border-yellow-200",
  Inactive: "bg-gray-100 text-gray-700 border-gray-200",
  Onboard: "bg-green-50 text-green-700 border-green-200",
};

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [openModal, setOpenModal] = useState(false);
  const [toast, setToast] = useState("");
  const [remarksUser, setRemarksUser] = useState(null);
  const [remarksHistory, setRemarksHistory] = useState([]);
  const [savingStageId, setSavingStageId] = useState("");
  const [savingTagId, setSavingTagId] = useState("");
  const [savingAssigneeId, setSavingAssigneeId] = useState("");
  const [teamMembers, setTeamMembers] = useState([]);
  const [serviceModalUser, setServiceModalUser] = useState(null);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    leadStatus: "",
    source: "manual-upload",
  });

  const [upgradeModalUser, setUpgradeModalUser] = useState(null);



  useEffect(() => {
    fetchUsers();
    fetchTeamMembers();
  }, []);

  const updateLeadStage = async (user, leadStage) => {
    setSavingStageId(user._id);
    try {
      const res = await fetch("/api/franchise-panel/franchise-user", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ userId: user._id, leadStage }),
      });
      const data = await res.json();

      if (data.success) {
        setUsers((prev) =>
          prev.map((item) => (item._id === data.user._id ? data.user : item)),
        );
        showToast("Lead stage updated");

        // ✅ Onboard select karne par modal open karo
        if (leadStage === "Onboard") {
          setUpgradeModalUser(user);
        }
      } else {
        showToast("Failed to update lead stage");
      }
    } catch (error) {
      console.error("Stage update error:", error);
      showToast("Failed to update lead stage");
    } finally {
      setSavingStageId("");
    }
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem("franchise_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchUsers = async () => {
    setLoading(true);

    try {
      const franchiseCode = localStorage.getItem("franchise_code");
      if (!franchiseCode) {
        setUsers([]);
        return;
      }

      const res = await fetch(
        `/api/franchise-panel/franchise-user?referCode=${encodeURIComponent(
          franchiseCode,
        )}`,
        { headers: getAuthHeaders() },
      );
      const data = await res.json();
      setUsers(data.success ? data.users || [] : []);
    } catch (error) {
      console.error("Fetch error:", error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const res = await fetch("/api/franchise-panel/team?status=active", {
        headers: getAuthHeaders(),
      });
      const data = await res.json();

      setTeamMembers(data.success ? data.data || [] : []);
    } catch (error) {
      console.error("Team fetch error:", error);
      setTeamMembers([]);
    }
  };

  /* ---------------- UPLOAD TO S3 (client helper) ---------------- */
  const uploadToS3 = async (file) => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const result = await uploadToS3Action(formData);

      if (!result.success) {
        throw new Error(result.error || "Failed to upload to S3");
      }

      return result.url;
    } catch (error) {
      console.error("S3 upload error:", error);
      throw error;
    }
  };

  

  useEffect(() => {
    fetchUsers();
    fetchTeamMembers();
  }, []);

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return users;

    return users.filter((user) =>
      [
        user.fullName,
        user.email,
        user.phone,
        user.referCode,
        user.referredByAgentName,
        user.leadStatus,
        user.source,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term)),
    );
  }, [search, users]);

  const handleAddLead = async () => {
    const referCode = localStorage.getItem("franchise_code") || "";
    if (!referCode) {
      showToast("Franchise code missing. Please log in again");
      return;
    }
    if (!formData.fullName.trim() || !formData.email.trim()) {
      showToast("Please enter full name and email");
      return;
    }

    try {
      const res = await fetch("/api/franchise-panel/franchise-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ ...formData, referCode }),
      });
      const data = await res.json();

      if (!data.success) {
        showToast(data.error || "Failed to add lead");
        return;
      }

      showToast("Lead added and assigned successfully");
      setFormData({
        fullName: "",
        email: "",
        phone: "",
        leadStatus: "",
        source: "manual-upload",
      });
      setOpenModal(false);
      fetchUsers();
    } catch (error) {
      console.error("Add lead error:", error);
      showToast("Failed to add lead");
    }
  };

  const openRemarks = async (user) => {
    setRemarksUser(user);
    const userId = user?._id || user?.userId;
    if (!userId) return;

    const res = await fetch(
      `/api/franchise-panel/franchise-user?userId=${userId}&referCode=${encodeURIComponent(
        localStorage.getItem("franchise_code") || "",
      )}`,
      { headers: getAuthHeaders() },
    );
    const data = await res.json();

    if (data.success) {
      setRemarksUser(data.user);
      setRemarksHistory(data.user?.remarksHistory || []);
    }
  };

  const updateLeadTag = async (user, leadStatus) => {
    setSavingTagId(user._id);
    try {
      const res = await fetch("/api/franchise-panel/franchise-user", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ userId: user._id, leadStatus }),
      });
      const data = await res.json();

      if (data.success) {
        setUsers((prev) =>
          prev.map((item) => (item._id === data.user._id ? data.user : item)),
        );
        showToast("Lead tag updated");
      } else {
        showToast(data.message || "Failed to update lead tag");
      }
    } catch (error) {
      console.error("Tag update error:", error);
      showToast("Failed to update lead tag");
    } finally {
      setSavingTagId("");
    }
  };

  const updateAssignee = async (user, assignedAgentId) => {
    setSavingAssigneeId(user._id);
    try {
      const res = await fetch("/api/franchise-panel/franchise-user", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ userId: user._id, assignedAgentId }),
      });
      const data = await res.json();

      if (data.success) {
        setUsers((prev) =>
          prev.map((item) => (item._id === data.user._id ? data.user : item)),
        );
        showToast(assignedAgentId ? "Lead assigned" : "Lead unassigned");
      } else {
        showToast(data.message || "Failed to update assignee");
      }
    } catch (error) {
      console.error("Assignee update error:", error);
      showToast("Failed to update assignee");
    } finally {
      setSavingAssigneeId("");
    }
  };

  const getAssignedId = (user) => {
    const assigned = user.referredByAgentId || user.assignedAgentId || "";
    if (!assigned) return "";
    if (typeof assigned === "object") return assigned._id || "";
    return String(assigned);
  };

  const getLeadDisplayCode = (user) => {
    return user.referCode || "-";
  };

  return (
    <>
      <div className="p-6">
        {toast && (
          <div className="fixed top-5 right-5 z-50 flex items-center gap-2 rounded-xl bg-green-500 px-6 py-3 text-white shadow-lg">
            <CheckCircle size={18} />
            {toast}
          </div>
        )}

        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-950">User Management</h1>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search
                className="absolute left-3 top-2.5 text-gray-500"
                size={18}
              />
              <input
                type="text"
                placeholder="Search by name, email or refer code"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-80 rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm text-gray-900 shadow-sm outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>

            <button
              type="button"
              onClick={() => setOpenModal(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-gray-950 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-gray-800"
            >
              <span className="text-lg leading-none">+</span>
              Add Lead
            </button>
          </div>
        </div>

        <DashboardStats users={filteredUsers} />

        <RemarksModal
          user={remarksUser}
          onClose={() => setRemarksUser(null)}
          remarksHistory={remarksHistory}
          setRemarksHistory={setRemarksHistory}
          fetchUsers={fetchUsers}
          setUsers={setUsers}
          setRemarksUser={setRemarksUser}
          showToast={showToast}
        />

        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full min-w-[1450px] text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-700">
              <tr>
                <th className="px-5 py-4 text-left">Joined</th>
                <th className="px-5 py-4 text-left">Lead</th>
                <th className="px-5 py-4 text-left">Contact</th>
                <th className="px-5 py-4 text-left">Tag</th>
                <th className="px-5 py-4 text-left">Source</th>
                <th className="px-5 py-4 text-left">Assigned To</th>
                <th className="px-5 py-4 text-left">Remarks</th>
                <th className="px-5 py-4 text-left">Stage</th>
                <th className="px-5 py-4 text-left">Service</th>
                {/* <th className="px-5 py-4 text-left">Chat</th> */}
                <th className="px-5 py-4 text-left">Wallet</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan="12"
                    className="px-5 py-10 text-center text-gray-500"
                  >
                    Loading...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan="12"
                    className="px-5 py-10 text-center text-gray-500"
                  >
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr
                    key={user._id}
                    className="border-t border-gray-200 hover:bg-gray-50"
                  >
                    <td className="px-5 py-4 text-gray-700">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-semibold text-gray-950">
                        {user.fullName}
                      </div>
                      <div className="mt-1 w-fit rounded bg-gray-100 px-2 py-1 font-mono text-xs text-gray-800">
                        {getLeadDisplayCode(user)}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 text-gray-800">
                        <Mail size={14} className="text-gray-500" />
                        {user.email || "-"}
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-gray-800">
                        <Phone size={14} className="text-gray-500" />
                        {user.phone || "-"}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <select
                        value={user.leadStatus || ""}
                        disabled={savingTagId === user._id}
                        onChange={(e) => updateLeadTag(user, e.target.value)}
                        className={`rounded-lg border px-3 py-2 text-xs font-semibold outline-none ${
                          statusClass[user.leadStatus] ||
                          "border-gray-200 bg-gray-50 text-gray-700"
                        }`}
                      >
                        {STATUSES.map((status) => (
                          <option key={status || "empty"} value={status}>
                            {status || "Untagged"}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium capitalize text-gray-800">
                        {user.source || "manual-upload"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="relative">
                        <UserRound
                          size={14}
                          className="pointer-events-none absolute left-3 top-2.5 text-violet-700"
                        />
                        <select
                          value={getAssignedId(user)}
                          disabled={savingAssigneeId === user._id}
                          onChange={(e) => updateAssignee(user, e.target.value)}
                          className="w-48 rounded-full border border-violet-100 bg-violet-50 py-2 pl-9 pr-3 text-xs font-semibold text-violet-700 outline-none"
                        >
                          <option value="">Unassigned</option>
                          {teamMembers.map((member) => (
                            <option key={member._id} value={member._id}>
                              {member.fullName}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={() => openRemarks(user)}
                        className="inline-flex min-w-24 items-center justify-center gap-2 rounded-full bg-gray-200 px-4 py-2 text-gray-950 hover:bg-gray-300"
                      >
                        <MessageCircle size={15} />
                        {user?.remarksHistory?.length || 0}
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <select
                        value={user.leadStage || "Active"}
                        disabled={savingStageId === user._id}
                        onChange={(e) => updateLeadStage(user, e.target.value)}
                        className={`rounded-lg border px-3 py-2 text-sm font-semibold outline-none ${
                          stageClass[user.leadStage || "Active"]
                        }`}
                      >
                        {STAGES.map((stage) => (
                          <option key={stage} value={stage}>
                            {stage}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={() => setServiceModalUser(user)}
                        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
                      >
                        Add Service
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 font-bold text-emerald-700">
                        <Wallet size={15} />
                        {user.wallet || 0}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {openModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-2xl rounded-2xl bg-white p-8 shadow-2xl">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-950">
                  Add New Lead
                </h2>
                <button
                  type="button"
                  onClick={() => setOpenModal(false)}
                  className="rounded-full p-2 hover:bg-gray-100"
                >
                  <X size={20} className="text-gray-700" />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormInput
                  label="Full Name"
                  value={formData.fullName}
                  onChange={(value) =>
                    setFormData({ ...formData, fullName: value })
                  }
                  placeholder="Enter full name"
                />
                <FormInput
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(value) =>
                    setFormData({ ...formData, email: value })
                  }
                  placeholder="user@example.com"
                />
                <FormInput
                  label="Phone"
                  value={formData.phone}
                  onChange={(value) =>
                    setFormData({ ...formData, phone: value })
                  }
                  placeholder="+91 9876543210"
                />
                <FormSelect
                  label="Lead Tag"
                  value={formData.leadStatus}
                  onChange={(value) =>
                    setFormData({ ...formData, leadStatus: value })
                  }
                  options={STATUSES}
                  emptyLabel="Untagged"
                />
                <FormSelect
                  label="Source"
                  value={formData.source}
                  onChange={(value) =>
                    setFormData({ ...formData, source: value })
                  }
                  options={SOURCES}
                />
              </div>

              <div className="mt-5 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                <Crown size={16} />
                Saving this lead will assign it automatically to the next active
                team member by round robin.
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setOpenModal(false)}
                  className="flex-1 rounded-xl bg-gray-100 px-6 py-3 font-medium text-gray-700 hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddLead}
                  className="flex-1 rounded-xl bg-gray-950 px-6 py-3 font-medium text-white hover:bg-gray-800"
                >
                  Save Lead
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      {upgradeModalUser && (
        <FienchiesePlanUpgradeModel
          selectedUser={upgradeModalUser}
          onClose={() => setUpgradeModalUser(null)}
          fetchUsers={fetchUsers}
        />
      )}

      {serviceModalUser && (
        <FrienchieseServiceBookingModel
          selectedUser={serviceModalUser}
          onClose={() => setServiceModalUser(null)}
          fetchUsers={fetchUsers}
        />
      )}
    </>
  );
}

function FormInput({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-gray-700">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:ring-2 focus:ring-gray-900"
      />
    </label>
  );
}

function FormSelect({ label, value, onChange, options, emptyLabel }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-gray-700">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none focus:ring-2 focus:ring-gray-900"
      >
        {options.map((option) => (
          <option key={option || "empty"} value={option}>
            {option || emptyLabel}
          </option>
        ))}
      </select>
    </label>
  );
}
