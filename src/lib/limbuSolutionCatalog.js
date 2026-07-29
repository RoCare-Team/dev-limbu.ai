/**
 * Limbu AI ka product catalog — sirf wahi features jo actually product mein hain.
 * AI analysis ka prompt isi list se solutions pick karta hai, taki sales agent ko
 * koi aisa feature na bataye jo exist hi nahi karta.
 *
 * `problemSignals` bataata hai ki Google profile mein kya dikhe to ye feature
 * pitch karna hai.
 */
export const LIMBU_SOLUTIONS = [
  {
    key: "magicQr",
    name: "Magic QR",
    what: "QR card jo khush customer ko Google review pe bhejta hai aur naaraz customer ka feedback private capture kar leta hai — negative review public hone se pehle filter ho jaata hai.",
    problemSignals: [
      "negative ya kam rating (rating < 4)",
      "reviews kam aa rahe hain",
      "purane negative reviews public dikh rahe hain",
    ],
  },
  {
    key: "gmbHealth",
    name: "GMB Health Check",
    what: "Google Business Profile ka health score aur audit — har missing cheez (photos, hours, categories, description, services) ka point-wise fix list deta hai.",
    problemSignals: [
      "profile adhoora hai",
      "photos nahi hain",
      "opening hours missing",
      "category galat ya missing",
      "description khaali",
    ],
  },
  {
    key: "gmbInsights",
    name: "GMB Insights Report",
    what: "Google se actual performance data — kitne calls aaye, kitne direction requests, kaunse search keywords se log mile — ka PDF report jo email/WhatsApp pe jaata hai.",
    problemSignals: [
      "owner ko pata hi nahi profile se business aa raha hai ya nahi",
      "koi tracking nahi hai",
      "ROI prove karna hai",
    ],
  },
  {
    key: "aiPosts",
    name: "AI Post Generation",
    what: "AI se image aur video posts bante hain jo GMB, Facebook, Instagram, Pinterest, LinkedIn aur YouTube pe publish hote hain.",
    problemSignals: [
      "profile pe koi post nahi",
      "content banane ka time nahi",
      "posts purane ho gaye hain",
    ],
  },
  {
    key: "automation",
    name: "Smart Scheduling & Post Automation",
    what: "Automation plan set kar do — daily/weekly/monthly frequency pe posts apne aap publish hote rehte hain, post consistency kabhi tootegi nahi.",
    problemSignals: [
      "posting consistency nahi hai",
      "kabhi kabhi post karte hain",
      "mahino se koi update nahi",
    ],
  },
  {
    key: "reviewReply",
    name: "Review Management & Auto Reply",
    what: "Har Google review ka AI se automatic ya suggested reply — negative review ka professional jawab turant chala jaata hai.",
    problemSignals: [
      "reviews ka reply nahi ho raha",
      "negative reviews unanswered hain",
      "reply karne ka time nahi",
    ],
  },
  {
    key: "keywordPlanner",
    name: "Keyword Planner",
    what: "AI keyword research — volume, competition aur intent ke saath. Yahi keywords automation mein daal do to posts keyword ke basis pe bante hain, jisse ranking improve hoti hai.",
    problemSignals: [
      "kaunse keyword pe rank karna hai pata nahi",
      "posts mein keywords nahi hain",
      "competitor upar aa rahe hain",
    ],
  },
  {
    key: "localRank",
    name: "Local Rank Tracker",
    what: "Geo-grid rank tracking — sheher ke alag alag points pe aapki ranking aur competitors ka comparison, snapshot ke saath taki improvement dikhe.",
    problemSignals: [
      "'near me' search mein nahi aate",
      "ranking pata nahi",
      "competitor upar hai",
    ],
  },
  {
    key: "websiteBuilder",
    name: "AI Website Builder",
    what: "AI se hosted business website ban jaati hai, lead capture form ke saath — aane wali leads dashboard mein dikhti hain.",
    problemSignals: [
      "website hai hi nahi",
      "website purani ya dead hai",
      "leads capture nahi ho rahi",
    ],
  },
  {
    key: "assets",
    name: "Assets Management",
    what: "Brand assets library — logo, colour palette, product images, background — jisse har AI post brand ke hisaab se consistent dikhta hai.",
    problemSignals: [
      "photos poor quality hain",
      "branding consistent nahi hai",
      "har post alag dikhta hai",
    ],
  },
  {
    key: "videoGen",
    name: "AI Image & Video Generation",
    what: "Professional images aur videos AI se — photoshoot ya designer ki zaroorat nahi.",
    problemSignals: [
      "photos bahut kam hain",
      "video content bilkul nahi",
      "photos professional nahi lagte",
    ],
  },
  {
    key: "gbpService",
    name: "GBP Management Service",
    what: "Done-for-you Google Business Profile management — Limbu ki team poora profile handle karti hai.",
    problemSignals: [
      "owner ko khud manage karne ka time nahi",
      "technical samajh nahi aata",
      "full service chahiye",
    ],
  },
];

/** Prompt mein daalne layak compact catalog text. */
export const LIMBU_SOLUTION_CATALOG_TEXT = LIMBU_SOLUTIONS.map(
  (s) =>
    `- ${s.name}: ${s.what}\n  (tab pitch karo jab: ${s.problemSignals.join("; ")})`,
).join("\n");

/** Valid feature names — AI ka output isi se validate hota hai. */
export const LIMBU_SOLUTION_NAMES = LIMBU_SOLUTIONS.map((s) => s.name);
