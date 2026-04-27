"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";

const BusinessTypesSection = () => {
  const businessTypes = [
    {
      title: "Gym & Fitness Centres",
      image: "/images/category/jim.png",
      bgColor: "bg-blue-50/50",
      slug: "/gym-marketing-software",
    },
    {
      title: "Doctors & Health Clinics",
      image: "/images/category/doctor.png",
      bgColor: "bg-slate-50",
      slug: "/clinic-marketing-software",
    },
    {
      title: "Bakers & Cake Shops",
      image: "/images/category/cake.png",
      bgColor: "bg-orange-50/30",
      slug: "/bakery-marketing-software",
    },
    {
      title: "Salon Owners",
      image: "/images/category/salon.png",
      bgColor: "bg-rose-50/40",
      slug: "/salon-marketing-software",
    },
    {
      title: "Restaurants & Bars",
      image: "/images/category/restorent.png",
      bgColor: "bg-amber-50/40",
      slug: "/restaurant-marketing-software",
    },
    {
      title: "Pest Control Businesses",
      image: "/images/category/pest.png",
      bgColor: "bg-emerald-50/30",
      slug: "/pest-control-marketing-software",
    },
    {
      title: "Car Garages & Mechanics",
      image: "/images/category/car.png",
      bgColor: "bg-zinc-50",
      slug: "/car-garage-marketing-software",
    },
    {
      title: "Tours & Travels",
      image: "/images/category/tour.png",
      bgColor: "bg-sky-50/40",
      slug: "/tour-travel-marketing-software",
    },
    {
      title: "Yoga & Wellness",
      image: "/images/category/yoga.png",
      bgColor: "bg-indigo-50/30",
      slug: "/yoga-wellness-marketing-software",
    },
    {
      title: "Handyman Services",
      image: "/images/category/handyman.png",
      bgColor: "bg-stone-50",
      slug: "/handyman-marketing-software",
    },
    {
      title: "Education & Coaching",
      image: "/images/category/education.png",
      bgColor: "bg-violet-50/40",
      slug: "/education-marketing-software",
    },
    {
      title: "Real Estate Agents",
      image: "/images/category/realestate.png",
      bgColor: "bg-cyan-50/40",
      slug: "/realestate-marketing-software",
    },
  ];

  return (
    <section className="py-14 px-4 sm:px-6 lg:px-8 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 tracking-tight text-black">
            Built for <span className="text-black">Small Business Owners</span>
          </h2>

          <p className="text-gray-600 text-lg sm:text-xl max-w-2xl mx-auto font-medium">
            You focus on your business, we automate your{" "}
            <span className="font-bold text-black">
              Google Business growth with Limbu AI
            </span>
          </p>
        </div>

        {/* GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {businessTypes.map((type, index) => {
            if (!type?.slug || !type?.title) return null;

            return (
              <Link href={type.slug} key={index}>
                <div
                  className={`relative group h-40 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 flex items-center ${type.bgColor} border border-black/5 cursor-pointer`}
                >
                  {/* TEXT */}
                  <div className="flex-1 p-6 z-10">
                    <h3 className="text-lg font-bold leading-tight text-black">
                      {type.title}
                    </h3>
                  </div>

                  {/* IMAGE */}
                  <div className="w-1/2 h-full relative">
                    <Image
                      src={type.image || "/images/category/fallback.png"}
                      alt={type.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-contain object-bottom translate-y-2 group-hover:scale-110 transition-transform duration-500"
                      onError={(e) => {
                        e.currentTarget.src = "/images/category/fallback.png";
                      }}
                    />
                  </div>

                  {/* HOVER EFFECT */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-all duration-300"></div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default BusinessTypesSection;