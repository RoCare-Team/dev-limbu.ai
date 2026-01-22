import { useEffect, useState } from "react";
import { X, MessageSquare } from "lucide-react";

export default function ChatModalForAdmin({ userId }) {
  const [isOpen, setIsOpen] = useState(false);
  const [chatData, setChatData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msgCount, setMsgCount] = useState(0);

  useEffect(() => {
    if (userId) {
      fetchChatData();
    }
  }, [userId]);

  const fetchChatData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/issue-check?userId=${userId}`);
      const result = await response.json();

      if (result.success) {
        setChatData(result.data);
        setMsgCount(result.data.length);
      } else {
        console.error(result.message);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(true);
          fetchChatData();
        }}
        className="relative flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium border border-blue-200"
      >
        <MessageSquare size={16} />
        Chat
        {msgCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm min-w-[18px] text-center">
            {msgCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(false);
          }}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl w-full max-w-md flex flex-col max-h-[80vh] overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-800">User Issues</h3>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-200 rounded-full text-gray-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 bg-gray-50/50">
              {loading && <p className="text-center text-gray-500 py-4">Loading chats...</p>}

              {!loading && chatData.length === 0 && (
                <p className="text-center text-gray-500 py-4">No issues found.</p>
              )}

              <div className="space-y-3">
                {chatData.map((item, index) => (
                  <div key={index} className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-sm font-semibold text-gray-900">
                        User: <span className="font-normal text-gray-700">{item.fullName}</span>
                      </p>
                      <span className="text-xs text-gray-400">
                        {new Date(item.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-800 mb-1">
                      <span className="font-semibold">Message:</span> {item.message || item.issue}
                    </p>
                    {item.adminResponse && (
                      <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-800 border border-blue-100">
                        <span className="font-semibold">Admin:</span> {item.adminResponse}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
