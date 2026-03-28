// Auto-post scheduler logic (called from /api/auto-post)
// Finds posts scheduled for 9AM today → posts to GMB via n8n webhook

import dbConnect from '@/lib/dbConnect';
import Post from '@/models/PostStatus.js';
import { postToGmbAction } from '@/app/actions/postActions.js';

export async function executeDailyPosts() {
  await dbConnect();
  
  const now = new Date();
  const today9AM = new Date(now.toDateString());
  today9AM.setHours(9, 0, 0, 0);
  
  console.log(`📅 Checking posts due at ${today9AM.toISOString()}`);
  
  const duePosts = await Post.find({
    status: 'scheduled',
    scheduledDate: today9AM,
    'scheduledDateSource': { $in: ['gmb'] }
  });

  if (duePosts.length === 0) {
    console.log('No posts scheduled for 9AM');
    return { processed: 0 };
  }

  console.log(`🚀 Processing ${duePosts.length} posts...`);

  const results = [];
  for (const post of duePosts) {
    try {
      const locations = post.locations || [];
      if (!locations.length) {
        throw new Error('No locations found');
      }

      const payload = {
        account: post.gmbProjectId || locations[0]?.accountId,
        locationData: locations.map(loc => ({
          city: loc.locationId,
          cityName: loc.name || loc.locality,
          bookUrl: loc.websiteUrl || ''
        })),
        output: post.aiOutput,
        description: post.gmbDescription || post.description,
        accessToken: post.accessToken,
        refreshToken: post.refreshToken,
        checkmark: post.checkmark || 'both'
      };

      const postResult = await postToGmbAction(payload);
      
      if (postResult.ok) {
        await Post.findByIdAndUpdate(post._id, {
          status: 'posted',
          'whenPosted.gmb': new Date()
        });
        results.push({ success: true, postId: post._id });
      } else {
        await Post.findByIdAndUpdate(post._id, {
          status: 'failed',
          error: `postToGmb failed: ${JSON.stringify(postResult.data)}`
        });
        results.push({ success: false, postId: post._id, error: postResult.data });
      }
    } catch (err) {
      await Post.findByIdAndUpdate(post._id, {
        status: 'failed',
        error: err.message
      });
      results.push({ success: false, postId: post._id, error: err.message });
    }
  }

  return { processed: results.length, success: results.filter(r => r.success).length };
}

