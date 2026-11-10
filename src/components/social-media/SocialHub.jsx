"use client";

import { Suspense } from "react";
import HubSection from "./HubSection";
import SocialAccounts from "./SocialAccounts";
import SocialTools from "./SocialTools";
import { useUserHomeSections } from "@/hooks/useUserHomeSections";

/**
 * Client part of /social-media. Loads the user's plan once and passes it down:
 *  - any paid plan  -> accounts can be connected
 *  - Social plan    -> social tools unlocked (see SocialTools)
 */
export default function SocialHub({ initialSections }) {
  const { sections, planGroups } = useUserHomeSections(initialSections);
  // null while loading — cards show "Checking…" instead of a wrong state
  const isPaid = planGroups === null ? null : planGroups.length > 0;

  return (
    <>
      <HubSection title="Connected accounts" text="Connect a platform once and publish to it from Limbu AI.">
        {/* useSearchParams inside needs a Suspense boundary */}
        <Suspense fallback={<div className="h-32 animate-pulse rounded-2xl bg-slate-100" />}>
          <SocialAccounts isPaid={isPaid} />
        </Suspense>
      </HubSection>

      <SocialTools sections={sections} planGroups={planGroups} />
    </>
  );
}
