"use client";
import React, { useState } from 'react';
import { 
  Calendar, Clock, Plus, X, Save, CheckCircle, AlertCircle, 
  Facebook, Instagram, MapPin, ListFilter, Trash2,
  ToggleLeft, ToggleRight, PlayCircle, FileText,
  Globe, ChevronLeft, ChevronRight
} from 'lucide-react';

export default function BulkScheduledPage() {
  // --- Section 1: Keyword Selection ---
  const [keywords, setKeywords] = useState([]);
  const [currentKeyword, setCurrentKeyword] = useState("");

  const handleAddKeyword = () => {
    if (currentKeyword.trim() && !keywords.includes(currentKeyword.trim())) {
      setKeywords([...keywords, currentKeyword.trim()]);
      setCurrentKeyword("");
    }
  };

  const handleRemoveKeyword = (keywordToRemove) => {
    setKeywords(keywords.filter(k => k !== keywordToRemove));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddKeyword();
    }
  };

  // --- Section 2: Schedule Settings ---
  const [frequency, setFrequency] = useState("daily");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [time, setTime] = useState("10:00");
  const [specificDates, setSpecificDates] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const handleDateClick = (day) => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    setSpecificDates(prev => prev.includes(dateStr) ? prev.filter(d => d !== dateStr) : [...prev, dateStr].sort());
  };

  const changeMonth = (offset) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1));
  };


  // --- Section 3: Automation Rules ---
  const [autoGenerate, setAutoGenerate] = useState(true);
  const [autoPost, setAutoPost] = useState(true);

  // --- Section 4: Platform Selection ---
  const [platforms, setPlatforms] = useState({
    gmb: true,
    facebook: false,
    instagram: false
  });

  const togglePlatform = (platform) => {
    setPlatforms(prev => ({ ...prev, [platform]: !prev[platform] }));
  };

  // --- Section 7: Scheduled Posts Overview (Mock Data) ---
  const [filterStatus, setFilterStatus] = useState("All");
  
  const scheduledPosts = [
    { id: 1, date: '2024-01-20', time: '10:00 AM', keyword: 'Best Coffee Shop', status: 'Scheduled', platform: 'GMB' },
    { id: 2, date: '2024-01-21', time: '10:00 AM', keyword: 'Espresso Deals', status: 'Posted', platform: 'Facebook' },
    { id: 3, date: '2024-01-22', time: '10:00 AM', keyword: 'Latte Art', status: 'Failed', platform: 'Instagram' },
    { id: 4, date: '2024-01-23', time: '10:00 AM', keyword: 'Morning Brew', status: 'Scheduled', platform: 'GMB' },
  ];

  const filteredPosts = filterStatus === "All" 
    ? scheduledPosts 
    : scheduledPosts.filter(post => post.status === filterStatus);

  return (
    <div className="min-h-screen bg-gray-50 p-6 lg:p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bulk Schedule & Auto Posting</h1>
          <p className="text-gray-500 mt-1">Automate your content strategy with keyword-based scheduling.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Configuration */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Section 1: Keyword Selection */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Select Keywords for Auto Posting
              </h2>
              
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={currentKeyword}
                  onChange={(e) => setCurrentKeyword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter a keyword (e.g., 'Best Pizza')"
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <button 
                  onClick={handleAddKeyword}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 font-medium"
                >
                  <Plus className="w-4 h-4" /> Add
                </button>
              </div>

              <div className="flex flex-wrap gap-2 min-h-[40px]">
                {keywords.map((keyword, idx) => (
                  <span key={idx} className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 border border-blue-100">
                    {keyword}
                    <button onClick={() => handleRemoveKeyword(keyword)} className="hover:text-blue-900">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                {keywords.length === 0 && (
                  <p className="text-gray-400 text-sm italic py-2">No keywords added yet.</p>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-3">
                Keywords will be used one by one for automatic post generation.
              </p>
            </div>

            {/* Section 2: Schedule Settings */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-600" />
                Schedule Settings
              </h2>

              <div className="space-y-4">
                <div className="flex flex-wrap gap-4">
                  {['daily', 'alternate', 'specific'].map((opt) => (
                    <label key={opt} className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="frequency" 
                        value={opt} 
                        checked={frequency === opt}
                        onChange={(e) => setFrequency(e.target.value)}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="capitalize text-gray-700 font-medium">
                        {opt === 'alternate' ? 'Alternate Days' : opt === 'specific' ? 'Specific Dates' : 'Post Daily'}
                      </span>
                    </label>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {frequency === 'specific' ? (
                    <div className="md:col-span-2 bg-white border border-gray-200 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-4">
                        <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-gray-100 rounded-full">
                          <ChevronLeft className="w-5 h-5 text-gray-600" />
                        </button>
                        <span className="font-bold text-gray-800">
                          {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                        </span>
                        <button onClick={() => changeMonth(1)} className="p-1 hover:bg-gray-100 rounded-full">
                          <ChevronRight className="w-5 h-5 text-gray-600" />
                        </button>
                      </div>
                      <div className="grid grid-cols-7 gap-1 text-center mb-2">
                        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                          <span key={d} className="text-xs font-medium text-gray-400">{d}</span>
                        ))}
                      </div>
                      <div className="grid grid-cols-7 gap-1">
                        {Array.from({ length: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay() }).map((_, i) => (
                          <div key={`empty-${i}`} />
                        ))}
                        {Array.from({ length: new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate() }).map((_, i) => {
                          const day = i + 1;
                          const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                          const isSelected = specificDates.includes(dateStr);
                          return (
                            <button
                              key={day}
                              onClick={() => handleDateClick(day)}
                              className={`h-8 w-8 rounded-full text-sm flex items-center justify-center transition-all ${isSelected ? 'bg-blue-600 text-white font-bold shadow-md' : 'hover:bg-blue-50 text-gray-700'}`}
                            >
                              {day}
                            </button>
                          );
                        })}
                      </div>
                      {specificDates.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-gray-100">
                          <p className="text-xs text-gray-500 mb-2">Selected Dates:</p>
                          <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto custom-scrollbar">
                            {specificDates.map(date => (
                              <span key={date} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md border border-blue-100 flex items-center gap-1">
                                {date}
                                <button onClick={() => setSpecificDates(prev => prev.filter(d => d !== date))} className="hover:text-blue-900"><X className="w-3 h-3" /></button>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">Start Date</label>
                        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">End Date (Optional)</label>
                        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                      </div>
                    </>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Post Time</label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input 
                        type="time" 
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Automation Rules */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <PlayCircle className="w-5 h-5 text-green-600" />
                Automation Rules
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-medium text-gray-800">Enable automatic post generation</p>
                    <p className="text-xs text-gray-500">AI will generate content using selected keywords</p>
                  </div>
                  <button onClick={() => setAutoGenerate(!autoGenerate)} className={`text-2xl transition-colors ${autoGenerate ? 'text-green-500' : 'text-gray-300'}`}>
                    {autoGenerate ? <ToggleRight className="w-10 h-10" /> : <ToggleLeft className="w-10 h-10" />}
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-medium text-gray-800">Enable automatic posting</p>
                    <p className="text-xs text-gray-500">Posts will be published without manual approval</p>
                  </div>
                  <button onClick={() => setAutoPost(!autoPost)} className={`text-2xl transition-colors ${autoPost ? 'text-green-500' : 'text-gray-300'}`}>
                    {autoPost ? <ToggleRight className="w-10 h-10" /> : <ToggleLeft className="w-10 h-10" />}
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-3">
                On each scheduled date, one keyword will be selected and a post will be generated automatically with assets.
              </p>
            </div>

            {/* Section 4: Platform Selection */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Globe className="w-5 h-5 text-indigo-600" />
                Choose Posting Platforms
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { id: 'gmb', name: 'Google Business', icon: <MapPin className="w-5 h-5" />, connected: true },
                  { id: 'facebook', name: 'Facebook Page', icon: <Facebook className="w-5 h-5" />, connected: false },
                  { id: 'instagram', name: 'Instagram', icon: <Instagram className="w-5 h-5" />, connected: false },
                ].map((p) => (
                  <div 
                    key={p.id}
                    onClick={() => togglePlatform(p.id)}
                    className={`
                      relative p-4 rounded-xl border-2 cursor-pointer transition-all
                      ${platforms[p.id] ? 'border-blue-500 bg-blue-50' : 'border-gray-100 bg-white hover:border-gray-200'}
                    `}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`p-2 rounded-full ${platforms[p.id] ? 'bg-white text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                        {p.icon}
                      </div>
                      <span className={`font-semibold ${platforms[p.id] ? 'text-blue-800' : 'text-gray-700'}`}>{p.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${p.connected ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <span className="text-xs text-gray-500">{p.connected ? 'Connected' : 'Not Connected'}</span>
                    </div>
                    {platforms[p.id] && (
                      <div className="absolute top-3 right-3 text-blue-600">
                        <CheckCircle className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column: Preview & Actions */}
          <div className="space-y-8">
            
            {/* Section 5: Preview & Confirmation */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sticky top-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6">Preview & Confirm</h2>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center pb-3 border-b border-gray-50">
                  <span className="text-gray-500 text-sm">Total Keywords</span>
                  <span className="font-bold text-gray-800 text-lg">{keywords.length}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-gray-50">
                  <span className="text-gray-500 text-sm">Frequency</span>
                  <span className="font-medium text-gray-800 capitalize">{frequency}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-gray-50">
                  <span className="text-gray-500 text-sm">Start Date</span>
                  <span className="font-medium text-gray-800">{startDate || '-'}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-gray-50">
                  <span className="text-gray-500 text-sm">Platforms</span>
                  <div className="flex gap-1">
                    {platforms.gmb && <MapPin className="w-4 h-4 text-blue-600" />}
                    {platforms.facebook && <Facebook className="w-4 h-4 text-blue-600" />}
                    {platforms.instagram && <Instagram className="w-4 h-4 text-pink-600" />}
                    {!platforms.gmb && !platforms.facebook && !platforms.instagram && <span className="text-gray-400">-</span>}
                  </div>
                </div>
                  <div className="flex justify-between items-center pb-3 border-b border-gray-50">
                  <span className="text-gray-500 text-sm">Total Coins</span>
                  <span className="font-medium text-gray-800">{startDate || '-'}</span>
                </div>
              </div>

              <div className="bg-blue-50 p-3 rounded-lg flex gap-2 mb-6">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <p className="text-xs text-blue-800 leading-relaxed">
                  Posts will be generated and published automatically on the selected dates starting at {time}.
                </p>
              </div>

              {/* Section 6: Action Buttons */}
              <div className="space-y-3">
                <button className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]">
                  Save & Activate Schedule
                </button>
                <button className="w-full py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all">
                  Save as Draft
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Section 7: Scheduled Posts Overview */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
            <h2 className="text-xl font-bold text-gray-800">Scheduled Posts Timeline</h2>
            <div className="flex items-center gap-2">
              <ListFilter className="w-4 h-4 text-gray-500" />
              <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                <option value="All">All Status</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Posted">Posted</option>
                <option value="Failed">Failed</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-sm text-gray-500">
                  <th className="py-3 px-4 font-medium">Date & Time</th>
                  <th className="py-3 px-4 font-medium">Keyword</th>
                  <th className="py-3 px-4 font-medium">Platform</th>
                  <th className="py-3 px-4 font-medium">Status</th>
                  <th className="py-3 px-4 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {filteredPosts.map((post) => (
                  <tr key={post.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 text-gray-800">
                      <div className="font-medium">{post.date}</div>
                      <div className="text-xs text-gray-500">{post.time}</div>
                    </td>
                    <td className="py-3 px-4 text-gray-700">
                      <span className="bg-gray-100 px-2 py-1 rounded text-xs font-medium">{post.keyword}</span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{post.platform}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        post.status === 'Posted' ? 'bg-green-100 text-green-700' :
                        post.status === 'Failed' ? 'bg-red-100 text-red-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {post.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button className="text-gray-400 hover:text-red-500 transition-colors p-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredPosts.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                No posts found.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}