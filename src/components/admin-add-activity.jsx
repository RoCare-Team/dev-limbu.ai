"use client";
import { useState, useEffect } from "react";
import { Activity, X, Plus, Trash2, Calendar, Save, CheckCircle, Link as LinkIcon, FileText, Facebook, Instagram, MapPin } from "lucide-react";

export default function AddAddUserActivity({ userId }) {
  const [isOpen, setIsOpen] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const defaultActivities = {
    gmb: { enabled: false, label: "GMB Posting", target: 1, done: 0, link: "", notes: "", icon: <MapPin size={18} className="text-blue-600" /> },
    facebook: { enabled: false, label: "Facebook Posting", target: 1, done: 0, link: "", notes: "", icon: <Facebook size={18} className="text-blue-700" /> },
    instagram: { enabled: false, label: "Instagram Posting", target: 1, done: 0, link: "", notes: "", icon: <Instagram size={18} className="text-pink-600" /> },
    citations: { enabled: false, label: "Citations", count: 0, notes: "", icon: <FileText size={18} className="text-orange-600" /> },
    services: { enabled: false, label: "Services Update", notes: "", icon: <CheckCircle size={18} className="text-green-600" /> },
    category: { enabled: false, label: "Category Update", notes: "", icon: <Activity size={18} className="text-purple-600" /> },
  };

  const [activities, setActivities] = useState(defaultActivities);
  const [customFields, setCustomFields] = useState([]);

  useEffect(() => {
    if (isOpen && userId && date) fetchActivityData();
  }, [isOpen, date, userId]);

  const fetchActivityData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/user-activity?userId=${userId}&date=${date}`);
      const data = await res.json();  

      if (data.success && data.data) {
        // Merge fetched data with default structure to ensure all keys exist and icons are preserved
        const mergedActivities = { ...defaultActivities };
        if (data.data.activities) {
            Object.keys(data.data.activities).forEach(key => {
                if (mergedActivities[key]) {
                    mergedActivities[key] = { ...mergedActivities[key], ...data.data.activities[key] };
                }
            });
        }
        setActivities(mergedActivities);
        setCustomFields(data.data.customFields || []);
      } else {
        setActivities(defaultActivities);
        setCustomFields([]);
      }
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleActivityChange = (key, field, value) => {
    setActivities(prev => ({
      ...prev,
      [key]: { ...prev[key], [field]: value }
    }));
  };

  const toggleActivity = (key) => {
    setActivities(prev => ({
      ...prev,
      [key]: { ...prev[key], enabled: !prev[key].enabled }
    }));
  };

  const addCustomField = () => {
    setCustomFields([...customFields, { id: Date.now(), label: "", value: "" }]);
  };

  const removeCustomField = (id) => {
    setCustomFields(customFields.filter(f => f.id !== id));
  };

  const updateCustomField = (id, field, value) => {
    setCustomFields(customFields.map(f => f.id === id ? { ...f, [field]: value } : f));
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      // Strip icons before saving to avoid circular JSON or unnecessary data
      const activitiesToSave = {};
      Object.keys(activities).forEach(key => {
          const { icon, ...rest } = activities[key];
          activitiesToSave[key] = rest;
      });

      const res = await fetch("/api/admin/user-activity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, date, activities: activitiesToSave, customFields }),
      });

      const data = await res.json();

      if (data.success) {
        fetchActivityData(); // refresh
        setIsOpen(false);
      } else {
        alert("Save failed");
      }
    } catch (err) {
      console.error("Save Error:", err);
      alert("Server error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(true);
        }}
        className="flex items-center gap-2 px-3 py-2 bg-white text-gray-700 hover:text-purple-600 hover:bg-purple-50 rounded-lg border border-gray-200 shadow-sm transition-all text-sm font-medium"
      >
        <Activity size={16} /> Activity
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200" onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-purple-50 to-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                    <Activity size={20} />
                </div>
                <div>
                    <h3 className="font-bold text-gray-800 text-lg">Daily Work Update</h3>
                    <p className="text-xs text-gray-500">Track and manage daily tasks</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-6 relative bg-gray-50/50 flex-1">
              {loading && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-[1px] flex justify-center items-center z-10 rounded-b-2xl">
                  <div className="flex flex-col items-center gap-2">
                    <div className="animate-spin h-8 w-8 border-4 border-purple-600 border-t-transparent rounded-full"></div>
                    <span className="text-sm font-medium text-purple-600">Loading data...</span>
                  </div>
                </div>
              )}

              {/* Date Selection */}
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Calendar size={14} /> Select Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full p-2.5 border border-gray-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                />
              </div>

              {/* Activities Grid */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                    <span className="w-1 h-4 bg-purple-500 rounded-full"></span>
                    Platform Activities
                </h4>
                <div className="grid grid-cols-1 gap-4">
                    {["gmb", "facebook", "instagram"].map(key => (
                        <div key={key} className={`bg-white border rounded-xl transition-all duration-200 ${activities[key].enabled ? 'border-purple-200 shadow-md ring-1 ring-purple-50' : 'border-gray-200 hover:border-gray-300'}`}>
                        <div className="p-4 flex items-center justify-between cursor-pointer" onClick={() => toggleActivity(key)}>
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${activities[key].enabled ? 'bg-purple-100' : 'bg-gray-100'}`}>
                                    {activities[key].icon}
                                </div>
                                <span className={`font-semibold ${activities[key].enabled ? 'text-gray-900' : 'text-gray-500'}`}>{activities[key].label}</span>
                            </div>
                            <div className={`w-10 h-5 rounded-full relative transition-colors duration-200 ${activities[key].enabled ? 'bg-purple-600' : 'bg-gray-300'}`}>
                                <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform duration-200 ${activities[key].enabled ? 'translate-x-5' : ''}`} />
                            </div>
                        </div>

                        {activities[key].enabled && (
                            <div className="px-4 pb-4 pt-0 space-y-3 animate-in slide-in-from-top-2">
                                <div className="h-px bg-gray-100 mb-3" />
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] font-semibold text-gray-500 uppercase mb-1 block">Target</label>
                                        <input
                                            type="number"
                                            value={activities[key].target}
                                            onChange={(e) => handleActivityChange(key, "target", e.target.value)}
                                            className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-semibold text-gray-500 uppercase mb-1 block">Completed</label>
                                        <input
                                            type="number"
                                            value={activities[key].done}
                                            onChange={(e) => handleActivityChange(key, "done", e.target.value)}
                                            className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-semibold text-gray-500 uppercase mb-1 block">Post Link</label>
                                    <div className="relative">
                                        <LinkIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="text"
                                            value={activities[key].link}
                                            onChange={(e) => handleActivityChange(key, "link", e.target.value)}
                                            placeholder="https://..."
                                            className="w-full pl-9 p-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-semibold text-gray-500 uppercase mb-1 block">Notes</label>
                                    <textarea
                                        value={activities[key].notes}
                                        onChange={(e) => handleActivityChange(key, "notes", e.target.value)}
                                        placeholder="Any remarks..."
                                        rows={2}
                                        className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none resize-none"
                                    />
                                </div>
                            </div>
                        )}
                        </div>
                    ))}
                </div>
              </div>

              {/* Other Tasks */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                    <span className="w-1 h-4 bg-blue-500 rounded-full"></span>
                    Other Tasks
                </h4>
                <div className="grid grid-cols-1 gap-3">
                    {["citations", "services", "category"].map(key => (
                         <div key={key} className={`bg-white border rounded-xl transition-all duration-200 ${activities[key].enabled ? 'border-blue-200 shadow-sm ring-1 ring-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                            <div className="p-3 flex items-center justify-between cursor-pointer" onClick={() => toggleActivity(key)}>
                                <div className="flex items-center gap-3">
                                    <div className={`p-1.5 rounded-lg ${activities[key].enabled ? 'bg-blue-100' : 'bg-gray-100'}`}>
                                        {activities[key].icon}
                                    </div>
                                    <span className={`text-sm font-semibold ${activities[key].enabled ? 'text-gray-900' : 'text-gray-500'}`}>{activities[key].label}</span>
                                </div>
                                <div className={`w-8 h-4 rounded-full relative transition-colors duration-200 ${activities[key].enabled ? 'bg-blue-600' : 'bg-gray-300'}`}>
                                    <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform duration-200 ${activities[key].enabled ? 'translate-x-4' : ''}`} />
                                </div>
                            </div>
                            {activities[key].enabled && (
                                <div className="px-3 pb-3 pt-0 space-y-2 animate-in slide-in-from-top-1">
                                    <div className="h-px bg-gray-100 mb-2" />
                                    {key === 'citations' && (
                                        <div>
                                            <input
                                                type="number"
                                                value={activities[key].count}
                                                onChange={(e) => handleActivityChange(key, "count", e.target.value)}
                                                placeholder="Count"
                                                className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none mb-2"
                                            />
                                        </div>
                                    )}
                                    <textarea
                                        value={activities[key].notes}
                                        onChange={(e) => handleActivityChange(key, "notes", e.target.value)}
                                        placeholder="Details..."
                                        rows={1}
                                        className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                    />
                                </div>
                            )}
                         </div>
                    ))}
                </div>
              </div>

              {/* Custom Fields */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                    <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                        <span className="w-1 h-4 bg-orange-500 rounded-full"></span>
                        Additional Info
                    </h4>
                    <button onClick={addCustomField} className="text-xs flex items-center gap-1 bg-orange-50 text-orange-600 px-2 py-1 rounded-md hover:bg-orange-100 transition-colors font-medium">
                        <Plus size={12} /> Add Field
                    </button>
                </div>

                {customFields.length === 0 && (
                    <div className="text-center p-4 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 text-xs">
                        No custom fields added
                    </div>
                )}

                <div className="space-y-2">
                    {customFields.map(f => (
                    <div key={f.id} className="flex gap-2 items-start animate-in fade-in slide-in-from-top-2">
                        <input
                        value={f.label}
                        onChange={(e) => updateCustomField(f.id, "label", e.target.value)}
                        placeholder="Label"
                        className="border border-gray-200 p-2 rounded-lg flex-1 text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                        />
                        <input
                        value={f.value}
                        onChange={(e) => updateCustomField(f.id, "value", e.target.value)}
                        placeholder="Value"
                        className="border border-gray-200 p-2 rounded-lg flex-[2] text-sm focus:ring-2 focus:ring-orange-500 outline-none"
                        />
                        <button onClick={() => removeCustomField(f.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 size={16} />
                        </button>
                    </div>
                    ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setIsOpen(false)}
                className="px-5 py-2.5 rounded-xl text-gray-600 font-medium hover:bg-gray-200 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
              >
                {saving ? (
                    <>
                        <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                        Saving...
                    </>
                ) : (
                    <>
                        <Save size={16} />
                        Save Update
                    </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
