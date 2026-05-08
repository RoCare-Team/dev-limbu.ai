"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import {
  Check,
  ChevronDown,
  Instagram,
  Loader2,
  Search,
  Send,
  X,
} from "lucide-react";
import Link from "next/link";
import { metaPublishMedia } from "@/lib/postMediaUrls";

const getAccountId = (account = {}) => account.igId || account.id;
const getAccountName = (account = {}) =>
  account.igUsername || account.username || "Instagram Account";

const InstagramShareModal = ({
  isOpen,
  onClose,
  onConfirm,
  post,
  selectedMedia = null,
  accounts = [],
  loading = false,
}) => {
  const [caption, setCaption] = useState("");
  const [selectedAccountIds, setSelectedAccountIds] = useState([]);
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const [accountSearch, setAccountSearch] = useState("");
  const [dropdownStyle, setDropdownStyle] = useState(null);
  /** Instagram Graph: VIDEO = feed video, REELS = Reel */
  const [igVideoKind, setIgVideoKind] = useState("REELS");
  const dropdownTriggerRef = useRef(null);
  const dropdownMenuRef = useRef(null);

  useEffect(() => {
    if (post) {
      setCaption(post?.igDescription || post?.description || "");
      setIgVideoKind("REELS");
    }
  }, [post]);

  useEffect(() => {
    if (!isOpen) return;

    setIsAccountDropdownOpen(false);
    setAccountSearch("");

    const firstAccountId = getAccountId(accounts[0]);
    setSelectedAccountIds(firstAccountId ? [firstAccountId] : []);
  }, [accounts, isOpen, post?._id]);

  const publishMedia = useMemo(() => {
    return selectedMedia || metaPublishMedia(post);
  }, [post, selectedMedia]);

  const allAccountsSelected =
    accounts.length > 0 && selectedAccountIds.length === accounts.length;

  const filteredAccounts = useMemo(() => {
    const query = accountSearch.trim().toLowerCase();
    if (!query) return accounts;

    return accounts.filter((account) =>
      getAccountName(account).toLowerCase().includes(query),
    );
  }, [accounts, accountSearch]);

  const selectedAccountNames = useMemo(() => {
    const selectedIds = new Set(selectedAccountIds);
    return accounts
      .filter((account) => selectedIds.has(getAccountId(account)))
      .map(getAccountName);
  }, [accounts, selectedAccountIds]);

  const accountDropdownLabel =
    selectedAccountNames.length === 0
      ? "Select Instagram accounts"
      : selectedAccountNames.length === 1
        ? selectedAccountNames[0]
        : `${selectedAccountNames.length} accounts selected`;

  const updateDropdownPosition = useCallback(() => {
    const trigger = dropdownTriggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const viewportPadding = 16;
    const spaceBelow = window.innerHeight - rect.bottom - viewportPadding;
    const spaceAbove = rect.top - viewportPadding;
    const shouldOpenUp = spaceBelow < 280 && spaceAbove > spaceBelow;
    const maxHeight = Math.max(
      180,
      Math.min(320, shouldOpenUp ? spaceAbove - 8 : spaceBelow - 8),
    );

    setDropdownStyle({
      left: rect.left,
      top: shouldOpenUp ? undefined : rect.bottom + 8,
      bottom: shouldOpenUp ? window.innerHeight - rect.top + 8 : undefined,
      width: rect.width,
      maxHeight,
    });
  }, []);

  useEffect(() => {
    if (!isAccountDropdownOpen) return;

    const handleClickOutside = (event) => {
      const clickedTrigger = dropdownTriggerRef.current?.contains(event.target);
      const clickedMenu = dropdownMenuRef.current?.contains(event.target);

      if (!clickedTrigger && !clickedMenu) {
        setIsAccountDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isAccountDropdownOpen]);

  useEffect(() => {
    if (!isAccountDropdownOpen) return;

    updateDropdownPosition();
    window.addEventListener("resize", updateDropdownPosition);
    window.addEventListener("scroll", updateDropdownPosition, true);

    return () => {
      window.removeEventListener("resize", updateDropdownPosition);
      window.removeEventListener("scroll", updateDropdownPosition, true);
    };
  }, [isAccountDropdownOpen, updateDropdownPosition]);

  const handleToggleAll = useCallback(() => {
    if (!accounts.length) return;

    setSelectedAccountIds((prev) =>
      prev.length === accounts.length
        ? []
        : accounts.map(getAccountId).filter(Boolean),
    );
  }, [accounts]);

  const handleToggleAccount = useCallback((accountId) => {
    setSelectedAccountIds((prev) =>
      prev.includes(accountId)
        ? prev.filter((id) => id !== accountId)
        : [...prev, accountId],
    );
  }, []);

  const handleSubmit = useCallback(() => {
    if (!accounts.length) return;

    const selectedAccounts = accounts.filter((account) =>
      selectedAccountIds.includes(getAccountId(account)),
    );

    if (selectedAccounts.length > 0 && post) {
      onConfirm(
        post,
        selectedAccounts,
        caption,
        publishMedia?.type === "video" ? igVideoKind : undefined,
      );
    }
  }, [accounts, selectedAccountIds, post, caption, onConfirm, igVideoKind, publishMedia]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 animate-fadeIn">
      <div className="w-full max-w-md max-h-[92vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200 animate-scaleIn">
        <div className="flex justify-between items-center gap-4 px-5 md:px-6 py-4 border-b border-gray-100 bg-white shrink-0">
          <h2 className="flex items-center gap-2 text-lg md:text-xl font-bold text-gray-800 min-w-0">
            <Instagram className="w-5 h-5 md:w-6 md:h-6 shrink-0 text-[#E1306C]" />
            <span className="truncate">Share to Instagram</span>
          </h2>

          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-gray-100 transition shrink-0"
            aria-label="Close Instagram share modal"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-3 px-6">
            <Loader2 className="w-7 h-7 animate-spin text-pink-600" />
            <p className="text-sm text-gray-500">
              Loading Instagram Accounts...
            </p>
          </div>
        ) : accounts.length === 0 ? (
          <div className="text-center py-8 px-6">
            <p className="text-gray-600 mb-4">
              No Instagram accounts connected.
            </p>

            <Link
              href="/dashboard"
              className="inline-block bg-pink-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-pink-700 transition"
            >
              Connect Instagram
            </Link>
          </div>
        ) : (
          <div className="space-y-4 overflow-y-auto px-5 md:px-6 py-5">
            <div>
              <div className="flex items-center justify-between gap-3 mb-2">
                <label className="text-sm font-medium text-gray-700 block">
                  Select Accounts
                </label>
                <button
                  type="button"
                  onClick={handleToggleAll}
                  className="text-xs font-semibold text-pink-600 hover:text-pink-700"
                >
                  {allAccountsSelected ? "Deselect All" : "Select All"}
                </button>
              </div>

              <div ref={dropdownTriggerRef} className="relative">
                <button
                  type="button"
                  onClick={() => {
                    updateDropdownPosition();
                    setIsAccountDropdownOpen((prev) => !prev);
                  }}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-left text-sm text-gray-700 shadow-sm transition hover:border-pink-300 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-100"
                >
                  <span className="flex items-center justify-between gap-3">
                    <span
                      className={`min-w-0 flex-1 truncate ${
                        selectedAccountNames.length === 0 ? "text-gray-400" : ""
                      }`}
                    >
                      {accountDropdownLabel}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${
                        isAccountDropdownOpen ? "rotate-180 text-pink-600" : ""
                      }`}
                    />
                  </span>
                </button>
              </div>

              {isAccountDropdownOpen &&
                dropdownStyle &&
                createPortal(
                  <div
                    ref={dropdownMenuRef}
                    className="fixed z-[9999] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl"
                    style={{
                      left: dropdownStyle.left,
                      top: dropdownStyle.top,
                      bottom: dropdownStyle.bottom,
                      width: dropdownStyle.width,
                    }}
                  >
                    <div className="border-b border-gray-100 p-2">
                      <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <input
                          value={accountSearch}
                          onChange={(e) => setAccountSearch(e.target.value)}
                          placeholder="Search accounts..."
                          className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm text-gray-700 outline-none focus:border-pink-500 focus:bg-white focus:ring-2 focus:ring-pink-100"
                          autoFocus
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 border-b border-gray-100 bg-gray-50 px-3 py-2">
                      <span className="text-xs font-medium text-gray-500">
                        {filteredAccounts.length} of {accounts.length} accounts
                      </span>
                      <button
                        type="button"
                        onClick={handleToggleAll}
                        className="text-xs font-semibold text-pink-600 hover:text-pink-700"
                      >
                        {allAccountsSelected ? "Clear selection" : "Select all accounts"}
                      </button>
                    </div>

                    <div
                      className="overflow-y-auto overscroll-contain py-1"
                      style={{ maxHeight: dropdownStyle.maxHeight }}
                    >
                      {filteredAccounts.length > 0 ? (
                        filteredAccounts.map((account) => {
                          const accountId = getAccountId(account);
                          const accountName = getAccountName(account);
                          const isSelected = selectedAccountIds.includes(accountId);

                          return (
                            <button
                              type="button"
                              key={accountId}
                              onClick={() => accountId && handleToggleAccount(accountId)}
                              className={`flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition ${
                                isSelected
                                  ? "bg-pink-50 text-pink-900"
                                  : "text-gray-700 hover:bg-gray-50"
                              }`}
                            >
                              <span
                                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                                  isSelected
                                    ? "border-pink-600 bg-pink-600"
                                    : "border-gray-300 bg-white"
                                }`}
                              >
                                {isSelected && <Check className="h-3.5 w-3.5 text-white" />}
                              </span>
                              <span className="min-w-0 flex-1 truncate font-medium">
                                {accountName}
                              </span>
                            </button>
                          );
                        })
                      ) : (
                        <div className="px-3 py-6 text-center text-sm text-gray-500">
                          No accounts found.
                        </div>
                      )}
                    </div>
                  </div>,
                  document.body,
                )}

              {selectedAccountNames.length > 1 && (
                <div className="mt-2 max-h-32 overflow-y-auto border border-gray-100 rounded-lg p-2 bg-gray-50/30">
                  <div className="flex flex-wrap gap-1.5">
                    {selectedAccountNames.map((name, index) => (
                      <span
                        key={`${name}-${index}`}
                        className="max-w-[10rem] truncate rounded-full bg-pink-50 px-2.5 py-1 text-xs font-medium text-pink-700 border border-pink-100"
                        title={name}
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <p className="mt-2 text-xs text-gray-500">
                {selectedAccountIds.length} of {accounts.length} account
                {accounts.length === 1 ? "" : "s"} selected
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Caption
              </label>

              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={4}
                placeholder="Write your caption..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 outline-none resize-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-lg bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition"
              >
                Cancel
              </button>

              <button
                onClick={handleSubmit}
                disabled={!post || !publishMedia?.url || selectedAccountIds.length === 0}
                className="flex-1 py-2.5 rounded-lg bg-pink-600 text-white font-semibold hover:bg-pink-700 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
                {selectedAccountIds.length > 1 ? "Post to Accounts" : "Post Now"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(InstagramShareModal);
