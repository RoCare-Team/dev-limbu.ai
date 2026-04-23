"use client";

import React from "react";
import HeaderSection from "@/components/sections/HeaderSection";
import FooterSection from "@/components/sections/FooterSection";
import {
    ShieldCheck,
    Star,
    AlertCircle,
    MapPin,
    CheckCircle2,
    ChevronRight,
    TrendingUp,
    Settings,
    RefreshCcw,
    PlusCircle,
    Users,
    Search,
    MessageSquare,
    Zap,
    Layout,
    BarChart3,
    PhoneCall,
    Smartphone
} from "lucide-react";
import Link from "next/link";

export default function GMBManagementServicePage() {
    return (
        <div className="min-h-screen font-inter text-slate-900 bg-white">
            <HeaderSection />

            {/* ── Hero Section ── */}
            <section className="relative pt-20 pb-10 lg:pt-24 lg:pb-12 bg-white text-slate-900 overflow-hidden border-b border-slate-100">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-lemon-hover/20 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/3"></div>

                <div className="max-w-7xl mx-auto px-6 lg:px-10 relative z-10">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div className="relative">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lemon-hover/10 text-slate-900 text-[10px] font-black uppercase tracking-[0.2em] mb-6 border border-lemon-hover/20">
                                <ShieldCheck size={14} className="text-lemon-hover" /> Google Maps Ranking Service
                            </div>

                            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tighter leading-[1.1] mb-6 text-slate-900">
                                Rank <span className="text-lemon-hover">#1 on Google Maps</span> and Get More Customers
                            </h1>

                            <div className="relative pl-5 border-l-2 border-lemon-hover mb-8">
                                <p className="text-base md:text-lg text-slate-600 font-medium leading-relaxed max-w-xl">
                                    We manage your Google Business Profile so your shop always looks active, accurate, and easy for local customers to find.
                                </p>
                            </div>

                            {/* Testimonial Lite */}
                            <div className="mb-8 p-4 bg-slate-50 rounded-2xl border border-slate-100 max-w-md shadow-sm">
                                <p className="text-sm font-medium italic text-slate-600 mb-2 leading-relaxed">
                                    "Limbu AI made managing our Google profile so easy. We don't have to worry about it anymore, and our store visits have doubled!"
                                </p>
                                <div className="flex items-center gap-2">
                                    <div className="flex text-lemon-hover">
                                        <Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" /><Star size={12} fill="currentColor" />
                                    </div>
                                    <span className="text-[11px] font-bold text-slate-500">Rahul S., Store Owner</span>
                                </div>
                            </div>

                            {/* CTA Buttons */}
                            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                                <Link
                                    href="https://wa.me/919283344726"
                                    className="bg-lemon-hover text-slate-900 px-7 py-3.5 rounded-xl font-black text-sm text-center hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 shadow-lg shadow-lemon-hover/20"
                                >
                                    Talk on WhatsApp <ChevronRight size={16} />
                                </Link>
                                <Link
                                    href="/signup"
                                    className="bg-white text-slate-900 border border-slate-200 hover:bg-slate-50 px-7 py-3.5 rounded-xl font-black text-sm text-center transition-all"
                                >
                                    Start Now
                                </Link>
                            </div>
                            <p className="text-[11px] font-bold text-slate-500 flex items-center gap-2">
                                <CheckCircle2 size={14} className="text-green-500" /> Great for a single shop or businesses with 500+ locations.
                            </p>
                        </div>

                        {/* Right side Illustration */}
                        <div className="relative hidden lg:block lg:pl-10">
                            <div className="relative z-10 p-2 bg-slate-50 rounded-[2rem] border border-slate-100 shadow-inner">
                                <img
                                    src="https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=1200&auto=format&fit=crop"
                                    alt="Customer Support"
                                    className="rounded-[1.8rem] shadow-xl"
                                />
                            </div>
                            {/* Floating Stat */}
                            <div className="absolute -bottom-4 -left-4 bg-white p-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-100 animate-bounce-slow z-10">
                                <div className="w-10 h-10 rounded-xl bg-lemon-hover/20 text-slate-900 flex items-center justify-center">
                                    <PhoneCall size={20} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase">Benefit</p>
                                    <p className="text-base font-black text-slate-900">More Phone Calls</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Pain Points Section ── */}
            <section className="py-10 bg-white">
                <div className="max-w-7xl mx-auto px-6 lg:px-10">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div className="bg-slate-50 p-8 lg:p-12 rounded-[2.5rem] border border-slate-100 relative shadow-sm">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-2xl bg-slate-900 text-lemon-hover flex items-center justify-center shadow-xl">
                                <AlertCircle size={32} />
                            </div>
                            <h2 className="text-2xl md:text-3xl font-black mb-6 text-center lg:text-left mt-4">
                                Are You Losing Customers Online?
                            </h2>
                            <ul className="space-y-4 mb-8">
                                {[
                                    "Does your shop's address or timings keep changing on Google?",
                                    "Did your business drop in search results overnight?",
                                    "Are you getting fewer phone calls from local customers?",
                                    "Is a nearby competitor ranking higher with fewer reviews?",
                                    "Do you forget to reply to customer reviews?",
                                    "Did your profile get blocked and you don't know how to fix it?"
                                ].map((text, i) => (
                                    <li key={i} className="flex items-start gap-3">
                                        <CheckCircle2 size={18} className="text-red-400 mt-1 shrink-0" />
                                        <span className="font-semibold text-slate-700">{text}</span>
                                    </li>
                                ))}
                            </ul>
                            <p className="text-slate-500 font-medium text-center lg:text-left leading-relaxed">
                                Forget these headaches. Limbu AI handles your entire Google presence for you.
                            </p>
                        </div>
                        <div className="lg:pl-10">
                            <div className="inline-flex items-center gap-2 text-lemon-hover font-black mb-4 uppercase tracking-[0.2em] text-[10px]">
                                <RefreshCcw size={14} /> The Limbu AI Solution
                            </div>
                            <h2 className="text-3xl lg:text-4xl font-black tracking-tight mb-6 leading-tight">
                                The Easiest Way to Manage Your Business on Google.
                            </h2>
                            <p className="text-slate-600 font-medium mb-8 leading-relaxed text-base lg:text-lg">
                                We don't just "post" updates. We make sure your business shows up when customers are looking to buy. Our smart system keeps your profile fresh, attractive, and always growing.
                            </p>
                            <div className="grid sm:grid-cols-2 gap-6">
                                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
                                    <Zap size={20} className="text-lemon-hover mb-3" />
                                    <h4 className="font-black text-sm mb-1 uppercase tracking-tight">Daily Fresh Updates</h4>
                                    <p className="text-[12px] text-slate-500 font-medium">Our AI creates beautiful daily posts so your shop always looks open and active.</p>
                                </div>
                                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-100">
                                    <Star size={20} className="text-lemon-hover mb-3" />
                                    <h4 className="font-black text-sm mb-1 uppercase tracking-tight">Smart Review System</h4>
                                    <p className="text-[12px] text-slate-500 font-medium">Get more 5-star reviews easily with our Magic QR, and let us handle angry customers privately.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Feature: Accuracy ── */}
            <section className="py-10 bg-slate-50">
                <div className="max-w-7xl mx-auto px-6 lg:px-10">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div className="order-2 lg:order-1">
                            <img
                                src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1200&auto=format&fit=crop"
                                alt="Accurate Business Data"
                                className="rounded-[2rem] shadow-xl"
                            />
                        </div>
                        <div className="order-1 lg:order-2">
                            <div className="inline-flex items-center gap-2 text-slate-900 font-black mb-4 uppercase tracking-[0.2em] text-[10px]">
                                <MapPin size={14} className="text-lemon-hover" /> 100% Accurate Details
                            </div>
                            <h2 className="text-3xl lg:text-4xl font-black tracking-tight mb-6 leading-tight">
                                Keep Your Business Details Perfectly Correct.
                            </h2>
                            <p className="text-slate-600 font-medium mb-6 leading-relaxed">
                                Google sometimes accepts wrong updates from random users. We check your profile every hour to block wrong changes. Your phone number, address, and timings will always be correct.
                            </p>
                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    "Opening Hours & Holidays",
                                    "Store Address",
                                    "Phone Numbers",
                                    "Services List",
                                    "Photos & Videos",
                                    "Special Offers"
                                ].map((text, i) => (
                                    <div key={i} className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                        <div className="w-1.5 h-1.5 rounded-full bg-lemon-hover" /> {text}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Overview Grid ── */}
            <section className="py-10 bg-white">
                <div className="max-w-7xl mx-auto px-6 lg:px-10">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl lg:text-4xl font-black tracking-tight mb-4 uppercase">
                            How We <span className="text-lemon-hover italic">Grow Your Business</span>
                        </h2>
                        <p className="text-slate-500 text-sm font-medium max-w-xl mx-auto">
                            From fixing old mistakes to bringing in new customers, here is how we help you.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            {
                                num: "01",
                                title: "Fixing Mistakes",
                                desc: "We clean up your profile, remove duplicate listings, and fix any rule violations.",
                                icon: <Search size={20} />
                            },
                            {
                                num: "02",
                                title: "Daily Updates",
                                desc: "We upload new photos and posts regularly so customers know you are active.",
                                icon: <Zap size={20} />
                            },
                            {
                                num: "03",
                                title: "Review Replies",
                                desc: "We make sure every customer review gets a polite and quick reply.",
                                icon: <MessageSquare size={20} />
                            },
                            {
                                num: "04",
                                title: "Checking Your Rank",
                                desc: "We track how high your business shows up on Google Maps in your city.",
                                icon: <BarChart3 size={20} />
                            },
                            {
                                num: "05",
                                title: "Safety Guard",
                                desc: "We protect your profile from getting blocked or suspended by Google.",
                                icon: <ShieldCheck size={20} />
                            },
                            {
                                num: "06",
                                title: "Monthly Reports",
                                desc: "Every month, we show you exactly how many new people called or visited your shop.",
                                icon: <PlusCircle size={20} />
                            }
                        ].map((item, i) => (
                            <div key={i} className="group p-8 rounded-2xl bg-white border border-slate-100 hover:border-lemon-hover/50 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="text-lemon-hover font-black text-2xl group-hover:scale-110 transition-transform">{item.num}</div>
                                    <div className="w-10 h-10 rounded-xl bg-slate-900 text-lemon-hover flex items-center justify-center">
                                        {item.icon}
                                    </div>
                                </div>
                                <h3 className="text-lg font-black mb-3">{item.title}</h3>
                                <p className="text-sm text-slate-500 font-medium leading-relaxed">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Why Specialists Section ── */}
            <section className="py-10 bg-slate-50">
                <div className="max-w-7xl mx-auto px-6 lg:px-10">
                    <div className="text-center mb-16 max-w-3xl mx-auto">
                        <div className="inline-flex items-center gap-2 text-lemon-hover font-black mb-4 uppercase tracking-[0.2em] text-[10px]">
                            <ShieldCheck size={14} /> Why Limbu AI?
                        </div>
                        <h2 className="text-3xl lg:text-4xl font-black tracking-tight mb-6">
                            Specialists in Google Business Management — Not a General Agency
                        </h2>
                        <p className="text-slate-600 text-lg font-medium leading-relaxed">
                            Most agencies treat Google profiles as an afterthought. We've built our entire business around it. That means you get deeper expertise, faster results, and a system designed specifically for Google.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-3 mb-4">
                                <Search size={24} className="text-lemon-hover" />
                                <h3 className="text-lg font-black text-slate-900">100% Focus on Google</h3>
                            </div>
                            <p className="text-slate-500 text-sm font-medium leading-relaxed">
                                We don't juggle dozens of different services. We live and breathe Google Business. Our tools and systems are purpose-built for this single channel — and it shows in the results.
                            </p>
                        </div>

                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-3 mb-4">
                                <ShieldCheck size={24} className="text-lemon-hover" />
                                <h3 className="text-lg font-black text-slate-900">Proactive Safety Protection</h3>
                            </div>
                            <p className="text-slate-500 text-sm font-medium leading-relaxed">
                                Google changes its rules constantly. We monitor your profile daily to block risky edits and catch issues before they lead to your profile being blocked.
                            </p>
                        </div>

                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-3 mb-4">
                                <MapPin size={24} className="text-lemon-hover" />
                                <h3 className="text-lg font-black text-slate-900">Expertise for Multi-Locations</h3>
                            </div>
                            <p className="text-slate-500 text-sm font-medium leading-relaxed">
                                Managing 10, 50, or 500 locations requires scale and precision. We handle bulk updates, audits, and location-level coordination so your internal team doesn't have to.
                            </p>
                        </div>

                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-3 mb-4">
                                <Star size={24} className="text-lemon-hover fill-lemon-hover" />
                                <h3 className="text-lg font-black text-slate-900">Proven Results & Real Reviews</h3>
                            </div>
                            <p className="text-slate-500 text-sm font-medium leading-relaxed">
                                With hundreds of profiles managed and thousands of reinstatements, our system is predictable and repeatable. We know exactly what works to get you ranking.
                            </p>
                        </div>

                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-3 mb-4">
                                <Users size={24} className="text-lemon-hover" />
                                <h3 className="text-lg font-black text-slate-900">Dedicated Personal Support</h3>
                            </div>
                            <p className="text-slate-500 text-sm font-medium leading-relaxed">
                                No slow support tickets or generic replies. You get specialists who know your brand, your locations, and your goals — with direct communication and fast follow-up.
                            </p>
                        </div>

                        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-3 mb-4">
                                <Settings size={24} className="text-lemon-hover" />
                                <h3 className="text-lg font-black text-slate-900">Smart Software + Human Experts</h3>
                            </div>
                            <p className="text-slate-500 text-sm font-medium leading-relaxed">
                                Our AI software handles the monitoring and automation, while our human experts handle the strategy and judgment calls. You get the best of both worlds.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Testimonials Section ── */}
            <section className="py-10 bg-white">
                <div className="max-w-7xl mx-auto px-6 lg:px-10">
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center gap-2 text-lemon-hover font-black mb-4 uppercase tracking-[0.2em] text-[10px]">
                            <Star size={14} className="fill-lemon-hover" /> Client Success Stories
                        </div>
                        <h2 className="text-3xl lg:text-4xl font-black tracking-tight mb-4">
                            Hear From Business Owners Like You
                        </h2>
                    </div>
                    <div className="grid md:grid-cols-3 gap-6">
                        {[
                            {
                                text: "Limbu AI made managing our Google profile so easy. We don't have to worry about it anymore, and our store visits have literally doubled in just 3 months!",
                                author: "Rahul S.",
                                role: "Retail Store Owner"
                            },
                            {
                                text: "I used to forget to reply to reviews and my timings were always wrong on holidays. Since Limbu AI took over, my ranking went from #8 to #2 in my area.",
                                author: "Priya M.",
                                role: "Clinic Manager"
                            },
                            {
                                text: "Managing 15 restaurant locations was a nightmare. The Limbu AI team handles everything in bulk. It saves me at least 10 hours a week.",
                                author: "Karan D.",
                                role: "Franchise Owner"
                            }
                        ].map((item, i) => (
                            <div key={i} className="p-8 rounded-2xl bg-slate-50 border border-slate-100 shadow-sm relative">
                                <div className="flex text-lemon-hover mb-4">
                                    <Star size={16} className="fill-lemon-hover" /><Star size={16} className="fill-lemon-hover" /><Star size={16} className="fill-lemon-hover" /><Star size={16} className="fill-lemon-hover" /><Star size={16} className="fill-lemon-hover" />
                                </div>
                                <p className="text-sm font-medium italic text-slate-600 mb-6 leading-relaxed">
                                    "{item.text}"
                                </p>
                                <div>
                                    <p className="text-base font-black text-slate-900">{item.author}</p>
                                    <p className="text-[11px] font-bold text-slate-500 uppercase">{item.role}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── FAQ Section ── */}
            <section className="py-10 bg-slate-50">
                <div className="max-w-7xl mx-auto px-6 lg:px-10">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl lg:text-4xl font-black tracking-tight mb-4">
                            Frequently Asked Questions
                        </h2>
                        <p className="text-slate-500 font-medium max-w-xl mx-auto">
                            Got questions about how our Google Business Management works? We've got answers.
                        </p>
                    </div>
                    <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
                        {[
                            {
                                q: "Do I lose ownership of my Google Profile?",
                                a: "No, absolutely not. You remain the primary owner of your profile. We simply request 'Manager' access so our team and software can make updates on your behalf."
                            },
                            {
                                q: "How long does it take to see results?",
                                a: "While we fix errors and update your profile immediately, ranking improvements generally take 3 to 6 weeks depending on how competitive your area and industry are."
                            },
                            {
                                q: "What if Google suspends my profile?",
                                a: "Profile suspensions happen, but we act as your shield. Our team is highly experienced in the reinstatement process and will handle the entire appeal with Google directly."
                            },
                            {
                                q: "Do you handle negative reviews?",
                                a: "Yes! We reply to all reviews (positive and negative) based on brand guidelines we establish with you. For highly sensitive negative reviews, we escalate them to you first."
                            }
                        ].map((faq, i) => (
                            <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                                <h4 className="text-lg font-black text-slate-900 mb-2 flex items-start gap-2">
                                    <span className="text-lemon-hover">Q.</span> {faq.q}
                                </h4>
                                <p className="text-sm text-slate-600 font-medium leading-relaxed pl-6">
                                    {faq.a}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Popular Cities Section ── */}
            <section className="py-10 bg-white">
                <div className="max-w-7xl mx-auto px-6 lg:px-10">
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center gap-2 text-lemon-hover font-black mb-3 uppercase tracking-[0.2em] text-[10px]">
                            <MapPin size={14} /> Local Presence
                        </div>
                        <h2 className="text-3xl lg:text-4xl font-black tracking-tight mb-4">
                            Popular Cities Where Limbu AI is Growing
                        </h2>
                        <p className="text-slate-500 font-medium max-w-xl mx-auto">
                            We help businesses rank #1 across major hubs in India. Join the local leaders in your city.
                        </p>
                    </div>
                    
                    <div className="flex flex-wrap justify-center gap-3">
                        {[
                            "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Ahmedabad", 
                            "Chennai", "Kolkata", "Surat", "Pune", "Jaipur", 
                            "Lucknow", "Kanpur", "Nagpur", "Indore", "Thane", 
                            "Bhopal", "Visakhapatnam", "Pimpri-Chinchwad", "Patna", "Vadodara"
                        ].map((city, i) => (
                            <div 
                                key={i} 
                                className="px-5 py-2.5 rounded-full bg-slate-50 border border-slate-100 text-sm font-bold text-slate-700 hover:border-lemon-hover hover:text-lemon-hover transition-colors cursor-default flex items-center gap-2"
                            >
                                <div className="w-1.5 h-1.5 rounded-full bg-lemon-hover" />
                                {city}
                            </div>
                        ))}
                    </div>
                    
                    <p className="text-center mt-8 text-xs font-bold text-slate-400 uppercase tracking-widest">
                        + Serving 500+ other locations nationwide
                    </p>
                </div>
            </section>

            {/* ── Final CTA ── */}
            <section className="py-10 px-6">
                <div className="max-w-5xl mx-auto rounded-[2.5rem] bg-white text-slate-900 border border-slate-100 p-10 lg:p-20 text-center relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-lemon-hover/20 blur-[100px] rounded-full" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full" />

                    <div className="relative z-10">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lemon-hover/10 border border-lemon-hover/20 text-lemon-hover text-[10px] font-black uppercase tracking-[0.2em] mb-8">
                            <Smartphone size={14} /> Ready to Grow?
                        </div>
                        <h2 className="text-3xl lg:text-5xl font-black mb-6 leading-tight tracking-tighter">
                            Stop Worrying About Google. <br />Start Growing Your Business.
                        </h2>
                        <p className="text-slate-600 font-medium text-base lg:text-lg max-w-2xl mx-auto mb-10">
                            Join hundreds of business owners who let us handle the hard work while they enjoy more phone calls and foot traffic.
                        </p>
                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            <Link
                                href="https://wa.me/919283344726"
                                className="bg-lemon-hover text-slate-900 px-10 py-4 rounded-xl font-black text-base hover:scale-105 transition-transform shadow-lg shadow-lemon-hover/20"
                            >
                                Book a Free Call
                            </Link>
                            <Link
                                href="/pricing"
                                className="bg-white text-slate-900 px-10 py-4 rounded-xl font-black text-base hover:bg-slate-50 transition-all border border-slate-200"
                            >
                                See Pricing
                            </Link>
                        </div>
                        <p className="mt-8 text-slate-500 text-xs font-bold flex items-center justify-center gap-2">
                            <ShieldCheck size={14} className="text-green-500" /> Cancel anytime. You own your profile 100%. No hidden fees.
                        </p>
                    </div>
                </div>
            </section>

            <FooterSection />
        </div>
    );
}