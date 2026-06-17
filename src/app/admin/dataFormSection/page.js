"use client";

import { useEffect, useState, useCallback } from "react";
import Lottie from "lottie-react";
import animationData from "../../../../src/assets/animation/Loading.json";
import WhatsappModal from "../../../app/admin/user-management/components/WhatsAppTemplateModel";
import ScraperModal from "./ScraperModal"; 

export default function Page() {
  const [sheet, setSheet] = useState("Sheet1");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sheets, setSheets] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]); 
  const [currentPage, setCurrentPage] = useState(1);
  const [openWhatsappModal, setOpenWhatsappModal] = useState(false);
  const [isScraperOpen, setIsScraperOpen] = useState(false);
  const [sendingTemplateId, setSendingTemplateId] = useState("");

  const usersPerPage = 20;

  const fetchSheetData = useCallback(() => {
    setLoading(true);
    fetch(`/api/admin/sheets?sheet=${sheet}`)
      .then((res) => res.json())
      .then((result) => {
        const uniqueData = [];
        const seen = new Set();
        (result.data || []).forEach((row, index) => {
          if (index === 0) { uniqueData.push(row); return; } 
          const businessName = String(row[0] || "").trim().toLowerCase();
          // Deduplication ke liye clean phone use kar rahe hain
          const cleanPhone = String(row[2] || "").replace(/\D/g, "").replace(/^91/, "");
          if (!cleanPhone) { uniqueData.push(row); return; }
          const key = `${businessName}-${cleanPhone}`;
          if (!seen.has(key)) {
            seen.add(key);
            uniqueData.push(row);
          }
        });
        setData(uniqueData);
      })
      .finally(() => setLoading(false));
  }, [sheet]);

  useEffect(() => {
    fetch("/api/admin/sheets-list")
      .then((res) => res.json())
      .then((result) => {
        const sortedSheets = (result.sheets || []).sort((a, b) => {
          const numA = parseInt(a.replace(/\D/g, "")) || 0;
          const numB = parseInt(b.replace(/\D/g, "")) || 0;
          return numA - numB;
        });
        setSheets(sortedSheets);
        if (sortedSheets.length > 0) setSheet(sortedSheets[0]);
      });
  }, []);

  useEffect(() => {
    fetchSheetData();
  }, [fetchSheetData]);

  const filteredRows = data.slice(1).filter((row) =>
    row.some((cell) => String(cell || "").toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  const startIndex = (currentPage - 1) * usersPerPage;
  const paginatedData = filteredRows.slice(startIndex, startIndex + usersPerPage);
  const totalPages = Math.ceil(filteredRows.length / usersPerPage);

  const toggleRow = (index) => {
    setSelectedRows((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const toggleAll = () => {
    if (selectedRows.length === filteredRows.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(filteredRows.map((_, i) => i));
    }
  };

  // ✅ UPDATED: Payload exactly as requested
  const handleSendTemplate = async (template) => {
    try {
      setSendingTemplateId(template.id);
      const adminEmail = localStorage.getItem("email");

      const selectedUsersPayload = filteredRows
        .filter((_, idx) => selectedRows.includes(idx))
        .map((row) => ({
          name: row[0] || "User",      // Business Name
          phone: String(row[2] || ""), // Exact string like "093190 80715"
        }));

      if (selectedUsersPayload.length === 0) {
        alert("Please select leads first.");
        return;
      }

      console.log("Sending Payload:", selectedUsersPayload); // Debugging ke liye

      const response = await fetch("/api/admin/user-management-template-whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminEmail,
          users: selectedUsersPayload,
          templateId: template.id,
        }),
      });

      const result = await response.json();
      if (result.success) {
        alert("WhatsApp Template Sent Successfully!");
        setOpenWhatsappModal(false);
        setSelectedRows([]);
      } else {
        alert(result.message || "Failed to send template");
      }
    } catch (error) {
      console.error(error);
      alert("Error occurred while sending.");
    } finally {
      setSendingTemplateId("");
    }
  };

  if (loading && data.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Lottie animationData={animationData} loop={true} className="w-40 h-40" />
      </div>
    );
  }

  return (
    <>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Google Sheet Data</h1>
          <button 
            onClick={() => setIsScraperOpen(true)}
            className="bg-black text-white px-5 py-2.5 rounded-xl font-medium hover:bg-gray-800 transition flex items-center gap-2"
          >
            <span>➕</span> Scrape New Data
          </button>
        </div>

        <div className="mb-4 flex flex-col md:flex-row gap-4 justify-between items-end">
            <div className="flex gap-4 overflow-x-auto pb-2 w-full md:w-auto">
                {sheets.map((sheetName) => (
                    <button
                        key={sheetName}
                        onClick={() => { setSheet(sheetName); setCurrentPage(1); setSelectedRows([]); }}
                        className={`px-4 py-2 rounded-lg whitespace-nowrap transition ${sheet === sheetName ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
                    >
                        {sheetName}
                    </button>
                ))}
            </div>

            <div className="flex gap-2 w-full max-w-md">
                <input
                    type="text"
                    placeholder="Search business, phone..."
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    className="flex-1 rounded-xl border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                />
            </div>
        </div>

        {selectedRows.length > 0 && (
          <div className="mb-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 rounded-2xl bg-green-600 px-6 py-4 shadow-lg text-white">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500 text-white text-xl">💬</div>
              <div>
                <p className="text-sm text-green-100">Selected leads</p>
                <h2 className="text-3xl font-bold">{selectedRows.length}</h2>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <button onClick={() => setOpenWhatsappModal(true)} className="rounded-2xl bg-white px-6 py-3 font-semibold text-green-600 shadow hover:scale-105 transition">WhatsApp</button>
              <button className="rounded-2xl bg-white px-6 py-3 font-semibold text-blue-600 shadow hover:scale-105 transition">RCS</button>
              <button className="rounded-2xl bg-white px-6 py-3 font-semibold text-purple-600 shadow hover:scale-105 transition">Email</button>
              <button className="rounded-2xl bg-white px-6 py-3 font-semibold text-orange-600 shadow hover:scale-105 transition">SMS</button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-auto max-h-[70vh]">
            <table className="min-w-full border-separate border-spacing-0">
              <thead className="sticky top-0 bg-gray-50 z-10">
                <tr>
                  <th className="p-4 border-b text-center">
                    <input 
                      type="checkbox" 
                      onChange={toggleAll} 
                      checked={selectedRows.length === filteredRows.length && filteredRows.length > 0} 
                    />
                  </th>
                  {data[0]?.map((h, i) => (
                    <th key={i} className="p-4 text-left text-xs font-bold uppercase text-gray-500 border-b">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((row, rowIndex) => {
                  const actualIndex = startIndex + rowIndex;
                  return (
                    <tr key={rowIndex} className={`hover:bg-gray-50 border-b transition ${selectedRows.includes(actualIndex) ? 'bg-blue-50' : ''}`}>
                      <td className="p-4 border-b text-center">
                        <input 
                          type="checkbox" 
                          checked={selectedRows.includes(actualIndex)} 
                          onChange={() => toggleRow(actualIndex)} 
                        />
                      </td>
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex} className="p-4 text-sm border-b truncate max-w-[200px]">
                           {cell} 
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-4 flex justify-center items-center gap-4">
           <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="px-4 py-2 bg-gray-100 rounded-lg disabled:opacity-50">Prev</button>
           <span className="text-sm font-medium">Page {currentPage} of {totalPages}</span>
           <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50">Next</button>
        </div>
      </div>

      <WhatsappModal 
        isOpen={openWhatsappModal} 
        setIsOpen={setOpenWhatsappModal} 
        selectedCount={selectedRows.length}
        sendingTemplateId={sendingTemplateId}
        onSendTemplate={handleSendTemplate}
      />

      <ScraperModal 
        isOpen={isScraperOpen} 
        onClose={() => setIsScraperOpen(false)} 
        sheets={sheets}
        currentSheet={sheet}
        onScrapeComplete={() => fetchSheetData()}
      />
    </>
  );
}