// src/components/PageDesignerManager.tsx
import React, { useState } from "react";

const PageDesignerManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState("Designer");

  const layouts = [
    "Site Header",
    "Site Footer",
    "Static Page",
    "Website Homepage",
    "Epaper Archive",
    "Epaper Display",
    "Epaper Map",
    "Epaper Clip",
  ];

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-semibold text-gray-800 mb-4">
          Page Designer Manager
        </h1>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-4">
          <button
            onClick={() => setActiveTab("Designer")}
            className={`px-4 py-2 font-medium ${
              activeTab === "Designer"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-600 hover:text-blue-500"
            }`}
          >
            Designer
          </button>
          <button
            onClick={() => setActiveTab("Layout Backups")}
            className={`px-4 py-2 font-medium ${
              activeTab === "Layout Backups"
                ? "border-b-2 border-blue-500 text-blue-600"
                : "text-gray-600 hover:text-blue-500"
            }`}
          >
            Layout Backups
          </button>
        </div>

        {/* Control Buttons */}
        {activeTab === "Designer" && (
          <>
            <div className="flex flex-wrap gap-3 mb-6">
              <button className="bg-gray-500 text-white px-4 py-2 rounded shadow hover:bg-gray-600 transition">
                Preview Mode Off
              </button>
              <button className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition">
                💾 Backup Current Layout Online
              </button>
              <button className="bg-emerald-600 text-white px-4 py-2 rounded shadow hover:bg-emerald-700 transition">
                ⬇️ Download Offline Backup
              </button>
              <button className="bg-teal-600 text-white px-4 py-2 rounded shadow hover:bg-teal-700 transition">
                ⬆️ Upload Offline Backup
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Layouts
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {layouts.map((layout, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-green-600 font-semibold">
                        Published!
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-blue-700 hover:underline cursor-pointer">
                        {layout}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Layout Backups Tab */}
        {activeTab === "Layout Backups" && (
          <div className="text-gray-600 p-6 bg-gray-50 rounded-lg">
            <p>No backups available yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PageDesignerManager;
