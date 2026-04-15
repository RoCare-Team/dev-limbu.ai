import React from "react";
import { TrendingUp, ImageIcon, CheckCircle, Clock, CalendarDays, Send, Coins, ArrowUpCircle, ArrowDownCircle, Loader2 } from "lucide-react";

const StatCard = React.memo(({ title, value, icon, colorClass, iconColor }) => (
  <div className="bg-white p-4 rounded-2xl border border-black/5 flex flex-col items-center text-center transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group relative overflow-hidden">
    <div className={`absolute top-0 right-0 w-16 h-16 opacity-[0.03] rounded-full -mr-8 -mt-8 transition-transform duration-500 group-hover:scale-150 ${colorClass}`} />
    
    <div className={`p-2.5 rounded-xl mb-3 shadow-sm border border-black/5 transition-colors duration-300 ${colorClass} ${iconColor}`}>
      {icon}
    </div>
    
    <p className="text-2xl font-black text-black tracking-tighter leading-none mb-1.5">
      {value}
    </p>
    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest group-hover:text-slate-600 transition-colors">
      {title}
    </p>
  </div>
));
StatCard.displayName = "StatCard";

const StatsSection = React.memo(({ allCounts, transactions, loadingTx }) => {
  return (
    <div className="lg:col-span-8 space-y-8">
      {/* Activity Stats */}
      <div className="bg-white rounded-[2rem] shadow-sm p-6 sm:p-8 border border-black/5 relative overflow-hidden">
        <div className="flex items-center gap-2 mb-8">
          <div className="p-1.5 bg-slate-50 rounded-lg border border-black/5">
            <TrendingUp className="w-3.5 h-3.5 text-black" />
          </div>
          <h2
            className="text-[11px] font-bold text-black uppercase tracking-tight"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Your Activity Stats
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <StatCard
            title="Total Assets"
            value={allCounts.total}
            icon={<ImageIcon className="w-4 h-4" />}
            colorClass="bg-slate-50"
            iconColor="text-slate-600"
          />
          <StatCard
            title="Approved"
            value={allCounts.approved}
            icon={<CheckCircle className="w-4 h-4" />}
            colorClass="bg-green-50"
            iconColor="text-green-600"
          />
          <StatCard
            title="Pending"
            value={allCounts.pending}
            icon={<Clock className="w-4 h-4" />}
            colorClass="bg-amber-50"
            iconColor="text-amber-600"
          />
          <StatCard
            title="Scheduled"
            value={allCounts.scheduled}
            icon={<CalendarDays className="w-4 h-4" />}
            colorClass="bg-blue-50"
            iconColor="text-blue-600"
          />
          <StatCard
            title="Published"
            value={allCounts.posted}
            icon={<Send className="w-4 h-4" />}
            colorClass="bg-purple-50"
            iconColor="text-purple-600"
          />
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-[2rem] shadow-sm p-6 sm:p-8 border border-black/5">
        <div className="flex items-center gap-2 mb-6">
          <div className="p-1.5 bg-slate-50 rounded-lg">
            <Coins className="w-3.5 h-3.5 text-black" />
          </div>
          <h2
            className="text-[11px] font-bold text-black uppercase tracking-tight"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Transaction History
          </h2>
        </div>

        <div className="space-y-3 max-h-[280px] overflow-y-auto pr-2 custom-scroll">
          {loadingTx ? (
            <div className="flex flex-col items-center justify-center py-10 opacity-50">
              <Loader2 className="w-6 h-6 text-black animate-spin mb-2" />
              <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">
                Loading history...
              </p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed border-slate-100 rounded-2xl">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                No transactions found
              </p>
            </div>
          ) : (
            transactions.map((tx) => {
              const isCredit = tx.type === "credit";
              return (
                <div
                  key={tx.id}
                  className={`group flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 ${
                    isCredit
                      ? "bg-green-50/50 border-green-100 hover:border-green-300 hover:shadow-sm"
                      : "bg-red-50/50 border-red-100 hover:border-red-300 hover:shadow-sm"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex items-center justify-center w-10 h-10 rounded-xl shadow-sm border ${
                        isCredit
                          ? "bg-white border-green-100 text-green-500"
                          : "bg-white border-red-100 text-red-500"
                      }`}
                    >
                      {isCredit ? (
                        <ArrowUpCircle className="w-5 h-5" />
                      ) : (
                        <ArrowDownCircle className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <p className={`text-[11px] font-black uppercase tracking-tight mb-1 ${isCredit ? "text-green-900" : "text-red-900"}`}>
                        {tx.reason || (isCredit ? "Coins Added" : "Coins Spent")}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                          <CalendarDays className="w-2.5 h-2.5" /> {tx.date}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-slate-200" />
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" /> {tx.time}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`text-lg font-black tracking-tighter ${
                        isCredit ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {isCredit ? "+" : "-"}
                      {tx.amount}
                    </div>
                    <p className={`text-[7px] font-black uppercase tracking-widest ${isCredit ? "text-green-500/70" : "text-red-500/70"}`}>
                      {isCredit ? "Recharge" : "Expense"}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
});

StatsSection.displayName = "StatsSection";
export default StatsSection;
