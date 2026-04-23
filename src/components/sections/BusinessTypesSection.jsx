"use client";

import React from "react";
import Link from "next/link";

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
  ];

  const WhatsAppIcon = () => (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="currentColor"
      className="mr-2"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );

  return (
    <section className="py-12 px-4 sm:px-6 lg:px-8 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h2
            className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 tracking-tight text-black"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Built for <span className="text-black">Small Business Owners</span>
          </h2>
          <p className="text-gray-600 text-lg sm:text-xl max-w-2xl mx-auto font-medium">
            You focus on your craft and leave the hassle of growth marketing to{" "}
            <span className="font-bold text-black">Limbu AI</span>
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {businessTypes.map((type, index) => (
            <Link
              href={type.slug}
              key={index}
              className={`relative group h-40 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex items-center ${type.bgColor} border border-black/5 cursor-pointer`}
            >
              <div className="flex-1 p-6 z-10">
                <h3 className="text-lg font-bold leading-tight text-black group-hover:text-black transition-colors">
                  {type.title}
                </h3>
              </div>
              <div className="w-1/2 h-full relative overflow-hidden">
                <img
                  src={type.image}
                  alt={type.title}
                  className="absolute bottom-0 right-0 w-full h-auto object-contain object-bottom translate-y-2 group-hover:scale-110 transition-transform duration-500 origin-bottom"
                />
              </div>
            </Link>
          ))}

          {/* CTA Card */}
          <div className="lg:col-span-2 relative h-40 rounded-2xl overflow-hidden bg-gradient-to-r from-yellow-600 to-yellow-400 flex items-center p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-6">
              <h3 className="text-xl sm:text-2xl font-bold text-white leading-tight max-w-xs text-center sm:text-left">
                And many more businesses like yours
              </h3>
              <button
                onClick={() =>
                  window.open("https://wa.me/919289344726", "_blank")
                }
                className="btn-lemon px-6 py-3 rounded-xl flex items-center text-sm font-bold shadow-2xl hover:scale-105 transition-transform"
              >
                <WhatsAppIcon />
                Book Free Demo
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BusinessTypesSection;