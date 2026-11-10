"use client";

import Lottie from "lottie-react";
import animationData from "@/assets/animation/Loading.json";
import PostCard from "./PostCard";

/**
 * The post list under the tabs: loading animation, empty state, or the cards
 * plus the infinite-scroll sentinel (`loaderRef`). `cardProps` is spread onto
 * every PostCard (all the action handlers).
 */
export default function PostsGrid({ posts, isLoading, isLoadingMore, activeTab, loaderRef, cardProps }) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Lottie animationData={animationData} loop className="h-32 w-32" />
        <p className="mt-4 text-gray-500">Loading your creatives...</p>
      </div>
    );
  }

  if (!posts.length) {
    return (
      <div className="rounded-3xl border-3 border-dashed border-slate-200 bg-white p-16 text-center shadow-xl">
        <div className="mb-6 text-8xl">📭</div>
        <h3 className="mb-2 text-xl font-bold">No posts found</h3>
        <p className="text-slate-900/70">{`No ${activeTab} posts yet`}</p>
      </div>
    );
  }

  return (
    <>
      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <PostCard key={post._id} post={post} {...cardProps} />
        ))}
      </div>
      <div ref={loaderRef} className="h-10 w-full" />
      {isLoadingMore && (
        <div className="flex justify-center py-6">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-slate-500" />
        </div>
      )}
    </>
  );
}
