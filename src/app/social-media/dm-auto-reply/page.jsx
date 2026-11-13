"use client";

import { Send } from "lucide-react";
import ReplyFeature from "@/components/social-automation/ReplyFeature";

export default function DmAutoReplyPage() {
  return (
    <ReplyFeature
      section="dmReply"
      permission="dms"
      kind="dm"
      icon={Send}
      title="DM Auto Reply"
      subtitle="Instant AI replies to messages on Facebook Messenger and Instagram."
      howItWorks={[
        "New messages are checked every 10 minutes.",
        "Customers get a helpful answer from your business details, or an invite to call.",
        "Meta allows replies within 24 hours of the customer's message.",
        "Once you reply yourself, the AI leaves that chat alone.",
      ]}
      samplePlaceholder="e.g. Hi, what is the price for a haircut?"
      emptyActivity="No DM replies yet. Turn it on and new messages will show here."
    />
  );
}
