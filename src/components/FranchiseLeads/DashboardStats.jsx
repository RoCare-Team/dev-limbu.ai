"use client";

import { useEffect, useState } from "react";
import {
  Users,
  UserCheck,
  Clock,
  UserX,
  Rocket,
  LogsIcon,
  CheckCircle,
  ImageIcon,
} from "lucide-react";

export default function DashboardStats() {
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);

  useEffect(() => {
  const fetchData = async () => {
    try {
      const franchiseCode = localStorage.getItem("franchiseCode");

      console.log("CODE:", franchiseCode);

      if (!franchiseCode) return;

      const res = await fetch(
        `/api/franchise-panel/franchise-user?referCode=${franchiseCode}`
      );

      const data = await res.json();
      // console.log("USERS:", data);

      setUsers(data.users || []);
    } catch (err) {
      console.log(err);
    }
  };

  fetchData();
}, []); // ✅ only once

  const totalPosts = posts.length;

  const today = new Date().toDateString();

  const usersToday = users.filter(
    (u) => new Date(u.createdAt).toDateString() === today,
  ).length;

  const onboardUsers = users.filter((u) => u.leadStage === "Onboard").length;

  // Example: maan lo 1 onboard user = ₹5000
  const onboardRevenue = onboardUsers * 5000;

  // {total chats today chats }

  const totalChats = users.filter((u) => u.chat).length;

  const todays = new Date().toDateString();

  const chatsTodays = users.filter(
    (u) => new Date(u.createdAt).toDateString() === todays && u.chat,
  ).length;

  const resolved = users.filter((u) => u.chatStatus === "Resolved").length;

  const totalUsers = users.length;

  // return

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-2">
      {/* Total Users */}
      <div className="bg-white rounded-lg p-2 shadow-sm border border-gray-300">
        <div className="flex justify-between">
          <div>
            <p className="text-xs   text-dark font-semibold mt-2">
              TOTAL USERS
            </p>
            <p className="text-lg font-bold text-dark">{totalUsers}</p>
          </div>
          <Users className="text-dark mt-3" />
        </div>
      </div>

      {/* Active */}
      <div className="bg-white rounded-lg p-2 shadow-sm border border-gray-300">
        <div className="flex justify-between">
          <div>
            <p className="text-xs text-green-600 font-semibold mt-2">
              ACTIVE USERS
            </p>
            <p className="text-lg font-bold text-green-800">
              {users.filter((u) => u.leadStage === "Active").length}
            </p>
          </div>
          <CheckCircle className="text-green-600 mt-3" />
        </div>
      </div>

      {/* Follow Up */}
      <div className="bg-white rounded-lg p-2 shadow-sm border border-gray-300">
        <div className="flex justify-between">
          <div>
            <p className="text-xs text-dark font-semibold mt-2">FOLLOW UP</p>
            <p className="text-lg font-bold text-dark">
              {users.filter((u) => u.leadStage === "Follow Up").length}
            </p>
          </div>
          <Clock className="text-dark mt-3" />
        </div>
      </div>

      {/* Inactive */}
      <div className="bg-white rounded-lg p-2 shadow-sm border border-gray-300">
        <div className="flex justify-between">
          <div>
            <p className="text-xs text-dark font-semibold mt-2">INACTIVE</p>
            <p className="text-lg font-bold text-dark">
              {users.filter((u) => u.leadStage === "Inactive").length}
            </p>
          </div>
          <UserX className="text-dark mt-3" />
        </div>
      </div>

      {/* Onboarded */}
      <div className="bg-white rounded-lg p-2  shadow-sm border border-gray-300">
        <div className="flex justify-between">
          <div>
            <p className="text-xs text-dark font-semibold mt-1">ONBOARDED</p>
            <p className="text-lg font-bold text-dark">
              {users.filter((u) => u.leadStage === "Onboard").length}
            </p>
          </div>
          <Rocket className="text-dark mt-3" />
        </div>
      </div>

      {/* {totala posts} */}

      <div className="bg-white w-50 h-15 rounded-lg p-2.5 shadow-sm border border-gray-300 hover:shadow-md transition-all">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-dark font-medium  ">Total Posts</p>
            <p className="text-lg font-bold text-dark">{totalPosts}</p>
          </div>
          <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center mb-2">
            <ImageIcon className="text-dark" size={18} />
          </div>
        </div>
      </div>

      {/* {users today} */}

      <div className="bg-gradient-to-br w-50 h-15 rounded-lg p-2.5 shadow-sm border border-gray-300 hover:shadow-md transition-all">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-dark font-medium">Users Today</p>
            <p className="text-lg font-bold text-dark">{usersToday}</p>
          </div>
          <div className="w-9 h-9 bg-teal-100 rounded-lg flex items-center justify-center mb-2">
            <Users className="text-dark" size={18} />
          </div>
        </div>
      </div>

    </div>
  );
}
