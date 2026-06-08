import { AlertCircle, Loader2, XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export default function InhousePinterestMappingModal({
  isOpen,
  onClose,
  locations = [],
  mappings = [],
  onSave,
}) {
  const [drafts, setDrafts] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const mappingByLocationId = useMemo(() => {
    return new Map(mappings.map((mapping) => [String(mapping.locationId), mapping]));
  }, [mappings]);

  useEffect(() => {
    if (!isOpen) return;

    setDrafts(
      locations.map((location, index) => {
        const locationId = String(location.id || location.locationId || index + 1);
        const saved = mappingByLocationId.get(locationId) || {};

        return {
          locationId,
          accountId:
            saved.accountId ||
            location.accountId ||
            location.accountName ||
            location.account ||
            location.parent ||
            "",
          locationName: location.name || location.title || saved.locationName || `Location ${index + 1}`,
          locality: saved.locality || location.locality || "",
          city: saved.city || location.city || "",
          websiteUri: saved.websiteUri || location.websiteUrl || location.websiteUri || "",
          visitUri: saved.visitUri || location.visitUrl || location.visitUri || "",
        };
      }),
    );
    setError("");
  }, [isOpen, locations, mappingByLocationId]);

  if (!isOpen) return null;

  const updateDraft = (locationId, updates) => {
    setDrafts((prev) =>
      prev.map((draft) =>
        draft.locationId === locationId ? { ...draft, ...updates } : draft,
      ),
    );
  };

  const handleSave = async () => {
    const validDrafts = drafts.filter((draft) => draft.city.trim());

    if (!validDrafts.length) {
      setError("City name is required for at least one location.");
      return;
    }

    setIsSaving(true);
    setError("");

    const result = await onSave(validDrafts);

    if (!result?.success) {
      setError(result?.error || "Unable to save mapping.");
    } else {
      onClose();
    }

    setIsSaving(false);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="flex max-h-[88vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-4">
          <div>
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-900">
              Inhouse Pinterest Mapping
            </h2>
            <p className="mt-1 text-xs font-medium text-slate-500">
              Save account, locality, city and URI mapping for connected GMB locations.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="rounded-full p-2 text-slate-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
          >
            <XCircle size={22} />
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-5">
          {drafts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm font-semibold text-slate-500">
              No GMB locations found.
            </div>
          ) : (
            drafts.map((draft) => (
              <div
                key={draft.locationId}
                className="rounded-2xl border border-slate-200 bg-white p-4"
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-slate-900">
                      {draft.locationName}
                    </p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      Pinterest boards are selected while sharing.
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <input
                    value={draft.accountId}
                    onChange={(event) =>
                      updateDraft(draft.locationId, { accountId: event.target.value })
                    }
                    placeholder="GMB Account ID"
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold outline-none focus:border-[#E60023] md:col-span-2"
                  />
                  <input
                    value={draft.locality}
                    onChange={(event) =>
                      updateDraft(draft.locationId, { locality: event.target.value })
                    }
                    placeholder="Locality"
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold outline-none focus:border-[#E60023]"
                  />
                  <input
                    value={draft.city}
                    onChange={(event) =>
                      updateDraft(draft.locationId, { city: event.target.value })
                    }
                    placeholder="City"
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold outline-none focus:border-[#E60023]"
                  />
                  <input
                    value={draft.websiteUri}
                    onChange={(event) =>
                      updateDraft(draft.locationId, { websiteUri: event.target.value })
                    }
                    placeholder="Website URI"
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold outline-none focus:border-[#E60023]"
                  />
                  <input
                    value={draft.visitUri}
                    onChange={(event) =>
                      updateDraft(draft.locationId, { visitUri: event.target.value })
                    }
                    placeholder="Visit URI"
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold outline-none focus:border-[#E60023]"
                  />
                </div>
              </div>
            ))
          )}
        </div>

        <div className="border-t border-slate-100 bg-slate-50 p-5">
          {error && (
            <div className="mb-3 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-xs font-semibold text-red-600">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || drafts.length === 0}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-xs font-black uppercase tracking-widest text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving && <Loader2 size={16} className="animate-spin" />}
            {isSaving ? "Saving..." : "Save Mapping"}
          </button>
        </div>
      </div>
    </div>
  );
}
