"use client";

import { MessageSquareReply } from "lucide-react";
import ReplyFeature from "@/components/social-automation/ReplyFeature";

export default function CommentAutoReplyPage() {
  return (
    <ReplyFeature
      section="commentReply"
      permission="comments"
      kind="comment"
      icon={MessageSquareReply}
      title="Comment Auto Reply"
      subtitle="AI replies to new comments on your Facebook and Instagram posts, in your tone."
      howItWorks={[
        "New comments on your latest posts are checked every 10 minutes.",
        "Each gets a short, personal reply in the customer's language.",
        "Comments you already replied to are skipped.",
        "Abusive or spam comments can be hidden instead (Delete Negative Comments).",
      ]}
      samplePlaceholder="e.g. Kya aap Sunday ko open rehte ho?"
      emptyActivity="No comment replies yet. Turn it on and new comments will show here."
    />
  );
}
