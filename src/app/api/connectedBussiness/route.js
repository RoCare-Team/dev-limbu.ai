import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";

function getRequiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} not defined`);
  return value;
}

export async function GET() {
  const uri = getRequiredEnv("MONGODB_URI");
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db("gmb_dashboard");
    const usersCollection = db.collection("users");

    console.log("usersCollectionusersCollection",usersCollection);
    

    // Fetch all users in DESCENDING order (latest first)
    const users = await usersCollection
      .find()
      .sort({ _id: -1 }) // 👈 Sort by _id descending (latest first)
      .toArray();

    const formattedUsers = users.map((user) => {
      const project = user.projects?.[0] || {};
      const isConnected = !!project.refreshToken;

      return {
        _id: user.userId,
        name: user.name || "N/A",
        email: user.email || "N/A",
        googleId: project.googleId || null,
        accessToken: project.accessToken || null,
        refreshToken: project.refreshToken || null,
        status: isConnected ? "Connected" : "Not Connected",
        createdAt: project.createdAt,
      };
    });

    return NextResponse.json({
      success: true,
      total: formattedUsers.length,
      users: formattedUsers,
    });
  } catch (err) {
    console.error("Error fetching users:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  } finally {
    await client.close();
  }
}