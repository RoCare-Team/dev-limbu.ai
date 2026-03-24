import dbConnect from './dbConnect';
import GmbUser from '@/models/GmbUser';

/**
 * Fetch GMB access/refresh tokens for a user's project
 * @param {string} userId - AutomationPlan.userId
 * @param {string} gmbProjectId - AutomationPlan.gmbProjectId or locations[0].accountId
 * @returns {Promise<{accessToken: string, refreshToken: string}|null>}
 */
export async function getGmbTokens(userId, gmbProjectId) {
  await dbConnect();
  
  const gmbUser = await GmbUser.findOne({ 
    $or: [
      { userId }, 
      { email: userId }  // fallback if stored as email
    ] 
  }).lean();
  
  if (!gmbUser?.projects?.length) {
    console.warn(`No GmbUser found for userId: ${userId}`);
    return null;
  }
  
  // Find project by exact ID match (gmbProjectId or accountId)
  const project = gmbUser.projects.find(p => 
    p.googleId === gmbProjectId || 
    p.accountId === gmbProjectId || 
    p.projectId === gmbProjectId
  );
  
  if (!project) {
    console.warn(`No project "${gmbProjectId}" found for userId: ${userId}`);
    return null;
  }
  
  return {
    accessToken: project.accessToken,
    refreshToken: project.refreshToken
  };
}

