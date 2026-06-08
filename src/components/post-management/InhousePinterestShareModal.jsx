import {
  AlertCircle,
  CheckCircle,
  Loader2,
  PlusCircle,
  XCircle,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

export default function InhousePinterestShareModal({
  isOpen,
  onClose,
  post,
  pinterestProfiles = [],
  aiContent,
  isGeneratingContent,
  onCreateBoard,
  onPublish,
}) {
  const [selectedBoardIds, setSelectedBoardIds] = useState([]);
  const [showCreateBoard, setShowCreateBoard] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState("");
  const [newBoardName, setNewBoardName] = useState("");
  const [newBoardDescription, setNewBoardDescription] = useState("");
  const [isCreatingBoard, setIsCreatingBoard] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [boardUris, setBoardUris] = useState({});
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishError, setPublishError] = useState("");
  const [publishResult, setPublishResult] = useState(null);

  const pinterestBoards = useMemo(() => {
    return pinterestProfiles.flatMap((profile) =>
      (profile.boards || []).map((board) => ({
        ...board,
        profileId: profile.pinterestUserId,
        username: profile.username,
      })),
    );
  }, [pinterestProfiles]);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedBoardIds(pinterestBoards.map((board) => board.boardId));
    setSelectedProfileId(pinterestProfiles[0]?.pinterestUserId || "");
    setTitle(aiContent?.title || "");
    setDescription(aiContent?.description || "");
    setHashtags(
      Array.isArray(aiContent?.hashtags) ? aiContent.hashtags.join(" ") : "",
    );
    setBoardUris({});
    setPublishError("");
    setPublishResult(null);
  }, [aiContent, isOpen, pinterestBoards, pinterestProfiles]);

  if (!isOpen || !post) return null;

  const handleToggleBoard = (boardId) => {
    setSelectedBoardIds((prev) =>
      prev.includes(boardId)
        ? prev.filter((id) => id !== boardId)
        : [...prev, boardId],
    );
  };

  const handlePublish = async () => {
    if (!selectedBoardIds.length) return;

    const selectedBoards = pinterestBoards
      .filter((board) => selectedBoardIds.includes(board.boardId))
      .map((board) => ({
        ...board,
        visitUri: boardUris[board.boardId] || "",
      }));

    setIsPublishing(true);
    setPublishError("");
    setPublishResult(null);

    const result = await onPublish({
      post,
      media_url: post.aiOutput,
      boards: selectedBoards,
      title,
      description,
      hashtags: hashtags
        .split(/\s+/)
        .map((tag) => tag.trim())
        .filter(Boolean),
    });

    if (result?.success) {
      setPublishResult(result);
    } else {
      setPublishError(result?.error || "Unable to publish in-house pins.");
    }

    setIsPublishing(false);
  };

  const handleSelectAll = () => {
    const allBoardIds = pinterestBoards.map((board) => board.boardId);
    setSelectedBoardIds((prev) =>
      prev.length === allBoardIds.length ? [] : allBoardIds,
    );
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

    if (result?.success) {
      setSelectedBoardIds((prev) =>
        result.board?.boardId
          ? [...new Set([...prev, result.board.boardId])]
          : prev,
      );
      setNewBoardName("");
      setNewBoardDescription("");
      setShowCreateBoard(false);
    } else {
      setPublishError(result?.error || "Unable to create Pinterest board.");
    }

    setIsCreatingBoard(false);
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="flex max-h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-4">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-900">
              <img
                src="/social-icon/pinterest-icon.png"
                alt="Pinterest"
                className="h-5 w-5 object-contain"
              />
              Inhouse Pinterest Share
            </h2>
            <p className="mt-1 text-xs font-medium text-slate-500">
              Edit AI content and publish to selected city boards.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isPublishing}
            className="rounded-full p-2 text-slate-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
          >
            <XCircle size={22} />
          </button>
        </div>

        <div className="grid flex-1 gap-0 overflow-y-auto md:grid-cols-[320px_1fr]">
          {/* Left Panel — Image + Boards */}
          <div className="border-b border-slate-100 p-5 md:border-b-0 md:border-r">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
              <Image
                src={post.aiOutput}
                alt="Pinterest creative"
                width={640}
                height={480}
                className="aspect-4/3 w-full object-cover"
              />
            </div>

            <div className="mt-4 space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Pinterest Boards
              </p>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  disabled={pinterestBoards.length === 0}
                  className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-700 hover:border-[#E60023] disabled:opacity-50"
                >
                  {selectedBoardIds.length === pinterestBoards.length &&
                  pinterestBoards.length > 0
                    ? "Clear All"
                    : "Select All"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateBoard((prev) => {
                      const newState = !prev;
                      if (newState && pinterestProfiles.length > 0) {
                        setSelectedProfileId(
                          pinterestProfiles[0]?.pinterestUserId || "",
                        );
                      }
                      return newState;
                    });
                  }}
                  className="rounded-xl bg-[#E60023] px-3 py-2 text-white hover:bg-[#c5001f]"
                >
                  <PlusCircle size={16} />
                </button>
              </div>

              {/* Create Board Form */}
              {showCreateBoard && (
                <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <select
                    value={selectedProfileId}
                    onChange={(e) => setSelectedProfileId(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-[#E60023]"
                  >
                    <option value="">Choose account</option>
                    {pinterestProfiles.map((profile) => (
                      <option
                        key={profile.pinterestUserId}
                        value={profile.pinterestUserId}
                      >
                        @{profile.username || profile.pinterestUserId}
                      </option>
                    ))}
                  </select>
                  <input
                    value={newBoardName}
                    onChange={(e) => setNewBoardName(e.target.value)}
                    placeholder="Board name"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-[#E60023]"
                  />
                  <textarea
                    value={newBoardDescription}
                    onChange={(e) => setNewBoardDescription(e.target.value)}
                    placeholder="Board description"
                    rows={2}
                    className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-[#E60023]"
                  />
                  <button
                    type="button"
                    onClick={handleCreateBoard}
                    disabled={
                      !selectedProfileId ||
                      !newBoardName.trim() ||
                      isCreatingBoard
                    }
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white disabled:opacity-50"
                  >
                    {isCreatingBoard && (
                      <Loader2 size={14} className="animate-spin" />
                    )}
                    {isCreatingBoard ? "Creating..." : "Create Board"}
                  </button>
                </div>
              )}

              {/* Board List */}
              {pinterestBoards.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 p-4 text-xs font-semibold text-slate-500">
                  No Pinterest boards found. Create a board first.
                </div>
              ) : (
                pinterestBoards.map((board) => (
                  <div
                    key={`${board.profileId}-${board.boardId}`}
                    className="space-y-1"
                  >
                    <label
                      className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border px-3 py-2 transition ${
                        selectedBoardIds.includes(board.boardId)
                          ? "border-[#E60023] bg-[#E60023]/5"
                          : "border-slate-200 hover:border-[#E60023]/30"
                      }`}
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-black text-slate-800">
                          {board.boardName}
                        </span>
                        <span className="block truncate text-[10px] font-bold text-slate-400">
                          @{board.username || board.profileId}
                        </span>
                      </span>
                      <input
                        type="checkbox"
                        checked={selectedBoardIds.includes(board.boardId)}
                        onChange={() => handleToggleBoard(board.boardId)}
                        className="h-4 w-4 accent-[#E60023]"
                      />
                    </label>

                    {/* Visit URI input — sirf selected boards ke liye */}
                    {selectedBoardIds.includes(board.boardId) && (
                      <input
                        value={boardUris[board.boardId] || ""}
                        onChange={(e) =>
                          setBoardUris((prev) => ({
                            ...prev,
                            [board.boardId]: e.target.value,
                          }))
                        }
                        placeholder={`Visit URI for ${board.boardName}`}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-[#E60023]"
                      />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Panel — Content */}
          <div className="space-y-4 p-5">
            {isGeneratingContent ? (
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-600">
                <Loader2 size={18} className="animate-spin text-[#E60023]" />
                Generating Pinterest content...
              </div>
            ) : null}

            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title (use {city} for city name)"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold outline-none focus:border-[#E60023]"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description (use {city} for city name)"
              rows={8}
              className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold leading-6 outline-none focus:border-[#E60023]"
            />
            <textarea
              value={hashtags}
              onChange={(e) => setHashtags(e.target.value)}
              placeholder="Hashtags"
              rows={3}
              className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold leading-6 outline-none focus:border-[#E60023]"
            />

            {publishError && (
              <div className="flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-xs font-semibold text-red-600">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{publishError}</span>
              </div>
            )}

            {publishResult && (
              <div className="flex items-start gap-2 rounded-xl border border-green-100 bg-green-50 p-3 text-xs font-semibold text-green-700">
                <CheckCircle size={16} className="mt-0.5 shrink-0" />
                <span>
                  Published {publishResult.successCount || 0} board(s). Failed{" "}
                  {publishResult.failedCount || 0}.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 bg-slate-50 p-5">
          <button
            type="button"
            onClick={handlePublish}
            disabled={
              isPublishing ||
              isGeneratingContent ||
              !selectedBoardIds.length ||
              !title.trim() ||
              !description.trim()
            }
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#E60023] px-4 py-4 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-[#E60023]/20 hover:bg-[#c5001f] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPublishing ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <img
                src="/social-icon/pinterest-icon.png"
                alt="Pinterest"
                className="h-4 w-4 object-contain"
              />
            )}
            {isPublishing ? "Publishing..." : "Publish To Selected Boards"}
          </button>
        </div>
      </div>
    </div>
  );
}
