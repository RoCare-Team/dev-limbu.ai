// Detail pages for the "Website SEO" tiles on the home page (/seo-tools/<slug>).
// Keyed by the home-section item key, so web.js can point each tile at its page.
// Only Website Audit is free; everything else is a paid service or a coin tool.

export const SEO_TOOLS = {
  website_audit: {
    slug: "website-audit",
    plan: "Standard SEO",
    name: "Website Audit",
    free: true,
    icon: { type: "material", value: "fact_check" },
    metaTitle: "Free Website Audit | SEO, Speed & Error Check | Limbu.ai",
    metaDescription:
      "Get a free website audit from Limbu.ai: page speed, SEO, broken links, mobile issues and Google indexing checked, with a clear fix list for your business.",
    tagline: "Find out exactly what is stopping your website from ranking — free.",
    intro:
      "Our experts check your website the way Google does: speed, mobile experience, on-page SEO, indexing and technical errors. You get a simple report with every problem ranked by impact and a step-by-step fix list, at no cost.",
    features: [
      { title: "Page speed check", text: "Core Web Vitals (LCP, CLS, INP) on mobile and desktop, with what slows each page down." },
      { title: "On-page SEO review", text: "Titles, meta descriptions, headings, images and keyword use on your key pages." },
      { title: "Technical health", text: "Broken links, redirects, duplicate pages, sitemap, robots.txt and HTTPS issues." },
      { title: "Google indexing", text: "Which pages Google has indexed, which it skipped and why." },
      { title: "Mobile experience", text: "Layout, tap targets and font sizes on real phone screens." },
      { title: "Local SEO signals", text: "Name, address and phone consistency, Google Business Profile link and local schema." },
    ],
    steps: [
      "Share your website URL on WhatsApp or call",
      "Our SEO team runs the full audit",
      "Get your report and fix list within 48 hours",
    ],
    deliverables: [
      "Overall SEO health score",
      "Issue list ranked by priority",
      "Page-wise speed report",
      "Step-by-step fix list",
      "Free consultation call on the report",
    ],
    whoFor: ["Business owners whose website gets few enquiries", "Sites that recently dropped in Google", "Anyone planning a redesign or SEO campaign"],
    faqs: [
      { q: "Is the website audit really free?", a: "Yes. The audit and report are free with no obligation. If you want us to fix the issues, we will share a quote separately." },
      { q: "How long does the audit take?", a: "You get the report within 48 hours of sharing your website URL." },
      { q: "Do you need access to my website?", a: "No. The audit works from the public website. Google Search Console access helps us add indexing data, but it is optional." },
      { q: "Which websites can you audit?", a: "Any website — WordPress, Shopify, Wix, custom-built or a site made with Limbu AI." },
    ],
    cta: { label: "Get Free Audit", whatsapp: "Hi Limbu AI, I want a free website audit for my website." },
  },

  onpage_seo: {
    slug: "onpage-seo",
    plan: "Basic SEO",
    name: "Onpage SEO",
    icon: { type: "material", value: "description" },
    metaTitle: "On-Page SEO Services | Titles, Content & Meta Tags | Limbu.ai",
    metaDescription:
      "On-page SEO services by Limbu.ai: keyword-optimised titles, meta tags, headings, content, internal links and schema so your pages rank higher on Google.",
    tagline: "Make every page on your website easy for Google to understand and rank.",
    intro:
      "On-page SEO is everything on the page itself: the title Google shows, the headings, the content, images and links. Our team optimises each important page around the keywords your customers actually search, so Google ranks it for the right queries.",
    features: [
      { title: "Title & meta tags", text: "Click-worthy titles and descriptions written around your target keywords." },
      { title: "Heading structure", text: "Clean H1–H3 structure so Google and readers understand each page." },
      { title: "Content optimisation", text: "Existing content improved for keywords, depth and readability." },
      { title: "Image SEO", text: "Compressed images with descriptive file names and alt text." },
      { title: "Internal linking", text: "Links between your pages that pass authority to the ones that matter." },
      { title: "Schema markup", text: "LocalBusiness, Service, FAQ and Product schema for rich results." },
    ],
    steps: ["We map keywords to each of your pages", "Our team optimises titles, content and tags", "You track rankings in a monthly report"],
    deliverables: ["Keyword-to-page map", "Optimised titles and meta descriptions", "Updated headings and content", "Schema markup", "Monthly ranking report"],
    whoFor: ["Websites with pages that never show up on Google", "Service businesses targeting local keywords", "Online stores with many product pages"],
    faqs: [
      { q: "How soon will I see results?", a: "Most pages start moving within 4–8 weeks of optimisation; competitive keywords can take longer." },
      { q: "Will you change my website design?", a: "No. We change text, tags and code that affect SEO, not your design." },
      { q: "Is on-page SEO free?", a: "No, it is part of our SEO plans. Start with a free Website Audit to see what your pages need." },
    ],
    cta: { label: "Talk to an SEO Expert", whatsapp: "Hi Limbu AI, I want on-page SEO for my website." },
  },

  technical_seo: {
    slug: "technical-seo",
    plan: "Standard SEO",
    name: "Technical SEO",
    icon: { type: "material", value: "settings" },
    metaTitle: "Technical SEO Services | Site Speed, Indexing & Errors | Limbu.ai",
    metaDescription:
      "Technical SEO by Limbu.ai: faster page speed, Core Web Vitals, crawl and indexing fixes, sitemaps, redirects and HTTPS so Google can rank your website.",
    tagline: "Fix the hidden problems that stop Google from crawling and ranking your site.",
    intro:
      "Great content cannot rank if Google cannot crawl it or if the page loads slowly. Technical SEO fixes the foundation: speed, indexing, site structure and errors, so every other SEO effort actually pays off.",
    features: [
      { title: "Speed optimisation", text: "Image compression, caching, lazy loading and script clean-up for better Core Web Vitals." },
      { title: "Indexing fixes", text: "Search Console errors resolved so your pages get into Google." },
      { title: "Crawl errors & redirects", text: "404s, redirect chains and broken links fixed." },
      { title: "Sitemap & robots.txt", text: "Correct XML sitemap and crawl rules submitted to Google." },
      { title: "Mobile-first fixes", text: "Layout and usability issues fixed for Google's mobile-first index." },
      { title: "HTTPS & security", text: "Mixed content and certificate issues resolved." },
    ],
    steps: ["We crawl your site and read Search Console", "Our developers fix speed and errors", "We re-test and monitor every month"],
    deliverables: ["Technical issue report", "Speed and Core Web Vitals fixes", "Clean sitemap and robots.txt", "Search Console error resolution", "Monthly health check"],
    whoFor: ["Slow websites with high bounce rates", "Sites with pages missing from Google", "Websites after a migration or redesign"],
    faqs: [
      { q: "Do you need access to my website?", a: "Yes, technical fixes need hosting or CMS access. We work safely and keep a backup before changes." },
      { q: "Can you fix a WordPress site?", a: "Yes — WordPress, Shopify, Wix and custom-built sites." },
      { q: "Is technical SEO free?", a: "No, it is a paid service. Our free Website Audit shows which technical fixes your site needs first." },
    ],
    cta: { label: "Talk to an SEO Expert", whatsapp: "Hi Limbu AI, I want technical SEO for my website." },
  },

  offpage_seo: {
    slug: "offpage-seo",
    plan: "Standard SEO",
    name: "Offpage SEO",
    icon: { type: "material", value: "link" },
    metaTitle: "Off-Page SEO Services | Backlinks & Citations | Limbu.ai",
    metaDescription:
      "Off-page SEO by Limbu.ai: quality backlinks, local citations, business listings and brand mentions that build your website's authority and Google rankings.",
    tagline: "Build the authority Google needs to trust and rank your business.",
    intro:
      "Off-page SEO is what other websites say about you. Links from trusted sites, consistent business listings and brand mentions tell Google your business is real and reliable. We build these signals steadily and safely.",
    features: [
      { title: "Quality backlinks", text: "Relevant, white-hat links from real websites in your industry." },
      { title: "Local citations", text: "Your business listed on trusted Indian and global directories." },
      { title: "NAP consistency", text: "Same name, address and phone everywhere Google looks." },
      { title: "Guest posts", text: "Articles on niche blogs that link back to your site." },
      { title: "Brand mentions", text: "Your business mentioned on news, blogs and community sites." },
      { title: "Toxic link check", text: "Spammy links found and disavowed to protect your ranking." },
    ],
    steps: ["We study your competitors' backlinks", "Our team builds links and citations every month", "You see every link in a monthly report"],
    deliverables: ["Competitor backlink analysis", "Monthly backlinks and citations", "Citation clean-up", "Disavow file if needed", "Monthly link report"],
    whoFor: ["Businesses in competitive local markets", "New websites with no authority yet", "Sites stuck on page 2 of Google"],
    faqs: [
      { q: "Are your backlinks safe?", a: "Yes. We only use white-hat methods — no private blog networks or paid link farms." },
      { q: "How many links will I get?", a: "It depends on your plan; every link is listed in your monthly report." },
      { q: "Is off-page SEO free?", a: "No, it is part of our paid SEO plans." },
    ],
    cta: { label: "Talk to an SEO Expert", whatsapp: "Hi Limbu AI, I want off-page SEO and backlinks for my website." },
  },

  keyword_research: {
    slug: "keyword-research",
    plan: "Basic SEO",
    name: "Keyword Research",
    icon: { type: "material", value: "key" },
    metaTitle: "Keyword Research Tool | Find Keywords That Bring Customers | Limbu.ai",
    metaDescription:
      "Find the keywords your customers search with Limbu.ai keyword research: search volume, competition and local keyword ideas for your business and city.",
    tagline: "Find the exact words your customers type into Google.",
    intro:
      "Ranking for the wrong keywords brings traffic that never converts. Our keyword research tool shows what people in your area search, how many search each month and how hard each keyword is, so you target the ones that bring paying customers.",
    features: [
      { title: "Search volume", text: "Monthly searches for every keyword, including your city." },
      { title: "Competition level", text: "See which keywords are easy wins and which need more work." },
      { title: "Local keyword ideas", text: "\"Near me\" and city-based keywords for your services." },
      { title: "Related searches", text: "Long-tail questions and phrases your customers use." },
      { title: "Competitor keywords", text: "Find keywords your competitors already rank for." },
      { title: "Export & plan", text: "Save keyword lists to plan pages, posts and ads." },
    ],
    steps: ["Enter your service and city", "Get keyword ideas with volume and competition", "Use them in your website, posts and ads"],
    deliverables: ["Keyword ideas with search volume", "Competition score", "Local and long-tail keywords", "Saved keyword lists"],
    whoFor: ["Businesses starting SEO or Google Ads", "Content writers planning blogs", "Anyone choosing what pages to create"],
    faqs: [
      { q: "Do I need an account?", a: "Yes, sign up to use the keyword research tool inside your Limbu AI dashboard." },
      { q: "Is keyword research free?", a: "No. It is part of Limbu AI plans and coins; new accounts get coins to try it." },
      { q: "Does it show local keywords?", a: "Yes, you can search by city to see local keyword demand." },
    ],
    cta: { label: "Open Keyword Research", href: "/keyword-planner", needsLogin: true, whatsapp: "Hi Limbu AI, I want help with keyword research." },
  },

  content_management: {
    slug: "content-management",
    plan: "Advanced SEO",
    name: "Content Management",
    icon: { type: "material", value: "edit_note" },
    metaTitle: "SEO Content Writing Services | Blogs & Pages | Limbu.ai",
    metaDescription:
      "SEO content by Limbu.ai: keyword-researched blogs, service pages and city pages written and published for your website to bring more Google traffic.",
    tagline: "SEO blogs and pages written and published for you, every month.",
    intro:
      "Google ranks websites that answer customers' questions. Our writers create keyword-researched blogs, service pages and city pages for your business, optimise them for SEO and publish them on your website on a regular schedule.",
    features: [
      { title: "SEO blog posts", text: "Helpful articles that answer what your customers search." },
      { title: "Service pages", text: "One focused page per service, written to rank and convert." },
      { title: "City / area pages", text: "Location pages to rank in every area you serve." },
      { title: "Content refresh", text: "Old pages updated so they climb back up in Google." },
      { title: "Publishing", text: "We format, add images and publish on your website." },
      { title: "Content calendar", text: "A monthly plan so your site grows consistently." },
    ],
    steps: ["We plan topics from keyword research", "Writers create and optimise each piece", "We publish and track rankings"],
    deliverables: ["Monthly content calendar", "SEO-optimised blogs and pages", "Images and formatting", "Publishing on your site", "Monthly traffic report"],
    whoFor: ["Businesses without time to write", "Sites with thin or outdated content", "Brands targeting many services or cities"],
    faqs: [
      { q: "Is the content original?", a: "Yes, every piece is written for your business and checked for plagiarism." },
      { q: "Can I review before publishing?", a: "Yes, you can approve every article before it goes live." },
      { q: "Is content management free?", a: "No, it is a paid monthly service." },
    ],
    cta: { label: "Talk to a Content Expert", whatsapp: "Hi Limbu AI, I want SEO blogs and pages written for my website." },
  },

  local_rank_tracker: {
    slug: "local-rank-tracker",
    plan: "Advanced SEO",
    name: "Local Rank Tracker",
    icon: { type: "material", value: "location_searching" },
    metaTitle: "Local Rank Tracker | Google Maps Ranking by Area | Limbu.ai",
    metaDescription:
      "Track your Google Maps ranking area by area with the Limbu.ai local rank tracker. See where you show up, where competitors beat you, and track growth.",
    tagline: "See where your business ranks on Google Maps, street by street.",
    intro:
      "Your Google Maps ranking changes from one area to the next. The local rank tracker checks your position for each keyword across a grid around your business, so you see exactly where customers can find you and where competitors win.",
    features: [
      { title: "Area-wise grid", text: "Your Maps rank shown on a map grid around your location." },
      { title: "Keyword tracking", text: "Track the searches that matter, like \"dentist near me\"." },
      { title: "Competitor view", text: "See who ranks above you in each area." },
      { title: "Ranking history", text: "Watch your rank improve week after week." },
      { title: "Visibility score", text: "One number that shows your overall local reach." },
      { title: "GBP linked", text: "Works with your connected Google Business Profile." },
    ],
    steps: ["Connect your Google Business Profile", "Pick keywords and your service area", "Track your rank on the map grid"],
    deliverables: ["Map-grid ranking report", "Keyword-wise positions", "Competitor list per area", "Ranking history"],
    whoFor: ["Shops, clinics and services that rely on Maps", "Businesses with multiple service areas", "Agencies reporting local results"],
    faqs: [
      { q: "Do I need a Google Business Profile?", a: "Yes, the tracker works with your connected Google Business Profile." },
      { q: "Is the rank tracker free?", a: "No. It is part of Limbu AI plans and coins." },
      { q: "How often is ranking checked?", a: "You can run a new check any time from your dashboard." },
    ],
    cta: { label: "Open Rank Tracker", href: "/dashboard", needsLogin: true, whatsapp: "Hi Limbu AI, I want to track my Google Maps ranking." },
  },

  backlinker: {
    slug: "backlinker",
    plan: "Advanced SEO",
    name: "Backlinker",
    icon: { type: "material", value: "hub" },
    metaTitle: "Backlink Building Service | Quality Backlinks | Limbu.ai",
    metaDescription:
      "Limbu.ai Backlinker builds quality, relevant backlinks for your website every month to grow domain authority and Google rankings safely.",
    tagline: "Quality backlinks every month that grow your site's authority.",
    intro:
      "Backlinks are still one of Google's strongest ranking signals. Backlinker builds relevant, high-quality links to your website every month from real sites, profiles and directories — with a full report of every link we create.",
    features: [
      { title: "Relevant sites only", text: "Links from websites related to your industry and location." },
      { title: "Mixed link profile", text: "Directories, profiles, articles and citations for a natural profile." },
      { title: "Anchor text planning", text: "Branded and keyword anchors balanced to stay safe." },
      { title: "Page targeting", text: "Links pointed at the pages you want to rank." },
      { title: "Link monitoring", text: "We check that links stay live and indexed." },
      { title: "Full transparency", text: "Every link listed with its URL in your report." },
    ],
    steps: ["Choose the pages you want to rank", "We build links every month", "Track every link and your authority growth"],
    deliverables: ["Monthly backlinks", "Link report with URLs", "Authority growth tracking", "Indexing checks"],
    whoFor: ["New websites with low authority", "Businesses in competitive niches", "Sites that already did on-page SEO"],
    faqs: [
      { q: "Are the backlinks safe?", a: "Yes, we only build white-hat links from real websites." },
      { q: "Will I see the links?", a: "Yes, every link is listed in your monthly report." },
      { q: "Is Backlinker free?", a: "No, it is a paid monthly service." },
    ],
    cta: { label: "Talk to an SEO Expert", whatsapp: "Hi Limbu AI, I want quality backlinks for my website." },
  },
};

export const SEO_TOOL_LIST = Object.entries(SEO_TOOLS).map(([key, tool]) => ({ key, ...tool }));

export const seoToolBySlug = (slug) => SEO_TOOL_LIST.find((t) => t.slug === slug) || null;

export const seoToolPath = (tool) => `/seo-tools/${tool.slug}`;

export const LIMBU_WHATSAPP = "917065178662";

export const whatsappHref = (text) => `https://wa.me/${LIMBU_WHATSAPP}?text=${encodeURIComponent(text)}`;
