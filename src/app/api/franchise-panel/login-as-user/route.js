import jwt from "jsonwebtoken";
import connectDB from "@/lib/dbConnect";
import User from "@/models/User";
import GmbUser from "@/models/GmbUser";
import { decodeFranchiseToken } from "@/lib/franchiseAuthServer";
import { userBelongsToFranchise } from "@/lib/franchiseLeadsQuery";
import { APP_JWT_SECRET } from "@/lib/appSession";

/**
 * Lets a franchise admin open one of THEIR OWN leads' dashboards to support
 * them. Scope is enforced twice: the lead must belong to the caller's
 * franchise, and a team agent may only enter leads assigned to them.
 */
export async function POST(req) {
  try {
    await connectDB();

    const decoded = decodeFranchiseToken(req);
    if (!decoded) {
      return Response.json(
        { success: false, message: "Authentication required" },
        { status: 401 },
      );
    }

    const { userId } = await req.json();
    if (!userId) {
      return Response.json(
        { success: false, message: "userId is required" },
        { status: 400 },
      );
    }

    const targetUser = await User.findOne({ userId }).lean();
    if (!targetUser) {
      return Response.json(
        { success: false, message: "User not found" },
        { status: 404 },
      );
    }

    if (!userBelongsToFranchise(targetUser, decoded.franchiseCode)) {
      return Response.json(
        { success: false, message: "This lead does not belong to your franchise" },
        { status: 403 },
      );
    }

    // Agents are limited to the leads assigned to them.
    if (
      decoded.type === "franchiseTeam" &&
      String(targetUser.referredByAgentId || targetUser.assignedAgentId || "") !==
        String(decoded.id)
    ) {
      return Response.json(
        { success: false, message: "This lead is not assigned to you" },
        { status: 403 },
      );
    }

    const gmbUser = await GmbUser.findOne({ email: targetUser.email }).lean();

    const token = jwt.sign(
      {
        userId: targetUser.userId,
        email: targetUser.email,
        role: "user",
        impersonated: true,
        impersonatedBy: decoded.email || decoded.id,
        impersonatedByFranchise: decoded.franchiseCode,
      },
      // appSession ka hi secret — apna fallback rakhne se JWT_SECRET-less env
      // par token banate hi invalid ho jata tha.
      APP_JWT_SECRET,
      { expiresIn: "2h" },
    );

    return Response.json({
      success: true,
      message: "Impersonation session created",
      token,
      user: {
        userId: targetUser.userId,
        fullName: targetUser.fullName || "",
        email: targetUser.email || "",
        phone: targetUser.phone || "",
        gmbData: gmbUser || null,
        gmbProjects: gmbUser?.projects || [],
      },
    });
  } catch (error) {
    console.error("Franchise login-as-user error:", error);
    return Response.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}
