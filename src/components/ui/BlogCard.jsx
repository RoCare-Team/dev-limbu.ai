"use client";

import Link from "next/link";
import { ArrowRight, Calendar, User, Tag } from "lucide-react";

export default function BlogCard({ blog }) {
  const { title, slug, excerpt, featuredImage, author, category, createdAt } = blog;

  return (
    <div className="group bg-white rounded-2xl overflow-hidden border border-black/5 hover:border-black/10 shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col h-full">
      {/* Image Section */}
      <Link href={`/blog/${slug}`} className="relative block overflow-hidden aspect-video">
        <img
          src={featuredImage || "/images/app_template.jpg"}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        {category && (
          <div className="absolute top-4 left-4">
            <span className="bg-white/90 backdrop-blur-md text-black text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
              {category}
            </span>
          </div>
        )}
      </Link>

      {/* Content Section */}
      <div className="p-6 flex flex-col flex-1">
        <div className="flex items-center gap-4 mb-3 text-[11px] font-medium text-black/40">
          <div className="flex items-center gap-1.5">
            <Calendar size={12} className="text-black/20" />
            {new Date(createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </div>
          <div className="flex items-center gap-1.5">
            <User size={12} className="text-black/20" />
            {author || "Admin"}
          </div>
        </div>

        <Link href={`/blog/${slug}`}>
          <h3 className="text-xl font-bold text-black mb-3 group-hover:text-lemon-hover transition-colors line-clamp-2 leading-tight">
            {title}
          </h3>
        </Link>

        <p className="text-sm text-black/60 line-clamp-3 mb-6 leading-relaxed flex-1">
          {excerpt || "Read more about this interesting topic on Limbu.ai blog..."}
        </p>

        <Link
          href={`/blog/${slug}`}
          className="inline-flex items-center gap-2 text-sm font-bold text-black group-hover:gap-3 transition-all"
        >
          Read Article
          <ArrowRight size={16} className="text-lemon-hover" />
        </Link>
      </div>
    </div>
  );
}
