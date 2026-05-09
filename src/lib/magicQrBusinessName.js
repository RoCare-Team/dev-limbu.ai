/**
 * Same label as useMagicQR.js → QRPreviewCard `business` prop (title + locality).
 */
export function formatMagicQrBusinessTitle(location) {
  if (!location) return "Business";
  const title = location.title || "Business";
  const locality =
    location.locality || location.storefrontAddress?.locality || "";
  return locality ? `${title} - ${locality}` : title;
}
