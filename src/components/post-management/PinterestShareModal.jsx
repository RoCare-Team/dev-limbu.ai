import { XCircle, CheckCircle, AlertCircle, Loader2, PlusCircle } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

export default function PinterestShareModal({
  isOpen,
  onClose,
  post,
  pinterestProfiles,
  onPost,
  onCreateBoard,
  coverImageUrl,
}) {
  const [selectedBoardId, setSelectedBoardId] = useState(null);
  const [selectedProfileId, setSelectedProfileId] = useState(null);
  const [showCreateBoard, setShowCreateBoard] = useState(false);
  const [newBoardName, setNewBoardName] = useState("");
  const [newBoardDescription, setNewBoardDescription] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [isCreatingBoard, setIsCreatingBoard] = useState(false);
  const [publishError, setPublishError] = useState("");

  if (!isOpen || !post) return null;

  const handlePublish = async () => {
    if (!selectedBoardId) return;

    setIsPublishing(true);
    setPublishError("");

    const result = await onPost(post, selectedBoardId, coverImageUrl);

    if (result && !result.success) {
      setPublishError(result.error || "An unknown error occurred while publishing to Pinterest.");
    }

    setIsPublishing(false);
  };

  const handleCreateBoard = async () => {
    if (!selectedProfileId || !newBoardName.trim() || !onCreateBoard) return;

    setIsCreatingBoard(true);
    setPublishError("");

    const result = await onCreateBoard({
      profileId: selectedProfileId,
      name: newBoardName.trim(),
      description: newBoardDescription.trim(),
    });

    if (result?.success && result.board?.boardId) {
      setSelectedBoardId(result.board.boardId);
      setNewBoardName("");
      setNewBoardDescription("");
      setShowCreateBoard(false);
    } else {
      setPublishError(result?.error || "Unable to create Pinterest board.");
    }

    setIsCreatingBoard(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">

        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
              <img src="/social-icon/pinterest-icon.png" alt="Pinterest" className="w-5 h-5 object-contain" />
              Share to Pinterest
            </h2>
            <p className="text-xs font-medium text-slate-500 mt-1">
              Select or create a board to pin your post
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isPublishing}
            className="p-2 text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-full transition-colors disabled:opacity-50"
          >
            <XCircle size={24} />
          </button>
        </div>

        {/* Board Selection List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scroll">
          {pinterestProfiles.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm font-medium text-slate-500 mb-4">
                No Pinterest accounts connected.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <button
                type="button"
                onClick={() => {
                  setShowCreateBoard((prev) => !prev);
                  setPublishError("");
                  if (!selectedProfileId && pinterestProfiles[0]?.pinterestUserId) {
                    setSelectedProfileId(pinterestProfiles[0].pinterestUserId);
                  }
                }}
                disabled={isPublishing || isCreatingBoard}
                className="w-full flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#E60023]/30 bg-[#E60023]/5 px-4 py-3 text-xs font-black uppercase tracking-widest text-[#E60023] transition-all hover:bg-[#E60023]/10 disabled:opacity-50"
              >
                <PlusCircle size={16} />
                Create New Board
              </button>

              {showCreateBoard && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                  <select
                    value={selectedProfileId || ""}
                    onChange={(e) => setSelectedProfileId(e.target.value)}
                    disabled={isCreatingBoard}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-[#E60023]"
                  >
                    <option value="" disabled>
                      Choose Pinterest account
                    </option>
                    {pinterestProfiles.map((profile) => (
                      <option key={profile.pinterestUserId} value={profile.pinterestUserId}>
                        @{profile.username || profile.pinterestUserId}
                      </option>
                    ))}
                  </select>
                  <input
                    value={newBoardName}
                    onChange={(e) => setNewBoardName(e.target.value)}
                    disabled={isCreatingBoard}
                    placeholder="Board name"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-[#E60023]"
                  />
                  <textarea
                    value={newBoardDescription}
                    onChange={(e) => setNewBoardDescription(e.target.value)}
                    disabled={isCreatingBoard}
                    placeholder="Description (optional)"
                    rows={2}
                    className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-medium text-slate-700 outline-none focus:border-[#E60023]"
                  />
                  <button
                    type="button"
                    onClick={handleCreateBoard}
                    disabled={!selectedProfileId || !newBoardName.trim() || isCreatingBoard}
                    className="w-full rounded-xl bg-slate-900 px-4 py-3 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isCreatingBoard && <Loader2 size={14} className="animate-spin" />}
                    {isCreatingBoard ? "Creating..." : "Create Board"}
                  </button>
                </div>
              )}

              {pinterestProfiles.map((profile) => (
                <div key={profile.pinterestUserId} className="space-y-3">
                  <div className="flex items-center gap-3 pb-2 border-b border-slate-100">
                    {profile.profileImage ? (
                      <img src={profile.profileImage} alt={profile.username} className="w-8 h-8 rounded-full" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-500">
                        {profile.username?.charAt(0)?.toUpperCase()}
                      </div>
                    )}
                    <span className="text-sm font-bold text-slate-800">@{profile.username}</span>
                  </div>

                  {profile.boards && profile.boards.length > 0 ? (
                    <div className="grid grid-cols-1 gap-2 pl-2">
                      {profile.boards.map((board) => (
                        <label
                          key={board.boardId}
                          className={`flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all ${selectedBoardId === board.boardId
                            ? "border-[#E60023] bg-[#E60023]/5"
                            : "border-slate-200 hover:border-[#E60023]/30 hover:bg-slate-50"
                            }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex-1">
                              <p className={`text-sm font-bold ${selectedBoardId === board.boardId ? "text-[#E60023]" : "text-slate-700"}`}>
                                {board.boardName}
                              </p>
                              <p className="text-[10px] text-slate-500 mt-0.5">ID: {board.boardId}</p>
                            </div>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${selectedBoardId === board.boardId
                            ? "border-[#E60023] bg-[#E60023]"
                            : "border-slate-300"
                            }`}>
                            {selectedBoardId === board.boardId && <CheckCircle size={12} className="text-white" />}
                          </div>
                          <input
                            type="radio"
                            name="pinterestBoard"
                            value={board.boardId}
                            checked={selectedBoardId === board.boardId}
                            onChange={() => {
                              setSelectedBoardId(board.boardId);
                              setSelectedProfileId(profile.pinterestUserId);
                              setPublishError("");
                            }}
                            className="hidden"
                          />
                        </label>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic pl-2">No boards found for this profile.</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions & Errors */}
        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex flex-col gap-3">
          {publishError && (
            <div className="flex items-start gap-2 p-3 bg-red-50 text-red-600 rounded-xl text-xs font-medium border border-red-100">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{publishError}</span>
            </div>
          )}

          <button
            onClick={handlePublish}
            disabled={!selectedBoardId || isPublishing}
            className="w-full py-4 bg-[#E60023] text-white rounded-2xl text-[12px] font-black uppercase tracking-widest shadow-lg shadow-[#E60023]/20 hover:bg-[#c5001f] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isPublishing ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Image
                src="/social-icon/pinterest-icon.png"
                width={16}
                height={16}
                className="object-contain"
                alt="Pinterest"
              />
            )}
            {isPublishing ? "Publishing..." : "Create Pin on Pinterest"}
          </button>
        </div>
      </div>
    </div>
  );
}
