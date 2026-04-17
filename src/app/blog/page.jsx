import HeaderSection from "@/components/sections/HeaderSection";
import FooterSection from "@/components/sections/FooterSection";
import BlogCard from "@/components/ui/BlogCard";
import { Metadata } from "next";

export const metadata = {
  title: "Blog - Limbu.ai | GMB Optimization & AI Marketing Insights",
  description: "Stay updated with the latest trends in Google Business Profile optimization, AI post generation, and local SEO strategies to grow your business.",
};

async function getBlogs() {
  // Use absolute URL for server-side fetching in Next.js
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
  try {
    const res = await fetch(`${baseUrl}/api/blog?status=published`, {
      cache: "no-store", // Ensure fresh data
    });
    const data = await res.json();
    return data.success ? data.blogs : [];
  } catch (error) {
    console.error("Error fetching blogs:", error);
    return [];
  }
}

export default async function BlogListPage() {
  const blogs = await getBlogs();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <HeaderSection />

      <main className="flex-grow pt-28 pb-20">
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          {/* Header Section */}
          <div className="mb-16 text-center">
            <h1 className="text-4xl md:text-5xl font-black text-black mb-4 tracking-tight">
              Our <span className="text-lemon-hover">Blog</span>
            </h1>
            <p className="text-black/60 text-lg max-w-2xl mx-auto font-medium">
              Expert insights, tutorials, and strategies to help you dominate local search and automate your marketing with AI.
            </p>
          </div>

          {/* Blog Grid */}
          {blogs.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-black/5">
              <p className="text-black/40 font-bold text-xl">No articles published yet. Check back soon!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {blogs.map((blog) => (
                <BlogCard key={blog._id} blog={blog} />
              ))}
            </div>
          )}
        </div>
      </main>

      <FooterSection />
    </div>
  );
}
