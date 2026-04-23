import HeaderSection from "@/components/sections/HeaderSection";
import FooterSection from "@/components/sections/FooterSection";
import { Calendar, User, Tag, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

// Generate Metadata for SEO
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  try {
    const res = await fetch(`${baseUrl}/api/blog?slug=${slug}&status=published`);
    const data = await res.json();

    if (!data.success || !data.blog) {
      return { title: "Blog Not Found - Limbu.ai" };
    }

    const blog = data.blog;
    return {
      title: `${blog.seoTitle || blog.title} - Limbu.ai`,
      description: blog.seoDescription || blog.excerpt,
      openGraph: {
        title: blog.title,
        description: blog.excerpt,
        images: [blog.featuredImage],
      },
    };
  } catch (error) {
    return { title: "Blog Post - Limbu.ai" };
  }
}

// Helper to decode HTML entities if double-escaped
function decodeHtml(html) {
  if (!html) return "";
  let decoded = html
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " "); // Replace non-breaking spaces so text wraps normally

  // Aggressive cleanup for HTML pasted into the visual editor
  // 1. Remove <p> wrappers around Headings
  decoded = decoded.replace(/<p>\s*(<h[1-6]>.*?<\/h[1-6]>)\s*<\/p>/gi, "$1");
  // 2. Remove <p> wrappers around Lists
  decoded = decoded.replace(/<p>\s*(<ul>.*?<\/ul>)\s*<\/p>/gi, "$1");
  // 3. Remove <p> wrappers around Blockquotes
  decoded = decoded.replace(/<p>\s*(<blockquote>.*?<\/blockquote>)\s*<\/p>/gi, "$1");
  // 4. Remove completely empty paragraphs
  decoded = decoded.replace(/<p>(\s|<br>)*<\/p>/gi, "");

  return decoded;
}

async function getBlog(slug) {  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
  try {
    const res = await fetch(`${baseUrl}/api/blog?slug=${slug}&status=published`, {
      cache: "no-store",
    });
    const data = await res.json();
    return data.success ? data.blog : null;
  } catch (error) {
    console.error("Error fetching blog:", error);
    return null;
  }
}

export default async function BlogDetailPage({ params }) {
  const { slug } = await params;
  const blog = await getBlog(slug);

  if (!blog) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <HeaderSection />

      <main className="flex-grow pt-32 pb-20">
        <article className="max-w-4xl mx-auto px-6 md:px-10">
          {/* Back Button */}
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm font-bold text-black/40 hover:text-black mb-8 transition-colors group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Back to Blog
          </Link>

          {/* Header */}
          <header className="mb-10">
            <div className="flex items-center gap-3 mb-6">
              <span className="bg-lemon-hover/10 text-lemon-hover text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest border border-lemon-hover/20">
                {blog.category || "General"}
              </span>
              <div className="h-px w-8 bg-black/10" />
              <div className="flex items-center gap-4 text-[11px] font-bold text-black/40 uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <Calendar size={12} />
                  {new Date(blog.createdAt).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
                <span className="flex items-center gap-1.5">
                  <User size={12} />
                  {blog.author || "Admin"}
                </span>
              </div>
            </div>

            <h1 className="text-3xl md:text-5xl font-black text-black mb-6 leading-[1.15] tracking-tight">
              {blog.title}
            </h1>

            {blog.excerpt && (
              <p className="text-xl text-black/50 font-medium leading-relaxed italic border-l-4 border-lemon-hover pl-6">
                {blog.excerpt}
              </p>
            )}
          </header>

          {/* Featured Image */}
          {blog.featuredImage && (
            <div className="mb-12 rounded-3xl overflow-hidden shadow-2xl border border-black/5">
              <img
                src={blog.featuredImage}
                alt={blog.title}
                className="w-full h-auto object-cover max-h-[500px]"
              />
            </div>
          )}

          {/* Content */}
          <div
            className="prose prose-lg max-w-none prose-headings:font-black prose-headings:text-black prose-headings:mt-8 prose-headings:mb-4 prose-p:text-black/80 prose-p:leading-relaxed prose-p:my-4 prose-a:text-lemon-hover prose-strong:text-black prose-li:my-1"
            dangerouslySetInnerHTML={{ __html: decodeHtml(blog.content) }}
          />

          {/* Tags */}
          {blog.tags && blog.tags.length > 0 && (
            <div className="mt-16 pt-8 border-t border-black/5 flex flex-wrap gap-2">
              <span className="text-xs font-black text-black/30 uppercase tracking-widest mr-2 flex items-center">
                <Tag size={14} className="mr-2" /> Tags:
              </span>
              {blog.tags.map((tag) => (
                <span
                  key={tag}
                  className="bg-slate-50 text-black/60 text-xs font-bold px-4 py-2 rounded-xl border border-black/5"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </article>
      </main>

      <FooterSection />
    </div>
  );
}
