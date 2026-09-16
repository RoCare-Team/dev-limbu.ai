import React from "react";
import { X, History, Loader2, Receipt, ArrowUpCircle, ArrowDownCircle, Calendar, Clock, ChevronDown } from "lucide-react";
import { transactionLabel } from "@/lib/transactionLabels";

const TransactionHistoryModal = React.memo(({
  showTransactions,
  setShowTransactions,
  filterType,
  setFilterType,
  loadingTx,
  filteredTransactions,
  hasMore = false,
  loadingMore = false,
  onLoadMore,
}) => {
  if (!showTransactions) return null;

  const formatDate = (dateString) => {
    if (!dateString) return "";

    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return "";

    const date = new Date(dateString);
    return date.toLocaleTimeString("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fadeIn">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col border border-black/5 animate-scaleUp">
        <div className="bg-black p-6 sm:p-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-400 rounded-2xl flex items-center justify-center shadow-lg shadow-yellow-400/20">
              <History className="w-6 h-6 text-black" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>Vault Logs</h2>
              <p className="text-[9px] font-bold text-yellow-400 uppercase tracking-widest">Transaction History</p>
            </div>
          </div>
          <button
            onClick={() => setShowTransactions(false)}
            className="p-2.5 hover:bg-white/10 rounded-full transition-all text-white/50 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 sm:p-10 flex-1 flex flex-col min-h-0 bg-slate-50/30">
          <div className="flex gap-2 mb-6 p-1 bg-white border border-black/5 rounded-xl shrink-0">
            {["all", "credit", "debit"].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`flex-1 py-2 px-4 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filterType === type
                  ? "bg-black text-yellow-400 shadow-lg"
                  : "text-slate-400 hover:text-black hover:bg-slate-50"
                  }`}
              >
                {type}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto custom-scroll space-y-3 pr-2">
            {loadingTx ? (
              <div className="flex flex-col items-center justify-center py-20 opacity-30">
                <Loader2 className="w-10 h-10 animate-spin text-black mb-4" />
                <p className="text-[10px] font-black uppercase tracking-widest">Reading Vault Records...</p>
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-16 h-16 bg-white border border-black/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Receipt className="w-8 h-8 text-slate-200" />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No logs found in this sector</p>
              </div>
            ) : (
              filteredTransactions?.map((tx, index) => {
                const isCredit = tx.type === "credit" || tx.type === "add";
                return (
                  <div
                    key={tx._id || index}
                    className={`bg-white border p-5 rounded-2xl transition-all group ${
                      isCredit
                      ? "border-black/5 hover:border-green-300 hover:shadow-sm"
                      : "border-black/5 hover:border-red-300 hover:shadow-sm"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                            isCredit ? "bg-green-50 text-green-600 border-green-100" : "bg-red-50 text-red-600 border-red-100"
                            }`}
                        >
                          {isCredit ? (
                            <ArrowUpCircle className="w-5 h-5" />
                          ) : (
                            <ArrowDownCircle className="w-5 h-5" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className={`font-black text-xs uppercase tracking-tight truncate ${isCredit ? "text-green-900" : "text-red-900"}`}>
                            {tx.label || tx.description || transactionLabel(tx.reason)}
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                            {/* `createdAt` carries the real time — the old `date` field was
                                date-only, which made every entry read 12:00 AM. */}
                            <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                              <Calendar className="w-3 h-3" />
                              <span>{formatDate(tx?.createdAt || tx?.timestamp)}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                              <Clock className="w-3 h-3" />
                              <span>{formatTime(tx?.createdAt || tx?.timestamp)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`font-black text-base leading-none mb-1 ${isCredit ? "text-green-600" : "text-red-600"}`}>
                          {isCredit ? "+" : "-"}₹{tx.amount}
                        </p>
                        <p className={`text-[9px] font-black uppercase tracking-widest ${isCredit ? "text-green-500/70" : "text-red-500/70"}`}>
                          {tx.coins || tx.amount} COINS
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {/* Older history, one page at a time */}
            {!loadingTx && filteredTransactions.length > 0 && (
              <div className="pt-2 pb-1 text-center">
                {hasMore ? (
                  <button
                    type="button"
                    onClick={onLoadMore}
                    disabled={loadingMore}
                    className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white px-5 py-2.5 text-[10px] font-black uppercase tracking-widest text-slate-700 transition hover:border-black hover:text-black disabled:opacity-60"
                  >
                    {loadingMore ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                    {loadingMore ? "Loading…" : "Load older transactions"}
                  </button>
                ) : (
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-300">
                    Showing all {filteredTransactions.length} {filterType === "all" ? "" : filterType} transactions
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

TransactionHistoryModal.displayName = "TransactionHistoryModal";
export default TransactionHistoryModal;
