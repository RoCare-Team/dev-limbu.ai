"use client";

import { useEffect, useState } from "react";

import Lottie from "lottie-react";
import animationData from "../../../../src/assets/animation/Loading.json";

import WhatsappModal from "../../../app/admin/user-management/components/WhatsAppTemplateModel";

export default function Page() {
  const [sheet, setSheet] = useState("Sheet1");
  const [data, setData] = useState([]);

  const [loading, setLoading] = useState(true);

  const [sheets, setSheets] = useState([]);

  const [selectedRows, setSelectedRows] = useState([]);

  // PAGINATION
  const [currentPage, setCurrentPage] = useState(1);

  const [openWhatsappModal, setOpenWhatsappModal] = useState(false);

  const usersPerPage = 20;

  const startIndex = (currentPage - 1) * usersPerPage;
  const endIndex = startIndex + usersPerPage;

  const paginatedData = data.slice(1).slice(startIndex, endIndex);

  const totalPages = Math.ceil(data.slice(1).length / usersPerPage);

  useEffect(() => {
  fetch("/api/admin/sheets-list")
    .then((res) => res.json())
    .then((result) => {

      const sortedSheets = (result.sheets || []).sort(
        (a, b) => {

          const numA =
            parseInt(a.replace(/\D/g, "")) || 0;

          const numB =
            parseInt(b.replace(/\D/g, "")) || 0;

          return numA - numB;
        }
      );

      setSheets(sortedSheets);

      if (sortedSheets.length > 0) {
        setSheet(sortedSheets[0]);
      }
    });
}, []);

  useEffect(() => {
    setLoading(true);

    fetch(`/api/admin/sheets?sheet=${sheet}`)
      .then((res) => res.json())
      .then((result) => {
        setData(result.data || []);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [sheet]);

 const toggleRow = (rowIndex) => {
  setSelectedRows((prev) =>
    prev.includes(rowIndex)
      ? prev.filter((i) => i !== rowIndex)
      : [...prev, rowIndex]
  );
};

  const toggleAll = () => {
  if (selectedRows.length === paginatedData.length) {
    setSelectedRows([]);
  } else {
    setSelectedRows(paginatedData.map((_, i) => i));
  }
};

const selectedUsers = paginatedData.filter((_, index) =>
  selectedRows.includes(index)
);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="text-center">
          <div className="w-40 h-40 mx-auto flex items-center justify-center">
            <Lottie
              animationData={animationData}
              loop={true}
              className="w-full h-full"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Google Sheet Data</h1>

        {/* SHEETS */}
        <div className="flex gap-4 mb-4 flex-wrap">
          {sheets.map((sheetName) => (
            <button
              key={sheetName}
              onClick={() => {
                setSheet(sheetName);
                setCurrentPage(1);
              }}
              className={`px-4 py-2 rounded ${
                sheet === sheetName ? "bg-blue-600 text-white" : "bg-gray-200"
              }`}
            >
              {sheetName}
            </button>
          ))}
        </div>

        {/* SELECTED BAR */}
        {selectedRows.length > 0 && (
          <div className="mb-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 rounded-2xl bg-green-600 px-6 py-4 shadow-lg">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500 text-white text-xl">
                💬
              </div>

              <div>
                <p className="text-sm text-green-100">Selected leads</p>

                <h2 className="text-3xl font-bold text-white">
                  {selectedRows.length}
                </h2>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
            <button
  onClick={() => setOpenWhatsappModal(true)}
  className="rounded-2xl bg-white px-6 py-3 font-semibold text-green-600 shadow hover:scale-105 transition"
>
  WhatsApp
</button>

              <button className="rounded-2xl bg-white px-6 py-3 font-semibold text-blue-600 shadow hover:scale-105 transition">
                RCS
              </button>

              <button className="rounded-2xl bg-white px-6 py-3 font-semibold text-purple-600 shadow hover:scale-105 transition">
                Email
              </button>

              <button className="rounded-2xl bg-white px-6 py-3 font-semibold text-orange-600 shadow hover:scale-105 transition">
                SMS
              </button>
            </div>
          </div>
        )}

        {/* TABLE */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-auto max-h-[80vh]">
            <table className="min-w-full border-separate border-spacing-0">
              {/* HEADER */}
              <thead className="sticky top-0 z-20 bg-[#f8fafc] border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 border-b border-gray-200">
                    <input
                      type="checkbox"
                      checked={
                        selectedRows.length === paginatedData.length &&
                        paginatedData.length > 0
                      }
                      onChange={toggleAll}
                      className="h-4 w-4 cursor-pointer"
                    />
                  </th>

                  {data[0]?.map((header, index) => (
                    <th
                      key={index}
                      className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 whitespace-nowrap border-b border-gray-200"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>

              {/* BODY */}
              <tbody className="bg-white">
                {paginatedData.map((row, rowIndex) => (
                  <tr
                    key={rowIndex}
                    className="group transition-all duration-200 hover:bg-gray-50 border-b border-gray-200 shadow-[0_1px_0_0_#e5e7eb]"
                  >
                    <td className="px-6 py-5 border-b border-gray-200">
                      <input
                        type="checkbox"
                        checked={selectedRows.includes(rowIndex)}
onChange={() => toggleRow(rowIndex)}
                        className="h-4 w-4 cursor-pointer rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>

                    {row.map((cell, cellIndex) => (
                      <td
                        key={cellIndex}
                        className="px-6 py-5 border-b border-gray-200 align-top"
                      >
                        {cellIndex === 1 ? (
                          <details className="max-w-[240px] group/details">
                            <summary className="list-none cursor-pointer">
                              <div className="text-gray-700 text-sm leading-6 line-clamp-2">
                                {cell}
                              </div>

                              <span className="mt-1 inline-block text-xs font-medium text-blue-600 hover:underline">
                                See more
                              </span>
                            </summary>

                            <div className="mt-3 rounded-xl bg-gray-50 p-3 text-sm text-gray-600 leading-6 border border-gray-200">
                              {cell}
                            </div>
                          </details>
                        ) : (
                          <div
                            className={`${
                              cellIndex === 2 ||
                              cellIndex === 4 ||
                              cellIndex === 5
                                ? "whitespace-nowrap"
                                : "break-words max-w-[260px]"
                            }`}
                          >
                            {cellIndex === 3 && cell ? (
                              <a
                                href={cell}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 transition"
                              >
                                Visit
                              </a>
                            ) : cellIndex === 4 ? (
                              <span className="inline-flex rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                                ⭐ {cell}
                              </span>
                            ) : cellIndex === 5 ? (
                              <span className="inline-flex rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700">
                                {cell} Reviews
                              </span>
                            ) : (
                              <span className="text-sm text-gray-700 leading-6">
                                {cellIndex === 2 && cell
                                  ? `+91 ${cell.replace(/^0+/, "")}`
                                  : cell}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* PAGINATION */}
        <div className="flex items-center justify-center gap-3 p-5 border-t border-gray-200 bg-white">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="rounded-xl bg-gray-100 px-4 py-2 text-sm font-semibold disabled:opacity-50"
          >
            Previous
          </button>

          <div className="text-sm font-semibold text-gray-700">
            Page {currentPage} of {totalPages}
          </div>

          <button
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages}
            className="rounded-xl bg-blue-600 text-white px-4 py-2 text-sm font-semibold disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

    
            <WhatsappModal
  isOpen={openWhatsappModal}
  setIsOpen={setOpenWhatsappModal}
  selectedCount={selectedRows.length}
  onSendTemplate={async (template) => {

  const numbers = selectedUsers.map((row) =>
    `91${String(row[2]).replace(/\D/g, "")}`
  );

  try {

    const response = await fetch("/api/admin/user-management-template-whatsapp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
body: JSON.stringify({
  adminEmail: "info@limbu.ai",

  templateId: template.id,

  users: selectedUsers.map((row) => ({
    name: row[0],
    phone: row[2],
  })),
}),
    });

    const result = await response.json();

    console.log(result);

    alert("WhatsApp Template Sent");

  } catch (error) {

    console.log(error);

    alert("Failed To Send Template");
  }
}}

/>
    </>
  );
}
