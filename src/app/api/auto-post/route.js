import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Post from '@/models/PostStatus';
import User from '@/models/User';
import { postToGmbAction } from '@/app/actions/postActions';

export async function GET() {
  await dbConnect();
  
  const now = new Date();
  const nineAM = new Date(now);
  nineAM.setHours(9, 0, 0, 0);
  
  // Find scheduled posts due at 9AM today for GMB
  const duePosts = await Post.find({
    status: 'scheduled',
    scheduledDate: { $eq: nineAM },
    'scheduledDateSource': 'gmb'
  }).populate('userId');

  if (duePosts.length === 0) {
    return NextResponse.json({ message: 'No posts due at 9AM' });
  }

  const results = [];
  for (const post of duePosts) {
    try {
      // Prepare locations from post (assuming stored)
      const locations = post.locations || [];
      if (locations.length === 0) {
        await Post.findByIdAndUpdate(post._id, { 
          status: 'failed',
          error: 'No locations specified'
        });
        continue;
      }

      const locationData = locations.map(loc => ({
        city: loc.locationId,
        cityName: loc.locality || loc.name,
        bookUrl: loc.websiteUrl || ''
      }));

      const payload = {
        account: post.gmbProjectId || locations[0].accountId,
        locationData,
        output: post.aiOutput,
        description: post.description || post.gmbDescription,
        accessToken: post.accessToken, // stored at schedule time
        refreshToken: post.refreshToken,
        checkmark: post.checkmark || 'post'
      };

      const result = await postToGmbAction(payload);
      
      if (result.ok) {
        await Post.findByIdAndUpdate(post._id, { 
          status: 'posted',
          whenPosted: { gmb: true }
        });
        results.push({ postId: post._id, success: true });
      } else {
        await Post.findByIdAndUpdate(post._id, { 
          status: 'failed',
          error: result.data?.error || 'postToGmb failed'
        });
        results.push({ postId: post._id, success: false, error: result.data });
      }
    } catch (error) {
      console.error(`Auto-post failed for ${post._id}:`, error);
      results.push({ postId: post._id, success: false, error: error.message });
    }
  }

  return NextResponse.json({ 
    message: `${results.length} posts processed`,
    results 
  });
}

