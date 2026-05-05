"use client";
import jsPDF from "jspdf";

import { useEffect, useState, useRef, useMemo } from "react";
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Button,
  TextField,
  Card,
  CardContent,
  Chip,
  InputAdornment,
  CircularProgress,
  LinearProgress,
  Backdrop,
  Avatar,
} from "@mui/material";
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  QrCode as QrCodeIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  LocationOn as MapPinIcon,
  Phone as PhoneIcon,
  Description as FileTextIcon,
  Business as BusinessIcon,
  Verified as VerifiedIcon,
  Pending as PendingIcon,
  People as PeopleIcon,
} from "@mui/icons-material";

import Lottie from "lottie-react";
import animationData from "@/assets/animation/Loading.json"; 

import { toPng } from "html-to-image";
import { toast, Toaster } from "react-hot-toast";
import { generateUniversalSlug, stringToSlug } from "@/utils/slugify";

import JSZip from "jszip";

export default function AdminDashboard() {
  const [allUserListings, setAllUserListings] = useState([]);
  console.log("All User Listings in store bussiness: ", allUserListings);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [qrFilterStatus, setQrFilterStatus] = useState("all");
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalListings: 0,
    verifiedListings: 0,
    unverifiedListings: 0,
    totalGeneratedQrs: 0,
  });

  const [generatedQrsStatus, setGeneratedQrsStatus] = useState({});
  const [isGeneratingBulk, setIsGeneratingBulk] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0, currentBusiness: "" });

  const qrCardRef = useRef(null);
  const [activeQrData, setActiveQrData] = useState({
    business: "",
    qrImage: "",
    reviewUrl: ""
  });

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const fetchGeneratedQrStatus = async () => {
    try {
      const res = await fetch("/api/magic-qr/status");
      const data = await res.json();
      if (data.success) {
        setGeneratedQrsStatus(data.data || {});
        setStats(prev => ({ ...prev, totalGeneratedQrs: data.totalGenerated || 0 }));
      }
    } catch (error) {
      console.error("Failed to fetch QR status", error);
    }
  };

  useEffect(() => {
    fetchAllUserListings(1);
    fetchGeneratedQrStatus();
  }, []);

  const fetchAllUserListings = async (pageNumber = 1) => {
    if (pageNumber === 1) setLoading(true);
    else setIsLoadingMore(true);

    try {
      const response = await fetch(`/api/admin/saveBussiness?page=${pageNumber}&limit=10`);
      const data = await response.json();

      if (data.success) {
        if (pageNumber === 1) {
          setAllUserListings(data.listings || []);
        } else {
          setAllUserListings(prev => [...prev, ...(data.listings || [])]);
        }

        if (data.globalStats) {
          setStats(prev => ({
            ...prev,
            ...data.globalStats
          }));
        }

        setTotalPages(data.pagination?.totalPages || 1);
        setPage(pageNumber);
      }
    } catch (error) {
      console.error("Error fetching user listings:", error);
      toast.error("Failed to load listings");
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (page < totalPages) {
      fetchAllUserListings(page + 1);
    }
  };

  const filteredUsers = useMemo(() => {
    let filtered = allUserListings;

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.userEmail?.toLowerCase().includes(lowerSearch) ||
          user.userName?.toLowerCase().includes(lowerSearch)
      );
    }

    if (qrFilterStatus !== "all") {
      filtered = filtered.filter((user) => {
        const hasAnyGenerated = user.listings?.some((listing) => {
          const id = listing.locationId || listing.name;
          return !!generatedQrsStatus[id];
        });

        if (qrFilterStatus === "generated") {
          return hasAnyGenerated;
        } else if (qrFilterStatus === "pending") {
          return user.listings?.some((listing) => {
            const id = listing.locationId || listing.name;
            return !generatedQrsStatus[id];
          });
        }
        return true;
      });
    }

    return filtered;
  }, [allUserListings, searchTerm, qrFilterStatus, generatedQrsStatus]);

  const getReviewUrl = (listing, allUserListingsData) => {
    const baseSlug = generateUniversalSlug(listing);

    const allListingsArray = (allUserListingsData || []).flatMap(u => u.listings || []);

    const conflicts = allListingsArray.filter(loc => {
      if (loc.locationId === listing.locationId || loc.name === listing.name) return false;
      return generateUniversalSlug(loc) === baseSlug;
    });

    let finalSlug = baseSlug;

    if (conflicts.length > 0) {
      const idPart = (listing.locationId || listing.name || "00000").substring(0, 5);
      finalSlug = `${baseSlug}-${idPart}`;
    }

    return `${window.location.origin}/reviews/${finalSlug}`;
  };

  const fetchImageAsBase64 = async (url) => {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  };

  const downloadSingleQrAsPng = async (listing, user) => {
    const id = listing.locationId || listing.name;
    const qrUrl = generatedQrsStatus[id];
    if (!qrUrl) {
      toast.error("QR not generated yet");
      return;
    }

    const locality = listing.address?.locality || listing.storefrontAddress?.locality || "";
    const displayName = locality ? `${listing.title} - ${locality}` : listing.title;

    const finalReviewURL = getReviewUrl(listing, allUserListings);
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(finalReviewURL)}&t=${Date.now()}`;

    const toastId = toast.loading("Preparing PNG...");

    try {
      // 1. Pre-fetch image as base64 to ensure it renders instantly without network delay
      const base64Qr = await fetchImageAsBase64(qrApiUrl);

      // 2. Set the data with the fully loaded local base64 image
      setActiveQrData({
        business: displayName,
        qrImage: base64Qr,
        reviewUrl: finalReviewURL
      });

      // 3. Small delay to let React update the DOM
      await new Promise(resolve => setTimeout(resolve, 500));

      if (!qrCardRef.current) {
        toast.error("Renderer error", { id: toastId });
        return;
      }

      const dataUrl = await toPng(qrCardRef.current, {
        cacheBust: true,
        pixelRatio: 4,
        style: { borderRadius: '32px' }
      });

      const link = document.createElement('a');
      link.download = `QR_${stringToSlug(displayName)}.png`;
      link.href = dataUrl;
      link.click();
      toast.success("PNG Downloaded!", { id: toastId });
    } catch (err) {
      console.error("Download error:", err);
      toast.error("Failed to download PNG", { id: toastId });
    }
  };

  const downloadAllUserPngs = async (user) => {
    const generatedListings = (user.listings || []).filter(l => {
      const id = l.locationId || l.name;
      return generatedQrsStatus[id];
    });

    if (generatedListings.length === 0) {
      toast.error("No generated QRs found.");
      return;
    }

    const toastId = toast.loading(`Preparing ZIP for ${generatedListings.length} PNGs...`);
    const zip = new JSZip();

    try {
      for (const listing of generatedListings) {
        const id = listing.locationId || listing.name;
        const locality = listing.address?.locality || listing.storefrontAddress?.locality || "";
        const displayName = locality ? `${listing.title} - ${locality}` : listing.title;

        const finalReviewURL = getReviewUrl(listing, allUserListings);
        const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(finalReviewURL)}&t=${Date.now()}`;

        // Fetch image and render to PNG
        const base64Qr = await fetchImageAsBase64(qrApiUrl);
        setActiveQrData({
          business: displayName,
          qrImage: base64Qr,
          reviewUrl: finalReviewURL
        });

        // Small delay for DOM update
        await new Promise(resolve => setTimeout(resolve, 600));

        if (qrCardRef.current) {
          const dataUrl = await toPng(qrCardRef.current, {
            cacheBust: true,
            pixelRatio: 3, // slightly lower for ZIP speed
            style: { borderRadius: '32px' }
          });

          // Add to ZIP (remove data:image/png;base64, prefix)
          const base64Data = dataUrl.split(',')[1];
          zip.file(`QR_${stringToSlug(displayName)}.png`, base64Data, { base64: true });
        }
      }

      const content = await zip.generateAsync({ type: "blob" });
      const link = document.createElement('a');
      link.download = `QR_Codes_${stringToSlug(user.userName || "User")}.zip`;
      link.href = URL.createObjectURL(content);
      link.click();

      toast.success("ZIP Downloaded!", { id: toastId });
    } catch (err) {
      console.error("ZIP Error:", err);
      toast.error("Failed to create ZIP archive", { id: toastId });
    }
  };

  const processUserQrs = async (targetUser) => {
    const pendingListings = (targetUser.listings || []).filter(listing => {
      const id = listing.locationId || listing.name;
      return !generatedQrsStatus[id];
    });

    if (pendingListings.length === 0) {
      toast.success("All QRs for this business are already generated!");
      return;
    }

    if (!confirm(`Are you sure you want to generate ${pendingListings.length} QRs for ${targetUser.userName}?`)) return;

    setIsGeneratingBulk(true);
    setBulkProgress({ current: 0, total: pendingListings.length, currentBusiness: "" });

    let successCount = 0;
    for (let i = 0; i < pendingListings.length; i++) {
      const listing = pendingListings[i];
      const locality = listing.address?.locality || listing.storefrontAddress?.locality || "";
      const displayName = locality ? `${listing.title} - ${locality}` : listing.title;

      setBulkProgress(prev => ({ ...prev, current: i + 1, currentBusiness: displayName }));

      const finalReviewURL = getReviewUrl(listing, allUserListings);
      const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(finalReviewURL)}&t=${Date.now()}`;

      try {
        // 1. Pre-fetch the exact QR code as base64
        const base64Qr = await fetchImageAsBase64(qrApiUrl);

        // 2. Assign to state
        setActiveQrData({
          business: displayName,
          qrImage: base64Qr,
          reviewUrl: finalReviewURL
        });

        // 3. Wait for DOM flush (since image is base64, no network load is needed in the hidden div)
        await new Promise(resolve => setTimeout(resolve, 500));

        if (!qrCardRef.current) continue;

        const dataUrl = await toPng(qrCardRef.current, {
          cacheBust: true,
          pixelRatio: 5,
          style: { borderRadius: '32px' }
        });

        const uploadRes = await fetch("/api/magic-qr/upload-s3", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userEmail: targetUser.userEmail || "unknown@example.com",
            businessTitle: listing.title || "Unknown Business",
            locality: locality,
            locationId: listing.locationId || listing.name || `fallback-${Date.now()}-${i}`,
            base64Image: dataUrl,
            reviewUrl: finalReviewURL,
          })
        });

        const uploadData = await uploadRes.json();
        if (uploadData.success) {
          successCount++;
          const activeLocationId = listing.locationId || listing.name || `fallback-${Date.now()}-${i}`;
          setGeneratedQrsStatus(prev => ({ ...prev, [activeLocationId]: uploadData.url }));
        }
      } catch (err) {
        console.error("Error generating/uploading QR for listing:", listing.title, err);
      }

      // Safety wait between iterations
      await new Promise(resolve => setTimeout(resolve, 800));
    }

    setIsGeneratingBulk(false);
    toast.success(`Successfully generated ${successCount} QRs for ${targetUser.userName}!`);
  };

  const exportUserQrsToDoc = (user) => {
    const generatedListings = (user.listings || []).filter(l => {
      const id = l.locationId || l.name;
      return generatedQrsStatus[id];
    });

    if (generatedListings.length === 0) {
      toast.error("No generated QRs found for this user.");
      return;
    }

    let docHtml = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" 
          xmlns:w="urn:schemas-microsoft-com:office:word" 
          xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <title>QR Codes - ${user.userName}</title>
      <style>
        body {
          font-family: 'Segoe UI', Arial, sans-serif;
          text-align: center;
          margin: 0;
          padding: 0;
        }
        h1 {
          color: #4f46e5;
          margin-top: 20px;
          margin-bottom: 5px;
          font-size: 26px;
        }
        .subtitle {
          color: #666;
          margin-bottom: 20px;
          font-size: 15px;
        }
        .page-break {
          page-break-before: always;
        }
        table.wrapper {
          width: 100%;
        }
        td.wrapper-td {
          text-align: center;
          vertical-align: middle;
          padding: 30px 0;
        }
        .qr-box {
          width: 300px;
          margin: 0 auto;
          text-align: center;
        }
        .title {
          font-size: 20px;
          font-weight: bold;
          color: #111;
          margin: 0;
        }
        .locality {
          font-size: 15px;
          color: #555;
          margin-top: 6px;
        }
      </style>
    </head>
    <body>
      <h1>Magic QR Codes</h1>
      <p class="subtitle">
        Generated for: <b>${user.userName}</b> (${user.userEmail})
      </p>
  `;

    const chunkSize = 2;
    for (let i = 0; i < generatedListings.length; i += chunkSize) {
      const chunk = generatedListings.slice(i, i + chunkSize);
      if (i > 0) docHtml += `<div class="page-break"></div>`;

      chunk.forEach(item => {
        const id = item.locationId || item.name;
        const imgUrl = generatedQrsStatus[id];
        const locality =
          item.address?.locality ||
          item.storefrontAddress?.locality ||
          "Headquarters";

        docHtml += `
        <table class="wrapper">
          <tr>
            <td class="wrapper-td">
              <div class="qr-box">
                <!-- ✅ FIX: Use width/height attributes + Word-specific mso style -->
                <img 
                  src="${imgUrl}" 
                  width="300" 
                  height="300"
                  style="width:300px; height:300px; display:block; margin:0 auto 12px auto; mso-style-priority:99;"
                  alt="QR Code" 
                />
                <p class="title">${item.title}</p>
                <p class="locality">${locality}</p>
              </div>
            </td>
          </tr>
        </table>
      `;
      });
    }

    docHtml += `</body></html>`;

    const blob = new Blob(['\ufeff', docHtml], {
      type: 'application/msword'
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;

    const safeName = (user.userName || "user")
      .replace(/[^a-z0-9]/gi, '_')
      .toLowerCase();

    link.download = `QR_Codes_${safeName}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`Downloaded ${generatedListings.length} QRs!`);
  };



  const exportToCSV = () => {
    if (allUserListings.length === 0) return;
    const csvData = [];
    allUserListings.forEach((user) => {
      (user.listings || []).forEach((listing) => {
        const locality = listing.address?.locality || listing.storefrontAddress?.locality || "";
        csvData.push({
          "User Email": user.userEmail,
          "User Name": user.userName,
          "Listing Title": listing.title,
          "Location ID": listing.locationId || listing.name,
          Verified: listing.verified ? "Yes" : "No",
          Category: listing.category,
          Phone: listing.phone || listing.phoneNumbers?.primaryPhone || "",
          Website: listing.website,
          City: locality,
          "QR Generated": (generatedQrsStatus[listing.locationId] || generatedQrsStatus[listing.name]) ? "Yes" : "No",
          "Last Updated": new Date(user.lastUpdated).toLocaleString(),
        });
      });
    });

    const csv = [
      Object.keys(csvData[0]).join(","),
      ...csvData.map((row) => Object.values(row).map((val) => `"${val}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `user-listings-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const pendingCount = Math.max(0, stats.totalListings - stats.totalGeneratedQrs);

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
    <Box sx={{ minHeight: "100vh", bgcolor: "#f8fafc", pb: 8 }}>
      <Toaster position="top-right" />

      {/* HIDDEN QR RENDERER */}
      <div style={{ position: "absolute", left: "-9999px", top: "-9999px" }}>
        <div ref={qrCardRef} style={{ width: '340px', borderRadius: '32px', overflow: 'hidden', backgroundColor: 'white', position: 'relative' }}>
          <div style={{ position: 'absolute', inset: 0 }}>
            <div style={{ position: 'absolute', top: 0, left: 0, width: '50%', height: '50%', backgroundColor: '#facc15', borderRadius: '0 0 120px 0' }} />
            <div style={{ position: 'absolute', top: 0, right: 0, width: '50%', height: '50%', backgroundColor: '#ef4444', borderRadius: '0 0 0 120px' }} />
            <div style={{ position: 'absolute', bottom: 0, left: 0, width: '50%', height: '50%', backgroundColor: '#22c55e', borderRadius: '0 120px 0 0' }} />
            <div style={{ position: 'absolute', bottom: 0, right: 0, width: '50%', height: '50%', backgroundColor: '#dbeafe', borderRadius: '120px 0 0 0' }} />
          </div>
          <div style={{ position: 'relative', backgroundColor: 'white', margin: '16px', borderRadius: '24px', padding: '24px', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '32px', fontWeight: 900 }}>
                <span style={{ color: '#3b82f6' }}>G</span>
                <span style={{ color: '#ef4444' }}>o</span>
                <span style={{ color: '#facc15' }}>o</span>
                <span style={{ color: '#3b82f6' }}>g</span>
                <span style={{ color: '#22c55e' }}>l</span>
                <span style={{ color: '#ef4444' }}>e</span>
              </span>
            </div>
            <div style={{ color: '#facc15', marginBottom: '8px' }}>★ ★ ★ ★ ★</div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>Scan to Rate Us on <span style={{ fontWeight: 800 }}>Google</span></div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#111827', marginTop: '4px', marginBottom: '16px' }}>{activeQrData.business || "Business"}</div>
            {activeQrData.qrImage && (
              <div style={{ position: 'relative', display: 'inline-block', backgroundColor: 'white', padding: '16px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
                <img src={activeQrData.qrImage} alt="QR" style={{ width: '208px', height: '208px', borderRadius: '12px' }} crossOrigin="anonymous" />
              </div>
            )}
            <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '12px', wordBreak: 'break-all' }}>{activeQrData.reviewUrl}</div>
            <div style={{ margin: '16px 0', borderBottom: '1px solid #e5e7eb' }}></div>
            <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: 700 }}>Powered by <span style={{ color: '#4338ca' }}>LimbuAI</span></div>
          </div>
        </div>
      </div>

      <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', color: 'white', borderRadius: 0 }}>
        <Container maxWidth="xl">
          <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
            <Box>
              <Typography variant="h5" fontWeight={800} gutterBottom sx={{ fontSize: { xs: '1.5rem', md: '1.75rem' }, m: 0 }}>Store Business</Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>Monitor and manage connected business listings</Typography>
            </Box>
            <Button
              variant="contained" size="small"
              startIcon={<RefreshIcon className={loading ? "animate-spin" : ""} sx={{ fontSize: 18 }} />}
              onClick={() => { fetchAllUserListings(1); fetchGeneratedQrStatus(); }}
              sx={{ bgcolor: 'rgba(255,255,255,0.2)', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }, textTransform: 'none', fontWeight: 600, px: 2 }}
            >
              Refresh
            </Button>
          </Box>
        </Container>
      </Paper>

      <Container maxWidth="xl" sx={{ mt: -2.5 }}>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <StatItem title="Total Users" value={stats.totalUsers} icon={<PeopleIcon sx={{ fontSize: 20 }} />} color="#3b82f6" />
          <StatItem title="Total Listings" value={stats.totalListings} icon={<BusinessIcon sx={{ fontSize: 20 }} />} color="#8b5cf6" />
          <StatItem title="Verified" value={stats.verifiedListings} icon={<VerifiedIcon sx={{ fontSize: 20 }} />} color="#10b981" />
          <StatItem title="QRs Ready" value={stats.totalGeneratedQrs} icon={<QrCodeIcon sx={{ fontSize: 20 }} />} color="#6366f1" />
          <StatItem title="Pending" value={pendingCount} icon={<PendingIcon sx={{ fontSize: 20 }} />} color="#f59e0b" />
        </Grid>

        <Paper elevation={1} sx={{ p: 1.8, mb: 3, borderRadius: 2.5, border: '1px solid #e2e8f0' }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6} lg={6}>
              <TextField
                fullWidth size="small" placeholder="Search by name or email..."
                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon fontSize="small" color="action" /></InputAdornment>) }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#f8fafc' } }}
              />
            </Grid>
            <Grid item xs={12} sm={8} md={4} lg={4}>
              <Box display="flex" gap={0.5} bgcolor="#f1f5f9" p={0.6} borderRadius={2}>
                {["all", "generated", "pending"].map((status) => (
                  <Button
                    key={status} size="small" variant={qrFilterStatus === status ? "contained" : "text"}
                    onClick={() => setQrFilterStatus(status)}
                    color={status === "generated" ? "info" : status === "pending" ? "warning" : "primary"}
                    sx={{ textTransform: 'capitalize', borderRadius: 1.5, flex: 1, fontSize: '0.8rem', fontWeight: 700, py: 0.6 }}
                  >
                    {status === "all" ? "All" : status === "generated" ? "Ready" : "Pending"}
                  </Button>
                ))}
              </Box>
            </Grid>
            <Grid item xs={12} sm={4} md={2} lg={2}>
              <Button
                fullWidth size="medium" variant="contained" startIcon={<DownloadIcon sx={{ fontSize: 18 }} />}
                onClick={exportToCSV}
                sx={{ bgcolor: '#1e293b', '&:hover': { bgcolor: '#0f172a' }, textTransform: 'none', py: 0.9, borderRadius: 2, fontWeight: 700, fontSize: '0.85rem' }}
              >
                CSV Export
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {loading ? (
          <Box display="flex" justifyContent="center" py={10}><CircularProgress size={40} /></Box>
        ) : filteredUsers.length === 0 ? (
          <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 4, border: '1px dashed #cbd5e1', bgcolor: 'transparent' }}>
            <PeopleIcon sx={{ fontSize: 48, color: '#cbd5e1', mb: 1.5 }} /><Typography variant="body1" color="textSecondary" fontWeight={600}>No matches found</Typography>
          </Paper>
        ) : (
          <Box display="flex" flexDirection="column" gap={2.5}>
            {filteredUsers.map((user, idx) => {
              const userGeneratedCount = (user.listings || []).filter(l => generatedQrsStatus[l.locationId || l.name]).length;
              const pendingQrs = (user.listings?.length || 0) - userGeneratedCount;
              const hasGenerated = userGeneratedCount > 0;

              return (
                <Card key={idx} elevation={1} sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                  <Box sx={{ p: 2, background: 'linear-gradient(to right, #ffffff, #f8fafc)', borderBottom: '1px solid #f1f5f9' }}>
                    <Grid container justifyContent="space-between" alignItems="center" spacing={1.5}>
                      <Grid item xs={12} sm={6}>
                        <Box display="flex" alignItems="center" gap={1.5}>
                          <Avatar sx={{ bgcolor: '#4f46e5', width: 40, height: 40 }}>{user.userName?.charAt(0).toUpperCase() || 'U'}</Avatar>
                          <Box>
                            <Typography variant="subtitle1" fontWeight={700} sx={{ lineHeight: 1.2 }}>{user.userName || 'Anonymous'}</Typography>
                            <Typography variant="caption" color="textSecondary">{user.userEmail}</Typography>
                          </Box>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Box display="flex" alignItems="center" justifyContent={{ xs: 'flex-start', sm: 'flex-end' }} gap={2} flexWrap="wrap">
                          <Box textAlign="right" sx={{ mr: 1 }}>
                            <Typography variant="caption" color="textSecondary" fontWeight={700} sx={{ display: 'block', fontSize: '0.65rem' }}>LOCATIONS</Typography>
                            <Typography variant="h6" fontWeight={800} color="primary" sx={{ lineHeight: 1 }}>{user.totalListings}</Typography>
                          </Box>
                          <Box display="flex" gap={1}>
                            {pendingQrs > 0 ? (
                              <Button
                                variant="contained" size="small" startIcon={<QrCodeIcon sx={{ fontSize: 16 }} />}
                                onClick={() => processUserQrs(user)} disabled={isGeneratingBulk}
                                sx={{ borderRadius: 1.5, textTransform: 'none', fontSize: '0.7rem' }}
                              >
                                {pendingQrs} QRs
                              </Button>
                            ) : (
                              <Chip size="small" icon={<CheckCircleIcon sx={{ fontSize: 14 }} />} label="Ready" color="success" sx={{ height: 26, fontWeight: 700 }} />
                            )}
                            {hasGenerated && (
                              <>
                                <Button
                                  variant="outlined" color="secondary" size="small" startIcon={<FileTextIcon sx={{ fontSize: 16 }} />}
                                  onClick={() => exportUserQrsToDoc(user)} sx={{ borderRadius: 1.5, textTransform: 'none', fontSize: '0.7rem' }}

                                >
                                  Docs
                                </Button>
                                <Button
                                  variant="outlined" color="info" size="small" startIcon={<DownloadIcon sx={{ fontSize: 16 }} />}
                                  onClick={() => downloadAllUserPngs(user)} sx={{ borderRadius: 1.5, textTransform: 'none', fontSize: '0.7rem' }}
                                >
                                  PNG
                                </Button>
                              </>
                            )}
                          </Box>
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>
                  <CardContent sx={{ p: 2 }}>
                    <Grid container spacing={1.5}>
                      {(user.listings || []).map((listing, i) => {
                        const id = listing.locationId || listing.name;
                        const qrUrl = generatedQrsStatus[id];
                        const locality = listing.address?.locality || listing.storefrontAddress?.locality || listing.profile?.address?.locality || 'N/A';
                        const phone = listing.phone || listing.phoneNumbers?.primaryPhone || listing.primaryPhone || 'N/A';
                        return (
                          <Grid item xs={12} sm={6} md={4} key={i}>
                            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, bgcolor: '#fcfdff', height: '100%', display: 'flex', flexDirection: 'column' }}>
                              <Box display="flex" justifyContent="space-between" mb={1}>
                                <Typography variant="caption" fontWeight={800} sx={{ lineHeight: 1.2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{listing.title || listing.locationName || 'Unnamed Business'}</Typography>
                                {qrUrl ? <CheckCircleIcon color="success" sx={{ fontSize: 16 }} /> : <CancelIcon sx={{ color: '#cbd5e1', fontSize: 16 }} />}
                              </Box>
                              <Box display="flex" alignItems="center" gap={0.5} mb={0.2}><MapPinIcon sx={{ fontSize: 12, color: '#94a3b8' }} /><Typography variant="caption" color="textSecondary">{locality}</Typography></Box>
                              <Box display="flex" alignItems="center" gap={0.5} mb={1}><PhoneIcon sx={{ fontSize: 12, color: '#94a3b8' }} /><Typography variant="caption" color="textSecondary">{phone}</Typography></Box>
                              <Box sx={{ mt: 'auto', pt: 1, borderTop: '1px dashed #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                {qrUrl ? (
                                  <>
                                    <Chip size="small" label="READY" color="success" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 800 }} />
                                    <Box display="flex" gap={1} alignItems="center">
                                      <Typography variant="caption" component="a" href={qrUrl} target="_blank" color="primary" sx={{ fontWeight: 700, textDecoration: 'none', cursor: 'pointer' }}>View</Typography>
                                      <DownloadIcon
                                        onClick={() => downloadSingleQrAsPng(listing, user)}
                                        color="secondary"
                                        sx={{ fontSize: 18, cursor: 'pointer', '&:hover': { opacity: 0.8 } }}
                                        titleAccess="Download PNG"
                                      />
                                    </Box>
                                  </>
                                ) : <Chip size="small" label="PENDING" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700 }} />}
                              </Box>
                            </Paper>
                          </Grid>
                        );
                      })}
                    </Grid>
                  </CardContent>
                </Card>
              );
            })}
            <Box textAlign="center" mt={3}><Button variant="outlined" size="small" onClick={handleLoadMore} disabled={isLoadingMore || page >= totalPages} sx={{ px: 5, py: 1.2, borderRadius: 2.5, fontWeight: 700, fontSize: '0.85rem' }}>{isLoadingMore ? "Loading..." : page >= totalPages ? "All Businesses Loaded" : "Load More Businesses"}</Button></Box>
          </Box>
        )}
      </Container>

      <Backdrop open={isGeneratingBulk} sx={{ zIndex: 9999, color: '#fff', flexDirection: 'column', backdropFilter: 'blur(4px)' }}>
        <Paper sx={{ p: 4, borderRadius: 5, width: 400, textAlign: 'center' }}>
          <Typography variant="h6" fontWeight={800} color="primary" gutterBottom>Generating Magic QRs</Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>Processing {bulkProgress.current} of {bulkProgress.total}</Typography>
          <LinearProgress variant="determinate" value={(bulkProgress.current / bulkProgress.total) * 100} sx={{ height: 10, borderRadius: 5, mb: 2 }} />
          <Typography variant="caption" color="textSecondary">{bulkProgress.currentBusiness}</Typography>
        </Paper>
      </Backdrop>
    </Box>
  );
}

function StatItem({ title, value, icon, color }) {
  return (
    <Grid item xs={6} sm={4} md={2.4}>
      <Paper elevation={1} sx={{ p: 2, borderRadius: 3, display: 'flex', alignItems: 'center', gap: 2, border: '1px solid #e2e8f0', height: '100%' }}>
        <Box sx={{ p: 1, borderRadius: 2, bgcolor: `${color}12`, color: color, display: 'flex' }}>{icon}</Box>
        <Box>
          <Typography variant="caption" color="textSecondary" fontWeight={800} sx={{ textTransform: 'uppercase', fontSize: '0.6rem' }}>{title}</Typography>
          <Typography variant="h6" fontWeight={900} sx={{ lineHeight: 1 }}>{value}</Typography>
        </Box>
      </Paper>
    </Grid>
  );
}
