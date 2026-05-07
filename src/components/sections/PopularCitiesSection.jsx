"use client";

import React from "react";
import Link from "next/link";
import { MapPin } from "lucide-react";

export default function PopularCitiesSection() {
  const popularCities = [
    { name: "Mumbai", image: "https://images.unsplash.com/photo-1566552881560-0be862a7c445?auto=format&fit=crop&q=80&w=400&h=300" },
    { name: "Delhi", image: "https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&q=80&w=400&h=300" },
    { name: "Bangalore", image: "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&q=80&w=400&h=300" },
    {
      name: "Hyderabad",
      image: "https://plus.unsplash.com/premium_photo-1697730430283-7e4456c78375?q=80&w=580&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
    },
    {
      name: "Gurgaon",
      image: "https://images.unsplash.com/photo-1689338039987-8a2539194e27?q=80&w=774&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
    },
    { name: "Kolkata", image: "https://images.unsplash.com/photo-1558431382-27e303142255?auto=format&fit=crop&q=80&w=400&h=300" },
    {
      name: "Noida",
      image: "https://images.unsplash.com/photo-1645938374927-d74b9349be51?q=80&w=726&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
    },
    {
      name: "Chandigarh",
      image: "https://plus.unsplash.com/premium_photo-1691031429261-aeb324882888?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
    },
    { name: "Jaipur", image: "https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&q=80&w=400&h=300" },
    { name: "Surat", image: "https://images.unsplash.com/photo-1593693411515-c20261bcad6e?auto=format&fit=crop&q=80&w=400&h=300" },
  ];

  // Duplicate the array to create a seamless infinite scrolling effect
  const marqueeCities = [...popularCities, ...popularCities];

  return (
    <section className="py-16 bg-white overflow-hidden relative border-y border-slate-100">
      <style>{`
        @keyframes scrollMarquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: flex;
          width: max-content;
          animation: scrollMarquee 35s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>

      <div className="max-w-7xl mx-auto px-4 mb-10 text-center">
        <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">
          Serving Local Businesses Across India
        </h2>
        <p className="text-slate-500 font-medium text-lg max-w-2xl mx-auto">
          From metro cities to tier-2 towns, Limbu AI is helping businesses rank #1 on Google everywhere. Select your city to see local growth stats.
        </p>
      </div>

      <div className="relative w-full">
        {/* Left/Right Fade Gradients for a seamless effect */}
        <div className="absolute top-0 left-0 w-24 md:w-48 h-full bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
        <div className="absolute top-0 right-0 w-24 md:w-48 h-full bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

        <div className="animate-marquee gap-6 px-4">
          {marqueeCities.map((city, idx) => {
            const slug = city.name.toLowerCase();
            return (
              <Link
                key={`${slug}-${idx}`}
                href={`/services/google-bussiness-profile-management-${slug}`}
                className="group relative w-64 h-48 rounded-2xl overflow-hidden shrink-0 block shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 border border-slate-100"
              >
                <img
                  src={city.image}
                  alt={`${city.name} Local SEO`}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent" />

                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center flex-shrink-0 shadow-lg">
                      <MapPin className="w-4 h-4 text-slate-900" />
                    </div>
                    <span className="text-white font-bold text-lg">{city.name}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}