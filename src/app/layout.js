import "./globals.css";
import ClientLayout from "../app/client-layout";
import SessionProviderWrapper from "./providers/SessionProviderWrapper";
import Script from "next/script";
import { Inter } from "next/font/google";
import AuthGuard from "../components/AuthGuard";
import InitAuth from "@/components/InitAuth";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata = {
  title: "AI GMB Marketing Automation Tool | Limbu.ai",
  description: "Automate Google Business, Facebook, and Instagram with Limbu.ai.",
  keywords: ["Google My Business automation", "GMB management tool", "limbu.ai"],
  robots: { index: true, follow: true },
  alternates: { canonical: "https://www.limbu.ai" },
  icons: { icon: "/images/bg-logo.png" },
  other: { "google-site-verification": "zll2ej9beWSYpmxgi_jEum9kGdOTL5ftMV8NdbXJfN0" },
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Limbu.ai",
  url: "https://www.limbu.ai",
  logo: "https://www.limbu.ai/images/bg-logo.png",
};

const webSiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Limbu.ai",
  url: "https://www.limbu.ai",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* JSON-LD Schemas */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteSchema) }}
        />

        {/*
          GTM aur Facebook Pixel dono pehle `afterInteractive` par the, yaani
          hydration ke turant baad main thread par chalte the — TBT (~400ms) aur
          INP (420ms, "poor") ka sabse bada hissa yahi tha.

          Ab `lazyOnload`: browser ke `load` event ke baad, idle time me. Critical
          path se poori tarah bahar.

          Trade-off jaan lena zaroori hai: PageView ab thoda der se fire hota hai,
          to jo visitor ~1-2s me hi bounce kar jaate hain woh analytics me miss ho
          sakte hain. Conversion tracking (form submit, payment) par koi asar nahi
          — woh events user ke rukne par hi hote hain.
        */}
        <Script id="gtm-script" strategy="lazyOnload">
          {`
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','GTM-WCPTXKLC');
          `}
        </Script>

        {/* Facebook Pixel - Using Next.js Script Component */}
        <Script id="fb-pixel" strategy="lazyOnload">
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

      <body className={`${inter.variable} antialiased`} suppressHydrationWarning>
        {/* GTM (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-WCPTXKLC"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>

        {/* Facebook Pixel (noscript) */}
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
            <AuthGuard>{children}</AuthGuard>
          </ClientLayout>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}