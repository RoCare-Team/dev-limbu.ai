"use client";

import { useEffect, useState } from "react";
import { Users, UserCheck, Clock, UserX, Rocket, LogsIcon } from "lucide-react";

export default function DashboardStats() {
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const franchiseCode = localStorage.getItem("franchise_code");

    if (!franchiseCode) return; // agar code nahi hai to API mat call karo

    const fetchUsers = async () => {
      try {
        const res = await fetch(
          `/api/franchise-panel/franchise-user?referCode=${franchiseCode}`,
        );
        const data = await res.json();

        console.log("API DATA:", data);

        setUsers(data.users || []);
      } catch (err) {
        console.log(err);
      }
    };

    fetchUsers();
  }, []);

  const totalUsers = users.length;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const franchiseCode = localStorage.getItem("franchiseCode");

        // users
        const userRes = await fetch(
          `/api/franchise-panel/franchise-user?referCode=${franchiseCode}`,
        );
        const userData = await userRes.json();
        setUsers(userData.users || []);

        // posts
        const postRes = await fetch(
          `/api/franchise-panel/posts?referCode=${franchiseCode}`,
        );
        const postData = await postRes.json();
        setPosts(postData.posts || []);
      } catch (err) {
        console.log(err);
      }
    };

    fetchData();
  }, []);

  const totalPosts = posts.length;

  const today = new Date().toDateString();

  const usersToday = users.filter(
    (u) => new Date(u.createdAt).toDateString() === today,
  ).length;

  const onboardUsers = users.filter((u) => u.leadStage === "Onboard").length;

  // Example: maan lo 1 onboard user = ₹5000
  const onboardRevenue = onboardUsers * 5000;

  // {total chats today chats }

  const totalChats = users.filter(u => u.chat).length;

  const todays = new Date().toDateString();

const chatsTodays = users.filter(u =>
  new Date(u.createdAt).toDateString() === todays && u.chat
).length;

const resolved = users.filter(u => u.chatStatus === "Resolved").length;

// return

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-2">
      {/* Total Users */}
      <div className="bg-white w-50 h-15 rounded-lg p-3 shadow-sm border">
        <div className="flex justify-between">
          <div>
            <p className="text-xs text-indigo-600 font-semibold">TOTAL USERS</p>
            <p className="text-lg font-bold text-indigo-800">{totalUsers}</p>
          </div>
          <Users className="text-indigo-600" />
        </div>
      </div>

      {/* Active */}
      <div className="bg-white w-50 h-15 rounded-lg p-3 shadow-sm border">
        <div className="flex justify-between">
          <div>
            <p className="text-xs text-green-600 font-semibold">ACTIVE USERS</p>
            <p className="text-lg font-bold text-green-800">
              {users.filter((u) => u.leadStage === "Active").length}
            </p>
          </div>
          <UserCheck className="text-green-600" />
        </div>
      </div>

      {/* Follow Up */}
      <div className="bg-white w-50 h-15 rounded-lg p-3 shadow-sm border">
        <div className="flex justify-between">
          <div>
            <p className="text-xs text-yellow-600 font-semibold">FOLLOW UP</p>
            <p className="text-lg font-bold text-yellow-800">
              {users.filter((u) => u.leadStage === "Follow Up").length}
            </p>
          </div>
          <Clock className="text-yellow-600" />
        </div>
      </div>

      {/* Inactive */}
      <div className="bg-white w-50 h-15 rounded-lg p-3 shadow-sm border">
        <div className="flex justify-between">
          <div>
            <p className="text-xs text-gray-600 font-semibold">INACTIVE</p>
            <p className="text-lg font-bold text-gray-800">
              {users.filter((u) => u.leadStage === "Inactive").length}
            </p>
          </div>
          <UserX className="text-gray-600" />
        </div>
      </div>

      {/* Onboarded */}
      <div className="bg-white w-50 h-15 rounded-lg p-3 shadow-sm border">
        <div className="flex justify-between">
          <div>
            <p className="text-xs text-blue-600 font-semibold">ONBOARDED</p>
            <p className="text-lg font-bold text-blue-800">
              {users.filter((u) => u.leadStage === "Onboard").length}
            </p>
          </div>
          <Rocket className="text-blue-600" />
        </div>
      </div>

      {/* {total posts} */}

      <div className="bg-white w-50 h-15 rounded-lg p-2.5 shadow-sm border border-gray-100 hover:shadow-md transition-all">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-600 font-medium">Total Posts</p>
            <p className="text-lg font-bold text-gray-800">{totalPosts}</p>
          </div>
          <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center"></div>
        </div>
      </div>

      {/* {users today} */}

      <div className="bg-gradient-to-br w-50 h-15 rounded-lg p-2.5 shadow-sm border border-teal-200 hover:shadow-md transition-all">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-teal-700 font-medium">Users Today</p>
            <p className="text-lg font-bold text-teal-800">{usersToday}</p>
          </div>
          <div className="w-9 h-9 bg-teal-200 rounded-lg flex items-center justify-center"></div>
        </div>
      </div>

    </div>
  );
}
