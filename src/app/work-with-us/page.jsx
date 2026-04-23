"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Briefcase, Users, Rocket, Heart, Globe, Zap, 
  Award, ArrowRight, CheckCircle, ArrowLeft,
  MapPin, Clock, DollarSign, Search, X, Upload
} from "lucide-react";

import Navbar from "@/components/sections/HeaderSection";
import FooterSection from "@/components/sections/FooterSection";

export default function WorkWithUsPage() {
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [activeDepartment, setActiveDepartment] = useState("All");

  const departments = ["All", "Engineering", "Sales & Marketing", "Customer Success", "Product"];

  const jobs = [
    {
      id: 1,
      title: "Senior Full Stack Developer",
      department: "Engineering",
      location: "Remote / Gurugram",
      type: "Full-time",
      salary: "₹18L - ₹35L",
      experience: "4-6 years",
      description: "We are looking for an experienced Full Stack Developer to lead our core product development. You will work with Next.js, Node.js, and AI integrations."
    },
    {
      id: 2,
      title: "AI/ML Engineer",
      department: "Engineering",
      location: "Remote",
      type: "Full-time",
      salary: "₹20L - ₹40L",
      experience: "3-5 years",
      description: "Join our AI team to build advanced NLP models for automated content generation and review management."
    },
    {
      id: 3,
      title: "Franchise Sales Manager",
      department: "Sales & Marketing",
      location: "Mumbai / Bangalore",
      type: "Full-time",
      salary: "₹8L - ₹15L + Incentives",
      experience: "2-4 years",
      description: "Drive franchise growth by connecting with potential partners and entrepreneurs across India."
    },
    {
      id: 4,
      title: "Customer Success Executive",
      department: "Customer Success",
      location: "Remote",
      type: "Full-time",
      salary: "₹4L - ₹7L",
      experience: "1-3 years",
      description: "Help our franchise partners and clients succeed with the Limbu.ai platform through training and support."
    },
    {
      id: 5,
      title: "Product Designer (UI/UX)",
      department: "Product",
      location: "Gurugram",
      type: "Full-time",
      salary: "₹10L - ₹18L",
      experience: "3+ years",
      description: "Design intuitive and beautiful interfaces for our SaaS platform and mobile apps."
    }
  ];

  const filteredJobs = activeDepartment === "All" 
    ? jobs 
    : jobs.filter(job => job.department === activeDepartment);

  const handleApply = (job) => {
    setSelectedJob(job);
    setShowApplyModal(true);
  };

  return (
    <>
      <Navbar />

      <div
        className="min-h-screen py-20 px-4 sm:px-6 relative overflow-hidden"
        style={{ backgroundColor: "var(--background)" }}
      >
        {/* ── Subtle background grid ── */}
        <div
          className="pointer-events-none absolute inset-0 z-0 opacity-[0.03]"
          style={{
            backgroundImage: "linear-gradient(rgba(15, 23, 42, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(15, 23, 42, 0.2) 1px, transparent 1px)",
            backgroundSize: "40px 40px"
          }}
        />

        {/* ── Ambient glow ── */}
        <div
          className="pointer-events-none absolute top-0 right-0 w-[500px] h-[400px] z-0 opacity-10"
          style={{
            background: "radial-gradient(ellipse at top right, rgba(250, 204, 21, 0.3) 0%, transparent 65%)",
          }}
        />

        <div className="max-w-7xl mx-auto relative z-10">

          {/* Back Button */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 mb-10 text-xs font-bold tracking-widest uppercase transition-colors hover:text-[var(--lemon-hover)] text-slate-400 cursor-pointer group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" /> Back to Home
          </Link>

          {/* =================== HERO SECTION =================== */}
          <div className="text-center mb-20">
            {/* Label chip */}
            <div
              className="inline-flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full"
              style={{
                background: "rgba(250, 204, 21, 0.1)",
                border: "1px solid rgba(250, 204, 21, 0.2)",
                backdropFilter: "blur(8px)",
              }}
            >
              <Rocket className="w-3.5 h-3.5 animate-pulse" style={{ color: "var(--lemon-hover)" }} />
              <span className="text-[11px] font-bold tracking-[0.2em] uppercase" style={{ color: "var(--lemon-hover)" }}>
                Careers Studio
              </span>
            </div>

            {/* Headline with slightly reduced font size as requested */}
            <h1
              className="font-bold uppercase leading-[1.05] tracking-tight mb-6"
              style={{
                fontFamily: "var(--font-heading)",
                color: "var(--foreground)",
                fontSize: "clamp(2.2rem, 5.5vw, 3.8rem)",
              }}
            >
              Do Your Best Work <br />
              <span style={{ color: "var(--lemon-hover)" }}>At Limbu.ai</span>
            </h1>

            <p
              className="text-sm sm:text-base leading-relaxed max-w-2xl mx-auto font-semibold mb-10"
              style={{ color: "rgba(15, 23, 42, 0.6)" }}
            >
              Join India's fastest-growing AI automation platform. We're building the future of local business growth, and we need visionaries like you.
            </p>

            <div className="flex flex-wrap justify-center gap-4">
              <a 
                href="#openings" 
                className="px-8 py-4 rounded-2xl text-xs font-bold tracking-[0.15em] uppercase transition-all duration-300 hover:scale-[1.02] shadow-xl flex items-center gap-2"
                style={{
                  background: "var(--lemon-hover)",
                  color: "#fff",
                  boxShadow: "0 10px 20px -5px rgba(234, 179, 8, 0.3)",
                }}
              >
                View Open Positions <ArrowRight className="w-4 h-4" />
              </a>
              <a 
                href="#culture" 
                className="px-8 py-4 rounded-2xl text-xs font-bold tracking-[0.15em] uppercase transition-all duration-300 border-2"
                style={{
                  background: "transparent",
                  color: "var(--foreground)",
                  borderColor: "rgba(15, 23, 42, 0.1)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--lemon-hover)";
                  e.currentTarget.style.color = "var(--lemon-hover)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(15, 23, 42, 0.1)";
                  e.currentTarget.style.color = "var(--foreground)";
                }}
              >
                Our Culture
              </a>
            </div>
          </div>

          {/* =================== STATS SECTION =================== */}
          <div className="py-12 mb-20 border-y border-slate-100">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { label: "Team Members", value: "50+" },
                { label: "Cities Covered", value: "100+" },
                { label: "Growth Rate", value: "300%" },
                { label: "Happy Clients", value: "10k+" },
              ].map((stat, index) => (
                <div key={index} className="text-center group">
                  <div 
                    className="text-3xl md:text-4xl font-black tracking-tight mb-2 transition-colors group-hover:text-[var(--lemon-hover)] text-black"
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    {stat.value}
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* =================== WHY JOIN US =================== */}
          <div id="culture" className="mb-24">
            <div className="text-center mb-16">
              <h2 
                className="text-2xl md:text-3xl font-bold uppercase tracking-tight mb-4 text-black"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Why Join <span style={{ color: "var(--lemon-hover)" }}>Limbu.ai?</span>
              </h2>
              <p className="text-sm sm:text-base font-semibold text-slate-500 max-w-2xl mx-auto">
                We offer more than just a job. We offer a platform to grow, innovate, and make a real impact.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
              {[
                { icon: Zap, title: "Innovation First", desc: "Work with cutting-edge AI technologies and solve complex problems that matter." },
                { icon: Users, title: "Collaborative Culture", desc: "Join a diverse team of thinkers and doers who support each other's growth." },
                { icon: ArrowRight, title: "Rapid Growth", desc: "Fast-track your career in a high-growth startup environment with endless opportunities." },
                { icon: Heart, title: "Work-Life Balance", desc: "Flexible working hours and remote options because we value your well-being." },
                { icon: Award, title: "Competitive Pay", desc: "Top-tier salary packages, equity options, and performance-based bonuses." },
                { icon: Globe, title: "Remote Friendly", desc: "Work from anywhere. We focus on output and impact, not hours at a desk." }
              ].map((item, i) => (
                <div 
                  key={i} 
                  className="bg-white p-8 rounded-3xl border border-slate-100 hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 group"
                  style={{ boxShadow: "0 10px 30px -10px rgba(0,0,0,0.02)" }}
                >
                  <div 
                    className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-colors duration-300"
                    style={{ background: "rgba(250, 204, 21, 0.1)" }}
                  >
                    <item.icon className="w-7 h-7 text-[var(--lemon-hover)] transition-transform duration-300 group-hover:scale-110" />
                  </div>
                  <h3 
                    className="text-lg font-bold uppercase tracking-tight text-black mb-3"
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    {item.title}
                  </h3>
                  <p className="text-sm font-medium text-slate-500 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* =================== PERKS SECTION =================== */}
          <div className="mb-24 bg-slate-50 rounded-[2.5rem] p-8 md:p-16 border border-slate-100 relative overflow-hidden">
            {/* Background texture for perks area */}
            <div
              className="pointer-events-none absolute inset-0 z-0 opacity-10"
              style={{
                backgroundImage: "radial-gradient(circle at 2px 2px, rgba(15, 23, 42, 0.2) 1px, transparent 0)",
                backgroundSize: "24px 24px"
              }}
            />

            <div className="flex flex-col md:flex-row items-center gap-12 relative z-10">
              <div className="md:w-1/2">
                <h2 
                  className="text-2xl md:text-3xl font-bold uppercase tracking-tight text-black mb-6"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  Perks that make work <br />
                  <span style={{ color: "var(--lemon-hover)" }}>Feel Less Like Work</span>
                </h2>
                <p className="text-sm font-semibold text-slate-500 mb-8 leading-relaxed">
                  We believe that happy employees are productive employees. That's why we provide benefits that support your lifestyle and health.
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {[
                    "Health Insurance", "Learning Budget", "MacBook Pro", 
                    "Annual Retreats", "Gym Membership", "Stock Options"
                  ].map((perk, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-[var(--lemon-hover)]/10 flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-4 h-4 text-[var(--lemon-hover)]" />
                      </div>
                      <span className="font-bold text-sm text-slate-700">{perk}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="md:w-1/2 w-full relative">
                <div className="absolute inset-0 bg-[var(--lemon-hover)] rounded-3xl transform rotate-3 opacity-10 transition-transform hover:rotate-6 duration-500"></div>
                <div className="relative bg-white rounded-3xl h-[350px] border border-slate-100 flex items-center justify-center overflow-hidden shadow-xl">
                   <div className="text-center p-8">
                      <div className="w-24 h-24 rounded-full bg-slate-50 mx-auto mb-4 flex items-center justify-center border border-slate-100">
                        <Users className="w-10 h-10 text-slate-300" />
                      </div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                        Team Collaboration Studio
                      </p>
                   </div>
                </div>
              </div>
            </div>
          </div>

          {/* =================== OPEN POSITIONS =================== */}
          <div id="openings" className="mb-24">
            <div className="text-center mb-12">
              <h2 
                className="text-2xl md:text-3xl font-bold uppercase tracking-tight text-black mb-4"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                Current <span style={{ color: "var(--lemon-hover)" }}>Openings</span>
              </h2>
              <p className="text-sm font-semibold text-slate-500">
                Find your next role and help us shape the future
              </p>
            </div>

            {/* Department Filter */}
            <div className="flex flex-wrap justify-center gap-3 mb-12">
              {departments.map((dept) => (
                <button
                  key={dept}
                  onClick={() => setActiveDepartment(dept)}
                  className={`px-5 py-2.5 rounded-full text-[11px] font-bold tracking-[0.1em] uppercase transition-all duration-300 cursor-pointer ${
                    activeDepartment === dept
                      ? "bg-[var(--lemon-hover)] text-white shadow-lg"
                      : "bg-white text-slate-500 border border-slate-200 hover:border-[var(--lemon-hover)]/50 hover:text-[var(--lemon-hover)]"
                  }`}
                >
                  {dept}
                </button>
              ))}
            </div>

            {/* Job List */}
            <div className="space-y-5">
              {filteredJobs.length > 0 ? (
                filteredJobs.map((job) => (
                  <div 
                    key={job.id} 
                    className="bg-white rounded-[2rem] p-6 md:p-8 border border-slate-100 hover:shadow-xl transition-all duration-500 hover:-translate-y-1 flex flex-col md:flex-row md:items-center justify-between gap-6 group"
                  >
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3 mb-3">
                        <h3 
                          className="text-lg font-bold uppercase tracking-tight text-black"
                          style={{ fontFamily: "var(--font-heading)" }}
                        >
                          {job.title}
                        </h3>
                        <span className="bg-slate-50 text-slate-500 border border-slate-200 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                          {job.department}
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap gap-4 text-xs font-bold text-slate-400 mb-4 uppercase tracking-wider">
                        <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-[var(--lemon-hover)]" /> {job.location}</span>
                        <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-[var(--lemon-hover)]" /> {job.type}</span>
                        <span className="flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5 text-[var(--lemon-hover)]" /> {job.experience}</span>
                        <span className="flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5 text-[var(--lemon-hover)]" /> {job.salary}</span>
                      </div>
                      
                      <p className="text-sm font-medium text-slate-500 leading-relaxed max-w-3xl">
                        {job.description}
                      </p>
                    </div>

                    <button 
                      onClick={() => handleApply(job)}
                      className="px-6 py-4 rounded-2xl text-[11px] font-bold tracking-[0.15em] uppercase transition-all duration-300 flex-shrink-0 whitespace-nowrap cursor-pointer border-2 border-slate-100 hover:border-[var(--lemon-hover)] hover:bg-[var(--lemon-hover)] hover:text-white text-black"
                    >
                      Apply Now ↗
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-16 bg-white rounded-[2rem] border border-dashed border-slate-200">
                  <Search className="w-10 h-10 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-sm font-bold uppercase tracking-tight text-black mb-1">No positions found</h3>
                  <p className="text-xs font-semibold text-slate-500">Try selecting a different department or check back later.</p>
                </div>
              )}
            </div>
          </div>

          {/* =================== FRANCHISE CTA =================== */}
          <div className="mb-20">
            <div className="bg-slate-950 rounded-[2.5rem] p-10 md:p-16 text-white text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--lemon-hover)] opacity-10 blur-[80px] -mr-20 -mt-20" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500 opacity-10 blur-[80px] -ml-20 -mb-20" />
              
              <div className="relative z-10">
                <h2 
                  className="text-2xl md:text-4xl font-bold uppercase tracking-tight mb-5"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  Not looking for a job?
                </h2>
                <p className="text-sm sm:text-base font-medium text-white/70 mb-10 max-w-2xl mx-auto leading-relaxed">
                  Start your own business with Limbu.ai. Become a franchise partner and earn recurring revenue by helping local businesses grow.
                </p>
                <a 
                  href="/franchise-opportunities" 
                  className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-xs font-bold tracking-[0.15em] uppercase transition-all duration-300 hover:scale-[1.02] cursor-pointer"
                  style={{
                    background: "var(--lemon-hover)",
                    color: "#000",
                    boxShadow: "0 10px 20px -5px rgba(234, 179, 8, 0.3)",
                  }}
                >
                  Explore Franchise <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>

        </div>
      </div>

      <FooterSection />

      {/* =================== APPLY MODAL =================== */}
      {showApplyModal && selectedJob && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto relative animate-in slide-in-from-bottom-8 duration-500">
            
            <button 
              onClick={() => setShowApplyModal(false)}
              className="absolute top-6 right-6 p-2 bg-slate-50 rounded-full hover:bg-slate-100 transition-colors cursor-pointer group border border-slate-200"
            >
              <X className="w-4 h-4 text-slate-500 group-hover:text-black" />
            </button>

            <div className="p-8 sm:p-10">
              <div className="mb-8 border-b border-slate-100 pb-6">
                <div className="inline-block px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-3">
                  {selectedJob.department} • {selectedJob.location}
                </div>
                <h3 
                  className="text-xl font-bold uppercase tracking-tight text-black"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  Apply for {selectedJob.title}
                </h3>
              </div>

              <form className="space-y-5" onSubmit={(e) => {
                e.preventDefault();
                alert("Application submitted successfully!");
                setShowApplyModal(false);
              }}>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Full Name</label>
                  <input type="text" required className="input" placeholder="Enter your full name" />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Email Address</label>
                  <input type="email" required className="input" placeholder="name@domain.com" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Phone Number</label>
                  <input type="tel" required className="input" placeholder="10 digit mobile number" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Resume / CV</label>
                  <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center hover:bg-slate-50 hover:border-[var(--lemon-hover)]/50 transition-colors cursor-pointer group">
                    <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-3 group-hover:bg-white group-hover:shadow-sm transition-all">
                      <Upload className="w-5 h-5 text-slate-400 group-hover:text-[var(--lemon-hover)]" />
                    </div>
                    <p className="text-xs font-bold text-slate-600 mb-1">Click to upload or drag & drop</p>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">PDF, DOCX up to 5MB</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">LinkedIn Profile (Optional)</label>
                  <input type="url" className="input" placeholder="https://linkedin.com/in/username" />
                </div>

                <button 
                  type="submit" 
                  className="w-full mt-6 py-4 rounded-2xl text-xs font-bold tracking-[0.15em] uppercase transition-all duration-300 hover:scale-[1.02] cursor-pointer"
                  style={{
                    background: "var(--lemon-hover)",
                    color: "#fff",
                    boxShadow: "0 10px 20px -5px rgba(234, 179, 8, 0.3)",
                  }}
                >
                  Submit Application ↗
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
