'use client';

import { useEffect, useRef, useState } from 'react';

// ─── CONFIG ────────────────────────────────────────────────────────────────────
// Replace with your actual deployed domain
const APP_URL = 'https://yourdomain.com/app';
// ──────────────────────────────────────────────────────────────────────────────

export default function QRPage() {
  const canvasRef = useRef(null);
  const [qrLibLoaded, setQrLibLoaded] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Dynamically load qrcodejs library
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
    script.onload = () => setQrLibLoaded(true);
    document.body.appendChild(script);
    return () => document.body.removeChild(script);
  }, []);

  useEffect(() => {
    if (!qrLibLoaded) return;

    const container = document.getElementById('qr-container');
    if (!container) return;
    container.innerHTML = '';

    // Generate QR Code
    new window.QRCode(container, {
      text: APP_URL,
      width: 256,
      height: 256,
      colorDark: '#1a1a2e',
      colorLight: '#ffffff',
      correctLevel: window.QRCode.CorrectLevel.H,
    });
  }, [qrLibLoaded]);

  const handleDownload = () => {
    const container = document.getElementById('qr-container');
    const canvas = container?.querySelector('canvas');
    if (!canvas) return;

    // Add padding + branding to download image
    const size = 320;
    const offscreen = document.createElement('canvas');
    offscreen.width = size;
    offscreen.height = size + 60;
    const ctx = offscreen.getContext('2d');

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.roundRect(0, 0, size, size + 60, 20);
    ctx.fill();

    // QR code centered
    ctx.drawImage(canvas, (size - 256) / 2, (size - 256) / 2, 256, 256);

    // Footer text
    ctx.fillStyle = '#6b21a8';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Limbu AI', size / 2, size + 20);

    ctx.fillStyle = '#9ca3af';
    ctx.font = '12px sans-serif';
    ctx.fillText('Scan to download the app', size / 2, size + 42);

    const link = document.createElement('a');
    link.download = 'limbu-ai-qr.png';
    link.href = offscreen.toDataURL('image/png');
    link.click();
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(APP_URL).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-purple-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 text-center">

        {/* Header */}
        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-600 to-purple-700 rounded-2xl flex items-center justify-center shadow-lg">
          <span className="text-2xl font-bold text-white">LA</span>
        </div>

        <h1 className="text-xl font-bold text-gray-800 mb-1">Limbu AI</h1>
        <p className="text-sm text-gray-500 mb-6">
          Scan with your phone — auto-redirects to the right store
        </p>

        {/* QR Code Box */}
        <div className="bg-gray-50 rounded-2xl p-5 mb-6 border border-gray-100 inline-flex flex-col items-center w-full">
          <div id="qr-container" className="flex items-center justify-center" style={{ minHeight: 256 }}>
            {!qrLibLoaded && (
              <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
            )}
          </div>

          <div className="mt-3 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-xs text-gray-500 font-medium">
              iOS → App Store &nbsp;|&nbsp; Android → Google Play
            </span>
          </div>
        </div>

        {/* URL Display */}
        <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-4 py-3 mb-5 text-left">
          <span className="text-xs text-gray-600 flex-1 truncate font-mono">{APP_URL}</span>
          <button
            onClick={handleCopyUrl}
            className="text-purple-600 text-xs font-semibold whitespace-nowrap hover:text-purple-800 transition-colors"
          >
            {copied ? '✅ Copied!' : 'Copy'}
          </button>
        </div>

        {/* Download Button */}
        <button
          onClick={handleDownload}
          disabled={!qrLibLoaded}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-700 text-white py-3 px-6 rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed mb-3"
        >
          ⬇️ Download QR Code (PNG)
        </button>

        {/* Instructions */}
        <div className="text-left bg-purple-50 rounded-xl p-4 text-xs text-gray-600 space-y-1.5">
          <p className="font-semibold text-purple-800 mb-2">📋 Instructions:</p>
          <p>1. Download this QR image</p>
          <p>2. Print it or add it to your marketing material</p>
          <p>3. iOS users → redirected to App Store</p>
          <p>4. Android users → redirected to Google Play</p>
          <p>5. Desktop users → see a WhatsApp link form</p>
        </div>
      </div>
    </div>
  );
}