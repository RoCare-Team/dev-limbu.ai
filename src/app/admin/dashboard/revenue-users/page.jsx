"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";

import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  Checkbox,
  Select,
  MenuItem,
  Stack,
  Box,
  Typography,
} from "@mui/material";

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
import RemarksNotesModal from "./components/RemarksNotesModal";

export default function RevenueUsersPage() {
  const router = useRouter();
  const [loadingRevenueUsers, setLoadingRevenueUsers] = useState(false);
  const [fullViewImage, setFullViewImage] = useState(null);
  const [approvalBusyId, setApprovalBusyId] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [expiryFilter, setExpiryFilter] = useState("");
  const [showFranchiseOnly, setShowFranchiseOnly] = useState(false);

  const [invoiceUrls, setInvoiceUrls] = useState({});
  const [sendingEmailId, setSendingEmailId] = useState(null);

  const [cardFilter, setCardFilter] = useState("");

  const [showServiceModal, setShowServiceModal] = useState(false);
  const [activeView, setActiveView] = useState("package");
  const [revenueUsersList, setRevenueUsersList] = useState([]);
  const [users, setUsers] = useState([]);

  const [updating, setUpdating] = useState(false);
  const [updatingService, setUpdatingService] = useState(false);

  // Package delete/edit modal state
  const [deleteModal, setDeleteModal] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [editModal, setEditModal] = useState(false);
  const [editData, setEditData] = useState(null);

  const [editPlan, setEditPlan] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRemarks, setEditRemarks] = useState("");
  const [editProofImage, setEditProofImage] = useState(null);
  const [editStartDate, setEditStartDate] = useState("");
  const [editExpiryDate, setEditExpiryDate] = useState("");

  // Service delete/edit modal state
  const [editServiceModal, setEditServiceModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [deleteType, setDeleteType] = useState("");

  const [editAmount, setEditAmount] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editServiceStartDate, setEditServiceStartDate] = useState("");
  const [editServiceExpiryDate, setEditServiceExpiryDate] = useState("");
  const [editServiceProofImage, setEditServiceProofImage] = useState(null);

  // NEW: State variables added to capture and update supplementary service details
  const [editGstNumber, setEditGstNumber] = useState("");
  const [editUtrNumber, setEditUtrNumber] = useState("");
  const [editPlanDuration, setEditPlanDuration] = useState("monthly");

  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 20;

  // Remarks & Notes Modal State
  const [showRemarksNotesModal, setShowRemarksNotesModal] = useState(false);
  const [modalRemarksData, setModalRemarksData] = useState({
    remarks: "",
    notes: "",
    customerName: "",
  });

  const displayData = activeView === "package" ? revenueUsersList : users;
  const serviceUsersCount = users?.filter((u) => u.paidService).length || 0;
  const serviceUsers = users.filter((u) => u.paidService || u.isServiceBooked);

  const [selectedPackageRows, setSelectedPackageRows] = useState([]);
  const [selectedServiceRows, setSelectedServiceRows] = useState([]);
  const [selectedServicePlan, setSelectedServicePlan] = useState({});

  const [showRenewModal, setShowRenewModal] = useState(false);
  const [renewUser, setRenewUser] = useState(null);

  const [renewPlan, setRenewPlan] = useState("");
  const [renewAmount, setRenewAmount] = useState("");
  const [renewStartDate, setRenewStartDate] = useState("");
  const [renewExpiryDate, setRenewExpiryDate] = useState("");
  const [renewScreenshot, setRenewScreenshot] = useState(null);
  const [renewRemarks, setRenewRemarks] = useState("");
  const [renewGstNumber, setRenewGstNumber] = useState("");

  const [renewDuration, setRenewDuration] = useState("monthly");
  const [savingPlan, setSavingPlan] = useState(false);
  const [selectedPackagePlan, setSelectedPackagePlan] = useState({});

  const revenuePlans = [
    { name: "Basic Plan", monthly: 3500 },
    { name: "Professional Plan", monthly: 5500 },
    { name: "Premium Plan", monthly: 7500 },
  ];

  const [showRenewServiceModal, setShowRenewServiceModal] = useState(false);
  const [renewServiceUser, setRenewServiceUser] = useState(null);

  const [renewServiceName, setRenewServiceName] = useState("");
  const [renewServiceAmount, setRenewServiceAmount] = useState("");
  const [renewServiceStartDate, setRenewServiceStartDate] = useState("");
  const [renewServiceExpiryDate, setRenewServiceExpiryDate] = useState("");
  const [renewServiceScreenshot, setRenewServiceScreenshot] = useState(null);
  const [renewServiceRemarks, setRenewServiceRemarks] = useState("");

  const [savingServicePlan, setSavingServicePlan] = useState(false);

  const servicePlans = [
    { name: "GMB Assistance & Update Plan", amount: 2500 },
    { name: "GMB Creation & Management Plan", amount: 3000 },
  ];

  const selectedRows =
    activeView === "package" ? selectedPackageRows : selectedServiceRows;
  const setSelectedRows =
    activeView === "package" ? setSelectedPackageRows : setSelectedServiceRows;

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
          ? groupedFilteredPackageRows.map((u) => u.leadId)
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

  const openRenewModal = (user) => {
    setRenewUser(user);
    setRenewPlan(user.plan || "");
    setRenewAmount(user.amount || "");
    setRenewGstNumber(user.gstNumber || "");

    const oldExpiry = user.packageExpiryDate || user.userPackageExpiryDate;

    if (oldExpiry) {
      const expiryDate = new Date(oldExpiry);
      const today = new Date();
      
      // Remove time component for accurate date comparison
      today.setHours(0, 0, 0, 0);
      expiryDate.setHours(0, 0, 0, 0);

      let startDate;

      // ✅ If plan is already expired, start from TODAY
      // ✅ If plan is not expired, start from the day AFTER expiry
      if (expiryDate < today) {
        // Plan already expired → use TODAY as start date
        startDate = new Date(today);
      } else {
        // Plan not yet expired → use day after expiry as start date
        startDate = new Date(expiryDate);
        startDate.setDate(startDate.getDate() + 1);
      }

      // ✅ Format date correctly (YYYY-MM-DD) without timezone issues
      const year = startDate.getFullYear();
      const month = String(startDate.getMonth() + 1).padStart(2, "0");
      const day = String(startDate.getDate()).padStart(2, "0");
      const startStr = `${year}-${month}-${day}`;

      // Calculate expiry date (1 month from start)
      const expiry = new Date(startDate);
      expiry.setMonth(expiry.getMonth() + 1);
      const expiryYear = expiry.getFullYear();
      const expiryMonth = String(expiry.getMonth() + 1).padStart(2, "0");
      const expiryDay = String(expiry.getDate()).padStart(2, "0");
      const expiryStr = `${expiryYear}-${expiryMonth}-${expiryDay}`;

      setRenewDuration("monthly");
      setRenewStartDate(startStr);
      setRenewExpiryDate(expiryStr);
    } else {
      setRenewStartDate("");
      setRenewExpiryDate("");
    }

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
        if (uploadResult?.success) {
          screenshotUrl = uploadResult.url;
        }
      }

      const res = await fetch("/api/franchise-revenue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: renewUser?.leadId,
          leadName: renewUser?.leadName,
          email: renewUser?.email || "",
          phone: renewUser?.phone || "",
          franchiseId: renewUser?.franchiseId || null,
          franchiseName: renewUser?.franchiseName || null,
          onboardedBy: renewUser?.onboardedBy || null,
          onboardedByName: renewUser?.onboardedByName || "",
          onboardedByRole: renewUser?.onboardedByRole || "",
          plan: renewPlan,
          amount: Number(renewAmount),
          packageStartDate: renewStartDate,
          packageExpiryDate: renewExpiryDate,
          paymentScreenshot: screenshotUrl,
          screenshot: screenshotUrl,
          planRemarks: renewRemarks,
          notes: `Plan renewed from ${renewUser?.plan || "Old Plan"} to ${renewPlan}`,
          type: "plan",
          status: "active",
          bookingSource: "manual-upload",
          gstNumber: renewGstNumber,
        }),
      });

      const data = await res.json();

      try {
        const whatsappRes = await fetch("/api/admin/revenue-plan-template", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: renewUser?.phone || "",
            firstName: renewUser?.leadName || "Customer",
            planName: renewPlan,
            amount: renewAmount,
            startDate: renewStartDate,
            expiryDate: renewExpiryDate,
            invoiceUrl: data.revenue.invoiceUrl,
          }),
        });
        const whatsappData = await whatsappRes.json();
      } catch (err) {
        console.error("Revenue WhatsApp template failed:", err);
      }

      try {
        const newRevenueId = data?.revenue?._id;
        if (newRevenueId) {
          const emailRes = await fetch("/api/admin/send-invoice-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ revenueId: newRevenueId }),
          });
          const emailData = await emailRes.json();
        }
      } catch (err) {
        console.error("Revenue invoice email failed:", err);
      }

      if (data.success) {
        alert("Plan Renewed Successfully");
        setShowRenewModal(false);
        setRenewUser(null);
        setRenewPlan("");
        setRenewAmount("");
        setRenewStartDate("");
        setRenewExpiryDate("");
        setRenewGstNumber("");
        setRenewScreenshot(null);
        fetchRevenueUsers();
      } else {
        alert(data.message || "Failed to renew plan");
      }
    } catch (err) {
      console.error("RENEW PLAN ERROR =>", err);
      alert("Something went wrong");
    } finally {
      setSavingPlan(false);
    }
  };

  const openRenewServiceModal = (user) => {
    setRenewServiceUser({
      ...user,
      email: user.email || "",
      phone: user.phone || "",
    });

    setRenewServiceName(user.plan || "");
    setRenewServiceAmount(user.amount || "");

    const oldExpiry = user.packageExpiryDate || user.userPackageExpiryDate;

    if (oldExpiry) {
      const start = new Date(oldExpiry);
      const startStr = start.toISOString().split("T")[0];

      const expiry = new Date(start);
      expiry.setMonth(expiry.getMonth() + 1);

      setRenewServiceStartDate(startStr);
      setRenewServiceExpiryDate(expiry.toISOString().split("T")[0]);
    } else {
      setRenewServiceStartDate("");
      setRenewServiceExpiryDate("");
    }

    setRenewServiceScreenshot(null);
    setShowRenewServiceModal(true);
  };

  const handleRenewService = async () => {
    try {
      setSavingServicePlan(true);
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: renewServiceUser?.leadId,
          leadName: renewServiceUser?.leadName,
          email: renewServiceUser?.email || "",
          phone: renewServiceUser?.phone || "",
          franchiseId: renewServiceUser?.franchiseId || null,
          franchiseName: renewServiceUser?.franchiseName || null,
          amount: Number(renewServiceAmount),
          plan: renewServiceName,
          packageStartDate: renewServiceStartDate,
          packageExpiryDate: renewServiceExpiryDate,
          paymentScreenshot: screenshotUrl,
          screenshot: screenshotUrl,
          notes: renewServiceRemarks,
          type: "service",
          status: "active",
        }),
      });

      const data = await res.json();

      try {
        const whatsappRes = await fetch("/api/admin/revenue-service-template", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: renewServiceUser?.phone || "",
            firstName: renewServiceUser?.leadName || "Customer",
            serviceName: renewServiceName,
            amount: renewServiceAmount,
            invoiceUrl: data.revenue?.invoiceUrl,
          }),
        });
        const whatsappData = await whatsappRes.json();
      } catch (err) {
        console.error("Service WhatsApp template failed:", err);
      }

      try {
        const newRevenueId = data?.revenue?._id;
        if (newRevenueId) {
          const emailRes = await fetch("/api/admin/send-invoice-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ revenueId: newRevenueId }),
          });
          const emailData = await emailRes.json();
        }
      } catch (err) {
        console.error("Service invoice email failed:", err);
      }

      if (data.success) {
        alert("Service Renewed Successfully");
        setShowRenewServiceModal(false);
        fetchRevenueUsers();
      }
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    } finally {
      setSavingServicePlan(false);
    }
  };

  const [isRefreshing, setIsRefreshing] = useState(false);

  const packageRows = revenueUsersList.filter(
    (item) =>
      (item.type === "user_onboard" || item.type === "plan") &&
      (item.status === "active" || item.status === "user_onboard"),
  );

  const groupedPackageRows = Object.values(
    packageRows.reduce((acc, item) => {
      const key = item.leadId;
      if (!acc[key]) {
        acc[key] = {
          leadId: item.leadId,
          leadName: item.leadName,
          email: item.email || "",
          phone: item.phone || "",
          franchiseName: item.franchiseName || "",
          plans: [],
        };
      }
      acc[key].plans.push(item);
      return acc;
    }, {}),
  );

  const totalPlans = packageRows.length;
  const serviceRows = revenueUsersList.filter(
    (item) => item.type === "service",
  );

  const groupedServiceRows = Object.values(
    serviceRows.reduce((acc, item) => {
      const key = item.leadId;
      if (!acc[key]) {
        acc[key] = {
          leadId: item.leadId,
          leadName: item.leadName,
          email: item.email || "",
          phone: item.phone || "",
          franchiseName: item.franchiseName || "",
          plans: [],
        };
      }
      if (item.email) acc[key].email = item.email;
      if (item.phone) acc[key].phone = item.phone;
      acc[key].plans.push(item);
      return acc;
    }, {}),
  );

  const today = new Date().toDateString();

  const todayRows =
    activeView === "package"
      ? packageRows.filter((item) => {
          if (!item.createdAt) return false;
          return new Date(item.createdAt).toDateString() === today;
        })
      : serviceRows.filter((item) => {
          if (!item.createdAt) return false;
          return new Date(item.createdAt).toDateString() === today;
        });

  // Distinct users today — same leadId ke 2 rows ho to 1 hi gine
  const todayUsers = [
    ...new Map(todayRows.map((item) => [item.leadId, item])).values(),
  ];

  // Distinct users (leadId ke hisaab se) — ek user ne multiple plan/renewal
  // liye ho to bhi 1 hi count hoga, taki dashboard ke "Onboarded" se match kare.
  const totalUsers =
    activeView === "package"
      ? groupedPackageRows.length
      : groupedServiceRows.length;

  // Transaction/row count alag se — plans card me dikhta hai
  const totalTransactions =
    activeView === "package" ? packageRows.length : serviceRows.length;

  const totalRevenue =
    activeView === "package"
      ? revenueUsersList
          .filter(
            (item) => item.type === "user_onboard" || item.type === "plan",
          )
          .reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
      : serviceRows.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

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

  const assistanceUsers = serviceRows.filter((item) =>
    item.plan?.toLowerCase().includes("assistance"),
  ).length;

  const creationUsers = serviceRows.filter((item) =>
    item.plan?.toLowerCase().includes("creation"),
  ).length;

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
    const email = localStorage.getItem("email");
    fetch(`/api/users?email=${email}`)
      .then((res) => res.json())
      .then((data) => {
        setUsers(data.users || []);
      });
  }, []);

  const premiumUsers = revenueUsersList.filter((r) =>
    r.plan?.toLowerCase().includes("premium"),
  );
  const role =
    typeof window !== "undefined" ? localStorage.getItem("role") : "";

  const getPlanName = (p) => {
    if (!p) return "";
    if (p.plan && p.plan.trim()) return p.plan;
    if (p.userPaidPackage && p.userPaidPackage.trim()) return p.userPaidPackage;
    return "";
  };

  const formatDateIST = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-IN", {
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
      const params = new URLSearchParams({ email, role });
      const res = await fetch(`/api/franchise-revenue?${params}`);
      const data = await res.json();

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

  const handleServiceApproval = async (revenue, decision) => {
    const revenueId = revenue?._id;
    if (!revenueId) return;

    setApprovalBusyId(String(revenueId));
    try {
      const res = await fetch("/api/franchise-revenue/onboard-approval", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: localStorage.getItem("email"),
          revenueId: String(revenueId),
          decision,
        }),
      });

      const data = await res.json();
      if (data.success) {
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
        alert("Invoice generation failed");
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      setInvoiceUrls((prev) => ({
        ...prev,
        [user._id]: url,
      }));

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
    try {
      const res = await fetch("/api/admin/send-invoice-whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ revenueId: user._id }),
      });
      const data = await res.json();

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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ revenueId: r._id }),
      });
      const data = await res.json();

      if (data.success) {
        alert("Invoice sent successfully");
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

  const filteredData = (
    activeView === "package" ? revenueUsersList : users
  ).filter((item) => {
    const name =
      item.name || item.fullName || item.userName || item.leadName || "";
    const email = item.email || "";

    const matchSearch =
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.toLowerCase().includes(searchTerm.toLowerCase());

    const plan = item.plan || item.paidService || "";
    const matchPlan = planFilter
      ? plan.toLowerCase().includes(planFilter)
      : true;

    const status = item.planApprovalStatus || "pending";
    const matchStatus = statusFilter ? status === statusFilter : true;

    const expiryRaw = item.userPackageExpiryDate || item.packageExpiryDate;
    let matchExpiry = true;

    if (expiryFilter) {
      // Koi expiry filter active hai lekin date hi nahi → row hide
      const expiryDate = expiryRaw ? new Date(expiryRaw) : null;

      if (!expiryDate || isNaN(expiryDate.getTime())) {
        matchExpiry = false;
      } else {
        // Time strip — sirf date compare karo (boundary bug fix)
        expiryDate.setHours(0, 0, 0, 0);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (expiryFilter === "expired") {
          matchExpiry = expiryDate < today;
        } else if (expiryFilter === "today") {
          matchExpiry = expiryDate.getTime() === today.getTime();
        } else if (expiryFilter === "7days") {
          const next7 = new Date(today);
          next7.setDate(today.getDate() + 7);
          matchExpiry = expiryDate >= today && expiryDate <= next7;
        } else if (expiryFilter === "15days") {
          const next15 = new Date(today);
          next15.setDate(today.getDate() + 15);
          matchExpiry = expiryDate >= today && expiryDate <= next15;
        } else if (expiryFilter === "this_month") {
          matchExpiry =
            expiryDate.getMonth() === today.getMonth() &&
            expiryDate.getFullYear() === today.getFullYear();
        }
      }
    }

    const franchiseCode = item.franchiseId || "";
    const matchFranchiseCode = showFranchiseOnly
      ? franchiseCode.length > 0
      : true;

    return matchSearch && matchPlan && matchStatus && matchExpiry && matchFranchiseCode;
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
      case "7days":
      case "this_month":
      case "expired": {
        const expiryRaw =
          item.userPackageExpiryDate || item.packageExpiryDate;

        if (!expiryRaw) return false;

        const expiry = new Date(expiryRaw);
        if (isNaN(expiry.getTime())) return false;

        expiry.setHours(0, 0, 0, 0);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (cardFilter === "today") {
          return expiry.getTime() === today.getTime();
        }

        if (cardFilter === "expired") {
          return expiry < today;
        }

        if (cardFilter === "7days") {
          const next7 = new Date(today);
          next7.setDate(today.getDate() + 7);
          return expiry >= today && expiry <= next7;
        }

        // this_month
        return (
          expiry.getMonth() === today.getMonth() &&
          expiry.getFullYear() === today.getFullYear()
        );
      }
      default:
        return true;
    }
  });

  const uniqueFranchiseCodes = [
    ...new Set(
      revenueUsersList
        .filter((item) => item.franchiseId)
        .map((item) => item.franchiseId),
    ),
  ].sort();

  const groupedFilteredPackageRows = Object.values(
    finalFilteredData
      .filter((item) => item.type === "user_onboard" || item.type === "plan")
      .reduce((acc, item) => {
        const key = item.leadId;
        if (!acc[key]) {
          acc[key] = {
            leadId: item.leadId,
            leadName: item.leadName,
            email: item.email || "",
            phone: item.phone || "",
            franchiseName: item.franchiseName || "",
            franchiseId: item.franchiseId || "",
            plans: [],
          };
        }
        acc[key].plans.push(item);
        return acc;
      }, {}),
  );

  // Build a stable invoice number for a revenue record.
  // (No invoice number is persisted, so derive one deterministically from the record.)
  const buildInvoiceNumber = (item) => {
    if (item?.invoiceNumber) return item.invoiceNumber;
    const year = item?.createdAt
      ? new Date(item.createdAt).getFullYear()
      : new Date().getFullYear();
    const idStr = String(item?._id || "");
    const suffix = idStr ? idStr.slice(-4).toUpperCase() : "0000";
    return `LIM/${year}/${suffix}`;
  };

  // Export all revenue records that have a GST number into an Excel file.
  const handleExportGst = () => {
    const gstRows = revenueUsersList.filter(
      (item) => item.gstNumber && String(item.gstNumber).trim() !== "",
    );

    if (gstRows.length === 0) {
      alert("No records with a GST number found to export");
      return;
    }

    const exportData = gstRows.map((item) => ({
      "Invoice Number": buildInvoiceNumber(item),
      "GST Number": item.gstNumber || "",
      "Customer Name": item.leadName || item.name || "",
      Email: item.email || "",
      Phone: item.phone || "",
      Plan: item.plan || item.userPaidPackage || "",
      Amount: Number(item.amount) || 0,
      "UTR Number": item.utrNumber || "",
      "Franchise Name": item.franchiseName || "",
      "Franchise ID": item.franchiseId || "",
      "Start Date": formatDateIST(
        item.packageStartDate || item.userPackageStartDate,
      ),
      "Expiry Date": formatDateIST(
        item.packageExpiryDate || item.userPackageExpiryDate,
      ),
      "Invoice URL": item.invoiceUrl || "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "GST Invoices");

    const today = new Date().toISOString().split("T")[0];
    XLSX.writeFile(workbook, `GST-Invoices-${today}.xlsx`);
  };

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

  const handleEdit = (item) => {
    setEditData(item);
    setEditPlan(item.plan || "");
    setEditEmail(item.email || "");
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

    // ✅ Load ALL fields so they can be edited/updated (even if empty in DB)
    setEditGstNumber(item.gstNumber || "");
    setEditUtrNumber(item.utrNumber || "");

    setEditModal(true);
  };

  const openRemarksNotesModal = (item, customerName) => {
    setModalRemarksData({
      remarks: item.planRemarks || "",
      notes: item.notes || "",
      customerName: customerName,
    });
    setShowRemarksNotesModal(true);
  };

  const handleUpdatePackage = async () => {
    try {
      setUpdating(true);
      const formData = new FormData();

      formData.append("id", editData._id);
      formData.append("plan", editPlan);
      formData.append("email", editEmail);
      formData.append("amount", editAmount);
      formData.append("planRemarks", editRemarks);
      formData.append("packageStartDate", editStartDate);
      formData.append("packageExpiryDate", editExpiryDate);

      // ✅ Always send GST + UTR so they update even if they were empty before
      formData.append("gstNumber", editGstNumber);
      formData.append("utrNumber", editUtrNumber);

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

  const confirmDelete = async () => {
    try {
      let url = "";
      if (deleteType === "service") {
        url = `/api/franchise-revenue?id=${selectedId}&type=service`;
      } else {
        url = `/api/franchise-revenue?id=${selectedId}`;
      }

      const res = await fetch(url, { method: "DELETE" });
      const data = await res.json();

      if (!res.ok || !data.success) {
        alert(data.message || "Delete failed");
        return;
      }

      setRevenueUsersList((prev) =>
        prev.filter((item) => String(item._id) !== String(selectedId)),
      );
      setDeleteModal(false);
      setSelectedId(null);
      setDeleteType("");

      alert(
        deleteType === "service"
          ? "Service deleted successfully"
          : "Package deleted successfully",
      );

      if (deleteType !== "service") {
        await fetchRevenueUsers();
      }
    } catch (err) {
      console.error("DELETE ERROR:", err);
      alert("Something went wrong");
    }
  };

  // UPDATED: Appending supplemental variables to the Service update multipart request
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

      // NEW: Added detailed fields to payload
      formData.append("gstNumber", editGstNumber);
      formData.append("utrNumber", editUtrNumber);
      formData.append("planDuration", editPlanDuration);

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

  const paginatedGroupedPackageRows = groupedFilteredPackageRows.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage,
  );

  const totalPages = Math.ceil(groupedFilteredPackageRows.length / rowsPerPage);

  return (
    <div className="min-h-screen bg-slate-50/50">
      <RevenueHeader
        handleRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        activeView={activeView}
        setActiveView={setActiveView}
      />

      <div className="max-w-[1600px] mx-auto px-4 py-6 space-y-6">
        {/* ===== STATS ===== */}
        <RevenueStats
          activeView={activeView}
          totalUsers={totalUsers}
          totalTransactions={totalTransactions}
          todayUsers={todayUsers}
          totalRevenue={totalRevenue}
          todayRevenue={todayRevenue}
          revenueUsersList={revenueUsersList}
          users={users}
          cardFilter={cardFilter}
          setCardFilter={setCardFilter}
          assistanceUsers={assistanceUsers}
          creationUsers={creationUsers}
        />

        {/* ===== FILTER TOOLBAR ===== */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
          <RevenueFilters
            onExport={handleExportGst}
            activeView={activeView}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            expiryFilter={expiryFilter}
            setExpiryFilter={setExpiryFilter}
            planFilter={planFilter}
            setPlanFilter={setPlanFilter}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            showFranchiseOnly={showFranchiseOnly}
            setShowFranchiseOnly={setShowFranchiseOnly}
          />
        </div>

        {/* ===== DATA TABLE WRAPPER ===== */}
        <RevenueTableWrapper
          loadingRevenueUsers={loadingRevenueUsers}
          revenueUsersList={revenueUsersList}
          selectedRows={selectedRows}
        >
          <div className="space-y-4">
            <TableContainer
              component={Paper}
              elevation={0}
              className="overflow-hidden border border-slate-200/80 rounded-2xl shadow-sm bg-white"
            >
              <Table stickyHeader size="small" className="min-w-[1100px]">
                <TableHead>
                  <TableRow>
                    {activeView === "package" && (
                      <>
                        <TableCell
                          padding="checkbox"
                          className="bg-slate-50/80 border-b border-slate-200"
                        >
                          <Checkbox
                            size="small"
                            color="primary"
                            checked={
                              groupedFilteredPackageRows.length > 0 &&
                              selectedRows.length ===
                                groupedFilteredPackageRows.length
                            }
                            indeterminate={
                              selectedRows.length > 0 &&
                              selectedRows.length <
                                groupedFilteredPackageRows.length
                            }
                            onChange={(e) => handleSelectAll(e.target.checked)}
                          />
                        </TableCell>
                        <TableCell className="bg-slate-50/80 text-xs font-semibold text-slate-500 uppercase tracking-wider py-4 border-b border-slate-200">
                          Customer
                        </TableCell>
                        <TableCell className="bg-slate-50/80 text-xs font-semibold text-slate-500 uppercase tracking-wider py-4 border-b border-slate-200">
                          Plan Status
                        </TableCell>
                        <TableCell className="bg-slate-50/80 text-xs font-semibold text-slate-500 uppercase tracking-wider py-4 border-b border-slate-200">
                          Amount
                        </TableCell>
                        <TableCell className="bg-slate-50/80 text-xs font-semibold text-slate-500 uppercase tracking-wider py-4 border-b border-slate-200">
                          Timeline
                        </TableCell>
                        <TableCell className="bg-slate-50/80 text-xs font-semibold text-slate-500 uppercase tracking-wider py-4 border-b border-slate-200">
                          Invoice Actions
                        </TableCell>
                        <TableCell className="bg-slate-50/80 text-xs font-semibold text-slate-500 uppercase tracking-wider py-4 border-b border-slate-200">
                          Proof File
                        </TableCell>
                        <TableCell className="bg-slate-50/80 text-xs font-semibold text-slate-500 uppercase tracking-wider py-4 border-b border-slate-200">
                          Notes / Remarks
                        </TableCell>
                        {role === "superAdmin" && (
                          <TableCell className="bg-slate-50/80 text-xs font-semibold text-slate-500 uppercase tracking-wider py-4 border-b border-slate-200">
                            Admin Status
                          </TableCell>
                        )}
                        <TableCell
                          align="right"
                          className="bg-slate-50/80 text-xs font-semibold text-slate-500 uppercase tracking-wider py-4 border-b border-slate-200 pr-6"
                        >
                          Actions
                        </TableCell>
                      </>
                    )}

                    {activeView === "service" && (
                      <>
                        <TableCell className="bg-slate-50/80 text-xs font-semibold text-slate-500 uppercase tracking-wider py-4 border-b border-slate-200">
                          Customer
                        </TableCell>
                        <TableCell className="bg-slate-50/80 text-xs font-semibold text-slate-500 uppercase tracking-wider py-4 border-b border-slate-200">
                          Service Details
                        </TableCell>
                        <TableCell className="bg-slate-50/80 text-xs font-semibold text-slate-500 uppercase tracking-wider py-4 border-b border-slate-200">
                          Duration
                        </TableCell>
                        <TableCell className="bg-slate-50/80 text-xs font-semibold text-slate-500 uppercase tracking-wider py-4 border-b border-slate-200">
                          Amount
                        </TableCell>
                        <TableCell className="bg-slate-50/80 text-xs font-semibold text-slate-500 uppercase tracking-wider py-4 border-b border-slate-200">
                          Timeline
                        </TableCell>
                        <TableCell className="bg-slate-50/80 text-xs font-semibold text-slate-500 uppercase tracking-wider py-4 border-b border-slate-200">
                          Invoice Actions
                        </TableCell>
                        <TableCell className="bg-slate-50/80 text-xs font-semibold text-slate-500 uppercase tracking-wider py-4 border-b border-slate-200">
                          Proof File
                        </TableCell>
                        <TableCell className="bg-slate-50/80 text-xs font-semibold text-slate-500 uppercase tracking-wider py-4 border-b border-slate-200">
                          Notes
                        </TableCell>
                        <TableCell className="bg-slate-50/80 text-xs font-semibold text-slate-500 uppercase tracking-wider py-4 border-b border-slate-200">
                          Approval
                        </TableCell>
                        <TableCell
                          align="right"
                          className="bg-slate-50/80 text-xs font-semibold text-slate-500 uppercase tracking-wider py-4 border-b border-slate-200 pr-6"
                        >
                          Actions
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {/* 📦 PACKAGE VIEW */}
                  {activeView === "package" &&
                    paginatedGroupedPackageRows.map((u) => {
                      const sortedPlans = [...u.plans].sort(
                        (a, b) =>
                          new Date(b.packageStartDate || b.createdAt) -
                          new Date(a.packageStartDate || a.createdAt),
                      );

                      const currentPlan =
                        sortedPlans.find(
                          (p) => p._id === selectedPackagePlan[u.leadId],
                        ) || sortedPlans[0];

                      const startDate =
                        currentPlan.packageStartDate ||
                        currentPlan.userPackageStartDate ||
                        currentPlan.createdAt;

                      const effectiveExpiry =
                        currentPlan.packageExpiryDate ||
                        currentPlan.userPackageExpiryDate;

                      const isExpired =
                        effectiveExpiry &&
                        new Date(effectiveExpiry) < new Date();

                      return (
                        <TableRow
                          key={u.leadId}
                          hover
                          className="transition-colors hover:bg-slate-50/40"
                        >
                          <TableCell className="border-b border-slate-100 py-4">
                            <Checkbox
                              size="small"
                              checked={selectedRows.includes(u.leadId)}
                              onChange={() => handleSelectRow(u.leadId)}
                            />
                          </TableCell>

                          <TableCell className="border-b border-slate-100 py-4 max-w-[240px]">
                            <div className="font-semibold text-slate-800 text-sm">
                              {u.leadName}
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              ID: {u.leadId}
                            </div>

                            {currentPlan.franchiseId && (
                              <div className="inline-flex items-center gap-1 mt-1 text-[11px] font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                                Franchise: {currentPlan.franchiseId}
                              </div>
                            )}
                            {u.franchiseName && (
                              <div className="text-[10px] text-purple-600 font-medium mt-1">
                                {u.franchiseName}
                              </div>
                            )}
                            <div className="text-[10px] text-slate-400 mt-1 font-mono">
                              UTR: {currentPlan.utrNumber || "N/A"}
                            </div>
                          </TableCell>

                          <TableCell className="border-b border-slate-100 py-4">
                            <div className="flex flex-col gap-1.5 max-w-[180px]">
                              <select
                                value={
                                  selectedPackagePlan[u.leadId] ||
                                  currentPlan._id
                                }
                                onChange={(e) =>
                                  setSelectedPackagePlan((prev) => ({
                                    ...prev,
                                    [u.leadId]: e.target.value,
                                  }))
                                }
                                className="bg-slate-50 hover:bg-slate-100/80 transition-colors border border-slate-200/80 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 outline-none focus:ring-1 focus:ring-indigo-500"
                              >
                                {sortedPlans.map((p) => (
                                  <option key={p._id} value={p._id}>
                                    {getPlanName(p)}
                                  </option>
                                ))}
                              </select>

                              {isExpired ? (
                                <div className="flex flex-col gap-1 mt-1">
                                  <span className="inline-flex items-center justify-center bg-rose-50 text-rose-600 px-2 py-1 rounded-md text-[10px] font-semibold border border-rose-100 w-fit">
                                    ● Expired
                                  </span>
                                  <button
                                    onClick={() => openRenewModal(currentPlan)}
                                    className="inline-flex items-center justify-center bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-semibold px-2.5 py-1 rounded-md text-[11px] transition"
                                  >
                                    Renew Plan
                                  </button>
                                </div>
                              ) : (
                                <span className="inline-flex items-center justify-center bg-emerald-50 text-emerald-600 px-2 py-1 rounded-md text-[10px] font-semibold border border-emerald-100 w-fit">
                                  ● Active
                                </span>
                              )}
                            </div>
                          </TableCell>

                          <TableCell className="border-b border-slate-100 py-4 font-semibold text-slate-950">
                            ₹{currentPlan.amount}
                          </TableCell>

                          <TableCell className="border-b border-slate-100 py-4 text-xs text-slate-600">
                            <div className="space-y-0.5">
                              <div>
                                <span className="text-slate-400 font-medium">
                                  Starts:
                                </span>{" "}
                                {formatDateIST(startDate)}
                              </div>
                              <div>
                                <span className="text-slate-400 font-medium">
                                  Expires:
                                </span>{" "}
                                {formatDateIST(effectiveExpiry)}
                              </div>
                            </div>
                          </TableCell>

                          <TableCell className="border-b border-slate-100 py-4">
                            <div className="flex flex-wrap gap-1.5 max-w-[280px]">
                              <button
                                onClick={() =>
                                  handleDownloadInvoice(currentPlan)
                                }
                                className="inline-flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 px-2.5 py-1.5 rounded-lg text-xs font-medium transition border border-slate-200"
                              >
                                <svg
                                  className="w-3.5 h-3.5"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                  />
                                </svg>
                                Download
                              </button>

                              {invoiceUrls[currentPlan._id] && (
                                <button
                                  onClick={() =>
                                    window.open(
                                      invoiceUrls[currentPlan._id],
                                      "_blank",
                                    )
                                  }
                                  className="inline-flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 text-indigo-600 px-2.5 py-1.5 rounded-lg text-xs font-medium transition border border-slate-200"
                                >
                                  View PDF
                                </button>
                              )}

                              {invoiceUrls[currentPlan._id] && (
                                <button
                                  onClick={() =>
                                    handleSendInvoiceEmail(currentPlan)
                                  }
                                  disabled={sendingEmailId === currentPlan._id}
                                  className="inline-flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-2.5 py-1.5 rounded-lg text-xs font-medium transition disabled:opacity-50"
                                >
                                  {sendingEmailId === currentPlan._id
                                    ? "Sending..."
                                    : "Email Invoice"}
                                </button>
                              )}

                              <button
                                onClick={() =>
                                  handleSendInvoiceWhatsApp(currentPlan)
                                }
                                className="inline-flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-2.5 py-1.5 rounded-lg text-xs font-medium transition border border-emerald-200/40"
                              >
                                Send Invoice
                              </button>
                            </div>
                          </TableCell>

                          <TableCell className="border-b border-slate-100 py-4">
                            <button
                              onClick={() => {
                                if (currentPlan.paymentScreenshot) {
                                  setFullViewImage(
                                    currentPlan.paymentScreenshot,
                                  );
                                } else {
                                  alert("No screenshot found");
                                }
                              }}
                              className="inline-flex items-center gap-1 bg-slate-50 hover:bg-indigo-50 border border-slate-200/80 hover:border-indigo-100 hover:text-indigo-600 text-slate-600 px-2.5 py-1.5 rounded-lg text-xs font-medium transition shadow-sm"
                            >
                              <svg
                                className="w-3.5 h-3.5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                />
                              </svg>
                              View Proof
                            </button>
                          </TableCell>

                          <TableCell className="border-b border-slate-100 py-4">
                            <button
                              onClick={() =>
                                openRemarksNotesModal(currentPlan, u.leadName)
                              }
                              className="inline-flex items-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-3 py-2 rounded-lg text-xs font-medium transition border border-indigo-200"
                            >
                              <svg
                                className="w-3.5 h-3.5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                              </svg>
                              View Details
                            </button>
                          </TableCell>

                          {role === "superAdmin" && (
                            <TableCell className="border-b border-slate-100 py-4">
                              {currentPlan?.type === "user_onboard" ||
                              currentPlan?.type === "plan" ? (
                                (() => {
                                  const st = currentPlan.planApprovalStatus;
                                  if (st === "approved") {
                                    return (
                                      <span className="inline-flex items-center bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full text-xs font-semibold border border-emerald-100">
                                        Approved
                                      </span>
                                    );
                                  }

                                  if (st === "rejected") {
                                    return (
                                      <span className="inline-flex items-center bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full text-xs font-semibold border border-slate-200">
                                        Not Approved
                                      </span>
                                    );
                                  }

                                  const busy =
                                    approvalBusyId === String(currentPlan._id);

                                  return (
                                    <div className="flex flex-col gap-1.5 w-[110px]">
                                      <button
                                        disabled={busy}
                                        onClick={() =>
                                          handleOnboardApproval(
                                            currentPlan,
                                            "approved",
                                          )
                                        }
                                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-1 rounded-lg text-[11px] transition shadow-sm"
                                      >
                                        {busy ? "…" : "Approve"}
                                      </button>
                                      <button
                                        disabled={busy}
                                        onClick={() =>
                                          handleOnboardApproval(
                                            currentPlan,
                                            "rejected",
                                          )
                                        }
                                        className="w-full border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium py-1 rounded-lg text-[11px] transition"
                                      >
                                        Reject
                                      </button>
                                    </div>
                                  );
                                })()
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </TableCell>
                          )}

                          <TableCell
                            align="right"
                            className="border-b border-slate-100 py-4 pr-6"
                          >
                            <div className="flex justify-end gap-1.5">
                              <button
                                onClick={() => handleEdit(currentPlan)}
                                className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                                title="Edit Row"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                                  />
                                </svg>
                              </button>

                              <button
                                onClick={() => {
                                  setSelectedId(currentPlan._id);
                                  setDeleteType("package");
                                  setDeleteModal(true);
                                }}
                                className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                title="Delete Row"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}

                  {/* 🛠 SERVICE VIEW */}
                  {activeView === "service" &&
                    groupedServiceRows.map((u, i) => {
                      const sortedPlans = [...u.plans].sort(
                        (a, b) =>
                          new Date(b.packageStartDate || b.createdAt) -
                          new Date(a.packageStartDate || a.createdAt),
                      );

                      const currentPlan =
                        sortedPlans.find(
                          (p) => p._id === selectedServicePlan[u.leadId],
                        ) || sortedPlans[0];

                      return (
                        <TableRow
                          key={i}
                          hover
                          className="transition-colors hover:bg-slate-50/40"
                        >
                          <TableCell className="border-b border-slate-100 py-4">
                            <div className="flex flex-col">
                              <span className="font-semibold text-slate-800 text-sm">
                                {u.name ||
                                  u.fullName ||
                                  u.leadName ||
                                  "No Name"}
                              </span>
                              <span className="text-[11px] text-slate-400 mt-0.5">
                                {currentPlan.email || u.email || "No Email"}
                              </span>

                              {/* NEW: Displays dynamic metadata rows in columns directly */}
                              {currentPlan.gstNumber && (
                                <span className="inline-flex mt-1 text-[10px] text-slate-500 font-semibold tracking-wider bg-slate-100/80 px-2 py-0.5 rounded w-fit">
                                  GST: {currentPlan.gstNumber}
                                </span>
                              )}

                              {currentPlan.utrNumber && (
                                <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                                  UTR: {currentPlan.utrNumber}
                                </span>
                              )}

                              {u.franchiseName && (
                                <span className="inline-block mt-1 text-[11px] text-indigo-600 font-medium">
                                  {u.franchiseName}
                                </span>
                              )}
                            </div>
                          </TableCell>

                          <TableCell className="border-b border-slate-100 py-4">
                            <div className="flex flex-col gap-1.5 max-w-[180px]">
                              <select
                                value={
                                  selectedServicePlan[u.leadId] ||
                                  currentPlan._id
                                }
                                onChange={(e) =>
                                  setSelectedServicePlan((prev) => ({
                                    ...prev,
                                    [u.leadId]: e.target.value,
                                  }))
                                }
                                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-indigo-600 outline-none focus:ring-1 focus:ring-indigo-500"
                              >
                                {sortedPlans.map((p) => (
                                  <option key={p._id} value={p._id}>
                                    {p.plan}
                                  </option>
                                ))}
                              </select>

                              {currentPlan.packageExpiryDate &&
                                new Date(currentPlan.packageExpiryDate) <
                                  new Date() && (
                                  <div className="flex flex-col gap-1 mt-1">
                                    <span className="bg-rose-50 border border-rose-100 text-rose-600 px-2 py-0.5 rounded text-[10px] font-semibold w-fit">
                                      ● Expired
                                    </span>
                                    <button
                                      onClick={() =>
                                        openRenewServiceModal(currentPlan)
                                      }
                                      className="inline-flex items-center justify-center bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-semibold px-2.5 py-1 rounded-md text-[11px] transition"
                                    >
                                      Renew Service
                                    </button>
                                  </div>
                                )}
                            </div>
                          </TableCell>

                          <TableCell className="border-b border-slate-100 py-4 text-xs font-medium text-slate-600">
                            {currentPlan.planDuration || "monthly"}
                          </TableCell>

                          <TableCell className="border-b border-slate-100 py-4">
                            <span className="inline-flex items-center bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full text-xs font-bold border border-emerald-100">
                              ₹{currentPlan.amount}
                            </span>
                          </TableCell>

                          <TableCell className="border-b border-slate-100 py-4 text-xs text-slate-600">
                            <div className="space-y-0.5">
                              <div>
                                <span className="text-slate-400 font-medium">
                                  Starts:
                                </span>{" "}
                                {(() => {
                                  const rawDate =
                                    currentPlan.packageStartDate ||
                                    u.startDate ||
                                    u.date ||
                                    u.createdAt;
                                  if (!rawDate) return "—";
                                  const d = new Date(rawDate);
                                  if (isNaN(d.getTime())) return "—";
                                  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
                                })()}
                              </div>
                              <div>
                                <span className="text-slate-400 font-medium">
                                  Expires:
                                </span>{" "}
                                {currentPlan.packageExpiryDate
                                  ? new Date(
                                      currentPlan.packageExpiryDate,
                                    ).toLocaleDateString("en-IN")
                                  : "—"}
                              </div>
                            </div>
                          </TableCell>

                          <TableCell className="border-b border-slate-100 py-4">
                            <div className="flex flex-wrap gap-1.5 max-w-[280px]">
                              <button
                                onClick={() =>
                                  handleDownloadInvoice(currentPlan)
                                }
                                className="inline-flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 px-2.5 py-1.5 rounded-lg text-xs font-medium transition border border-slate-200"
                              >
                                Download
                              </button>

                              {invoiceUrls[currentPlan._id] && (
                                <button
                                  onClick={() =>
                                    window.open(
                                      invoiceUrls[currentPlan._id],
                                      "_blank",
                                    )
                                  }
                                  className="inline-flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 text-indigo-600 px-2.5 py-1.5 rounded-lg text-xs font-medium transition border border-slate-200"
                                >
                                  View PDF
                                </button>
                              )}

                              {invoiceUrls[currentPlan._id] && (
                                <button
                                  onClick={() =>
                                    handleSendInvoiceEmail(currentPlan)
                                  }
                                  disabled={sendingEmailId === currentPlan._id}
                                  className="inline-flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-2.5 py-1.5 rounded-lg text-xs font-medium transition disabled:opacity-50"
                                >
                                  {sendingEmailId === currentPlan._id
                                    ? "Sending..."
                                    : "Email Invoice"}
                                </button>
                              )}

                              <button
                                onClick={() =>
                                  handleSendInvoiceWhatsApp(currentPlan)
                                }
                                className="inline-flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-2.5 py-1.5 rounded-lg text-xs font-medium transition border border-emerald-200/40"
                              >
                                Send Alert
                              </button>
                            </div>
                          </TableCell>

                          <TableCell className="border-b border-slate-100 py-4">
                            <button
                              onClick={() =>
                                setFullViewImage(currentPlan.paymentScreenshot)
                              }
                              className="inline-flex items-center gap-1 bg-slate-50 hover:bg-indigo-50 border border-slate-200/80 hover:border-indigo-100 hover:text-indigo-600 text-slate-600 px-2.5 py-1.5 rounded-lg text-xs font-medium transition shadow-sm"
                            >
                              View Proof
                            </button>
                          </TableCell>

                          <TableCell className="border-b border-slate-100 py-4 text-xs text-slate-600 max-w-[200px]">
                            {currentPlan.notes ??
                              currentPlan.remarks ??
                              currentPlan.Remarks ??
                              "—"}
                          </TableCell>

                          <TableCell className="border-b border-slate-100 py-4">
                            {(() => {
                              const st =
                                currentPlan.planApprovalStatus || "pending";
                              if (st === "approved") {
                                return (
                                  <span className="inline-flex items-center bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full text-xs font-semibold border border-emerald-100">
                                    Approved
                                  </span>
                                );
                              }

                              if (st === "rejected") {
                                return (
                                  <span className="inline-flex items-center bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full text-xs font-semibold border border-slate-200">
                                    Not Approved
                                  </span>
                                );
                              }

                              const busy =
                                approvalBusyId === String(currentPlan._id);

                              return (
                                <div className="flex flex-col gap-1.5 w-[110px]">
                                  <button
                                    disabled={busy}
                                    onClick={() =>
                                      handleServiceApproval(
                                        currentPlan,
                                        "approved",
                                      )
                                    }
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-1 rounded-lg text-[11px] transition shadow-sm"
                                  >
                                    {busy ? "…" : "Approve"}
                                  </button>
                                  <button
                                    disabled={busy}
                                    onClick={() =>
                                      handleServiceApproval(
                                        currentPlan,
                                        "rejected",
                                      )
                                    }
                                    className="w-full border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium py-1 rounded-lg text-[11px] transition"
                                  >
                                    Reject
                                  </button>
                                </div>
                              );
                            })()}
                          </TableCell>

                          <TableCell
                            align="right"
                            className="border-b border-slate-100 py-4 pr-6"
                          >
                            <div className="flex justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  // UPDATED: Pre-fills supplemental states when editing a service
                                  setSelectedService(currentPlan);
                                  setEditAmount(currentPlan.amount || "");
                                  setEditNotes(
                                    currentPlan.notes ??
                                      currentPlan.remarks ??
                                      currentPlan.Remarks ??
                                      "",
                                  );
                                  setEditServiceStartDate(
                                    currentPlan.packageStartDate
                                      ? new Date(currentPlan.packageStartDate)
                                          .toISOString()
                                          .split("T")[0]
                                      : "",
                                  );
                                  setEditServiceExpiryDate(
                                    currentPlan.packageExpiryDate
                                      ? new Date(currentPlan.packageExpiryDate)
                                          .toISOString()
                                          .split("T")[0]
                                      : "",
                                  );
                                  setEditServiceProofImage(
                                    currentPlan.paymentScreenshot || "",
                                  );

                                  // NEW: Hydrates newly introduced state bindings
                                  setEditGstNumber(currentPlan.gstNumber || "");
                                  setEditUtrNumber(currentPlan.utrNumber || "");
                                  setEditPlanDuration(
                                    currentPlan.planDuration || "monthly",
                                  );

                                  setEditServiceModal(true);
                                }}
                                className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                                title="Edit Service"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                                  />
                                </svg>
                              </button>

                              <button
                                onClick={() => {
                                  setSelectedId(currentPlan._id);
                                  setDeleteModal(true);
                                  setDeleteType("service");
                                }}
                                className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                title="Delete Service"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Pagination Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
              <span className="text-xs font-medium text-slate-500">
                Showing Page {currentPage} of {totalPages || 1}
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 font-medium text-xs hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition duration-150"
                >
                  Prev
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(
                    (page) =>
                      page >= currentPage - 1 && page <= currentPage + 1,
                  )
                  .map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-9 h-9 rounded-xl font-semibold text-xs transition duration-150 ${
                        currentPage === page
                          ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                          : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                <button
                  disabled={currentPage === totalPages || totalPages === 0}
                  onClick={() =>
                    setCurrentPage((p) => Math.min(p + 1, totalPages))
                  }
                  className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 font-medium text-xs hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition duration-150"
                >
                  Next
                </button>
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
          </div>
        </RevenueTableWrapper>
      </div>

      {/* ===== MODAL DIALOGS ===== */}
      <EditPackageModal
        editModal={editModal}
        setEditModal={setEditModal}
        editPlan={editPlan}
        setEditPlan={setEditPlan}
        editEmail={editEmail}
        setEditEmail={setEditEmail}
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
        editGstNumber={editGstNumber}
        setEditGstNumber={setEditGstNumber}
        editUtrNumber={editUtrNumber}
        setEditUtrNumber={setEditUtrNumber}
        updating={updating}
      />

      {/* UPDATED: Injected newly created bindings to child element props */}
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
        // NEW: Direct properties bound to modal component
        editGstNumber={editGstNumber}
        setEditGstNumber={setEditGstNumber}
        editUtrNumber={editUtrNumber}
        setEditUtrNumber={setEditUtrNumber}
        editPlanDuration={editPlanDuration}
        setEditPlanDuration={setEditPlanDuration}
        updateService={updateService}
        updatingService={updatingService}
      />

      <DeleteModal
        deleteModal={deleteModal}
        setDeleteModal={setDeleteModal}
        confirmDelete={confirmDelete}
      />

      <ImagePreviewModal
        fullViewImage={fullViewImage}
        setFullViewImage={setFullViewImage}
      />

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
        renewScreenshot={renewScreenshot}
        setRenewScreenshot={setRenewScreenshot}
        renewRemarks={renewRemarks}
        setRenewRemarks={setRenewRemarks}
        handleRenewPlan={handleRenewPlan}
        savingPlan={savingPlan}
        revenuePlans={revenuePlans}
        renewDuration={renewDuration}
        setRenewDuration={setRenewDuration}
        renewGstNumber={renewGstNumber}
        setRenewGstNumber={setRenewGstNumber}
      />

      <RenewServiceModal
        showRenewServiceModal={showRenewServiceModal}
        setShowRenewServiceModal={setShowRenewServiceModal}
        renewServiceName={renewServiceName}
        setRenewServiceName={setRenewServiceName}
        renewServiceAmount={renewServiceAmount}
        setRenewServiceAmount={setRenewServiceAmount}
        renewServiceStartDate={renewServiceStartDate}
        setRenewServiceStartDate={setRenewServiceStartDate}
        renewServiceExpiryDate={renewServiceExpiryDate}
        setRenewServiceExpiryDate={setRenewServiceExpiryDate}
        renewServiceScreenshot={renewServiceScreenshot}
        setRenewServiceScreenshot={setRenewServiceScreenshot}
        renewServiceRemarks={renewServiceRemarks}
        setRenewServiceRemarks={setRenewServiceRemarks}
        handleRenewService={handleRenewService}
        savingServicePlan={savingServicePlan}
        servicePlans={servicePlans}
      />

      <RemarksNotesModal
        showModal={showRemarksNotesModal}
        setShowModal={setShowRemarksNotesModal}
        remarks={modalRemarksData.remarks}
        notes={modalRemarksData.notes}
        customerName={modalRemarksData.customerName}
      />
    </div>
  );
}
