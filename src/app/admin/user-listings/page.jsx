"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, ArrowLeft, Building, MapPin, Phone, Globe, Tag, CheckCircle, XCircle, ServerCrash } from "lucide-react";

function UserListingsComponent() {
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId");

  const [user, setUser] = useState(null);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) {
      setError("User ID is missing from the URL.");
      setLoading(false);
      return;
    }

    const fetchAllData = async () => {
      try {
        // Step 1: Fetch user details (for display — email, name, etc.)
        const userRes = await fetch(`/api/auth/signup?userId=${userId}`);
        if (!userRes.ok) {
          throw new Error("User not found.");
        }
        const userData = await userRes.json();
        setUser(userData);

        // Step 2: Fetch business listings by userId — email pehle use hota
        // tha, lekin do alag userId same email share kar sakte hain, isliye
        // wo kabhi-kabhi galat user ki listings dikha deta tha.
        const listingsRes = await fetch(`/api/admin/saveBussiness?userId=${userId}`);
        const listingsData = await listingsRes.json();

        if (listingsData.success && listingsData.listings.length > 0) {
          // The API returns an array of objects, where each object contains the listings array
          setListings(listingsData.listings[0]?.listings || []);
        } else {
          setListings([]);
        }
      } catch (err) {
        setError(err.message || "Failed to fetch data.");
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [userId]);

  console.log("listings",listings);
  

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading User Listings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center bg-red-50 p-8 rounded-2xl border border-red-200">
          <ServerCrash className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-700">An Error Occurred</h2>
          <p className="mt-2 text-red-600">{error}</p>
          <Link href="/admin/user-management">
            <button className="mt-6 flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all">
              <ArrowLeft size={16} />
              Back to User Management
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Link href="/admin/user-management">
            <button className="flex items-center gap-2 text-gray-700 hover:text-indigo-600 transition-colors group mb-4">
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium">Back to User Management</span>
            </button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-800">Business Listings</h1>
          {user && <p className="text-gray-600 mt-1">Showing all listings for <span className="font-semibold text-indigo-600">{user.email}</span></p>}
        </div>

        {listings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((listing, index) => (
              <div key={listing.locationId || index} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl hover:scale-[1.02] transition-all">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <Building size={20} className="text-indigo-500" />
                    {listing.title}
                  </h2>
                  {listing.verified ? (
                    <CheckCircle size={20} className="text-green-500" />
                  ) : (
                    <XCircle size={20} className="text-red-500" />
                  )}
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-2 text-gray-600">
                    <MapPin size={16} className="mt-0.5 flex-shrink-0" />
                    <span>{listing.address?.addressLines?.join(', ') || 'No address'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Tag size={16} />
                    <span>{listing.category}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone size={16} />
                    <span>{listing.phone || 'No phone'}</span>
                  </div>
                  {listing.website && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Globe size={16} />
                      <a href={listing.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate">
                        {listing.website}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center bg-white rounded-2xl p-12 border border-gray-200">
            <Building size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700">No Listings Found</h3>
            <p className="text-gray-500 mt-2">This user does not have any business listings connected.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function UserListingsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-full"><Loader2 className="w-12 h-12 animate-spin text-indigo-600" /></div>}>
      <UserListingsComponent />
    </Suspense>
  );
}