/**
 * Coin price of each AI video type, charged per second of video.
 * Users pick MIN_SECONDS..MAX_SECONDS in steps of STEP_SECONDS.
 */
export const VIDEO_MIN_SECONDS = 10;
export const VIDEO_MAX_SECONDS = 60;
export const VIDEO_STEP_SECONDS = 10;

export const VIDEO_PRICING = [
  {
    key: "text_to_video",
    title: "Text To Video",
    description: "Type your offer or script, AI makes a ready-to-post reel.",
    coinsPerSecond: 30, // 300 coins / 10s
    href: "/video-generation",
  },
  {
    key: "ai_avatar_video",
    title: "AI Avatar Video",
    description: "A realistic AI presenter talks about your business.",
    coinsPerSecond: 20,
    href: "/video-generation/ai-avatar-video",
  },
  {
    key: "cgi_video",
    title: "CGI Product Video",
    description: "Cinematic 3D-style ad for your product.",
    coinsPerSecond: 30, // 300 coins / 10s
    href: "/video-generation/cgi-video",
  },
  {
    key: "image_to_video",
    title: "Image To Video",
    description: "Turn a product or shop photo into a moving video.",
    coinsPerSecond: 10, // 100 coins / 10s
    href: "/video-generation/image-to-video",
  },
];

export const videoCoins = (coinsPerSecond, seconds) => coinsPerSecond * seconds;

// [10, 20, ..., 60]
export const VIDEO_DURATION_OPTIONS = Array.from(
  { length: (VIDEO_MAX_SECONDS - VIDEO_MIN_SECONDS) / VIDEO_STEP_SECONDS + 1 },
  (_, i) => VIDEO_MIN_SECONDS + i * VIDEO_STEP_SECONDS
);

export const coinsPerSecondFor = (key) =>
  VIDEO_PRICING.find((item) => item.key === key).coinsPerSecond;
