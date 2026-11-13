import Image from "next/image";

const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.limbu.ai.limbu";
const APP_STORE_URL = "https://apps.apple.com/in/app/limbu-ai/id6757781138";

// Real screens from the Limbu AI app (public/images/app-screens).
const SCREENS = [
  { src: "/images/app-screens/app-home.webp", alt: "Limbu AI app home with connected accounts and GMB tools" },
  { src: "/images/app-screens/app-tools.webp", alt: "Limbu AI app with social media and website SEO tools" },
];

const STATS = [
  <>
    <span className="text-amber-600">4.3 ★</span> from 3,000+ Reviews
  </>,
  <>
    <strong className="text-slate-900">10,000+</strong> Active Users
  </>,
  <>✅ GMB, Social, Ads & SEO</>,
  <>⚡ Android & iPhone</>,
];

/** A phone frame around one app screenshot. */
function PhoneScreen({ src, alt, className = "" }) {
  return (
    <div
      className={`overflow-hidden rounded-[34px] border-[7px] border-slate-900 bg-slate-900 shadow-[0_30px_60px_-15px_rgba(15,23,42,0.45)] ${className}`}
    >
      <Image src={src} alt={alt} width={540} height={1142} sizes="240px" className="block h-auto w-full rounded-[27px]" />
    </div>
  );
}

/** "Download the Limbu.AI App" banner with real app screens. */
export default function AppDownloadSection() {
  return (
    <section className="w-full overflow-hidden border-y border-slate-100 bg-white">
      <div className="mx-auto max-w-7xl px-2 py-2.5">
        <div className="relative flex flex-col items-center gap-8 overflow-hidden rounded-3xl border border-amber-100 bg-[linear-gradient(160deg,#ffffff_0%,#fffbeb_60%,#f0f9ff_100%)] px-4 py-8 sm:px-6 sm:py-10 text-center md:flex-row md:justify-between md:px-16 md:py-12 md:text-left">
          {/* Copy + actions */}
          <div className="z-10 max-w-xl flex-1">
            <span className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-[11px] font-bold text-amber-800">
              ✦ The Limbu AI App
            </span>

            <h2
              className="font-black leading-tight tracking-tight text-slate-900"
              style={{ fontFamily: "var(--font-heading)", fontSize: "clamp(1.6rem, 3vw, 2.4rem)" }}
            >
              Download the <span className="text-amber-600">Limbu.AI</span> App
            </h2>

            <p className="mt-3 text-[15px] leading-relaxed text-slate-600">
              Manage your Google Business Profile, social media, ads and SEO from your phone. Available on Android and
              iPhone.
            </p>

            <a
              href="/appUrl"
              className="mt-6 inline-block rounded-xl bg-[#F5C400] px-7 py-3.5 text-sm font-extrabold text-black shadow-[0_4px_15px_rgba(245,196,0,0.25)] transition hover:-translate-y-0.5 hover:shadow-[0_10px_20px_rgba(217,119,6,0.3)]"
            >
              🎁 JOIN NOW AND GET 500 COINS
            </a>

            <div className="mt-6 flex flex-wrap justify-center gap-2.5 md:justify-start">
              <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer" className="transition hover:scale-105">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg"
                  alt="Get it on Google Play"
                  className="block h-10"
                />
              </a>
              <a href={APP_STORE_URL} target="_blank" rel="noopener noreferrer" className="transition hover:scale-105">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg"
                  alt="Download on the App Store"
                  className="block h-10"
                />
              </a>
            </div>
          </div>

          {/* Two real app screens, slightly fanned */}
          <div className="relative flex h-[380px] w-full max-w-[420px] flex-shrink-0 items-center justify-center sm:h-[440px]">
            <span className="absolute h-72 w-72 rounded-full bg-[#facc15]/25 blur-3xl" aria-hidden="true" />
            <PhoneScreen {...SCREENS[1]} className="absolute left-4 top-8 w-[170px] -rotate-6 sm:left-6 sm:w-[200px]" />
            <PhoneScreen {...SCREENS[0]} className="absolute right-4 top-0 w-[180px] rotate-3 sm:right-6 sm:w-[210px]" />
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 py-4 text-[13px] font-medium text-slate-500">
          {STATS.map((stat, i) => (
            <span key={i} className="flex items-center gap-6">
              {i > 0 && <span className="text-slate-300">|</span>}
              <span>{stat}</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
