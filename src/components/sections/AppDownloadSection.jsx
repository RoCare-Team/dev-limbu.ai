import React from "react";

// SVG Icons
const Icons = {
  Sparkles: () => (
    <svg
      width="10"
      height="10"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#f5c400"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path
        d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"
        fill="#f5c400"
      />
      <path d="M5 3v4M3 5h4M21 17v4M19 19h4" stroke="#f5c400" strokeWidth="2" />
    </svg>
  ),

  Upload: () => (
    <svg
      width="10"
      height="10"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#6366f1"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
    </svg>
  ),

  Grid: () => (
    <svg
      width="8"
      height="8"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#d97706"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="7" height="7" x="3" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="14" rx="1" />
      <rect width="7" height="7" x="3" y="14" rx="1" />
    </svg>
  ),
};

function AppScreenPhone() {
  return (
    <div
      style={{
        position: "relative",
        width: "155px",
        flexShrink: 0,
        filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.15))",
      }}
    >
      <svg
        width="155"
        height="315"
        viewBox="0 0 160 320"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          x="2"
          y="2"
          width="156"
          height="316"
          rx="26"
          fill="#111"
          stroke="#333"
          strokeWidth="1"
        />

        <rect x="5" y="5" width="150" height="310" rx="23" fill="#000" />

        <rect x="8" y="8" width="144" height="304" rx="20" fill="#F9FAFB" />

        <rect x="54" y="14" width="52" height="12" rx="6" fill="#000" />

        <text
          x="24"
          y="23"
          fill="#000"
          fontSize="5.5"
          fontWeight="bold"
          fontFamily="sans-serif"
        >
          9:41
        </text>

        <g transform="translate(120, 17)">
          <rect
            width="14"
            height="6.5"
            rx="2"
            stroke="#000"
            strokeWidth="0.8"
          />

          <rect x="1.5" y="1.5" width="9" height="3.5" rx="1" fill="#22c55e" />
        </g>

        <rect x="8" y="32" width="144" height="34" fill="#ffffff" />

        <line
          x1="8"
          y1="66"
          x2="152"
          y2="66"
          stroke="#f1f1f1"
          strokeWidth="0.8"
        />

        <circle cx="26" cy="49" r="10" fill="#f5c400" />

        <text
          x="26"
          y="52.5"
          textAnchor="middle"
          fill="#fff"
          fontSize="9"
          fontWeight="900"
          fontFamily="sans-serif"
        >
          L
        </text>

        <text
          x="40"
          y="52"
          fill="#111827"
          fontSize="9"
          fontWeight="800"
          fontFamily="sans-serif"
        >
          Limbu.AI
        </text>

        <rect
          x="108"
          y="42"
          width="34"
          height="14"
          rx="7"
          fill="#fef3c7"
          stroke="#fcd34d"
          strokeWidth="0.5"
        />

        <text
          x="125"
          y="51.5"
          textAnchor="middle"
          fill="#92400e"
          fontSize="6.5"
          fontWeight="bold"
          fontFamily="sans-serif"
        >
          ₹ 433
        </text>

        <g transform="translate(14, 78)">
          <Icons.Sparkles />

          <text
            x="14"
            y="8"
            fill="#111827"
            fontSize="8"
            fontWeight="700"
            fontFamily="sans-serif"
          >
            Create Content
          </text>
        </g>

        <rect
          x="14"
          y="90"
          width="132"
          height="24"
          rx="5"
          fill="#ffffff"
          stroke="#e5e7eb"
          strokeWidth="0.8"
        />

        <text
          x="20"
          y="104"
          fill="#9ca3af"
          fontSize="6.5"
          fontFamily="sans-serif"
        >
          Describe your post idea...
        </text>

        <text x="14" y="126" fill="#6b7280" fontSize="5.5" fontWeight="600">
          Business Name
        </text>

        <rect
          x="14"
          y="130"
          width="62"
          height="14"
          rx="4"
          fill="#fff"
          stroke="#e5e7eb"
          strokeWidth="0.8"
        />

        <text x="18" y="139" fill="#111827" fontSize="5.5">
          DoctorFresh Water
        </text>

        <text x="82" y="126" fill="#6b7280" fontSize="5.5" fontWeight="600">
          Keywords
        </text>

        <rect
          x="82"
          y="130"
          width="64"
          height="14"
          rx="4"
          fill="#fff"
          stroke="#e5e7eb"
          strokeWidth="0.8"
        />

        <text x="86" y="139" fill="#9ca3af" fontSize="5.5">
          Enter keywords
        </text>

        <g transform="translate(14, 155)">
          <Icons.Grid />

          <text x="12" y="7" fill="#111827" fontSize="7.5" fontWeight="700">
            Your Assets
          </text>
        </g>

        <g transform="translate(14, 168)">
          {["Character", "Product", "Uniform"].map((label, i) => (
            <g key={label} transform={`translate(${i * 46}, 0)`}>
              <rect
                width="40"
                height="38"
                rx="5"
                fill="#fff"
                stroke="#f3f4f6"
                strokeWidth="1"
              />

              <text
                x="20"
                y="9"
                textAnchor="middle"
                fill="#9ca3af"
                fontSize="5.5"
              >
                {label}
              </text>

              <g transform="translate(15, 12)">
                <Icons.Upload />
              </g>

              <text
                x="20"
                y="32"
                textAnchor="middle"
                fill="#4f46e5"
                fontSize="5"
                fontWeight="bold"
              >
                Upload
              </text>
            </g>
          ))}
        </g>

        <text x="14" y="270" fill="#6b7280" fontSize="5.5" fontWeight="600">
          Size
        </text>

        <rect x="14" y="274" width="62" height="14" rx="4" fill="#f3f4f6" />

        <text x="18" y="283" fill="#111827" fontSize="6" fontWeight="600">
          1:1 Square
        </text>

        <text x="82" y="270" fill="#6b7280" fontSize="5.5" fontWeight="600">
          Palette
        </text>

        <rect x="82" y="274" width="64" height="14" rx="4" fill="#f3f4f6" />

        <text x="86" y="283" fill="#111827" fontSize="6" fontWeight="600">
          Default
        </text>

        <rect x="14" y="294" width="132" height="18" rx="9" fill="#f5c400" />

        <text
          x="80"
          y="306"
          textAnchor="middle"
          fill="#1a1a1a"
          fontSize="7.5"
          fontWeight="800"
          fontFamily="sans-serif"
        >
          GENERATE POST
        </text>
      </svg>
    </div>
  );
}

export default function AppDownloadSection() {
  return (
    <>
      {/* IMPORTANT: NO style jsx in server component */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .app-badge-img{
            transition:transform .2s ease;
            height:40px;
            display:block;
          }

          .app-badge-img:hover{
            transform:scale(1.05);
          }

          .app-cta-btn{
            transition:all .3s ease;
          }

          .app-cta-btn:hover{
            transform:translateY(-2px);
            box-shadow:0 10px 20px rgba(217,119,6,0.3)!important;
          }

          @media (max-width:640px){
            .app-inner-box{
              flex-direction:column!important;
              align-items:center!important;
              text-align:center!important;
              padding:30px 20px!important;
            }

            .app-badge-row{
              justify-content:center!important;
            }

            .phone-wrapper{
              display:none;
            }
          }
        `,
        }}
      />

      <section
        style={{
          width: "100%",
          background: "#ffffff",
          borderTop: "1px solid #f0f0f0",
          borderBottom: "1px solid #f0f0f0",
          overflow: "hidden",
          fontFamily: "'Inter', sans-serif",
        }}
      >
        <div
          style={{
            maxWidth: "1280px",
            margin: "0 auto",
            padding: "10px 8px",
          }}
        >
          <a
            href="https://play.google.com/store/apps/details?id=com.limbu.ai.limbu"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "block",
              textDecoration: "none",
              cursor: "pointer",
            }}
          >
            <div
              className="app-inner-box"
              style={{
                position: "relative",
                background:
                  "linear-gradient(160deg, #ffffff 0%, #fffbeb 60%, #f0f9ff 100%)",
                borderRadius: "24px",
                border: "1px solid #fef3c7",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "50px 70px",
                overflow: "hidden",
                gap: "40px",
              }}
            >
              <div style={{ flex: 1, zIndex: 1 }}>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    background: "#fef3c7",
                    borderRadius: "100px",
                    padding: "5px 12px",
                    fontSize: "11px",
                    fontWeight: "700",
                    color: "#92400e",
                    marginBottom: "16px",
                  }}
                >
                  ✦ AI-Powered Post Creation
                </div>

                <h2
                  style={{
                    color: "#111827",
                    fontSize: "clamp(22px, 3vw, 36px)",
                    fontWeight: "900",
                    lineHeight: 1.2,
                    marginBottom: "12px",
                    letterSpacing: "-1px",
                  }}
                >
                  Download the{" "}
                  <span style={{ color: "#d97706" }}>Limbu.AI</span> App
                  <br />
                  for Instant Post Creation
                </h2>

                <p
                  style={{
                    color: "#4b5563",
                    fontSize: "15px",
                    margin: "0 0 24px",
                    lineHeight: 1.5,
                  }}
                >
                  Available on iOS & Android. Create professional
                  <br />
                  AI posts for your business in seconds.
                </p>

                <div
                  className="app-cta-btn"
                  style={{
                    display: "inline-block",
                    background: "#F5C400",
                    color: "#000",
                    fontWeight: "800",
                    fontSize: "14px",
                    padding: "14px 28px",
                    borderRadius: "12px",
                    marginBottom: "24px",
                    boxShadow: "0 4px 15px rgba(245,196,0,0.2)",
                  }}
                >
                  🎁 JOIN NOW AND GET 500 COINS
                </div>

                <div
                  className="app-badge-row"
                  style={{
                    display: "flex",
                    gap: "10px",
                    flexWrap: "wrap",
                  }}
                >
                  <img
                    className="app-badge-img"
                    src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg"
                    alt="Google Play"
                  />

                  <img
                    className="app-badge-img"
                    src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg"
                    alt="App Store"
                  />
                </div>
              </div>

              <div className="phone-wrapper">
                <AppScreenPhone />
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "24px",
                padding: "16px 0",
                fontSize: "13px",
                color: "#6b7280",
                flexWrap: "wrap",
                fontWeight: "500",
              }}
            >
              <span>
                <span style={{ color: "#d97706" }}>4.3 ★</span> from 3,000+
                Reviews
              </span>

              <span>|</span>

              <span>
                <strong style={{ color: "#111827" }}>10,000+</strong> Active
                Users
              </span>

              <span>|</span>

              <span>✅ Featured Posts</span>

              <span>|</span>

              <span>⚡ Instant Generation</span>
            </div>
          </a>
        </div>
      </section>
    </>
  );
}
