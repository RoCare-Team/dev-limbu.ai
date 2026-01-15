"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Briefcase, Users, Rocket, Heart, Globe, Zap, 
  Award, ArrowRight, CheckCircle, ArrowLeft,
  MapPin, Clock, DollarSign, Search, X, Upload
} from "lucide-react";


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
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      
      {/* =================== HERO SECTION =================== */}
      <section className="relative bg-gradient-to-br from-indigo-900 via-blue-800 to-purple-900 text-white py-24 px-6 overflow-hidden">
        <div className="absolute top-6 left-6 z-20">
          <Link href="/" className="inline-flex items-center gap-2 text-white/80 hover:text-white transition-colors bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full backdrop-blur-sm border border-white/10">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to Home</span>
          </Link>
        </div>

        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        <div className="max-w-7xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full text-sm font-medium mb-6 border border-white/20">
            <Rocket className="w-4 h-4 text-yellow-400" />
            <span>We are hiring! Join the revolution</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight tracking-tight">
            Do Your Best Work <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-pink-400">
              At Limbu.ai
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-blue-100 max-w-3xl mx-auto mb-10 leading-relaxed">
            Join India's fastest-growing AI automation platform. We're building the future of local business growth, and we need visionaries like you.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <a href="#openings" className="bg-white text-blue-900 font-bold px-8 py-4 rounded-full hover:bg-blue-50 transition-all hover:scale-105 shadow-lg flex items-center gap-2">
              View Open Positions <ArrowRight className="w-5 h-5" />
            </a>
            <a href="#culture" className="bg-transparent border-2 border-white text-white font-bold px-8 py-4 rounded-full hover:bg-white/10 transition-all">
              Our Culture
            </a>
          </div>
        </div>
      </section>

      {/* =================== STATS SECTION =================== */}
      <section className="py-10 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: "Team Members", value: "50+" },
              { label: "Cities Covered", value: "100+" },
              { label: "Growth Rate", value: "300%" },
              { label: "Happy Clients", value: "10k+" },
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-1">{stat.value}</div>
                <div className="text-sm text-gray-500 font-medium uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =================== WHY JOIN US =================== */}
      <section id="culture" className="py-20 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">Why Join <span className="text-blue-600">Limbu.ai?</span></h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We offer more than just a job. We offer a platform to grow, innovate, and make a real impact.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Zap,
                title: "Innovation First",
                desc: "Work with cutting-edge AI technologies and solve complex problems that matter."
              },
              {
                icon: Users,
                title: "Collaborative Culture",
                desc: "Join a diverse team of thinkers and doers who support each other's growth."
              },
              {
                icon: ArrowRight,
                title: "Rapid Growth",
                desc: "Fast-track your career in a high-growth startup environment with endless opportunities."
              },
              {
                icon: Heart,
                title: "Work-Life Balance",
                desc: "Flexible working hours and remote options because we value your well-being."
              },
              {
                icon: Award,
                title: "Competitive Pay",
                desc: "Top-tier salary packages, equity options, and performance-based bonuses."
              },
              {
                icon: Globe,
                title: "Remote Friendly",
                desc: "Work from anywhere. We focus on output and impact, not hours at a desk."
              }
            ].map((item, i) => (
              <div key={i} className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-blue-200 group">
                <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-600 transition-colors duration-300">
                  <item.icon className="w-7 h-7 text-blue-600 group-hover:text-white transition-colors duration-300" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                <p className="text-gray-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =================== PERKS SECTION =================== */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="md:w-1/2">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Perks that make work <br />
                <span className="text-blue-600">Feel Less Like Work</span>
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                We believe that happy employees are productive employees. That's why we provide benefits that support your lifestyle and health.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  "Health Insurance", "Learning Budget", "MacBook Pro", 
                  "Annual Retreats", "Gym Membership", "Stock Options"
                ].map((perk, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="font-medium text-gray-700">{perk}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="md:w-1/2 relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-3xl transform rotate-3 opacity-20"></div>
              <div className="relative bg-gray-100 rounded-3xl h-[400px] flex items-center justify-center overflow-hidden">
                 {/* Placeholder for Team Image */}
                 <div className="text-center p-8">
                    <Users className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">Team Photo Placeholder</p>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =================== OPEN POSITIONS =================== */}
      <section id="openings" className="py-24 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">Current <span className="text-blue-600">Openings</span></h2>
            <p className="text-xl text-gray-600">Find your next role and help us shape the future</p>
          </div>

          {/* Department Filter */}
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {departments.map((dept) => (
              <button
                key={dept}
                onClick={() => setActiveDepartment(dept)}
                className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${
                  activeDepartment === dept
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                }`}
              >
                {dept}
              </button>
            ))}
          </div>

          {/* Job List */}
          <div className="space-y-4">
            {filteredJobs.length > 0 ? (
              filteredJobs.map((job) => (
                <div key={job.id} className="bg-white rounded-2xl p-6 md:p-8 shadow-sm hover:shadow-lg transition-all border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{job.title}</h3>
                      <span className="bg-blue-100 text-blue-700 text-xs px-3 py-1 rounded-full font-medium">{job.department}</span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-3">
                      <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {job.location}</span>
                      <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {job.type}</span>
                      <span className="flex items-center gap-1"><Briefcase className="w-4 h-4" /> {job.experience}</span>
                      <span className="flex items-center gap-1"><DollarSign className="w-4 h-4" /> {job.salary}</span>
                    </div>
                    <p className="text-gray-600 text-sm">{job.description}</p>
                  </div>
                  <button 
                    onClick={() => handleApply(job)}
                    className="bg-gray-900 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-600 transition-colors flex-shrink-0 whitespace-nowrap"
                  >
                    Apply Now
                  </button>
                </div>
              ))
            ) : (
              <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300">
                <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900">No positions found</h3>
                <p className="text-gray-500">Try selecting a different department or check back later.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* =================== FRANCHISE CTA =================== */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 md:p-16 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
          
          <div className="relative z-10">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Not looking for a job?</h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Start your own business with Limbu.ai. Become a franchise partner and earn recurring revenue by helping local businesses grow.
            </p>
            <a href="/Join-our-Franchises" className="inline-flex items-center gap-2 bg-yellow-400 text-blue-900 px-8 py-4 rounded-full font-bold text-lg hover:bg-yellow-300 transition-all hover:scale-105 shadow-xl">
              Explore Franchise Opportunities <ArrowRight className="w-5 h-5" />
            </a>
          </div>
        </div>
      </section>

      {/* =================== FOOTER =================== */}
      <footer className="bg-gray-900 text-white py-12 px-6 border-t border-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-2xl font-bold text-blue-400 mb-4">Limbu.ai</h3>
              <p className="text-gray-400 text-sm">
                India's most advanced AI-powered Google My Business management platform.
              </p>
            </div>

            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition">About Us</a></li>
                <li><a href="#" className="hover:text-white transition">Careers</a></li>
                <li><a href="#" className="hover:text-white transition">Press</a></li>
                <li><a href="#" className="hover:text-white transition">Contact</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition">Blog</a></li>
                <li><a href="#" className="hover:text-white transition">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition">Case Studies</a></li>
                <li><a href="#" className="hover:text-white transition">API Docs</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">Contact</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>📞 +91 9289344726</li>
                <li>📧 careers@limbu.ai</li>
                <li>📍 Gurugram, India</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
            <p>&copy; {new Date().getFullYear()} Limbu.ai. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* =================== APPLY MODAL =================== */}
      {showApplyModal && selectedJob && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto relative animate-slideUp">
            <button 
              onClick={() => setShowApplyModal(false)}
              className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>

            <div className="p-8">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-1">Apply for {selectedJob.title}</h3>
                <p className="text-gray-500 text-sm">{selectedJob.department} • {selectedJob.location}</p>
              </div>

              <form className="space-y-4" onSubmit={(e) => {
                e.preventDefault();
                alert("Application submitted successfully!");
                setShowApplyModal(false);
              }}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input type="text" required className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" placeholder="John Doe" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <input type="email" required className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" placeholder="john@example.com" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input type="tel" required className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" placeholder="+91 9289344726" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Resume / CV</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:bg-gray-50 transition-colors cursor-pointer">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                    <p className="text-xs text-gray-400 mt-1">PDF, DOCX up to 5MB</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn Profile (Optional)</label>
                  <input type="url" className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" placeholder="https://linkedin.com/in/johndoe" />
                </div>

                <button type="submit" className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 transition-all shadow-lg mt-4">
                  Submit Application
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}