import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User';
import GmbUser from '@/models/GmbUser';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getPlanPostLimit, calculatePostingSchedule } from '@/utils/userSettingsHelpers';
import AutomationPlan from '@/models/AutomationPlan';
import Post from '@/models/PostStatus';

export async function GET(request) {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await User.findOne({ email: session.user.email }).lean();
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const gmbUser = await GmbUser.findOne({ email: session.user.email }).lean();
    const gmbProjects = gmbUser?.projects || [];

    const planLimit  = getPlanPostLimit(user.paidPackage, user.planDuration);
    const isValidPlan =
      user.packageExpiryDate && new Date(user.packageExpiryDate) > new Date();

    // Prefer active AutomationPlan, fallback to empty defaults
    const activePlan = await AutomationPlan.findOne({
      userId: user.userId || user._id.toString(),
      active: true,
    }).lean();

    const automationSettings = activePlan || { automationEnabled: false };

    // Prefer AutomationPlan.planDetails.postsUsed — kept in sync by the cron after every post.
    // Fall back to User.postsUsed for users who haven't run automation yet.
    const postsUsed = activePlan?.planDetails?.postsUsed ?? user.postsUsed ?? 0;
    const remaining = Math.max(0, planLimit - postsUsed);

    // Successful automation/manual posts by platform (same userId variants as posts collection)
    const postUserIds = [user.userId, user._id.toString()].filter(Boolean);
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

    let user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // NOTE: We use the localStorage `userId` (USR-format, sent in the request body)
    // for the AutomationPlan so the cron can save posts that the dashboard can find.
    // We do NOT update the User model's userId (that would cause a duplicate key error).
    // If no userId in body, fall back to what's already in the User document.
    const localStorageUserId = userId || user.userId || user._id.toString();
    console.log('[user-settings] AutomationPlan userId (from localStorage):', localStorageUserId);

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

    const planLimit = getPlanPostLimit(user.paidPackage, user.planDuration);

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
      const gmbUser = await GmbUser.findOne({ email: session.user.email });
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
    // Search by both USR-format and old Google-ID userId to find existing plan
    const existingPlan = await AutomationPlan.findOne({
      $or: [
        { userId: localStorageUserId },
        { userId: user.userId },
        { userRef: user._id },
      ],
    }).lean();

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
    const scheduleEndDate   = endDate   ? new Date(endDate)   : null;

    if (automationEnabled) {
      if (safeFrequency === 'custom' && Array.isArray(customDates) && customDates.length > 0) {
        // Custom mode: user picks exact posting dates
        schedule = customDates
          .map((d) => { try { return new Date(d); } catch { return null; } })
          .filter((d) => d && !Number.isNaN(d.getTime()));
      } else {
        const effectiveExpiry =
          scheduleEndDate && user.packageExpiryDate
            ? new Date(Math.min(scheduleEndDate.getTime(), new Date(user.packageExpiryDate).getTime()))
            : scheduleEndDate || user.packageExpiryDate || null;

        schedule = calculatePostingSchedule({
          startDate:   scheduleStartDate,
          frequency:   safeFrequency,
          postsLimit:  planLimit,
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
        const gmbUserForTokens = await GmbUser.findOne({ email: session.user.email }).lean();
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

    const automationPlanData = {
      userId:           finalUserId,
      userRef:          user._id,
      active:           true,
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
      startDate:        scheduleStartDate,
      endDate:          scheduleEndDate,
      skippedDates:     safeSkippedDates,
      schedule,
      lastPostDate:     existingPlan?.lastPostDate || null,
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

    // Find existing plan by any known userId variant (USR-format or old Google-ID)
    // then update it — this migrates old plans to the correct USR-format userId.
    const existingPlanDoc = await AutomationPlan.findOne({
      $or: [
        { userId: finalUserId },
        { userId: user.userId },
        { userRef: user._id },
      ],
    }).sort({ createdAt: -1 });

    let plan;
    if (existingPlanDoc) {
      // Update the found plan (migrates userId to USR-format if it was Google-ID)
      plan = await AutomationPlan.findOneAndUpdate(
        { _id: existingPlanDoc._id },
        { $set: automationPlanData },
        { new: true }
      );
    } else {
      plan = await AutomationPlan.create(automationPlanData);
    }

    // Clean up any stale duplicate plans for this user
    await AutomationPlan.deleteMany({
      userRef: user._id,
      _id:     { $ne: plan._id },
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

    // ── Bulk-create PostStatus records for the full schedule ───────────────────
    if (automationEnabled && schedule.length > 0 && user.gmbProjectId) {
      const Post    = (await import('@/models/PostStatus.js')).default;
      const gmbUser = await GmbUser.findOne({ email: session.user.email });
      const project = gmbUser?.projects?.find(
        (p) => p.googleId === user.gmbProjectId
      );

      if (project) {
        // Build location list from selectedBusiness
        const locations = Array.isArray(resolvedBusiness?.locations)
          ? resolvedBusiness.locations
          : resolvedBusiness?.locationId
            ? [{ locationId: resolvedBusiness.locationId, accountId: resolvedBusiness.accountId, name: businessName, address: resolvedBusiness.address || '', isPosted: false }]
            : [];

        const scheduledPlatforms = safePlatforms.filter((p) => ['gmb', 'fb', 'ig'].includes(p));
        const platformsForPost = scheduledPlatforms.length > 0 ? scheduledPlatforms : ['gmb'];
        const postUserIds = [...new Set([finalUserId, user.userId, user._id.toString()].filter(Boolean))];

        const postsData = schedule.map((scheduledDate, idx) => {
          const keyword = safeKeywords[idx] || safeKeywords[idx % safeKeywords.length];
          const line = `${keyword} — ${businessName || 'your business'}`;
          return {
            userId:              finalUserId,
            promat:              keyword,
            description:         `Automated post about ${keyword}`,
            gmbDescription:      line,
            fbDescription:       line,
            igDescription:       line,
            scheduledDateSource:   [...platformsForPost],
            status:              'scheduled',
            scheduledDate,
            accessToken:         project.accessToken || '',
            refreshToken:        project.refreshToken || '',
            checkmark:           'post',
            locations,
          };
        });

        // Remove any existing unprocessed scheduled posts for this user before inserting new ones
        await Post.deleteMany({
          userId: { $in: postUserIds },
          status: 'scheduled',
        });

        await Post.insertMany(postsData, { ordered: false });
        console.log(`✅ Created ${postsData.length} scheduled Posts for userId=${finalUserId}`);
      } else {
        console.warn('[user-settings] No GmbUser project found for bulk post creation');
      }
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
