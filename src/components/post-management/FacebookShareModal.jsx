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
  Facebook,
  Loader2,
  Search,
  Send,
  X,
} from "lucide-react";

const getPageName = (page = {}) =>
  page.pageName || page.name || "Facebook Page";

const FacebookShareModal = React.memo(
  ({ isOpen, onClose, onConfirm, post, pages = [], loading }) => {
    const [caption, setCaption] = useState("");
    const [selectedPageIds, setSelectedPageIds] = useState([]);
    const [isPageDropdownOpen, setIsPageDropdownOpen] = useState(false);
    const [pageSearch, setPageSearch] = useState("");
    const [dropdownStyle, setDropdownStyle] = useState(null);
    const dropdownTriggerRef = useRef(null);
    const dropdownMenuRef = useRef(null);

    useEffect(() => {
      if (post) {
        setCaption(post.fbDescription || post.description || "");
      }
    }, [post]);

    useEffect(() => {
      if (!isOpen) return;

      setIsPageDropdownOpen(false);
      setPageSearch("");

      if (pages.length > 0) {
        setSelectedPageIds([pages[0].pageId]);
      } else {
        setSelectedPageIds([]);
      }
    }, [isOpen, pages, post?._id]);

    useEffect(() => {
      if (!isPageDropdownOpen) return;

      const handleClickOutside = (event) => {
        const clickedTrigger = dropdownTriggerRef.current?.contains(
          event.target,
        );
        const clickedMenu = dropdownMenuRef.current?.contains(event.target);

        if (!clickedTrigger && !clickedMenu) {
          setIsPageDropdownOpen(false);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }, [isPageDropdownOpen]);

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
      if (!isPageDropdownOpen) return;

      updateDropdownPosition();
      window.addEventListener("resize", updateDropdownPosition);
      window.addEventListener("scroll", updateDropdownPosition, true);

      return () => {
        window.removeEventListener("resize", updateDropdownPosition);
        window.removeEventListener("scroll", updateDropdownPosition, true);
      };
    }, [isPageDropdownOpen, updateDropdownPosition]);

    const allPagesSelected =
      pages?.length > 0 && selectedPageIds.length === pages.length;

    const filteredPages = useMemo(() => {
      const query = pageSearch.trim().toLowerCase();
      if (!query) return pages;

      return pages.filter((page) =>
        getPageName(page).toLowerCase().includes(query),
      );
    }, [pages, pageSearch]);

    const selectedPageNames = useMemo(() => {
      const selectedIds = new Set(selectedPageIds);
      return pages
        .filter((page) => selectedIds.has(page.pageId))
        .map(getPageName);
    }, [pages, selectedPageIds]);

    const pageDropdownLabel =
      selectedPageNames.length === 0
        ? "Select Facebook pages"
        : selectedPageNames.length === 1
          ? selectedPageNames[0]
          : `${selectedPageNames.length} pages selected`;

    const handleToggleAll = useCallback(() => {
      if (!pages || pages.length === 0) return;
      setSelectedPageIds((prev) =>
        prev.length === pages.length ? [] : pages.map((page) => page.pageId),
      );
    }, [pages]);

    const handleTogglePage = useCallback((pageId) => {
      setSelectedPageIds((prev) =>
        prev.includes(pageId)
          ? prev.filter((id) => id !== pageId)
          : [...prev, pageId],
      );
    }, []);

    const handleSubmit = useCallback(() => {
      if (!pages || pages.length === 0) return;

      const selectedPages = pages.filter((page) =>
        selectedPageIds.includes(page.pageId),
      );
      if (selectedPages.length > 0) {
        onConfirm(post, selectedPages, caption);
      }
    }, [onConfirm, post, pages, selectedPageIds, caption]);

    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fadeIn">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 animate-scaleIn">
          <div className="flex justify-between items-center gap-4 px-6 py-4 border-b border-slate-100 bg-white shrink-0">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 min-w-0">
              <Facebook className="w-6 h-6 shrink-0 text-[#1877F2]" />
              <span className="truncate">Share to Facebook</span>
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 shrink-0"
              aria-label="Close Facebook share modal"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 space-y-3 px-6">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <p className="text-sm text-gray-500">Loading Facebook Pages...</p>
            </div>
          ) : pages.length === 0 ? (
            <div className="text-center py-8 px-6">
              <p className="text-gray-600 mb-4">No Facebook Pages connected.</p>
              <button
                onClick={onClose}
                className="text-blue-600 hover:underline"
              >
                Close
              </button>
            </div>
          ) : (
            <div className="space-y-4 overflow-y-auto px-6 py-5">
              <div>
                <div className="flex items-center justify-between gap-3 mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Select Pages
                  </label>
                  <button
                    type="button"
                    onClick={handleToggleAll}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                  >
                    {allPagesSelected ? "Deselect All" : "Select All"}
                  </button>
                </div>

                <div ref={dropdownTriggerRef} className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      updateDropdownPosition();
                      setIsPageDropdownOpen((prev) => !prev);
                    }}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-left text-sm text-gray-700 shadow-sm transition hover:border-blue-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  >
                    <span className="flex items-center justify-between gap-3">
                      <span
                        className={`min-w-0 flex-1 truncate ${
                          selectedPageNames.length === 0 ? "text-gray-400" : ""
                        }`}
                      >
                        {pageDropdownLabel}
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${
                          isPageDropdownOpen ? "rotate-180 text-blue-600" : ""
                        }`}
                      />
                    </span>
                  </button>
                </div>

                {isPageDropdownOpen &&
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
                            value={pageSearch}
                            onChange={(e) => setPageSearch(e.target.value)}
                            placeholder="Search pages..."
                            className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm text-gray-700 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
                            autoFocus
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 border-b border-gray-100 bg-gray-50 px-3 py-2">
                        <span className="text-xs font-medium text-gray-500">
                          {filteredPages.length} of {pages.length} pages
                        </span>
                        <button
                          type="button"
                          onClick={handleToggleAll}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                        >
                          {allPagesSelected
                            ? "Clear selection"
                            : "Select all pages"}
                        </button>
                      </div>

                      <div
                        className="overflow-y-auto overscroll-contain py-1"
                        style={{ maxHeight: dropdownStyle.maxHeight }}
                      >
                        {filteredPages.length > 0 ? (
                          filteredPages.map((page) => {
                            const isSelected = selectedPageIds.includes(
                              page.pageId,
                            );
                            const pageName = getPageName(page);

                            return (
                              <button
                                type="button"
                                key={page.pageId}
                                onClick={() => handleTogglePage(page.pageId)}
                                className={`flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition ${
                                  isSelected
                                    ? "bg-blue-50 text-blue-900"
                                    : "text-gray-700 hover:bg-gray-50"
                                }`}
                              >
                                <span
                                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                                    isSelected
                                      ? "border-blue-600 bg-blue-600"
                                      : "border-gray-300 bg-white"
                                  }`}
                                >
                                  {isSelected && (
                                    <Check className="h-3.5 w-3.5 text-white" />
                                  )}
                                </span>
                                <span className="min-w-0 flex-1 truncate font-medium">
                                  {pageName}
                                </span>
                              </button>
                            );
                          })
                        ) : (
                          <div className="px-3 py-6 text-center text-sm text-gray-500">
                            No pages found.
                          </div>
                        )}
                      </div>
                    </div>,
                    document.body,
                  )}

                {selectedPageNames.length > 1 && (
                  <div className="mt-2 max-h-32 overflow-y-auto border border-gray-100 rounded-lg p-2 bg-gray-50/30">
                    <div className="flex flex-wrap gap-1.5">
                      {selectedPageNames.map((name, index) => (
                        <span
                          key={`${name}-${index}`}
                          className="max-w-[10rem] truncate rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 border border-blue-100"
                          title={name}
                        >
                          {name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-2 text-xs text-gray-500">
                  <p>
                    {selectedPageIds.length} of {pages.length} page
                    {pages.length === 1 ? "" : "s"} selected
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Caption
                </label>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  rows={4}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={onClose}
                  className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg font-semibold hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!post || selectedPageIds.length === 0}
                  className="flex-1 bg-[#1877F2] text-white py-2.5 rounded-lg font-semibold hover:bg-[#166FE5] transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                  {selectedPageIds.length > 1 ? "Post to Pages" : "Post Now"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  },
);

FacebookShareModal.displayName = "FacebookShareModal";

export default FacebookShareModal;
