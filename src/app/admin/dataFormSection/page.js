"use client";

import { useEffect, useState } from "react";

export default function Page() {
  const [sheet, setSheet] = useState("Sheet1");
  const [data, setData] = useState([]);

  const [selectedRows, setSelectedRows] = useState([]);

  useEffect(() => {
    fetch(`/api/admin/sheets?sheet=${sheet}`)
      .then((res) => res.json())
      .then((result) => {
        setData(result.data || []);
      });
  }, [sheet]);

  const toggleRow = (index) => {
    setSelectedRows((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index],
    );
  };

  const toggleAll = () => {
    if (selectedRows.length === data.slice(1).length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(data.slice(1).map((_, i) => i));
    }
  };

  return (
    <>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Google Sheet Data</h1>

        <div className="flex gap-4 mb-4">
          <button
            onClick={() => setSheet("Sheet1")}
            className={`px-4 py-2 rounded ${
              sheet === "Sheet1" ? "bg-blue-600 text-white" : "bg-gray-200"
            }`}
          >
            Sheet1
          </button>

          <button
            onClick={() => setSheet("Sheet2")}
            className={`px-4 py-2 rounded ${
              sheet === "Sheet2" ? "bg-blue-600 text-white" : "bg-gray-200"
            }`}
          >
            Sheet2
          </button>
        </div>

         {selectedRows.length > 0 && (
        <div
          className="
    mb-5
    flex
    items-center
    justify-between
    rounded-2xl
    bg-green-600
    px-6
    py-4
    shadow-lg
  "
        >
          <div className="flex items-center gap-4">
            <div
              className="
        flex
        h-12
        w-12
        items-center
        justify-center
        rounded-full
        bg-green-500
        text-white
        text-xl
      "
            >
              💬
            </div>

            <div>
              <p className="text-sm text-green-100">Selected leads</p>

              <h2 className="text-3xl font-bold text-white">
                {selectedRows.length}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              className="
        rounded-2xl
        bg-white
        px-6
        py-3
        font-semibold
        text-green-600
        shadow
        hover:scale-105
        transition
      "
            >
              WhatsApp
            </button>

            <button
              className="
        rounded-2xl
        bg-white
        px-6
        py-3
        font-semibold
        text-blue-600
        shadow
        hover:scale-105
        transition
      "
            >
              RCS
            </button>

            <button
              className="       rounded-2xl       bg-white px-6  py-3  font-semibold  text-purple-600
        shadow
        hover:scale-105
        transition
      "
            >
              Email
            </button>

            <button
              className="
        rounded-2xl
        bg-white
        px-6
        py-3
        font-semibold
        text-orange-600
        shadow
        hover:scale-105
        transition
      "
            >
              SMS
            </button>
          </div>
        </div>
      )}

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {/* TABLE SCROLL */}
          <div className="overflow-auto max-h-[80vh]">
            <table className="min-w-full border-separate border-spacing-0">
              {/* HEADER */}
              <thead className="sticky top-0 z-20 bg-[#f8fafc] border-b border-gray-200">
                <tr>

                    <th className="px-6 py-4 border-b border-gray-200">
  <input
    type="checkbox"
    checked={
      selectedRows.length === data.slice(1).length &&
      data.length > 1
    }
    onChange={toggleAll}
    className="h-4 w-4 cursor-pointer"
  />
</th>
                  {data[0]?.map((header, index) => (
                    <th
                      key={index}
                      className="
                px-6 py-4
                text-left
                text-xs
                font-semibold
                uppercase
                tracking-wider
                text-gray-500
                whitespace-nowrap
                border-b
                border-gray-200
              "
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>

              {/* BODY */}
              <tbody className="bg-white">
                {data.slice(1).map((row, rowIndex) => (
                  <tr
                    key={rowIndex}
                    className="
    group
    transition-all
    duration-200
    hover:bg-gray-50
    border-b
    border-gray-200
    shadow-[0_1px_0_0_#e5e7eb]
  "
                  >

                    <td className="px-6 py-5 border-b border-gray-200">

  <input
    type="checkbox"
    checked={selectedRows.includes(rowIndex)}
    onChange={() => toggleRow(rowIndex)}
    className="
      h-4
      w-4
      cursor-pointer
      rounded
      border-gray-300
      text-blue-600
      focus:ring-blue-500
    "
  />

</td>
                    {row.map((cell, cellIndex) => (
                      <td
                        key={cellIndex}
                        className="
                  px-6 py-5
                  border-b
                  border-gray-200
                  align-top
                "
                      >
                        {/* ADDRESS */}
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
                            className={`

                      ${
                        cellIndex === 2 || cellIndex === 4 || cellIndex === 5
                          ? "whitespace-nowrap"
                          : "break-words max-w-[260px]"
                      }

                    `}
                          >
                            {/* WEBSITE */}
                            {cellIndex === 3 && cell ? (
                              <a
                                href={cell}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="
                          inline-flex
                          items-center
                          rounded-full
                          bg-blue-50
                          px-3 py-1
                          text-xs
                          font-medium
                          text-blue-700
                          hover:bg-blue-100
                          transition
                        "
                              >
                                Visit
                              </a>
                            ) : cellIndex === 4 ? (
                              <span
                                className="
                        inline-flex
                        rounded-full
                        bg-green-50
                        px-3 py-1
                        text-xs
                        font-semibold
                        text-green-700
                      "
                              >
                                ⭐ {cell}
                              </span>
                            ) : cellIndex === 5 ? (
                              <span
                                className="
                        inline-flex
                        rounded-full
                        bg-purple-50
                        px-3 py-1
                        text-xs
                        font-semibold
                        text-purple-700
                      "
                              >
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
      </div>

     
    </>
  );
}
