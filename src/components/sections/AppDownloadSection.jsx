"use client";

// Light-theme phone mockup showing the Limbu.AI "Create Content" screen
function AppScreenPhone() {
  return (
    <div style={{
      position: "relative",
      width: "150px",
      flexShrink: 0,
      filter: "drop-shadow(0 16px 40px rgba(0,0,0,0.18))",
      animation: "floatPhone 4s ease-in-out infinite",
    }}>
      <svg width="150" height="295" viewBox="0 0 160 310" xmlns="http://www.w3.org/2000/svg">
        {/* Phone shell */}
        <rect x="2" y="2" width="156" height="306" rx="22" fill="#1a1a1a" stroke="#333" strokeWidth="2"/>
        <rect x="5" y="5" width="150" height="300" rx="20" fill="#f8f9fa"/>
        {/* Notch */}
        <rect x="52" y="7" width="56" height="10" rx="5" fill="#1a1a1a"/>
        {/* Status bar */}
        <text x="12" y="24" fill="#555" fontSize="6" fontFamily="sans-serif">9:41</text>
        <rect x="120" y="19" width="18" height="7" rx="3" fill="none" stroke="#555" strokeWidth="1"/>
        <rect x="121" y="20" width="13" height="5" rx="2" fill="#22c55e"/>

        {/* App header - white */}
        <rect x="5" y="30" width="150" height="34" fill="#ffffff" />
        <line x1="5" y1="64" x2="155" y2="64" stroke="#e5e7eb" strokeWidth="1"/>
        <circle cx="22" cy="47" r="10" fill="#f5c400"/>
        <text x="22" y="51" textAnchor="middle" fill="#0a1628" fontSize="9" fontWeight="bold" fontFamily="sans-serif">L</text>
        <text x="40" y="51" fill="#111827" fontSize="10" fontWeight="bold" fontFamily="sans-serif">Limbu.AI</text>
        <rect x="106" y="40" width="36" height="14" rx="7" fill="#fef3c7" stroke="#f5c400" strokeWidth="1"/>
        <text x="124" y="50" textAnchor="middle" fill="#92400e" fontSize="7" fontWeight="bold" fontFamily="sans-serif">₹ 433</text>

        {/* Create Content */}
        <text x="14" y="80" fill="#f5c400" fontSize="8" fontFamily="sans-serif">✦</text>
        <text x="25" y="80" fill="#111827" fontSize="9" fontWeight="bold" fontFamily="sans-serif">Create Content</text>

        {/* Textarea */}
        <rect x="10" y="84" width="140" height="26" rx="6" fill="#ffffff" stroke="#e5e7eb" strokeWidth="1"/>
        <text x="18" y="101" fill="#9ca3af" fontSize="7" fontFamily="sans-serif">Describe your post idea...</text>

        {/* Business Name + Keywords */}
        <text x="10" y="120" fill="#6b7280" fontSize="6" fontFamily="sans-serif">Business Name</text>
        <text x="84" y="120" fill="#6b7280" fontSize="6" fontFamily="sans-serif">Keywords</text>
        <rect x="10" y="123" width="68" height="16" rx="4" fill="#fff" stroke="#e5e7eb" strokeWidth="1"/>
        <text x="16" y="134" fill="#111827" fontSize="5.5" fontFamily="sans-serif">DoctorFresh Water</text>
        <rect x="82" y="123" width="68" height="16" rx="4" fill="#fff" stroke="#e5e7eb" strokeWidth="1"/>
        <text x="88" y="134" fill="#9ca3af" fontSize="6" fontFamily="sans-serif">Enter keywords</text>

        {/* Your Assets */}
        <text x="14" y="152" fill="#f5c400" fontSize="7" fontFamily="sans-serif">◧</text>
        <text x="25" y="152" fill="#111827" fontSize="8" fontWeight="bold" fontFamily="sans-serif">Your Assets</text>

        {/* Row 1 */}
        {["Character","Product","Uniform"].map((label, i) => (
          <g key={label}>
            <rect x={10 + i*50} y={156} width="44" height="38" rx="5" fill="#fff" stroke="#e5e7eb" strokeWidth="1"/>
            <text x={32 + i*50} y={168} textAnchor="middle" fill="#9ca3af" fontSize="6" fontFamily="sans-serif">{label}</text>
            <rect x={23 + i*50} y={171} width="18" height="12" rx="3" fill="#f3f4f6"/>
            <text x={32 + i*50} y={180} textAnchor="middle" fill="#6b7280" fontSize="5" fontFamily="sans-serif">↑</text>
            <text x={32 + i*50} y={189} textAnchor="middle" fill="#3b82f6" fontSize="5" fontFamily="sans-serif">Upload</text>
          </g>
        ))}
        {/* Row 2 */}
        {["Background","Logo"].map((label, i) => (
          <g key={label}>
            <rect x={10 + i*50} y={197} width="44" height="38" rx="5" fill="#fff" stroke="#e5e7eb" strokeWidth="1"/>
            <text x={32 + i*50} y={209} textAnchor="middle" fill="#9ca3af" fontSize="6" fontFamily="sans-serif">{label}</text>
            <rect x={23 + i*50} y={212} width="18" height="12" rx="3" fill="#f3f4f6"/>
            <text x={32 + i*50} y={221} textAnchor="middle" fill="#6b7280" fontSize="5" fontFamily="sans-serif">↑</text>
            <text x={32 + i*50} y={230} textAnchor="middle" fill="#3b82f6" fontSize="5" fontFamily="sans-serif">Upload</text>
          </g>
        ))}

        {/* Size + Palette */}
        <text x="10" y="248" fill="#6b7280" fontSize="6" fontFamily="sans-serif">Size</text>
        <text x="84" y="248" fill="#6b7280" fontSize="6" fontFamily="sans-serif">Palette</text>
        <rect x="10" y="251" width="68" height="14" rx="4" fill="#fff" stroke="#e5e7eb" strokeWidth="1"/>
        <text x="18" y="261" fill="#111827" fontSize="6" fontFamily="sans-serif">1:1  ⌄</text>
        <rect x="82" y="251" width="68" height="14" rx="4" fill="#fff" stroke="#e5e7eb" strokeWidth="1"/>
        <text x="90" y="261" fill="#111827" fontSize="6" fontFamily="sans-serif">None  ⌄</text>

        {/* Generate Post button */}
        <rect x="10" y="269" width="140" height="18" rx="9" fill="#f5c400"/>
        <text x="80" y="281" textAnchor="middle" fill="#1a1a1a" fontSize="7.5" fontWeight="bold" fontFamily="sans-serif">✦  Generate Post</text>

        {/* Home bar */}
        <rect x="58" y="302" width="44" height="3" rx="1.5" fill="#d1d5db"/>
      </svg>
    </div>
  );
}

export default function AppDownloadSection() {
  return (
    <>
      <style>{`
        @keyframes floatPhone {
          0%,100% { transform: translateY(0px) rotate(-2deg); }
          50% { transform: translateY(-10px) rotate(-2deg); }
        }
        @keyframes shimmer {
          0% { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }
        .app-badge { transition: opacity .2s, transform .2s; text-decoration: none; display: block; }
        .app-badge:hover { opacity: .85; transform: translateY(-2px); }
        .app-cta { transition: transform .2s, box-shadow .2s !important; }
        .app-cta:hover { transform: scale(1.03) !important; box-shadow: 0 8px 32px rgba(234,179,8,.45) !important; }
        @media(max-width:640px){
          .app-inner { flex-direction:column !important; align-items:center !important; text-align:center !important; padding:20px 16px 0 !important; }
          .app-badges { justify-content:center !important; }
          .app-stats { flex-wrap:wrap; gap:8px !important; }
          .phone-left { display:none !important; }
        }
      `}</style>

      <section style={{
        width: "100%",
        background: "#ffffff",
        borderTop: "1px solid #e5e7eb",
        borderBottom: "1px solid #e5e7eb",
        overflow: "hidden",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
      }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 16px",width:"100%" }}>
          <a
            href="https://play.google.com/store/apps/details?id=com.limbu.ai.limbu"
            target="_blank" rel="noopener noreferrer"
            style={{ display: "block", textDecoration: "none" }}
          >
            {/* MAIN BANNER - light gradient */}
            <div style={{
              position: "relative",
              background: "linear-gradient(135deg, #fffbeb 0%, #fef9ee 30%, #f0f9ff 70%, #eff6ff 100%)",
              borderRadius: "12px",
              margin: "12px 0 0",
              overflow: "hidden",
            }}>
              {/* Subtle decorative circles */}
              <div style={{position:"absolute",top:"-60px",right:"20%",width:"200px",height:"200px",borderRadius:"50%",background:"rgba(245,196,0,0.08)",pointerEvents:"none"}}/>
              <div style={{position:"absolute",bottom:"-40px",left:"15%",width:"160px",height:"160px",borderRadius:"50%",background:"rgba(59,130,246,0.06)",pointerEvents:"none"}}/>

              {/* INNER ROW */}
              <div className="app-inner" style={{
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "space-between",
                gap: "16px",
                padding: "24px 36px 0",
                position: "relative",
                zIndex: 1,
              }}>

                {/* Left phone */}
                {/* <div className="phone-left">
                  <AppScreenPhone />
                </div> */}

                {/* Center text */}
                <div style={{ flex: 1, minWidth: 0, padding: "16px 0 28px", alignSelf: "center" }}>

                  {/* Badge */}
                  <div style={{
                    display: "inline-flex", alignItems: "center", gap: "6px",
                    background: "#fef3c7", border: "1px solid #fcd34d",
                    borderRadius: "20px", padding: "4px 12px",
                    fontSize: "11px", fontWeight: "600", color: "#92400e",
                    marginBottom: "10px",
                  }}>
                    ✦ AI-Powered Post Creation
                  </div>

                  {/* Heading */}
                  <div style={{
                    color: "#111827",
                    fontSize: "clamp(18px, 2.4vw, 30px)",
                    fontWeight: "800",
                    lineHeight: 1.15,
                    marginBottom: "10px",
                    letterSpacing: "-0.5px",
                  }}>
                    Download the{" "}
                    <span style={{
                      color: "#d97706",
                      background: "linear-gradient(90deg,#d97706,#f59e0b)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}>
                      Limbu.AI
                    </span>{" "}App<br/>
                    for Instant Post Creation
                  </div>

                  <p style={{
                    color: "#6b7280",
                    fontSize: "clamp(12px, 1.1vw, 15px)",
                    margin: "0 0 18px",
                    lineHeight: 1.65,
                  }}>
                    Available now on iOS &amp; Android. Start creating<br/>
                    AI-powered posts in just seconds!
                  </p>

                  {/* CTA Button */}
                  <div className="app-cta" style={{
                    display: "inline-block",
                    background: "linear-gradient(90deg, #F1B600)",
                    color: "#ffffff",
                    fontWeight: "800",
                    fontSize: "clamp(12px, 1.3vw, 16px)",
                    letterSpacing: "0.4px",
                    padding: "13px 28px",
                    borderRadius: "10px",
                    marginBottom: "18px",
                    boxShadow: "0 4px 20px #F1B600",
                    cursor: "pointer",
                    textTransform: "uppercase",
                  }}>
                    🎁 JOIN NOW AND GET 500 COINS.
                  </div>

                  {/* Store badges */}
                  <div className="app-badges" style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    <a
                      href="https://play.google.com/store/apps/details?id=com.limbu.ai.limbu"
                      target="_blank" rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="app-badge"
                    >
                      <div style={{display:"flex",alignItems:"center",gap:"8px",background:"#111827",border:"1px solid #374151",borderRadius:"8px",padding:"7px 14px",minWidth:"130px"}}>
                        <svg width="20" height="22" viewBox="0 0 20 22" xmlns="http://www.w3.org/2000/svg">
                          <defs>
                            <linearGradient id="gpL1"><stop offset="0%" stopColor="#00bcd4"/><stop offset="100%" stopColor="#00e676"/></linearGradient>
                            <linearGradient id="gpL2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#ff5252"/><stop offset="100%" stopColor="#ff9800"/></linearGradient>
                          </defs>
                          <path d="M1 1L1 21L11 11Z" fill="url(#gpL1)"/>
                          <path d="M11 11L1 21L17 14Z" fill="url(#gpL2)"/>
                          <path d="M1 1L17 8L11 11Z" fill="#69f0ae"/>
                          <path d="M11 11L17 8L17 14Z" fill="#ffcc02"/>
                        </svg>
                        <div>
                          <div style={{color:"#9ca3af",fontSize:"8px",lineHeight:1}}>GET IT ON</div>
                          <div style={{color:"#fff",fontSize:"13px",fontWeight:"600",lineHeight:1.3}}>Google Play</div>
                        </div>
                      </div>
                    </a>

                    <a
                      href="https://apps.apple.com/in/app/limbu-ai/id6757781138"
                      target="_blank" rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                      className="app-badge"
                    >
                      <div style={{display:"flex",alignItems:"center",gap:"8px",background:"#111827",border:"1px solid #374151",borderRadius:"8px",padding:"7px 14px",minWidth:"130px"}}>
                        <svg width="16" height="20" viewBox="0 0 16 20" xmlns="http://www.w3.org/2000/svg">
                          <path d="M13.5 10.5c0-2.6 1.7-3.9 1.8-4C13.8 4.1 11.8 3.8 11 3.8c-1.5-.2-2.9.9-3.7.9s-2-.9-3.2-.9C2.6 3.9.9 5 0 6.8c-1.8 3.1-.4 7.8 1.3 10.3.8 1.2 1.9 2.6 3.2 2.5 1.3-.1 1.8-.8 3.3-.8s2 .8 3.3.8 2.2-1.2 3.1-2.4c1-1.5 1.4-2.9 1.4-3C15.4 14.1 13.5 13.3 13.5 10.5z" fill="#fff"/>
                          <path d="M10.5 1.8C11.2.9 11.7 0 11.5 0 10.5.4 9.3 1.3 8.6 2.2c-.7.8-1.3 1.8-1.1 2.7C8.6 5 9.8 2.7 10.5 1.8z" fill="#fff"/>
                        </svg>
                        <div>
                          <div style={{color:"#9ca3af",fontSize:"8px",lineHeight:1}}>Download on the</div>
                          <div style={{color:"#fff",fontSize:"13px",fontWeight:"600",lineHeight:1.3}}>App Store</div>
                        </div>
                      </div>
                    </a>
                  </div>
                </div>

                {/* Right phone */}
                <div className="phone-right">
                  <AppScreenPhone />
                </div>
              </div>

              {/* STATS BAR */}
              <div style={{
                borderTop: "1px solid #e5e7eb",
                background: "rgba(255,255,255,0.7)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "28px",
                padding: "10px 24px",
                fontSize: "clamp(10px,.9vw,13px)",
                color: "#6b7280",
                flexWrap: "wrap",
              }}>
                <span><span style={{color:"#d97706"}}>4.3 ★</span> from <strong style={{color:"#111827"}}>3,000+</strong> Reviews</span>
                <span style={{color:"#d1d5db"}}>|</span>
                <span><strong style={{color:"#d97706"}}>10,000+</strong> Active Users</span>
                <span style={{color:"#d1d5db"}}>|</span>
                <span>✅ Feature Posts</span>
                <span style={{color:"#d1d5db"}}>|</span>
                <span>⚡ Generate Posts in Seconds</span>
              </div>
            </div>

            {/* bottom spacing */}
            <div style={{height:"12px"}}/>
          </a>
        </div>
      </section>
    </>
  );
}