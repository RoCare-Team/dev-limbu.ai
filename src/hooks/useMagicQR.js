import { useState, useEffect, useMemo, useCallback } from "react";
import { getLocalStorage } from "@/utils/storage";
import { toast } from "react-hot-toast";
import { toPng } from "html-to-image";
import { generateUniversalSlug } from "@/utils/slugify";

export function useMagicQR() {
  const [isMounted, setIsMounted] = useState(false);
  const [allLocations, setAllLocations] = useState([]);
  const [selectedLocationId, setSelectedLocationId] = useState("");
  const [copied, setCopied] = useState(false);

  // Initial Load from LocalStorage
  useEffect(() => {
    setIsMounted(true);
    const raw = getLocalStorage("locationDetails");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setAllLocations(parsed);
          setSelectedLocationId(parsed[0].locationId);
        }
      } catch (e) {
        console.error("localStorage parse error", e);
      }
    }
  }, []);

  // Derived State: Selected Location
  const selectedLocation = useMemo(() => {
    return allLocations.find((loc) => loc.locationId === selectedLocationId) || allLocations[0] || null;
  }, [allLocations, selectedLocationId]);

  // Derived State: Business Name
  const business = useMemo(() => {
    if (!selectedLocation) return "";
    const title = selectedLocation.title || "";
    const locality = selectedLocation.storefrontAddress?.locality || selectedLocation.locality || "";
    return locality ? `${title} - ${locality}` : title;
  }, [selectedLocation]);

  const getLocationIdentifier = (location) => {
    return (location?.locationId || location?.name || location?.locationResourceName || "").toString();
  };

  const buildUniqueReviewSlug = (location, locations) => {
    if (!location) return "";

    const baseSlug = generateUniversalSlug(location);
    if (!baseSlug) return "";

    const currentId = getLocationIdentifier(location);
    const conflict = (locations || []).some((loc) => {
      const locId = getLocationIdentifier(loc);
      if (!loc || !locId || locId === currentId) return false;
      return generateUniversalSlug(loc) === baseSlug;
    });

    if (!conflict) {
      return baseSlug;
    }

    const idPart = currentId.substring(0, 5);
    return `${baseSlug}-${idPart}`;
  };

  // Derived State: Clean Review URL (without query params)
  const reviewUrl = useMemo(() => {
    if (!selectedLocation) return "";
    const slug = buildUniqueReviewSlug(selectedLocation, allLocations);
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    return `${baseUrl}/reviews/${slug}`;
  }, [selectedLocation, allLocations]);

  // Derived State: QR Image URL
  const qrImage = useMemo(() => {
    if (!reviewUrl) return "";
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(reviewUrl)}`;
  }, [reviewUrl]);

  // Callbacks
  const handleLocationChange = useCallback((locationId) => {
    setSelectedLocationId(locationId);
  }, []);

  const copyToClipboard = useCallback(() => {
    if (!reviewUrl) return;
    navigator.clipboard.writeText(reviewUrl).then(() => {
      setCopied(true);
      toast.success("Magic Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    });
  }, [reviewUrl]);

  const shareLink = useCallback(async () => {
    if (!reviewUrl) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Review ${business}`,
          text: "Share your feedback!",
          url: reviewUrl,
        });
      } catch (e) {
        copyToClipboard();
      }
    } else {
      copyToClipboard();
    }
  }, [reviewUrl, business, copyToClipboard]);

  const downloadQR = useCallback(async (qrElement) => {
    if (!qrElement) return;
    try {
      // Ensure we capture the exact dimensions to avoid truncation
      const width = qrElement.offsetWidth;
      const height = qrElement.offsetHeight;

      const dataUrl = await toPng(qrElement, {
        cacheBust: true,
        includeQueryParams: true,
        pixelRatio: 3,
        width: width,
        height: height,
        style: {
          margin: "0",
          transform: "scale(1)",
        },
      });

      const link = document.createElement('a');
      link.download = `${business}-qr-review.png`;
      link.href = dataUrl;
      link.click();
      toast.success("Magic QR downloaded successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate download");
    }
  }, [business]);

  const printQR = useCallback(async (qrElement) => {
    if (!qrElement) return;
    try {
      // Ensure we capture the exact dimensions to avoid truncation
      const width = qrElement.offsetWidth;
      const height = qrElement.offsetHeight;

      const dataUrl = await toPng(qrElement, {
        cacheBust: true,
        includeQueryParams: true,
        pixelRatio: 3,
        width: width,
        height: height,
        style: {
          margin: "0",
          transform: "scale(1)",
        },
      });

      const printWindow = window.open("", "_blank");
      if(printWindow){
          printWindow.document.write(`
            <!DOCTYPE html>
            <html>
              <head>
                <title>Print QR - ${business}</title>
                <style>
                  @media print {
                    @page { size: auto; margin: 0; }
                    body { margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; height: 100vh; width: 100vw; }
                    img { max-width: 100%; max-height: 100vh; object-fit: contain; }
                  }
                  body { margin: 0; display: flex; justify-content: center; align-items: center; height: 100vh; background-color: #fff; }
                  img { max-width: 100%; max-height: 100vh; object-fit: contain; box-shadow: 0 20px 50px rgba(0,0,0,0.1); border-radius: 2rem; }
                </style>
              </head>
              <body>
                <img src="${dataUrl}" />
                <script>
                  window.onload = () => {
                    setTimeout(() => {
                      window.print();
                      window.close();
                    }, 500);
                  };
                </script>
              </body>
            </html>
          `);
          printWindow.document.close();
      }
    } catch (err) {
      console.error(err);
    }
  }, [business]);

  return {
    isMounted,
    allLocations,
    selectedLocationId,
    business,
    reviewUrl,
    qrImage,
    copied,
    handleLocationChange,
    copyToClipboard,
    shareLink,
    downloadQR,
    printQR
  };
}