import { useState, useEffect, useMemo, useCallback } from "react";
import { getLocalStorage } from "@/utils/storage";
import { toast } from "react-hot-toast";
import { toPng } from "html-to-image";
import {
  buildMagicQrReviewUrl,
  getMagicQrLocationIdentifier,
} from "@/lib/magicQrReviewUrl";

/**
 * @param {object} [options]
 * @param {object[]} [options.locations] — When set (including `[]`), skips localStorage and uses this list (e.g. GMB session / chatbot payload). When omitted, loads `locationDetails` from localStorage.
 * @param {string} [options.initialLocationId] — Selected row when `locations` is provided; falls back to first row id.
 * @param {string} [options.baseUrl] — Review link origin (default: `window.location.origin` in the browser).
 */
export function useMagicQR(options = {}) {
  const { locations: locationsProp, initialLocationId, baseUrl: baseUrlOption } = options;

  const [isMounted, setIsMounted] = useState(false);
  const [allLocations, setAllLocations] = useState([]);
  const [selectedLocationId, setSelectedLocationId] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (locationsProp === undefined) return;
    const locs = Array.isArray(locationsProp) ? locationsProp : [];
    setAllLocations(locs);
    if (locs.length === 0) {
      setSelectedLocationId("");
      return;
    }
    setSelectedLocationId((prev) => {
      if (prev && locs.some((l) => getMagicQrLocationIdentifier(l) === prev)) {
        return prev;
      }
      if (
        initialLocationId &&
        locs.some((l) => getMagicQrLocationIdentifier(l) === initialLocationId)
      ) {
        return initialLocationId;
      }
      return getMagicQrLocationIdentifier(locs[0]);
    });
  }, [locationsProp, initialLocationId]);

  useEffect(() => {
    if (locationsProp !== undefined) return;
    const raw = getLocalStorage("locationDetails");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setAllLocations(parsed);
          setSelectedLocationId(getMagicQrLocationIdentifier(parsed[0]));
        }
      } catch (e) {
        console.error("localStorage parse error", e);
      }
    }
  }, [locationsProp]);

  // Derived State: Selected Location
  const selectedLocation = useMemo(() => {
    return (
      allLocations.find((loc) => getMagicQrLocationIdentifier(loc) === selectedLocationId) ||
      allLocations[0] ||
      null
    );
  }, [allLocations, selectedLocationId]);

  // Derived State: Business Name
  const business = useMemo(() => {
    if (!selectedLocation) return "";
    const title = selectedLocation.title || "";
    const locality = selectedLocation.storefrontAddress?.locality || selectedLocation.locality || "";
    return locality ? `${title} - ${locality}` : title;
  }, [selectedLocation]);

  // Derived State: Clean Review URL (without query params)
  const reviewUrl = useMemo(() => {
    if (!selectedLocation) return "";
    const base =
      baseUrlOption || (typeof window !== "undefined" ? window.location.origin : "");
    return buildMagicQrReviewUrl({
      location: selectedLocation,
      allLocations,
      baseUrl: base,
    });
  }, [selectedLocation, allLocations, baseUrlOption]);

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