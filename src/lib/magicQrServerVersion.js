/**
 * Bump MAGIC_QR_SERVER_CARD_VERSION when server PNG pipeline changes so chatbot
 * does not keep returning stale S3 assets from MongoDB.
 */
export const MAGIC_QR_SERVER_CARD_VERSION = 4;

/** Saved from dashboard html-to-image — safe to reuse if reviewUrl matches. */
export const MAGIC_QR_CLIENT_UPLOAD_VERSION = 9999;
