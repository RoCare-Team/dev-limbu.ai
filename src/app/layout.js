import "./globals.css";
import ClientLayout from "../app/client-layout";
import SessionProviderWrapper from "./providers/SessionProviderWrapper";
import Script from "next/script";
import { Inter } from "next/font/google";
import AuthGuard from "../components/AuthGuard";
import { headers } from "next/headers";
import InitAuth from "@/components/InitAuth";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata = {
  title: "AI Marketing Automation for Google, Facebook & Instagram | Limbu.ai",
  description:
    "Automate Google Business, Facebook, and Instagram with Limbu.ai. Manage reviews, posts, messages & insights — all in one AI-powered dashboard.",
  keywords: [
    "Google My Business automation",
    "GMB management tool",
    "AI GMB posts",
    "Google Business Profile optimization",
    "review management software",
    "local SEO tools",
    "auto-reply reviews",
    "GMB insights dashboard",
    "business growth automation",
    "limbu.ai",
  ],
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://www.limbu.ai",
  },
  icons: {
    icon: "/images/bg-logo.png",
  },
  other: {
    "google-site-verification":
      "zll2ej9beWSYpmxgi_jEum9kGdOTL5ftMV8NdbXJfN0",
  },

  
};

function isTenantSubdomainHost(host) {
  if (!host) return false;
  const h = host.split(":")[0].toLowerCase();
  return (
    h.endsWith(".limbu.ai") &&
    h !== "limbu.ai" &&
    h !== "www.limbu.ai" &&
    h !== "crm.limbu.ai"
  );
}

export default async function RootLayout({ children }) {
  const headersList = await headers();
  const forwarded = headersList.get("x-forwarded-host");
  const host =
    forwarded?.split(",")[0]?.trim()?.split(":")[0] ||
    headersList.get("host")?.split(":")[0] ||
    "";
  const isSubdomainSite =
    headersList.get("x-is-subdomain-site") === "1" ||
    isTenantSubdomainHost(host);

  return (
    <html lang="en" className={inter.variable}>
      <head>
        {/* ---------------- Google Tag Manager ---------------- */}
        <Script id="gtm-script" strategy="afterInteractive">
          {`
            (function(w,d,s,l,i){w[l]=w[l]||[];
            w[l].push({'gtm.start': new Date().getTime(),event:'gtm.js'});
            var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';
            j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;
            f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','GTM-WTLTD58F');
          `}
        </Script>

        {/* ---------------- Facebook Pixel ---------------- */}
        <Script id="fb-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '1388988219494781');
            fbq('track', 'PageView');
          `}
        </Script>
      </head>

      <body className={`${inter.variable} antialiased`}>
        {/* ---------------- GTM (noscript) ---------------- */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-WTLTD58F"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>

        {/* ---------------- Facebook Pixel (noscript) ---------------- */}
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src="https://www.facebook.com/tr?id=1388988219494781&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>

        <SessionProviderWrapper>
          <InitAuth />

          <ClientLayout>
            {isSubdomainSite ? children : <AuthGuard>{children}</AuthGuard>}
          </ClientLayout>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
