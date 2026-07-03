import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import GmbUser from '@/models/GmbUser';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getPlanPostLimit, calculatePostingSchedule, getFrequencyStep } from '@/utils/userSettingsHelpers';
import { zonedYmdString } from '@/utils/postingScheduleWindow';
import { getEffectivePackageExpiry } from '@/utils/userPlanExpiry';
import AutomationPlan from '@/models/AutomationPlan';
import Post from '@/models/PostStatus';

function normEmail(e) {
  return String(e || '').trim().toLowerCase();
}

function emailRegexFor(e) {
  const n = normEmail(e);
  if (!n) return null;
  return new RegExp(`^${n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
}

/**
 * Resolve Mongoose User for settings: session email (case-insensitive), or client userId
 * when that row clearly belongs to the signed-in account (email / connectedBusinessEmail / GMB link).
 */
async function resolveUserForSettings(session, requestedUserId) {
  const sessionEmail = normEmail(session?.user?.email);
  if (!sessionEmail) return null;

  const rid = typeof requestedUserId === 'string' ? requestedUserId.trim() : '';
  const rx = emailRegexFor(sessionEmail);

  let user = rx ? await User.findOne({ email: rx }) : null;
  if (user) return user;

  if (rid) {
    const byId = await User.findOne({ userId: rid });
    if (!byId) return null;
    const uem = normEmail(byId.email);
    const cem = normEmail(byId.connectedBusinessEmail);
    if (uem === sessionEmail || cem === sessionEmail) return byId;

    if (byId.gmbProjectId) {
      const gmb = rx ? await GmbUser.findOne({ email: rx }).lean() : null;
      const linked =
        gmb?.projects?.some((p) => p.googleId === byId.gmbProjectId) ?? false;
      if (linked) return byId;
    }
  }

  return null;
}

export async function GET(request) {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const queryUserId = searchParams.get('userId')?.trim() || '';

    const userDoc = await resolveUserForSettings(session, queryUserId);
    if (!userDoc) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const user = userDoc.toObject ? userDoc.toObject({ versionKey: false }) : userDoc;

    const gmbRx = emailRegexFor(user.email || session.user.email);
    const gmbUser = gmbRx ? await GmbUser.findOne({ email: gmbRx }).lean() : null;
    const gmbProjects = gmbUser?.projects || [];

    const planLimit  = getPlanPostLimit(user.paidPackage, user.planDuration);
    // Latest of packageExpiryDate and subscription.expiry — a renewal may have
    // updated only one field, so trust whichever is further in the future.
    const effectiveExpiryGet = getEffectivePackageExpiry(user);
    const isValidPlan = !!(effectiveExpiryGet && effectiveExpiryGet > new Date());

    const planLookupIds = [...new Set([queryUserId, user.userId, user._id?.toString()].filter(Boolean))];
    const explicitUserId = queryUserId?.trim() || '';
    const canonicalUserId =
      explicitUserId ||
      String(user.userId || '').trim() ||
      user._id?.toString() ||
      '';

    // One AutomationPlan per dashboard `userId` (localStorage USR_*). Do not match by userRef alone
    // when the client sends an explicit userId — that would show another account's settings.
    let activePlan = explicitUserId
      ? await AutomationPlan.findOne({
          active: true,
          userId: explicitUserId,
        })
          .sort({ updatedAt: -1 })
          .lean()
      : await AutomationPlan.findOne({
          active: true,
          userId: canonicalUserId,
        })
          .sort({ updatedAt: -1 })
          .lean();

    if (!activePlan && !explicitUserId) {
      activePlan = await AutomationPlan.findOne({
        active: true,
        userRef: user._id,
      })
        .sort({ updatedAt: -1 })
        .lean();
    }

    const automationSettings = activePlan || { automationEnabled: false };

    // Prefer AutomationPlan.planDetails.postsUsed — kept in sync by the cron after every post.
    // Fall back to User.postsUsed for users who haven't run automation yet.
    const postsUsed = activePlan?.planDetails?.postsUsed ?? user.postsUsed ?? 0;
    const remaining = Math.max(0, planLimit - postsUsed);

    // Successful automation/manual posts by platform (same userId variants as posts collection)
    const postUserIds = [...new Set([...planLookupIds, user.userId, user._id?.toString()].filter(Boolean))];
    const postedDocs = await Post.find({
      userId: { $in: postUserIds },
      status: 'posted',
    })
      .select('scheduledDateSource')
      .lean();

    const usageByPlatform = { gmb: 0, fb: 0, ig: 0 };
    for (const p of postedDocs) {
      const src = Array.isArray(p.scheduledDateSource) ? p.scheduledDateSource : [];
      for (const plat of src) {
        if (plat === 'gmb' || plat === 'fb' || plat === 'ig') {
          usageByPlatform[plat]++;
        }
      }
    }

    // ── Compute next scheduled post date ─────────────────────────────────────
    let nextScheduledDate = null;
    if (activePlan?.automationEnabled && activePlan?.schedule?.length > 0) {
      const postIndex   = activePlan.postIndex || 0;
      const now         = new Date();
      // Try schedule[postIndex] first; if already passed walk forward
      const futureDates = activePlan.schedule
        .map(d => new Date(d))
        .filter(d => d >= now)
        .sort((a, b) => a - b);
      nextScheduledDate = futureDates[0] ?? null;
    } else if (activePlan?.automationEnabled && activePlan?.lastPostDate) {
      // No pre-computed schedule — derive from lastPostDate + frequency
      const { getFrequencyStep } = await import('@/utils/userSettingsHelpers');
      const step        = getFrequencyStep(activePlan.frequency || 'daily');
      const last        = new Date(activePlan.lastPostDate);
      last.setHours(0, 0, 0, 0);
      const next        = new Date(last);
      next.setDate(next.getDate() + step);
      nextScheduledDate = next;
    } else if (activePlan?.automationEnabled && activePlan?.startDate) {
      nextScheduledDate = new Date(activePlan.startDate);
    }

    return NextResponse.json({
      automationSettings,
      selectedBusiness:   activePlan?.selectedBusiness || user.selectedBusiness || null,
      businessName:       activePlan?.businessName || user.selectedBusiness?.name || '',
      gmbProjectId:       user.gmbProjectId || null,
      gmbProjects,
      savedLocations:     activePlan?.locations || [],
      keywordsRequired:   planLimit,
      automationStatus: {
        enabled:           activePlan?.automationEnabled ?? false,
        nextScheduledDate: nextScheduledDate ?? null,
        lastPostDate:      activePlan?.lastPostDate ?? null,
        postsUsed,
        remaining,
        postIndex:         activePlan?.postIndex ?? 0,
        totalKeywords:     activePlan?.keywords?.length ?? 0,
        frequency:         activePlan?.frequency ?? 'daily',
        usageByPlatform,
      },
      plan: {
        package:             user.paidPackage,
        planDuration:        user.planDuration,
        limit:               planLimit,
        postsUsed,
        remaining,
        expiryDate:          user.packageExpiryDate,
        isValid:             isValidPlan,
        isBusinessConnected: user.isBusinessConnected || false,
      },
      businessEmail: user.connectedBusinessEmail,
    });
  } catch (error) {
    console.error('GET /api/user-settings error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      automationEnabled,
      frequency,
      keywords,
      startDate,
      accessToken,
      refreshToken,
      endDate,
      skippedDates,          // dates to skip (string array "YYYY-MM-DD")
      customDates,           // explicit posting dates only for frequency=custom
      selectedBusiness,      // primary business object from frontend
      selectedLocations,     // array of GMB locations to post to
      platforms,
      fbPages,               // Facebook pages selected for automation
      igPages,               // Instagram accounts selected for automation
      userId,
      topic,
      businessProfileDescription,
      colourPalette,
      size,
      characterImage,
      uniformImage,
      productImage,
      backgroundImage,
      logoImage,
      includeInGeneration,
      postingHour,
      postingMinute,
      postingTimezone,
    } = body;

    let user = await resolveUserForSettings(session, userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // NOTE: We use the localStorage `userId` (USR-format, sent in the request body)
    // for the AutomationPlan so the cron can save posts that the dashboard can find.
    // We do NOT update the User model's userId (that would cause a duplicate key error).
    // If no userId in body, fall back to what's already in the User document.
    const localStorageUserId = String(userId || user.userId || user._id.toString()).trim();
    console.log('[user-settings] AutomationPlan userId (from body / User):', localStorageUserId);

    const safeFrequency    = frequency || 'daily';
    const safeKeywords     = Array.isArray(keywords) ? keywords.filter(Boolean) : [];
    const ALLOWED_PLATFORMS = new Set(['gmb', 'fb', 'ig']);
    let safePlatforms = Array.isArray(platforms)
      ? [...new Set(platforms.filter((p) => ALLOWED_PLATFORMS.has(p)))]
      : [];
    if (!safePlatforms.length) safePlatforms = ['gmb'];

    const fbList = Array.isArray(fbPages) ? fbPages.filter((p) => p?.pageId) : [];
    const igList = Array.isArray(igPages) ? igPages.filter((a) => a?.igId) : [];
    const hasGmb = safePlatforms.includes('gmb');
    const hasFb  = safePlatforms.includes('fb');
    const hasIg  = safePlatforms.includes('ig');
    const safeSkippedDates = Array.isArray(skippedDates) ? skippedDates.filter(Boolean) : [];
    // Normalise locations: accept an array from the UI, fallback to deriving from selectedBusiness
    const safeLocations = Array.isArray(selectedLocations) && selectedLocations.length > 0
      ? selectedLocations.map(loc => ({
          locationId: loc.locationId || loc.googleId || '',
          accountId:  loc.accountId  || loc.projectId || '',
          name:       loc.name       || loc.title      || '',
          address:    loc.address    || '',
          locality:   loc.locality   || '',
          websiteUrl: loc.websiteUrl || '',
          isVerified: loc.isVerified || false,
          
        }))
      : [];

    const planLimitBase = getPlanPostLimit(user.paidPackage, user.planDuration);
    // Unknown package name in DB → 0 posts; still allow automation using keyword count as floor
    const planLimit =
      automationEnabled && planLimitBase === 0
        ? Math.max(safeKeywords.length, 1)
        : planLimitBase;

    // ── Business resolution ────────────────────────────────────────────────────
    // Priority: (1) selectedBusiness from request, (2) already saved on user
    const resolvedBusiness = selectedBusiness || user.selectedBusiness || null;
    const businessName = (
      resolvedBusiness?.title ||
      resolvedBusiness?.name  ||
      ''
    );

    // Persist selectedBusiness to User if provided and valid
    if (selectedBusiness && (selectedBusiness.googleId || selectedBusiness.projectId || selectedBusiness.locationId)) {
      const gmbEmailRx = emailRegexFor(user.email || session.user.email);
      const gmbUser = gmbEmailRx ? await GmbUser.findOne({ email: gmbEmailRx }) : null;
      const incomingId =
        selectedBusiness.googleId ||
        selectedBusiness.projectId ||
        selectedBusiness.locationId ||
        selectedBusiness.accountId;

      const businessExists = !gmbUser || gmbUser.projects?.some(
        (p) => p.googleId === incomingId
      );

      // Allow even if not found in GmbUser (it may have been connected via OAuth separately)
      // Just warn in logs
      if (!businessExists) {
        console.warn(`[user-settings] selectedBusiness ${incomingId} not found in GmbUser projects for ${session.user.email}`);
      }

      user.selectedBusiness = {
        name:      selectedBusiness.name || selectedBusiness.title || businessName,
        email:     selectedBusiness.email || selectedBusiness.accountId || '',
        projectId: selectedBusiness.projectId || selectedBusiness.googleId || selectedBusiness.locationId || '',
        googleId:  selectedBusiness.googleId || selectedBusiness.locationId || selectedBusiness.projectId || '',
      };
      user.gmbProjectId           = selectedBusiness.accountId || selectedBusiness.projectId || selectedBusiness.googleId || selectedBusiness.locationId;
      user.isBusinessConnected    = true;
      user.connectedBusinessEmail = selectedBusiness.email || selectedBusiness.accountId || '';
    }

    // ── Validation ────────────────────────────────────────────────────────────
    if (automationEnabled) {
      if (hasGmb && !user.isBusinessConnected && !resolvedBusiness) {
        return NextResponse.json(
          { error: 'Connect Google Business and select locations when Google is enabled.' },
          { status: 400 }
        );
      }

      // Start date required
      if (!startDate) {
        return NextResponse.json(
          { error: 'Start date is required when automation is enabled.' },
          { status: 400 }
        );
      }

      if (!hasGmb && !hasFb && !hasIg) {
        return NextResponse.json(
          { error: 'Select at least one platform (Google, Facebook, or Instagram).' },
          { status: 400 }
        );
      }
      if (hasGmb && !safeLocations.length) {
        return NextResponse.json(
          { error: 'Select at least one Google Business location when Google is enabled.' },
          { status: 400 }
        );
      }
      if (hasFb && !fbList.length) {
        return NextResponse.json(
          { error: 'Select at least one Facebook page when Facebook is enabled.' },
          { status: 400 }
        );
      }
      if (hasIg && !igList.length) {
        return NextResponse.json(
          { error: 'Select at least one Instagram account when Instagram is enabled.' },
          { status: 400 }
        );
      }

      // Keywords must cover the full plan (no repeats)
      // if (planLimit > 0 && safeKeywords.length < planLimit) {
      //   return NextResponse.json(
      //     {
      //       error: `You need at least ${planLimit} keywords for this plan (${planLimit} posts). You have ${safeKeywords.length}.`,
      //       requiredKeywords: planLimit,
      //       providedKeywords: safeKeywords.length,
      //     },
      //     { status: 400 }
      //   );
      // }
    }

    // ── Preserve postIndex unless keywords changed ─────────────────────────────
    // Match only this dashboard userId so a different body userId always gets its own AutomationPlan row.
    const existingPlan = await AutomationPlan.findOne({
      userId: localStorageUserId,
    })
      .sort({ updatedAt: -1 })
      .lean();

    const postingHourNum =
      postingHour === null || postingHour === undefined || postingHour === ''
        ? (existingPlan?.postingHour !== undefined && existingPlan?.postingHour !== null
            ? existingPlan.postingHour
            : 11)
        : Math.min(23, Math.max(0, Number(postingHour)));
    const postingMinuteNum =
      postingMinute === null || postingMinute === undefined || postingMinute === ''
        ? (existingPlan?.postingMinute ?? 0)
        : Math.min(59, Math.max(0, Number(postingMinute)));
    const postingTz =
      typeof postingTimezone === 'string' && postingTimezone.trim()
        ? postingTimezone.trim()
        : (existingPlan?.postingTimezone || 'Asia/Kolkata');

    const prevKeywords    = existingPlan?.keywords || [];
    const keywordsChanged =
      JSON.stringify([...safeKeywords].sort()) !==
      JSON.stringify([...prevKeywords].sort());

    // ── Build schedule ─────────────────────────────────────────────────────────
    let schedule = [];
    const scheduleStartDate = startDate ? new Date(startDate) : new Date();
    let scheduleEndDate = endDate ? new Date(endDate) : null;

    // Effective expiry = latest of packageExpiryDate and subscription.expiry. A
    // renewal that only updated subscription.expiry left packageExpiryDate stale,
    // which produced an empty schedule (all dates past the stale expiry).
    const effectivePkgExpiry = getEffectivePackageExpiry(user);

    // Stale endDate (e.g. old save) blocks all crons while package may still be valid — extend on save
    if (automationEnabled && effectivePkgExpiry) {
      const pkgOk = effectivePkgExpiry.getTime() > Date.now();
      const todayYmd = zonedYmdString(new Date(), postingTz);
      if (pkgOk && scheduleEndDate) {
        const endYmd = zonedYmdString(scheduleEndDate, postingTz);
        if (endYmd < todayYmd) {
          scheduleEndDate = effectivePkgExpiry;
          console.warn('[user-settings] endDate was in the past — extended to effective plan expiry so automation can run');
        }
      }
    }

    if (automationEnabled) {
      if (safeFrequency === 'custom' && Array.isArray(customDates) && customDates.length > 0) {
        // Custom mode: user picks exact posting dates
        schedule = customDates
          .map((d) => { try { return new Date(d); } catch { return null; } })
          .filter((d) => d && !Number.isNaN(d.getTime()));
      } else {
        const effectiveExpiry =
          scheduleEndDate && effectivePkgExpiry
            ? new Date(Math.min(scheduleEndDate.getTime(), effectivePkgExpiry.getTime()))
            : scheduleEndDate || effectivePkgExpiry || null;

        schedule = calculatePostingSchedule({
          startDate:   scheduleStartDate,
          frequency:   safeFrequency,
          postsLimit:  Math.max(planLimit, 1),
          expiryDate:  effectiveExpiry,
          skippedDates: safeSkippedDates,
        });
      }
    }

    const preservedPostsUsed =
      existingPlan?.planDetails?.postsUsed ?? user.postsUsed ?? 0;

    const planDetails = {
      package:      user.paidPackage,
      planDuration: user.planDuration,
      limit:        planLimit,
      postsUsed:    preservedPostsUsed,
      remaining:    Math.max(0, planLimit - preservedPostsUsed),
      expiryDate:   user.packageExpiryDate,
    };

    const gmbEmailRxPost = emailRegexFor(user.email || session.user.email);
    const gmbUserPostQueue = user.gmbProjectId && gmbEmailRxPost
      ? await GmbUser.findOne({ email: gmbEmailRxPost }).select('projects').lean()
      : null;
    const projectPostQueue =
      gmbUserPostQueue?.projects?.find((p) => p.googleId === user.gmbProjectId) || null;
    const useDelayPostQueue =
      !!(automationEnabled && schedule.length > 0 && projectPostQueue && hasGmb);

    // ── Upsert AutomationPlan (one record per userId, always) ─────────────────
    // IMPORTANT: Do NOT deactivate first and then search active:true — that
    // creates a new document every save. Instead find by userId directly,
    // update if exists, insert if not, then deactivate any stale extras.
    // Use localStorage USR-format userId so cron posts appear in dashboard.
    const finalUserId = localStorageUserId;

    // ── Store OAuth tokens in AutomationPlan ─────────────────────────────────
    // Priority 1: session tokens (always fresh — user just logged in / re-authed)
    // Priority 2: GmbUser project tokens (may be stale but better than nothing)
    // Priority 3: whatever was already in the existing plan

    let planAccessToken  = existingPlan?.accessToken  || '';
    let planRefreshToken = existingPlan?.refreshToken || '';

    // 1. Use session tokens directly — these are the freshest available
    if (session.accessToken) {
      planAccessToken  = session.accessToken;
      planRefreshToken = session.refreshToken || planRefreshToken;
      console.log('[user-settings] ✅ Tokens taken from session. accessToken length:', planAccessToken.length);
    } else {
      // 2. Fallback: look in GmbUser projects
      console.warn('[user-settings] ⚠ No session.accessToken — falling back to GmbUser lookup');
      try {
        const gmbTokRx = emailRegexFor(user.email || session.user.email);
        const gmbUserForTokens = gmbTokRx ? await GmbUser.findOne({ email: gmbTokRx }).lean() : null;
        if (gmbUserForTokens?.projects?.length) {
          const accountId = user.gmbProjectId || safeLocations[0]?.accountId || '';
          const project =
            gmbUserForTokens.projects.find((p) => p.googleId === accountId) ||
            gmbUserForTokens.projects[0];
          if (project) {
            planAccessToken  = project.accessToken  || planAccessToken;
            planRefreshToken = project.refreshToken || planRefreshToken;
            console.log(`[user-settings] ✅ Tokens from GmbUser project googleId=${project.googleId}`);
          }
        } else {
          console.warn('[user-settings] ⚠ No GmbUser projects found either');
        }
      } catch (tokenErr) {
        console.error('[user-settings] ⚠ GmbUser token lookup failed:', tokenErr.message);
      }
    }

    console.log('[user-settings] Token check — hasAccess:', !!planAccessToken, '| hasRefresh:', !!planRefreshToken);

    const prevInc = existingPlan?.imageConfig?.includeInGeneration || {};
    const incIn = includeInGeneration && typeof includeInGeneration === 'object' ? includeInGeneration : {};
    const mergedInclude = {
      characterImage:  Object.prototype.hasOwnProperty.call(incIn, 'characterImage')  ? incIn.characterImage !== false  : prevInc.characterImage !== false,
      uniformImage:    Object.prototype.hasOwnProperty.call(incIn, 'uniformImage')    ? incIn.uniformImage !== false    : prevInc.uniformImage !== false,
      productImage:    Object.prototype.hasOwnProperty.call(incIn, 'productImage')    ? incIn.productImage !== false    : prevInc.productImage !== false,
      backgroundImage: Object.prototype.hasOwnProperty.call(incIn, 'backgroundImage') ? incIn.backgroundImage !== false : prevInc.backgroundImage !== false,
      logoImage:       Object.prototype.hasOwnProperty.call(incIn, 'logoImage')       ? incIn.logoImage !== false       : prevInc.logoImage !== false,
    };

    const safeProfileDesc =
      typeof businessProfileDescription === 'string'
        ? businessProfileDescription.slice(0, 20000)
        : (existingPlan?.businessProfileDescription ?? '');

    const rawLastPost = existingPlan?.lastPostDate ? new Date(existingPlan.lastPostDate) : null;
    let resolvedLastPostDate = rawLastPost;
    if (rawLastPost && !Number.isNaN(rawLastPost.getTime())) {
      const lastY = zonedYmdString(rawLastPost, postingTz);
      const startY = zonedYmdString(scheduleStartDate, postingTz);
      if (lastY < startY) {
        resolvedLastPostDate = null;
        console.warn('[user-settings] Cleared lastPostDate before startDate (fixes stuck daily cadence)');
      }
    }

    const automationPlanData = {
      userId:           finalUserId,
      userRef:          user._id,
      active:           true,
      postQueueMode:    useDelayPostQueue ? 'delay_generate_publish' : 'legacy',
      automationEnabled,
      frequency:        safeFrequency,
      keywords:         safeKeywords,
      topic:            topic || '',
      businessProfileDescription: safeProfileDesc,
      imageConfig: {
        colourPalette:   colourPalette   || 'none',
        size:            size            || '3:4',
        characterImage:  characterImage  ?? null,
        uniformImage:    uniformImage    ?? null,
        productImage:    productImage    ?? null,
        backgroundImage: backgroundImage ?? null,
        logoImage:       logoImage       ?? null,
        includeInGeneration: mergedInclude,
      },
      platforms:        safePlatforms,
      postingHour:        postingHourNum,
      postingMinute:      postingMinuteNum,
      postingTimezone:    postingTz,
      prefetchOffsetMinutes: 1440,
      startDate:        scheduleStartDate,
      endDate:          scheduleEndDate,
      skippedDates:     safeSkippedDates,
      schedule,
      lastPostDate:     resolvedLastPostDate,
      postIndex:        keywordsChanged ? 0 : (existingPlan?.postIndex || 0),
      planDetails,
      businessName,
      selectedBusiness: user.selectedBusiness || resolvedBusiness || null,
      gmbProjectId:     user.gmbProjectId || null,
      locations:        safeLocations,
      // OAuth tokens stored so the cron can post without any GmbUser lookup
      accessToken:      planAccessToken,
      refreshToken:     planRefreshToken,
      // Facebook pages selected for multi-platform automation
      fbPages: hasFb && Array.isArray(fbPages) ? fbPages.filter(p => p.pageId).map(p => ({
        pageId:          p.pageId          || '',
        pageName:        p.pageName        || '',
        pageAccessToken: p.pageAccessToken || '',
      })) : [],
      // Instagram accounts selected for multi-platform automation
      igPages: hasIg && Array.isArray(igPages) ? igPages.filter(a => a.igId).map(a => ({
        igId:            a.igId            || '',
        igUsername:      a.igUsername      || '',
        pageAccessToken: a.pageAccessToken || '',
      })) : [],
    };

    // Upsert strictly by AutomationPlan.userId (= body userId). Never pick another row via userRef
    // or a different userId — that overwrote sibling accounts under the same login.
    const existingPlanDoc = await AutomationPlan.findOne({
      userId: finalUserId,
    }).sort({ updatedAt: -1 });

    let plan;
    if (existingPlanDoc) {
      plan = await AutomationPlan.findOneAndUpdate(
        { _id: existingPlanDoc._id },
        { $set: automationPlanData },
        { new: true }
      );
    } else {
      plan = await AutomationPlan.create(automationPlanData);
    }

    // Remove duplicate AutomationPlan docs for this same dashboard userId only (not entire userRef)
    await AutomationPlan.deleteMany({
      userId: finalUserId,
      _id:    { $ne: plan._id },
    });

    console.log(`[user-settings] ✅ AutomationPlan upserted — _id=${plan._id} userId=${plan.userId} (USR-format)`);

    // Update only business-related fields — never touch userId to avoid duplicate key errors
    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          selectedBusiness:       user.selectedBusiness       ?? undefined,
          gmbProjectId:           user.gmbProjectId           ?? undefined,
          isBusinessConnected:    user.isBusinessConnected    ?? undefined,
          connectedBusinessEmail: user.connectedBusinessEmail ?? undefined,
        },
      }
    );

    // ── Bulk-create PostStatus records (delay queue: generate → then publish +12h) ──
    const PostModel = (await import('@/models/PostStatus.js')).default;
    // Only touch queued posts for this dashboard userId — not user.userId / ObjectId mixes (avoids wiping another profile's queue).
    const automationQueueUserId = finalUserId;

    if (!automationEnabled) {
      await PostModel.deleteMany({ userId: automationQueueUserId, automationQueued: true });
    } else if (automationEnabled && !useDelayPostQueue) {
      await PostModel.deleteMany({ userId: automationQueueUserId, automationQueued: true });
    }

    if (useDelayPostQueue && projectPostQueue) {
      // Use the GMB locations the user actually selected (safeLocations) — same
      // source the legacy publish cron uses. Falling back to a single
      // resolvedBusiness.locationId dropped every extra location (multi-location
      // automation posted to only one), and an empty locationId left the queued
      // post with NO targets → publish-scheduled marked it "failed".
      const locations = safeLocations.length
        ? safeLocations.map((l) => ({
            locationId: l.locationId || '',
            accountId:  l.accountId  || '',
            name:       l.name       || '',
            address:    l.address    || '',
            locality:   l.locality   || '',
            websiteUrl: l.websiteUrl || '',
            isPosted:   false,
          }))
        : resolvedBusiness?.locationId
          ? [{ locationId: resolvedBusiness.locationId, accountId: resolvedBusiness.accountId, name: businessName, address: resolvedBusiness.address || '', isPosted: false }]
          : [];

      const scheduledPlatforms = safePlatforms.filter((p) => ['gmb', 'fb', 'ig'].includes(p));
      const platformsForPost = scheduledPlatforms.length > 0 ? scheduledPlatforms : ['gmb'];

      const genDelayMin = Math.min(
        120,
        Math.max(1, Number(process.env.AUTOMATION_QUEUE_GENERATE_DELAY_MINUTES) || 10)
      );
      const pubAfterH = Math.min(
        168,
        Math.max(1, Number(process.env.AUTOMATION_QUEUE_PUBLISH_AFTER_HOURS) || 12)
      );
      const GEN_MS = genDelayMin * 60 * 1000;
      const PUB_MS = pubAfterH * 60 * 60 * 1000;
      const SAVE_TS = Date.now();
      const stepDays = getFrequencyStep(safeFrequency);

      let genTs = SAVE_TS + GEN_MS;
      const postsData = [];
      for (let idx = 0; idx < schedule.length; idx++) {
        if (idx > 0) {
          if (safeFrequency === 'custom') {
            const d0 = new Date(schedule[idx - 1]);
            d0.setHours(0, 0, 0, 0);
            const d1 = new Date(schedule[idx]);
            d1.setHours(0, 0, 0, 0);
            genTs += d1.getTime() - d0.getTime();
          } else {
            genTs += stepDays * 86400000;
          }
        }

        const generateContentAt = new Date(genTs);
        const publishAt = new Date(genTs + PUB_MS);
        const keyword = safeKeywords[idx] || safeKeywords[idx % safeKeywords.length];
        const line = `${keyword} — ${businessName || 'your business'}`;

        postsData.push({
          userId:              finalUserId,
          promat:              keyword,
          description:         `Automated post about ${keyword}`,
          gmbDescription:      line,
          fbDescription:       line,
          igDescription:       line,
          scheduledDateSource: [...platformsForPost],
          status:              'pending',
          generateContentAt,
          scheduledDate:       publishAt,
          automationQueued:    true,
          automationPlanId:    plan._id,
          aiOutput:            '',
          accessToken:         projectPostQueue.accessToken || '',
          refreshToken:        projectPostQueue.refreshToken || '',
          // 'both' = attach the generated image to the GMB post (publish-scheduled
          // sends post_type/cta too). 'post' alone published text-only — no image.
          checkmark:           'both',
          locations,
          fbPages: hasFb && Array.isArray(fbPages)
            ? fbPages.filter((p) => p?.pageId).map((p) => ({
                pageId:          p.pageId,
                pageName:        p.pageName || '',
                pageAccessToken: p.pageAccessToken || '',
                caption:         line,
                isPosted:        false,
              }))
            : [],
          igPages: hasIg && Array.isArray(igPages)
            ? igPages.filter((a) => a?.igId).map((a) => ({
                igId:            a.igId,
                igUsername:      a.igUsername || '',
                pageAccessToken: a.pageAccessToken || '',
                caption:         line,
                isPosted:        false,
              }))
            : [],
        });
      }

      await PostModel.deleteMany({
        userId:           automationQueueUserId,
        automationQueued: true,
        status:           { $in: ['pending', 'scheduled'] },
      });

      await PostModel.insertMany(postsData, { ordered: false });
      console.log(
        `[user-settings] ✅ Created ${postsData.length} queued Posts (generate +${genDelayMin}m, publish +${pubAfterH}h) userId=${finalUserId}`
      );
    }

    return NextResponse.json({
      success:            true,
      automationSettings: plan.toObject({ versionKey: false }),
      keywordsRequired:   planLimit,   // ← Fixed: was `minKeywords` (undefined)
      keywordsChanged,
      plan:               plan.planDetails,
      businessName,
    });
  } catch (error) {
    console.error('POST /api/user-settings error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
