"use client";

import { useState, useEffect } from "react";

import { useRouter } from "next/navigation";

import { uploadToS3Action } from "../../../../app/actions/uploadS3Actions";

import RevenueHeader from "./components/RevenueHeader";
import RevenueStats from "./components/RevenueStats";
import RevenueFilters from "./components/RevenueFilters";
import RevenueTableWrapper from "./components/RevenueTableWrapper";
import RevenueFooter from "./components/RevenueFooter";
import DeleteModal from "./components/DeleteModal";
import ImagePreviewModal from "./components/ImagePreviewModal";
import EditPackageModal from "./components/EditPackageModal";
import EditServiceModal from "./components/EditServiceModal";

import RenewPlanModal from "./components/RenewPlanModal";
import RenewServiceModal from "./components/RenewServiceModal";

export default function RevenueUsersPage() {
  // "package" | "service"

  const router = useRouter();
  const [loadingRevenueUsers, setLoadingRevenueUsers] = useState(false);
  const [fullViewImage, setFullViewImage] = useState(null);
  const [approvalBusyId, setApprovalBusyId] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [expiryFilter, setExpiryFilter] = useState("");

  const [invoiceUrls, setInvoiceUrls] = useState({});
  const [sendingEmailId, setSendingEmailId] = useState(null);

  // card filter
  const [cardFilter, setCardFilter] = useState("");

  //service

  const [showServiceModal, setShowServiceModal] = useState(false);

  const [activeView, setActiveView] = useState("package");
  const [revenueUsersList, setRevenueUsersList] = useState([]);
  const [users, setUsers] = useState([]);

  const [updating, setUpdating] = useState(false);
  const [updatingService, setUpdatingService] = useState(false);

  // packge delete edit modal
  const [deleteModal, setDeleteModal] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [editModal, setEditModal] = useState(false);
  const [editData, setEditData] = useState(null);

  const [editPlan, setEditPlan] = useState("");
  const [editRemarks, setEditRemarks] = useState("");
  const [editProofImage, setEditProofImage] = useState(null);
  const [editStartDate, setEditStartDate] = useState("");
  const [editExpiryDate, setEditExpiryDate] = useState("");

  // service delete edit modal
  const [editServiceModal, setEditServiceModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [deleteType, setDeleteType] = useState("");

  const [editAmount, setEditAmount] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editServiceStartDate, setEditServiceStartDate] = useState("");
  const [editServiceExpiryDate, setEditServiceExpiryDate] = useState("");
  const [editServiceProofImage, setEditServiceProofImage] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);

  const rowsPerPage = 20;

  const displayData = activeView === "package" ? revenueUsersList : users;

  // service
  const serviceUsersCount = users?.filter((u) => u.paidService).length || 0;
  const serviceUsers = users.filter((u) => u.paidService || u.isServiceBooked);

  // check box select
  // ===============================
  // Separate Selection for Package and Service
  // ===============================
  const [selectedPackageRows, setSelectedPackageRows] = useState([]);
  const [selectedServiceRows, setSelectedServiceRows] = useState([]);

  // revenue plan package
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [renewUser, setRenewUser] = useState(null);

  const [renewPlan, setRenewPlan] = useState("");
  const [renewAmount, setRenewAmount] = useState("");
  const [renewStartDate, setRenewStartDate] = useState("");
  const [renewExpiryDate, setRenewExpiryDate] = useState("");
  const [renewScreenshot, setRenewScreenshot] = useState(null);
  const [renewRemarks, setRenewRemarks] = useState("");

  const [savingPlan, setSavingPlan] = useState(false);

  //  REVENUE PLAN SERVICE ==============
  const [showRenewServiceModal, setShowRenewServiceModal] = useState(false);
  const [renewServiceUser, setRenewServiceUser] = useState(null);

  const [renewServicePlan, setRenewServicePlan] = useState("");
  const [renewServiceAmount, setRenewServiceAmount] = useState("");
  const [renewServiceStartDate, setRenewServiceStartDate] = useState("");
  const [renewServiceExpiryDate, setRenewServiceExpiryDate] = useState("");
  const [renewServiceScreenshot, setRenewServiceScreenshot] = useState(null);
  const [renewServiceRemarks, setRenewServiceRemarks] = useState("");

  const [savingService, setSavingService] = useState(false);
  const [expandedNotes, setExpandedNotes] = useState({});

  // Current active selection
  const selectedRows =
    activeView === "package" ? selectedPackageRows : selectedServiceRows;

  // Current active setter
  const setSelectedRows =
    activeView === "package" ? setSelectedPackageRows : setSelectedServiceRows;

  // Clear selection when switching tabs
  useEffect(() => {
    if (activeView === "package") {
      setSelectedServiceRows([]);
    } else {
      setSelectedPackageRows([]);
    }
  }, [activeView]);

  const handleSelectAll = (checked) => {
    if (checked) {
      const allIds =
        activeView === "package"
          ? filteredData.map((r) => r._id)
          : users.map((u) => u._id);

      setSelectedRows(allIds);
    } else {
      setSelectedRows([]);
    }
  };

  const handleSelectRow = (id) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  // REVNUE PLAN PACKAGE
  const openRenewModal = (user) => {
    setRenewUser(user);

    setRenewPlan(user.plan || "");
    setRenewAmount(user.amount || "");

    setRenewStartDate("");
    setRenewExpiryDate("");
    setRenewScreenshot(null);

    setShowRenewModal(true);
  };

  const handleRenewPlan = async () => {
    if (!renewPlan) return alert("Enter plan");
    if (!renewAmount) return alert("Enter amount");
    if (!renewStartDate) return alert("Select start date");
    if (!renewExpiryDate) return alert("Select expiry date");

    try {
      setSavingPlan(true);

      let screenshotUrl = "";

      if (renewScreenshot) {
        const uploadFormData = new FormData();

        uploadFormData.append("file", renewScreenshot);

        const uploadResult = await uploadToS3Action(uploadFormData);

        console.log("UPLOAD RESULT =>", uploadResult);

        if (uploadResult?.success) {
          screenshotUrl = uploadResult.url;
        }
      }

      // Agar screenshot upload API baad me lagani ho to yahan handle karenge

      const res = await fetch("/api/franchise-revenue", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          // Old user info
          leadId: renewUser?.leadId,
          leadName: renewUser?.leadName,

          email: renewUser?.email || "",
          phone: renewUser?.phone || "",

          franchiseId: renewUser?.franchiseId || null,
          franchiseName: renewUser?.franchiseName || null,

          onboardedBy: renewUser?.onboardedBy || null,
          onboardedByName: renewUser?.onboardedByName || "",
          onboardedByRole: renewUser?.onboardedByRole || "",

          // New Plan
          plan: renewPlan,
          amount: Number(renewAmount),

          packageStartDate: renewStartDate,
          packageExpiryDate: renewExpiryDate,

          paymentScreenshot: screenshotUrl,
          screenshot: screenshotUrl,
          planRemarks: renewRemarks,

          notes: `Plan renewed from ${renewUser?.plan || "Old Plan"} to ${renewPlan}`,

          // Important
          type: "plan",
          status: "active",
          bookingSource: "manual-upload",
        }),
      });

      const data = await res.json();

      // ==============================
      // Send WhatsApp Template
      // ==============================
      try {
        const whatsappRes = await fetch("/api/admin/package-booking-template", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            phone: renewUser?.phone || "",

            firstName: renewUser?.leadName || renewUser?.name || "Customer",

            planName: renewPlan,
            amount: renewAmount || "0",

            startDate: renewStartDate || "-",
            expiryDate: renewExpiryDate || "-",
          }),
        });

        const whatsappData = await whatsappRes.json();

        console.log("Revenue WhatsApp Template Response:", whatsappData);
      } catch (err) {
        console.error("Revenue WhatsApp template failed:", err);
      }

      // console.log("RENEW API RESPONSE =>", data);

      if (data.success) {
        alert("Plan Renew Successfully");

        setShowRenewModal(false);

        setRenewUser(null);
        setRenewPlan("");
        setRenewAmount("");
        setRenewStartDate("");
        setRenewExpiryDate("");
        setRenewScreenshot(null);

        fetchRevenueUsers();
      } else {
        alert(data.message || "Failed to renew plan");
      }
    } catch (err) {
      console.error("RENEW PLAN ERROR =>", err);
      alert("Something went wrong");
    }
  };

  // REVENUE PLAN SERVICE
  const openRenewServiceModal = (user) => {
    console.log("USER =>", user);

    setRenewServiceUser(user);

    setRenewServicePlan(user.plan || "");
    setRenewServiceAmount(user.amount || "");

    setRenewServiceStartDate("");
    setRenewServiceExpiryDate("");
    setRenewServiceScreenshot(null);
    setRenewServiceRemarks("");

    setShowRenewServiceModal(true);
  };

  const handleRenewService = async () => {
    if (!renewServicePlan) return alert("Enter service");
    if (!renewServiceAmount) return alert("Enter amount");
    if (!renewServiceStartDate) return alert("Select start date");
    if (!renewServiceExpiryDate) return alert("Select expiry date");

    try {
      setSavingService(true);

      let screenshotUrl = "";

      if (renewServiceScreenshot) {
        const uploadFormData = new FormData();

        uploadFormData.append("file", renewServiceScreenshot);

        const uploadResult = await uploadToS3Action(uploadFormData);

        if (uploadResult?.success) {
          screenshotUrl = uploadResult.url;
        }
      }

      const res = await fetch("/api/franchise-revenue", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          leadId: renewServiceUser?.leadId,
          leadName: renewServiceUser?.leadName,

          email: renewServiceUser?.email || renewServiceUser?.userEmail || "",
          phone: renewServiceUser?.phone || renewServiceUser?.mobile || "",

          plan: renewServicePlan,
          amount: Number(renewServiceAmount),

          packageStartDate: renewServiceStartDate,
          packageExpiryDate: renewServiceExpiryDate,

          paymentScreenshot: screenshotUrl,
          screenshot: screenshotUrl,

          notes: `Service renewed from ${renewServiceUser?.plan} to ${renewServicePlan}`,

          planRemarks: renewServiceRemarks,

          type: "service",
          status: "active",
          bookingSource: "manual-upload",
        }),
      });

      const data = await res.json();

      if (data.success) {
        try {
          const whatsappRes = await fetch(
            "/api/admin/service-booking-template",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                userId: data.revenue._id,
                startDate: renewServiceStartDate,
                expiryDate: renewServiceExpiryDate,
              }),
            },
          );

          const whatsappData = await whatsappRes.json();

          console.log("📲 Service Template Response:", whatsappData);
        } catch (err) {
          console.error("Service Template Failed:", err);
        }
        alert("Service Renew Successfully");

        setShowRenewServiceModal(false);

        setRenewServiceUser(null);
        setRenewServicePlan("");
        setRenewServiceAmount("");
        setRenewServiceStartDate("");
        setRenewServiceExpiryDate("");
        setRenewServiceScreenshot(null);
        setRenewServiceRemarks("");

        fetchRevenueUsers();
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.log(err);
      alert("Something went wrong");
    } finally {
      setSavingService(false);
    }
  };

  // refresh
  const [isRefreshing, setIsRefreshing] = useState(false);

  // packageRows filter
  const packageRows = revenueUsersList.filter(
    (item) =>
      (item.type === "user_onboard" || item.type === "plan") && // ✅ "plan" bhi add
      (item.status === "active" || item.status === "user_onboard"), // ✅ dono status
  );

  const serviceRows = revenueUsersList.filter(
    (item) => item.type === "service",
  );

  const today = new Date().toDateString();

  const todayUsers =
    activeView === "package"
      ? packageRows.filter((item) => {
          if (!item.createdAt) return false;

          return new Date(item.createdAt).toDateString() === today;
        })
      : serviceRows.filter((item) => {
          if (!item.createdAt) return false;

          return new Date(item.createdAt).toDateString() === today;
        });

  // ==============================
  // TOTAL USERS
  // ==============================
  // totalUsers count
  const totalUsers =
    activeView === "package"
      ? revenueUsersList.filter((item) => {
          return (
            (item.type === "user_onboard" || item.type === "plan") && // ✅
            (item.status === "active" || item.status === "user_onboard") // ✅
          );
        }).length
      : serviceRows.length;

  // total revenue// ==============================
  // TOTAL REVENUE
  // ==============================
  const totalRevenue =
    activeView === "package"
      ? revenueUsersList
          .filter((item) => {
            // ✅ Sirf package records
            return item.type === "user_onboard" || item.type === "plan";
          })
          .reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
      : serviceRows.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  // 🔥 TODAY REVENUE

  const todayRevenue =
    activeView === "package"
      ? revenueUsersList
          .filter((item) => {
            if (item.type !== "user_onboard" && item.type !== "plan")
              return false;

            if (item.status !== "active") return false;

            if (!item.createdAt) return false;

            return new Date(item.createdAt).toDateString() === today;
          })
          .reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
      : serviceRows
          .filter((item) => {
            if (!item.createdAt) return false;

            return new Date(item.createdAt).toDateString() === today;
          })
          .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  // service package

  const assistanceUsers = users.filter(
    (u) => u.paidService && u.paidService.toLowerCase().includes("assistance"),
  ).length;

  const creationUsers = users.filter(
    (u) => u.paidService && u.paidService.toLowerCase().includes("creation"),
  ).length;

  // service plane
  const planCounts =
    activeView === "package"
      ? {
          basic: revenueUsersList.filter((r) =>
            r.plan?.toLowerCase().includes("basic"),
          ).length,
          professional: revenueUsersList.filter((r) =>
            r.plan?.toLowerCase().includes("professional"),
          ).length,
        }
      : {
          assistance: users.filter((u) =>
            u.paidService?.toLowerCase().includes("assistance"),
          ).length,
          creation: users.filter((u) =>
            u.paidService?.toLowerCase().includes("creation"),
          ).length,
        };

  useEffect(() => {
    const email = localStorage.getItem("email"); // 🔥 IMPORTANT

    fetch(`/api/users?email=${email}`)
      .then((res) => res.json())
      .then((data) => {
        // console.log("USERS DATA 👉", data);
        setUsers(data.users || []);
      });
  }, []);

  const premiumUsers = revenueUsersList.filter((r) =>
    r.plan?.toLowerCase().includes("premium"),
  );

  const role =
    typeof window !== "undefined" ? localStorage.getItem("role") : "";

  const normalizeProofImageUrl = (raw) => {
    if (!raw || typeof raw !== "string") return "";
    const t = raw.trim();
    if (!t) return "";
    if (/^https?:\/\//i.test(t)) return t;
    if (typeof window !== "undefined" && t.startsWith("/")) {
      return `${window.location.origin}${t}`;
    }
    return t;
  };

  const formatDateIST = (dateStr) => {
    if (!dateStr) return "No Date";

    return new Date(dateStr).toLocaleDateString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const fetchRevenueUsers = async () => {
    setLoadingRevenueUsers(true);

    try {
      const email = localStorage.getItem("email");
      const role = localStorage.getItem("role");

      const params = new URLSearchParams({
        email,
        role,
      });

      const res = await fetch(`/api/franchise-revenue?${params}`);
      const data = await res.json();

      // console.log("🔥 FRANCHISE REVENUE API RESPONSE:", data);
      // console.log("📦 REVENUE LIST:", data.revenue);

      if (data.success) {
        setRevenueUsersList(data.revenue || []);
      } else {
        setRevenueUsersList([]);
      }
    } catch (err) {
      console.error(err);
      setRevenueUsersList([]);
    } finally {
      setLoadingRevenueUsers(false);
    }
  };

  useEffect(() => {
    fetchRevenueUsers();
  }, []);

  // pacakge approve and not approve
  const handleOnboardApproval = async (revenue, decision) => {
    const id = revenue?._id;
    if (!id) return;
    setApprovalBusyId(String(id));
    try {
      const res = await fetch("/api/franchise-revenue/onboard-approval", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email:
            typeof window !== "undefined" ? localStorage.getItem("email") : "",
          revenueId: String(id),
          decision,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setRevenueUsersList((list) =>
          (list || []).map((r) =>
            String(r._id) === String(id)
              ? {
                  ...r,
                  planApprovalStatus:
                    decision === "approved" ? "approved" : "rejected",
                }
              : r,
          ),
        );
      } else if (typeof window !== "undefined") {
        window.alert(data.message || "Could not update approval");
      }
    } catch (e) {
      if (typeof window !== "undefined") {
        window.alert(e?.message || "Request failed");
      }
    } finally {
      setApprovalBusyId(null);
    }
  };

  // ====service  approve and not approve ====
  const handleServiceApproval = async (revenue, decision) => {
    const revenueId = revenue?._id;
    if (!revenueId) return;

    setApprovalBusyId(String(revenueId));

    try {
      const res = await fetch("/api/franchise-revenue/onboard-approval", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: localStorage.getItem("email"),
          revenueId: String(revenueId), // ✅ franchise-revenue document ID
          decision,
        }),
      });

      const data = await res.json();

      if (data.success) {
        // Local table update
        setRevenueUsersList((prev) =>
          prev.map((item) =>
            String(item._id) === String(revenueId)
              ? {
                  ...item,
                  planApprovalStatus:
                    decision === "approved" ? "approved" : "rejected",
                }
              : item,
          ),
        );

        // Fresh fetch
        await fetchRevenueUsers();
      } else {
        alert(data.message || "Approval failed");
      }
    } catch (err) {
      console.error("SERVICE APPROVAL ERROR:", err);
      alert("Something went wrong");
    } finally {
      setApprovalBusyId(null);
    }
  };

  const handleDownloadInvoice = async (user) => {
    try {
      const res = await fetch(`/api/admin/invoice-tax?id=${user._id}`);

      if (!res.ok) {
        alert("Invoice generate failed");
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      // ✅ Save URL after successful download
      setInvoiceUrls((prev) => ({
        ...prev,
        [user._id]: url,
      }));

      // ✅ Download PDF
      const a = document.createElement("a");
      a.href = url;
      a.download = `Invoice-${user.leadName || user.name || "user"}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (error) {
      console.error(error);
      alert("Invoice download failed");
    }
  };

  const handleSendInvoiceWhatsApp = async (user) => {
    console.log("Sending invoice for:", user);
    try {
      const res = await fetch("/api/admin/send-invoice-whatsapp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          revenueId: user._id,
        }),
      });

      const data = await res.json();
      console.log("API Response:", data);

      if (data.success) {
        alert("Invoice sent successfully on WhatsApp");
      } else {
        alert(data.message || "Failed to send invoice");
      }
    } catch (error) {
      console.error(error);
      alert("WhatsApp send failed");
    }
  };

  const handleSendInvoiceEmail = async (r) => {
    try {
      setSendingEmailId(r._id);

      const res = await fetch("/api/admin/send-invoice-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          revenueId: r._id,
        }),
      });

      const data = await res.json();

      if (data.success) {
        alert("✅ Invoice sent successfully");
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error(error);
      alert("Failed to send invoice");
    } finally {
      setSendingEmailId(null);
    }
  };
  // filter and search ===============
  const filteredData = (
    activeView === "package" ? revenueUsersList : users
  ).filter((item) => {
    const name =
      item.name || item.fullName || item.userName || item.leadName || "";

    const email = item.email || "";

    // 🔍 SEARCH
    const matchSearch =
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.toLowerCase().includes(searchTerm.toLowerCase());

    // 📦 PLAN / SERVICE
    const plan = item.plan || item.paidService || "";

    const matchPlan = planFilter
      ? plan.toLowerCase().includes(planFilter)
      : true;

    // ✅ STATUS
    const status = item.planApprovalStatus || "pending";

    const matchStatus = statusFilter ? status === statusFilter : true;

    // 🔥 EXPIRY FILTER
    const expiryRaw = item.userPackageExpiryDate || item.packageExpiryDate;

    let matchExpiry = true;

    if (expiryRaw) {
      const expiryDate = new Date(expiryRaw);

      const now = new Date();

      // 🔥 EXPIRED USERS
      if (expiryFilter === "expired") {
        matchExpiry = expiryDate < now;
      }

      // 🔥 TODAY
      else if (expiryFilter === "today") {
        matchExpiry = expiryDate.toDateString() === now.toDateString();
      }

      // 🔥 NEXT 7 DAYS
      else if (expiryFilter === "7days") {
        const next7Days = new Date();

        next7Days.setDate(now.getDate() + 7);

        matchExpiry = expiryDate >= now && expiryDate <= next7Days;
      }

      // 🔥 NEXT 15 DAYS
      else if (expiryFilter === "15days") {
        const next15Days = new Date();

        next15Days.setDate(now.getDate() + 15);

        matchExpiry = expiryDate >= now && expiryDate <= next15Days;
      }

      // 🔥 CURRENT MONTH EXPIRING
      else if (expiryFilter === "this_month") {
        matchExpiry =
          expiryDate.getMonth() === now.getMonth() &&
          expiryDate.getFullYear() === now.getFullYear();
      }
    }

    return matchSearch && matchPlan && matchStatus && matchExpiry;
  });

  const finalFilteredData = filteredData.filter((item) => {
    if (!cardFilter) return true;

    const plan = item.plan?.toLowerCase() || "";

    switch (cardFilter) {
      case "basic":
        return plan.includes("basic");

      case "professional":
        return plan.includes("professional");

      case "premium":
        return plan.includes("premium");

      case "today_users":
        return (
          item.createdAt &&
          new Date(item.createdAt).toDateString() === new Date().toDateString()
        );

      case "today_revenue":
        return (
          item.createdAt &&
          new Date(item.createdAt).toDateString() ===
            new Date().toDateString() &&
          Number(item.amount || 0) > 0
        );

      case "today":
        return (
          new Date(
            item.userPackageExpiryDate || item.packageExpiryDate,
          ).toDateString() === new Date().toDateString()
        );

      case "7days": {
        const expiry = new Date(
          item.userPackageExpiryDate || item.packageExpiryDate,
        );

        const today = new Date();
        const next7 = new Date();

        next7.setDate(today.getDate() + 7);

        return expiry >= today && expiry <= next7;
      }

      case "this_month": {
        const expiry = new Date(
          item.userPackageExpiryDate || item.packageExpiryDate,
        );

        const today = new Date();

        return (
          expiry.getMonth() === today.getMonth() &&
          expiry.getFullYear() === today.getFullYear()
        );
      }

      case "expired":
        return (
          new Date(item.userPackageExpiryDate || item.packageExpiryDate) <
          new Date()
        );

      default:
        return true;
    }
  });

  // reshresh
  const handleRefresh = async () => {
    setIsRefreshing(true);

    try {
      await fetchRevenueUsers();
    } catch (err) {
      console.log(err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // package handle edit

  const handleEdit = (item) => {
    setEditData(item);

    setEditPlan(item.plan || "");
    setEditAmount(item.amount || "");
    setEditRemarks(item.planRemarks || "");

    setEditStartDate(
      item.packageStartDate
        ? new Date(item.packageStartDate).toISOString().split("T")[0]
        : "",
    );

    setEditExpiryDate(
      item.packageExpiryDate
        ? new Date(item.packageExpiryDate).toISOString().split("T")[0]
        : "",
    );

    setEditProofImage(item.paymentScreenshot || "");

    setEditModal(true);
  };

  // package handle delte
  const handleUpdatePackage = async () => {
    try {
      setUpdating(true);

      const formData = new FormData();

      formData.append("id", editData._id);
      formData.append("plan", editPlan);
      formData.append("amount", editAmount);
      formData.append("planRemarks", editRemarks);

      formData.append("packageStartDate", editStartDate);
      formData.append("packageExpiryDate", editExpiryDate);

      if (editProofImage instanceof File) {
        formData.append("paymentScreenshot", editProofImage);
      }

      const res = await fetch("/api/franchise-revenue", {
        method: "PUT",
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        setEditModal(false);
        fetchRevenueUsers();
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    } finally {
      setUpdating(false);
    }
  };

  //  delte user tabe

  const confirmDelete = async () => {
    try {
      let url = "";

      if (deleteType === "service") {
        url = `/api/franchise-revenue?id=${selectedId}&type=service`;
      } else {
        url = `/api/franchise-revenue?id=${selectedId}`;
      }

      const res = await fetch(url, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        alert(data.message || "Delete failed");
        return;
      }

      // ✅ Row remove from table immediately
      setRevenueUsersList((prev) =>
        prev.filter((item) => String(item._id) !== String(selectedId)),
      );

      // Close modal
      setDeleteModal(false);
      setSelectedId(null);
      setDeleteType("");

      alert(
        deleteType === "service"
          ? "Service deleted successfully"
          : "Package deleted successfully",
      );

      // ✅ ONLY package delete ke liye fresh fetch karo
      if (deleteType !== "service") {
        await fetchRevenueUsers();
      }
    } catch (err) {
      console.error("DELETE ERROR:", err);
      alert("Something went wrong");
    }
  };

  const updateService = async () => {
    try {
      setUpdatingService(true);

      const formData = new FormData();

      formData.append("id", selectedService?._id);
      formData.append("type", "service");

      formData.append("amount", editAmount);
      formData.append("notes", editNotes);

      formData.append("packageStartDate", editServiceStartDate);
      formData.append("packageExpiryDate", editServiceExpiryDate);

      if (editServiceProofImage instanceof File) {
        formData.append("paymentScreenshot", editServiceProofImage);
      }

      const res = await fetch("/api/franchise-revenue", {
        method: "PUT",
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        setEditServiceModal(false);
        fetchRevenueUsers();
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingService(false);
    }
  };
  // paginatedPackageRows filter
  const paginatedPackageRows = finalFilteredData.filter(
    (r) => r.type === "user_onboard" || r.type === "plan",
  );

  const currentPackageRows = paginatedPackageRows.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage,
  );

  const totalPages = Math.ceil(paginatedPackageRows.length / rowsPerPage);

  return (
    <>
      <div>
        <RevenueHeader
          handleRefresh={handleRefresh}
          isRefreshing={isRefreshing}
          activeView={activeView}
          setActiveView={setActiveView}
        />

        {/* ===== STATS ===== */}

        <RevenueStats
          activeView={activeView}
          totalUsers={totalUsers}
          todayUsers={todayUsers}
          totalRevenue={totalRevenue}
          todayRevenue={todayRevenue}
          revenueUsersList={revenueUsersList}
          users={users}
          cardFilter={cardFilter}
          setCardFilter={setCardFilter}
        />

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* SERACH TOOL BAAR  */}

          <RevenueFilters
            activeView={activeView}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            expiryFilter={expiryFilter}
            setExpiryFilter={setExpiryFilter}
            planFilter={planFilter}
            setPlanFilter={setPlanFilter}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
          />

          <RevenueTableWrapper
            loadingRevenueUsers={loadingRevenueUsers}
            revenueUsersList={revenueUsersList}
            selectedRows={selectedRows}
          >
            <>
              {/* Table */}
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm ">
                <div className="max-h-[70vh] overflow-y-auto overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        {activeView === "package" && (
                          <>
                            <th className="px-4 py-3">
                              <input
                                type="checkbox"
                                checked={
                                  activeView === "package"
                                    ? filteredData.length > 0 &&
                                      selectedRows.length ===
                                        filteredData.length
                                    : users.length > 0 &&
                                      selectedRows.length === users.length
                                }
                                onChange={(e) =>
                                  handleSelectAll(e.target.checked)
                                }
                                className="w-4 h-4 accent-indigo-600"
                              />
                            </th>

                            <th className="px-6 py-3 text-left text-xs font-semibold">
                              User
                            </th>

                            <th className="px-6 py-3 text-left text-xs font-semibold">
                              Plan
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold">
                              Amount
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold">
                              Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold">
                              Expiry DAte
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold">
                              Invoice
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold">
                              Screenshot
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold">
                              Notes
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold">
                              Remarks
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold">
                              Plan Approval
                            </th>
                          </>
                        )}

                        {activeView === "service" && (
                          <>
                            <th className="px-6 py-3 text-left text-xs font-semibold">
                              User
                            </th>

                            <th className="px-6 py-3 text-left text-xs font-semibold">
                              service
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold">
                              plane
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold">
                              Amount
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold">
                              start Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold">
                              expiry Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold">
                              Invoice
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold">
                              screenshot
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold">
                              notes
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold">
                              Plan Approval
                            </th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {/* 📦 PACKAGE VIEW (OLD DESIGN BACK) */}
                      {activeView === "package" &&
                        currentPackageRows.map((r) => {
                          return (
                            <tr
                              key={r._id}
                              className="border-t hover:bg-gray-50 transition"
                            >
                              <td className="px-4 py-4">
                                <input
                                  type="checkbox"
                                  checked={selectedRows.includes(r.leadId)}
                                  onChange={() => handleSelectRow(r.leadId)}
                                  className="w-4 h-4 accent-indigo-600"
                                />
                              </td>

                              <td className="px-6 py-4">
                                <div className="font-semibold text-gray-900">
                                  {r.leadName}
                                </div>
                                <div className="text-xs text-gray-500">
                                  ID: {r.leadId}
                                </div>

                                {/* ✅ franchiseId hai toh hi dikhao */}
                                {r.franchiseId && (
                                  <div className="text-xs font-medium text-indigo-600">
                                    Franchise: {r.franchiseId}
                                  </div>
                                )}
                                {r.franchiseName && (
                                  <div className="text-xs text-purple-600">
                                    {r.franchiseName}
                                  </div>
                                )}

                                <div className="text-xs text-gray-500">
                                  UTR: {r.utrNumber || "N/A"}
                                </div>
                              </td>

                              <td className="px-6 py-4">
                                <div className="flex flex-col gap-1">
                                  <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full text-xs w-fit">
                                    {r.plan}
                                  </span>
                                  {/* // revnue plan  */}
                                  {r.packageExpiryDate &&
                                    new Date(r.packageExpiryDate) <
                                      new Date() && (
                                      <>
                                        <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-semibold w-fit">
                                          Expired
                                        </span>

                                        <button
                                          onClick={() => openRenewModal(r)}
                                          className="bg-indigo-600 text-white px-1 py-1 rounded text-xs mt-2"
                                        >
                                          Revenue Plan
                                        </button>
                                      </>
                                    )}
                                </div>
                              </td>

                              <td className="px-6 py-4 font-semibold text-green-600">
                                ₹{r.amount}
                              </td>

                              <td className="px-6 py-4 text-sm text-gray-600">
                                {r.userPackageStartDate ? (
                                  new Date(
                                    r.packageStartDate,
                                  ).toLocaleDateString("en-IN")
                                ) : (
                                  <span className="text-red-500">No Date</span>
                                )}
                              </td>

                              <td className="px-6 py-4 text-sm text-gray-600">
                                {formatDateIST(r.packageExpiryDate)}
                              </td>

                              <td className="px-6 py-4">
                                <div className="flex gap-2">
                                  {/* PDF Download */}
                                  <button
                                    onClick={() => handleDownloadInvoice(r)}
                                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs"
                                  >
                                    PDF Download
                                  </button>

                                  {/* View PDF */}
                                  {invoiceUrls[r._id] && (
                                    <button
                                      onClick={() =>
                                        window.open(
                                          invoiceUrls[r._id],
                                          "_blank",
                                        )
                                      }
                                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs"
                                    >
                                      View PDF
                                    </button>
                                  )}

                                  {/* Send Email */}
                                  {invoiceUrls[r._id] && (
                                    <button
                                      onClick={() => handleSendInvoiceEmail(r)}
                                      disabled={sendingEmailId === r._id}
                                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded text-xs disabled:opacity-50"
                                    >
                                      {sendingEmailId === r._id
                                        ? "Sending..."
                                        : "Send Email"}
                                    </button>
                                  )}

                                  {/* Send WhatsApp - ONLY after download */}

                                  <button
                                    onClick={() => handleSendInvoiceWhatsApp(r)}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded text-xs"
                                  >
                                    Send Invoice
                                  </button>
                                </div>
                              </td>

                              {/* 🔥 EXPIRY */}

                              <td className="px-6 py-4">
                                <button
                                  onClick={() => {
                                    console.log(
                                      "SCREENSHOT =>",
                                      r.paymentScreenshot,
                                    );

                                    if (r.paymentScreenshot) {
                                      setFullViewImage(r.paymentScreenshot);
                                    } else {
                                      alert("No screenshot found");
                                    }
                                  }}
                                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition whitespace-nowrap"
                                >
                                  View Proof
                                </button>
                              </td>

                              <td className="px-6 py-4 text-sm">
                                {r.notes || "-"}
                              </td>

                              <td className="px-6 py-4 text-sm">
                                {r.planRemarks || r.remarks || "-"}
                              </td>

                              {role === "superAdmin" && (
                                <td className="px-6 py-4 align-top text-sm">
                                  {r?.type === "user_onboard" ||
                                  r?.type === "plan" ? (
                                    (() => {
                                      const st = r.planApprovalStatus;

                                      if (st === "approved") {
                                        return (
                                          <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                                            Approved
                                          </span>
                                        );
                                      }

                                      if (st === "rejected") {
                                        return (
                                          <span className="inline-flex rounded-full bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700">
                                            Not approved
                                          </span>
                                        );
                                      }

                                      const busy =
                                        approvalBusyId === String(r._id);

                                      return (
                                        <div className="flex flex-col gap-2">
                                          <button
                                            disabled={busy}
                                            onClick={() =>
                                              handleOnboardApproval(
                                                r,
                                                "approved",
                                              )
                                            }
                                            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs text-white"
                                          >
                                            {busy ? "…" : "Approved"}
                                          </button>

                                          <button
                                            disabled={busy}
                                            onClick={() =>
                                              handleOnboardApproval(
                                                r,
                                                "rejected",
                                              )
                                            }
                                            className="rounded-lg border px-3 py-1 text-xs h-[28px] whitespace-nowrap flex items-center justify-center"
                                          >
                                            Not approved
                                          </button>
                                        </div>
                                      );
                                    })()
                                  ) : (
                                    <span className="text-gray-400">—</span>
                                  )}
                                </td>
                              )}

                              <td className="px-6 py-4 align-middle">
                                <div className="flex justify-center items-center gap-2">
                                  <button
                                    onClick={() => handleEdit(r)}
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs"
                                  >
                                    Edit
                                  </button>

                                  <button
                                    onClick={() => {
                                      setSelectedId(r._id);
                                      setDeleteType("package");
                                      setDeleteModal(true);
                                    }}
                                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}

                      {/* =================🛠 SERVICE VIEW ================================*/}

                      {activeView === "service" &&
                        serviceRows.map((u, i) => {
                          // console.log("FULL SERVICE ROW", u);

                          return (
                            <tr
                              key={i}
                              className="border-t hover:bg-gray-50 transition"
                            >
                              <td className="px-6 py-4">
                                <div className="font-semibold text-gray-900">
                                  {u.name ||
                                    u.fullName ||
                                    u.leadName ||
                                    "No Name"}
                                </div>

                                <div className="text-xs text-gray-500">
                                  {u.email}
                                </div>

                                {/* Franchise Info */}
                                {u.franchiseId && (
                                  <div className="text-xs font-medium text-indigo-600">
                                    Franchise: {u.franchiseId}
                                  </div>
                                )}

                                {u.franchiseName && (
                                  <div className="text-xs text-purple-600">
                                    {u.franchiseName}
                                  </div>
                                )}
                              </td>

                              <td className="px-6 py-4">
                                <div className="flex flex-col gap-2">
                                  {/* Service Name */}
                                  <div
                                    className="bg-purple-100 text-purple-700 px-3 py-2 rounded-xl text-xs font-medium
                                     max-w-[180px] truncate cursor-pointer"
                                    title={u.paidService || u.plan}
                                  >
                                    {u.paidService || u.plan || "No Service"}
                                  </div>

                                  {/* Expired */}
                                  {u.packageExpiryDate &&
                                    new Date(u.packageExpiryDate) <
                                      new Date() && (
                                      <>
                                        <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-semibold w-fit">
                                          Expired
                                        </span>

                                        <button
                                          onClick={() =>
                                            openRenewServiceModal(u)
                                          }
                                          className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded-lg text-xs w-fit"
                                        >
                                          Revenue Service
                                        </button>
                                      </>
                                    )}
                                </div>
                              </td>

                              <td className="px-6 py-4">
                                {u.planDuration || "monthly"}
                              </td>

                              <td className="px-6 py-4">{u.amount}</td>

                              {/* START DATE */}
                              {/* START DATE */}
                              <td className="px-6 py-4">
                                {(() => {
                                  // 🔥 Actual field found from console:
                                  // userPackageStartDate = "2026-05-07T00:00:00.000Z"

                                  const rawDate =
                                    u.packageStartDate ||
                                    u.startDate ||
                                    u.date ||
                                    u.createdAt;

                                  if (!rawDate) return "No Date";

                                  // ✅ Convert to Date object
                                  const d = new Date(rawDate);

                                  if (isNaN(d.getTime())) return "No Date";

                                  // ✅ Use local date parts (NOT split("-"))
                                  // This avoids NaN/5/2026 issue
                                  const day = d.getDate();
                                  const month = d.getMonth() + 1;
                                  const year = d.getFullYear();

                                  return `${day}/${month}/${year}`;
                                })()}
                              </td>

                              <td className="px-6 py-4">
                                {u.packageExpiryDate
                                  ? new Date(
                                      u.packageExpiryDate,
                                    ).toLocaleDateString("en-IN")
                                  : "No Date"}
                              </td>

                              <td className="px-6 py-4">
                                <div className="flex gap-2">
                                  {/* PDF Download */}
                                  <button
                                    onClick={() => handleDownloadInvoice(u)}
                                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs"
                                  >
                                    PDF Download
                                  </button>

                                  {/* View PDF */}
                                  {invoiceUrls[u._id] && (
                                    <button
                                      onClick={() =>
                                        window.open(
                                          invoiceUrls[u._id],
                                          "_blank",
                                        )
                                      }
                                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs"
                                    >
                                      View PDF
                                    </button>
                                  )}

                                  {invoiceUrls[u._id] && (
                                    <button
                                      onClick={() => handleSendInvoiceEmail(u)}
                                      disabled={sendingEmailId === u._id}
                                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded text-xs disabled:opacity-50"
                                    >
                                      {sendingEmailId === u._id
                                        ? "Sending..."
                                        : "Send Email"}
                                    </button>
                                  )}

                                  <button
                                    onClick={() => handleSendInvoiceWhatsApp(u)}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded text-xs"
                                  >
                                    Send Invoice
                                  </button>
                                </div>
                              </td>

                              {/* service  */}

                              <td className="px-6 py-4">
                                <button
                                  onClick={() =>
                                    setFullViewImage(u.paymentScreenshot)
                                  }
                                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold
                                 bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition whitespace-nowrap"
                                >
                                  View Proof
                                </button>
                              </td>

                              <td className="px-4 py-3">
                                {(() => {
                                  const words = (u.notes || "").split(" ");
                                  const isExpanded = expandedNotes[u._id];

                                  return (
                                    <div className="max-w-[180px] text-sm text-gray-700">
                                      {isExpanded ? (
                                        <>
                                          {u.notes}
                                          <button
                                            onClick={() =>
                                              setExpandedNotes((prev) => ({
                                                ...prev,
                                                [u._id]: false,
                                              }))
                                            }
                                            className="text-blue-600 ml-1 font-semibold"
                                          >
                                            Less
                                          </button>
                                        </>
                                      ) : (
                                        <>
                                          {words.slice(0, 2).join(" ")}
                                          {words.length > 2 && (
                                            <button
                                              onClick={() =>
                                                setExpandedNotes((prev) => ({
                                                  ...prev,
                                                  [u._id]: true,
                                                }))
                                              }
                                              className="text-blue-600 ml-1 font-semibold"
                                            >
                                              ...More
                                            </button>
                                          )}
                                        </>
                                      )}
                                    </div>
                                  );
                                })()}
                              </td>

                              <td className="px-6 py-4 align-top text-sm">
                                {(() => {
                                  const st = u.planApprovalStatus || "pending";

                                  if (st === "approved") {
                                    return (
                                      <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                                        Approved
                                      </span>
                                    );
                                  }

                                  if (st === "rejected") {
                                    return (
                                      <span className="inline-flex rounded-full bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700">
                                        Not approved
                                      </span>
                                    );
                                  }

                                  const busy = approvalBusyId === String(u._id);

                                  return (
                                    <div className="flex flex-wrap gap-2">
                                      <button
                                        disabled={busy}
                                        onClick={() =>
                                          handleServiceApproval(u, "approved")
                                        }
                                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white"
                                      >
                                        {busy ? "…" : "Approved"}
                                      </button>

                                      <button
                                        disabled={busy}
                                        onClick={() =>
                                          handleServiceApproval(u, "rejected")
                                        }
                                        className="rounded-lg border px-3 py-1.5 text-xs"
                                      >
                                        Not approved
                                      </button>
                                    </div>
                                  );
                                })()}
                              </td>

                              <td className="px-6 py-4 align-middle">
                                <div className="flex justify-center items-center gap-2">
                                  <button
                                    onClick={() => {
                                      setSelectedService(u);
                                      setEditAmount(u.amount || "");
                                      setEditNotes(
                                        u.notes ?? u.remarks ?? u.Remarks ?? "",
                                      );
                                      setEditServiceStartDate(
                                        u.packageStartDate
                                          ? new Date(u.packageStartDate)
                                              .toISOString()
                                              .split("T")[0]
                                          : "",
                                      );

                                      setEditServiceExpiryDate(
                                        u.packageExpiryDate
                                          ? new Date(u.packageExpiryDate)
                                              .toISOString()
                                              .split("T")[0]
                                          : "",
                                      );

                                      setEditServiceProofImage(
                                        u.paymentScreenshot || "",
                                      );
                                      setEditServiceModal(true);
                                    }}
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs"
                                  >
                                    Edit
                                  </button>

                                  <button
                                    onClick={() => {
                                      setSelectedId(u._id); // 👈 temporarily
                                      setDeleteModal(true);
                                      setDeleteType("service");
                                    }}
                                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Footer Totals */}
              <RevenueFooter
                activeView={activeView}
                revenueUsersList={
                  activeView === "service" ? serviceRows : packageRows
                }
                users={users}
              />
            </>
          </RevenueTableWrapper>
        </div>

        {/* // package edit moada */}
        <EditPackageModal
          editModal={editModal}
          setEditModal={setEditModal}
          editPlan={editPlan}
          setEditPlan={setEditPlan}
          editAmount={editAmount}
          setEditAmount={setEditAmount}
          editRemarks={editRemarks}
          setEditRemarks={setEditRemarks}
          editStartDate={editStartDate}
          setEditStartDate={setEditStartDate}
          editExpiryDate={editExpiryDate}
          setEditExpiryDate={setEditExpiryDate}
          handleUpdatePackage={handleUpdatePackage}
          editProofImage={editProofImage}
          setEditProofImage={setEditProofImage}
          updating={updating}
        />
        {/* // service modal */}

        <EditServiceModal
          editServiceModal={editServiceModal}
          setEditServiceModal={setEditServiceModal}
          editAmount={editAmount}
          setEditAmount={setEditAmount}
          editNotes={editNotes}
          setEditNotes={setEditNotes}
          editServiceStartDate={editServiceStartDate}
          setEditServiceStartDate={setEditServiceStartDate}
          editServiceExpiryDate={editServiceExpiryDate}
          setEditServiceExpiryDate={setEditServiceExpiryDate}
          editServiceProofImage={editServiceProofImage}
          setEditServiceProofImage={setEditServiceProofImage}
          updateService={updateService}
          updatingService={updatingService}
        />

        {/* // Delete modal */}

        <DeleteModal
          deleteModal={deleteModal}
          setDeleteModal={setDeleteModal}
          confirmDelete={confirmDelete}
        />

        {/* // image Previe modal */}

        <ImagePreviewModal
          fullViewImage={fullViewImage}
          setFullViewImage={setFullViewImage}
        />
      </div>

      <RenewPlanModal
        showRenewModal={showRenewModal}
        setShowRenewModal={setShowRenewModal}
        renewPlan={renewPlan}
        setRenewPlan={setRenewPlan}
        renewAmount={renewAmount}
        setRenewAmount={setRenewAmount}
        renewStartDate={renewStartDate}
        setRenewStartDate={setRenewStartDate}
        renewExpiryDate={renewExpiryDate}
        setRenewExpiryDate={setRenewExpiryDate}
        setRenewScreenshot={setRenewScreenshot}
        renewRemarks={renewRemarks}
        setRenewRemarks={setRenewRemarks}
        handleRenewPlan={handleRenewPlan}
        savingPlan={savingPlan}
      />

      <RenewServiceModal
        showRenewServiceModal={showRenewServiceModal}
        setShowRenewServiceModal={setShowRenewServiceModal}
        renewServicePlan={renewServicePlan}
        setRenewServicePlan={setRenewServicePlan}
        renewServiceAmount={renewServiceAmount}
        setRenewServiceAmount={setRenewServiceAmount}
        renewServiceStartDate={renewServiceStartDate}
        setRenewServiceStartDate={setRenewServiceStartDate}
        renewServiceExpiryDate={renewServiceExpiryDate}
        setRenewServiceExpiryDate={setRenewServiceExpiryDate}
        setRenewServiceScreenshot={setRenewServiceScreenshot}
        renewServiceRemarks={renewServiceRemarks}
        setRenewServiceRemarks={setRenewServiceRemarks}
        handleRenewService={handleRenewService}
        savingService={savingService}
      />

      <div className="flex justify-center items-center gap-2 ">
        {/* PREV BUTTON */}
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((p) => p - 1)}
          className="px-4 py-2 rounded-xl border bg-white shadow-sm hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          Prev
        </button>

        {/* PAGE NUMBERS */}
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter((page) => page >= currentPage - 1 && page <= currentPage + 1)
          .map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`w-10 h-10 rounded-xl font-semibold transition ${
                currentPage === page
                  ? "bg-indigo-600 text-white shadow-lg scale-105"
                  : "bg-white border hover:bg-gray-100"
              }`}
            >
              {page}
            </button>
          ))}

        {/* NEXT BUTTON */}
        <button
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage((p) => p + 1)}
          className="px-4 py-2 rounded-xl border bg-white shadow-sm hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          Next
        </button>
      </div>
    </>
  );
}
