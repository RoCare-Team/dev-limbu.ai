"use client";

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
  Divider,
  InputAdornment,
  CircularProgress,
  LinearProgress,
  Backdrop,
  Avatar,
  Tooltip,
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
import { toPng } from "html-to-image";
import Image from "next/image";
import PowerRedLogo from "../../../../public/images/bg-logo.png";
import { toast, Toaster } from "react-hot-toast";

export default function AdminDashboard() {
  const [allUserListings, setAllUserListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
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
      const response = await fetch(`/api/admin/saveBussiness?page=${pageNumber}&limit=20`);
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

    if (filterStatus !== "all") {
      filtered = filtered
        .map((user) => ({
          ...user,
          listings: user.listings.filter((listing) =>
            filterStatus === "verified" ? listing.verified : !listing.verified
          ),
        }))
        .filter((user) => user.listings.length > 0);
    }

    return filtered;
  }, [allUserListings, searchTerm, filterStatus]);

  // Logic Helpers
  const generateSlug = (str) => str.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-").replace(/^-|-$/g, "");
  
  const getReviewUrl = (listing, allUserListingsData) => {
    const title = listing.title || "";
    const locality = listing.address?.locality || listing.storefrontAddress?.locality || "";
    const addressLine = listing.address?.addressLines?.[0] || listing.storefrontAddress?.addressLines?.[0] || "";

    const baseSlug = generateSlug(`${title}-${locality}`);
    const allListingsArray = (allUserListingsData || []).flatMap(u => u.listings || []);

    const conflicts = allListingsArray.filter(loc => {
      if (loc.locationId === listing.locationId || loc.name === listing.name) return false;
      const t = loc.title || "";
      const l = loc.address?.locality || loc.storefrontAddress?.locality || "";
      return generateSlug(`${t}-${l}`) === baseSlug;
    });

    let finalSlug = baseSlug;

    if (conflicts.length > 0 && addressLine) {
      const addressParts = generateSlug(addressLine).split('-');
      const suffix = addressParts.slice(0, 2).join('-');
      if (suffix) {
        finalSlug = `${baseSlug}-${suffix}`;
      } else {
        const idPart = (listing.locationId || listing.name || "00000").substring(0, 5);
        finalSlug = `${baseSlug}-${idPart}`;
      }
    }

    return `${window.location.origin}/reviews/${finalSlug}`;
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
      const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(finalReviewURL)}`;
      
      setActiveQrData({
        business: displayName,
        qrImage: qrImageUrl,
        reviewUrl: finalReviewURL
      });

      // Increased timeout to ensure QR image loads in DOM
      await new Promise(resolve => setTimeout(resolve, 500));

      if (!qrCardRef.current) continue;

      try {
        const dataUrl = await toPng(qrCardRef.current, { 
          cacheBust: true, 
          pixelRatio: 5,
          style: {
            borderRadius: '32px',
          }
        });
        
        const uploadRes = await fetch("/api/magic-qr/upload-s3", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userEmail: targetUser.userEmail || "unknown@example.com",
            businessTitle: listing.title || "Unknown Business",
            locality: locality,
            locationId: listing.locationId || listing.name || `fallback-${Date.now()}-${i}`,
            base64Image: dataUrl
          })
        });

        const uploadData = await uploadRes.json();
        
        if (uploadData.success) {
          successCount++;
          const activeLocationId = listing.locationId || listing.name || `fallback-${Date.now()}-${i}`;
          setGeneratedQrsStatus(prev => ({ ...prev, [activeLocationId]: uploadData.url }));
        }
      } catch (err) {
        console.error("Error generating/uploading QR:", err);
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
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
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <title>QR Codes - ${user.userName}</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; text-align: center; margin: 0; padding: 0; }
          .page-break { page-break-before: always; }
          .qr-container { width: 100%; text-align: center; padding: 40px 0; }
          img { width: 380px; height: 380px; border-radius: 16px; display: block; margin: 0 auto 15px auto; }
          .title { font-size: 20px; font-weight: bold; color: #111; margin: 0; padding: 0; }
          .locality { font-size: 15px; color: #555; margin-top: 6px; }
          h1 { color: #4f46e5; margin-top: 20px; margin-bottom: 5px; font-size: 26px; }
          p.subtitle { color: #666; margin-bottom: 20px; font-size: 15px; }
          table.wrapper { width: 100%; }
          td.wrapper-td { text-align: center; vertical-align: middle; padding: 20px; }
        </style>
      </head>
      <body>
        <h1>Magic QR Codes</h1>
        <p class="subtitle">Generated for: <b>${user.userName}</b> (${user.userEmail})</p>
    `;

    const chunkSize = 2;
    for (let i = 0; i < generatedListings.length; i += chunkSize) {
      const chunk = generatedListings.slice(i, i + chunkSize);
      if (i > 0) docHtml += `<div class="page-break"></div>`;

      chunk.forEach(item => {
        const id = item.locationId || item.name;
        const imgUrl = generatedQrsStatus[id];
        const locality = item.address?.locality || item.storefrontAddress?.locality || "Headquarters";
        docHtml += `
          <table class="wrapper"><tr><td class="wrapper-td">
            <div class="qr-container">
              <img src="${imgUrl}" alt="QR Code" width="380" height="380" />
              <p class="title">${item.title}</p>
              <p class="locality">${locality}</p>
            </div>
          </td></tr></table>
        `;
      });
    }

    docHtml += `</body></html>`;

    const blob = new Blob(['\ufeff', docHtml], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const safeName = (user.userName || "user").replace(/[^a-z0-9]/gi, '_').toLowerCase();
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
      ...csvData.map((row) =>
        Object.values(row).map((val) => `"${val}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `user-listings-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const pendingCount = Math.max(0, stats.totalListings - stats.totalGeneratedQrs);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f8fafc", pb: 8 }}>
      <Toaster position="top-right" />
      
      {/* HIDDEN QR RENDERER - Using plain HTML/CSS for robust capture */}
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
      
      {/* Header Section */}
      <Paper elevation={0} sx={{ p: 4, background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', color: 'white', borderRadius: 0 }}>
        <Container maxWidth="xl">
          <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
            <Box>
              <Typography variant="h3" fontWeight={800} gutterBottom sx={{ fontSize: { xs: '2rem', md: '3rem' } }}>Store Business</Typography>
              <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>Manage and monitor all connected user business listings</Typography>
            </Box>
            <Button 
              variant="contained" 
              startIcon={<RefreshIcon className={loading ? "animate-spin" : ""} />}
              onClick={() => { fetchAllUserListings(1); fetchGeneratedQrStatus(); }}
              sx={{ bgcolor: 'rgba(255,255,255,0.2)', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }, textTransform: 'none', fontWeight: 600 }}
            >
              Refresh Data
            </Button>
          </Box>
        </Container>
      </Paper>

      <Container maxWidth="xl" sx={{ mt: -4 }}>
        {/* Stats Grid */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <StatItem title="Total Users" value={stats.totalUsers} icon={<PeopleIcon />} color="#3b82f6" />
          <StatItem title="Total Listings" value={stats.totalListings} icon={<BusinessIcon />} color="#8b5cf6" />
          <StatItem title="Verified" value={stats.verifiedListings} icon={<VerifiedIcon />} color="#10b981" />
          <StatItem title="QRs Ready" value={stats.totalGeneratedQrs} icon={<QrCodeIcon />} color="#6366f1" />
          <StatItem title="Pending QRs" value={pendingCount} icon={<PendingIcon />} color="#f59e0b" />
        </Grid>

        {/* Filter Section */}
        <Paper elevation={2} sx={{ p: 3, mb: 4, borderRadius: 4 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} lg={6}>
              <TextField
                fullWidth
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
              />
            </Grid>
            <Grid item xs={12} md={8} lg={4}>
              <Box display="flex" gap={1}>
                {["all", "verified", "unverified"].map((status) => (
                  <Button
                    key={status}
                    variant={filterStatus === status ? "contained" : "outlined"}
                    onClick={() => setFilterStatus(status)}
                    color={status === "verified" ? "success" : status === "unverified" ? "error" : "primary"}
                    sx={{ textTransform: 'capitalize', borderRadius: 2, flex: 1 }}
                  >
                    {status}
                  </Button>
                ))}
              </Box>
            </Grid>
            <Grid item xs={12} md={4} lg={2}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={exportToCSV}
                sx={{ bgcolor: '#1e293b', '&:hover': { bgcolor: '#0f172a' }, textTransform: 'none', py: 1.5, borderRadius: 3 }}
              >
                Export CSV
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* User Content */}
        {loading ? (
          <Box display="flex" justifyContent="center" py={10}>
            <CircularProgress size={60} />
          </Box>
        ) : filteredUsers.length === 0 ? (
          <Paper sx={{ p: 10, textAlign: 'center', borderRadius: 4 }}>
            <PeopleIcon sx={{ fontSize: 80, color: '#cbd5e1', mb: 2 }} />
            <Typography variant="h5" color="textSecondary" fontWeight={600}>No Users Found</Typography>
          </Paper>
        ) : (
          <Box display="flex" flexDirection="column" gap={4}>
            {filteredUsers.map((user, idx) => {
              const userGeneratedCount = (user.listings || []).filter(l => {
                const id = l.locationId || l.name;
                return generatedQrsStatus[id];
              }).length;
              const pendingQrs = (user.listings?.length || 0) - userGeneratedCount;
              const hasGenerated = userGeneratedCount > 0;

              return (
                <Card key={idx} elevation={3} sx={{ borderRadius: 4, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                  <Box sx={{ p: 3, background: 'linear-gradient(to right, #f8fafc, #eff6ff)', borderBottom: '1px solid #e2e8f0' }}>
                    <Grid container justifyContent="space-between" alignItems="center" spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Avatar sx={{ bgcolor: '#4f46e5', width: 56, height: 56 }}>{user.userName?.charAt(0).toUpperCase() || 'U'}</Avatar>
                          <Box>
                            <Typography variant="h6" fontWeight={700}>{user.userName || 'Anonymous'}</Typography>
                            <Typography variant="body2" color="textSecondary">{user.userEmail}</Typography>
                          </Box>
                        </Box>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Box display="flex" alignItems="center" justifyContent={{ xs: 'flex-start', md: 'flex-end' }} gap={3} flexWrap="wrap">
                          <Box textAlign="right">
                            <Typography variant="caption" color="textSecondary" fontWeight={700} sx={{ display: 'block' }}>LOCATIONS</Typography>
                            <Typography variant="h5" fontWeight={800} color="primary">{user.totalListings}</Typography>
                          </Box>
                          <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />
                          <Box display="flex" flexDirection={{ xs: 'row', sm: 'column' }} gap={1} flexWrap="wrap">
                            {pendingQrs === 0 ? (
                              <Chip icon={<CheckCircleIcon />} label="All QRs Ready" color="success" sx={{ fontWeight: 700 }} />
                            ) : (
                              <Button 
                                variant="contained" 
                                startIcon={<QrCodeIcon />} 
                                size="small"
                                onClick={() => processUserQrs(user)}
                                disabled={isGeneratingBulk}
                                sx={{ borderRadius: 2, textTransform: 'none' }}
                              >
                                Generate {pendingQrs} QRs
                              </Button>
                            )}
                            {hasGenerated && (
                              <Button 
                                variant="outlined" 
                                color="secondary"
                                startIcon={<FileTextIcon />} 
                                size="small"
                                onClick={() => exportUserQrsToDoc(user)}
                                sx={{ borderRadius: 2, textTransform: 'none' }}
                              >
                                Export to DOC
                              </Button>
                            )}
                          </Box>
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>
                  <CardContent sx={{ p: 3, bgcolor: '#ffffff' }}>
                    <Grid container spacing={2}>
                      {(user.listings || []).map((listing, i) => {
                        const id = listing.locationId || listing.name;
                        const qrUrl = generatedQrsStatus[id];
                        const locality = listing.address?.locality || listing.storefrontAddress?.locality || "N/A";
                        const phone = listing.phone || listing.phoneNumbers?.primaryPhone || 'N/A';

                        return (
                          <Grid item xs={12} sm={6} lg={4} key={i}>
                            <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, '&:hover': { borderColor: '#4f46e5', bgcolor: '#fcfdff' }, transition: '0.2s', height: '100%', display: 'flex', flexDirection: 'column' }}>
                              <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1.5} gap={1}>
                                <Typography variant="subtitle2" fontWeight={800} color="#1e293b" sx={{ lineHeight: 1.3 }}>
                                  {listing.title}
                                </Typography>
                                {qrUrl ? (
                                  <Tooltip title="QR Generated">
                                    <CheckCircleIcon color="success" sx={{ fontSize: 20, mt: 0.3 }} />
                                  </Tooltip>
                                ) : (
                                  <Tooltip title="QR Not Generated">
                                    <CancelIcon sx={{ color: '#cbd5e1', fontSize: 20, mt: 0.3 }} />
                                  </Tooltip>
                                )}
                              </Box>
                              <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                                <MapPinIcon sx={{ fontSize: 14, color: '#94a3b8', flexShrink: 0 }} />
                                <Typography variant="caption" color="textSecondary">{locality}</Typography>
                              </Box>
                              <Box display="flex" alignItems="center" gap={1} mb={2}>
                                <PhoneIcon sx={{ fontSize: 14, color: '#94a3b8', flexShrink: 0 }} />
                                <Typography variant="caption" color="textSecondary">{phone}</Typography>
                              </Box>
                              <Box sx={{ mt: 'auto', pt: 1.5 }}>
                                <Divider sx={{ mb: 1.5, borderStyle: 'dashed' }} />
                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                  {qrUrl ? (
                                    <>
                                      <Chip size="small" color="success" label="QR READY" sx={{ height: 22, fontSize: '0.65rem', fontWeight: 800, bgcolor: '#ecfdf5', color: '#15803d', border: '1px solid #10b981' }} />
                                      <Typography variant="caption" component="a" href={qrUrl} target="_blank" color="primary" sx={{ fontWeight: 700, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>View Image</Typography>
                                    </>
                                  ) : (
                                    <Chip size="small" label="PENDING" sx={{ height: 22, fontSize: '0.65rem', fontWeight: 700, bgcolor: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0' }} />
                                  )}
                                </Box>
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

            {page < totalPages && (
              <Box textAlign="center" mt={2}>
                <Button 
                  variant="outlined" 
                  size="large" 
                  onClick={handleLoadMore} 
                  disabled={isLoadingMore}
                  sx={{ px: 6, py: 1.5, borderRadius: 4, fontWeight: 700, border: '2px solid' }}
                >
                  {isLoadingMore ? <CircularProgress size={24} sx={{ mr: 1 }} /> : "Load More Businesses"}
                </Button>
              </Box>
            )}
          </Box>
        )}
      </Container>

      {/* Bulk Progress Overlay */}
      <Backdrop open={isGeneratingBulk} sx={{ zIndex: 9999, color: '#fff', flexDirection: 'column', backdropFilter: 'blur(4px)' }}>
        <Paper elevation={10} sx={{ p: 4, borderRadius: 5, width: { xs: '90%', sm: 450 }, textAlign: 'center' }}>
          <Typography variant="h5" fontWeight={800} gutterBottom color="primary">Generating Magic QRs</Typography>
          <Typography variant="body1" fontWeight={600} color="textSecondary" sx={{ mb: 1 }}>
            Processing {bulkProgress.current} of {bulkProgress.total}
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
            Please wait while we generate high-quality branded assets
          </Typography>
          <LinearProgress 
            variant="determinate" 
            value={(bulkProgress.current / bulkProgress.total) * 100} 
            sx={{ height: 12, borderRadius: 6, mb: 4, bgcolor: '#e2e8f0', '& .MuiLinearProgress-bar': { borderRadius: 6 } }}
          />
          <Box bgcolor="#f8fafc" p={2.5} borderRadius={3} mb={2} border="1px solid #e2e8f0">
            <Typography variant="subtitle2" color="textSecondary" gutterBottom>Currently Processing:</Typography>
            <Typography variant="body2" fontWeight={800} color="#1e293b" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {bulkProgress.currentBusiness}
            </Typography>
          </Box>
          <Typography variant="caption" color="error" fontWeight={800} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
            <PendingIcon sx={{ fontSize: 14 }} /> DO NOT REFRESH OR CLOSE TAB
          </Typography>
        </Paper>
      </Backdrop>
    </Box>
  );
}

function StatItem({ title, value, icon, color }) {
  return (
    <Grid item xs={12} sm={6} md={2.4}>
      <Paper elevation={3} sx={{ 
        p: 3, 
        borderRadius: 4, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        borderLeft: `8px solid ${color}`,
        transition: 'transform 0.2s',
        '&:hover': { transform: 'translateY(-4px)' }
      }}>
        <Box>
          <Typography variant="caption" color="textSecondary" fontWeight={800} sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>{title}</Typography>
          <Typography variant="h4" fontWeight={900} sx={{ color: '#1e293b' }}>{value}</Typography>
        </Box>
        <Box sx={{ p: 1.5, borderRadius: 3, bgcolor: `${color}15`, color: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {icon}
        </Box>
      </Paper>
    </Grid>
  );
}
