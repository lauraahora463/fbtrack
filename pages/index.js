import React, { useEffect, useState } from 'react';
import DatePicker from 'react-datepicker';
import { CSVLink } from 'react-csv';
import "react-datepicker/dist/react-datepicker.css";

export default function Home() {
  const [clicks, setClicks] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [removeDuplicates, setRemoveDuplicates] = useState(false);

  useEffect(() => {
    fetchData();
  }, [startDate, endDate]);

  useEffect(() => {
    applyFilters();
  }, [search, clicks, removeDuplicates]);

  const fetchData = async () => {
    const params = new URLSearchParams();
    if (startDate) params.append('start', startDate.toISOString().split('T')[0]);
    if (endDate) params.append('end', endDate.toISOString().split('T')[0]);
    const res = await fetch(`/api/clicks?${params.toString()}`);
    const data = await res.json();
    setClicks(data);
  };

  const applyFilters = () => {
    let result = [...clicks];

    if (search) {
      const lower = search.toLowerCase();
      result = result.filter(c => c.landing?.toLowerCase().includes(lower));
    }

    if (removeDuplicates) {
      const unique = new Map();
      result.forEach(item => {
        if (!unique.has(item.ip)) {
          unique.set(item.ip, item);
        }
      });
      result = Array.from(unique.values());
    }

    setFiltered(result);
  };

  const headers = [
    { label: "Fecha", key: "createdAt" },
    { label: "Landing", key: "landing" },
    { label: "IP", key: "ip" },
    { label: "User Agent", key: "user_agent" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-blue-100 p-6">
      <div className="max-w-6xl mx-auto bg-white p-8 rounded-2xl shadow-2xl">
        <h1 className="text-4xl font-extrabold mb-6 text-center text-blue-800">
          📊 Reporte de Clics desde WhatsApp
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <input
            type="text"
            placeholder="🔍 Buscar por landing"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-300 p-3 rounded-lg shadow-sm w-full focus:outline-blue-500"
          />
          <DatePicker
            selected={startDate}
            onChange={(date) => setStartDate(date)}
            placeholderText="📅 Desde"
            className="border border-gray-300 p-3 rounded-lg shadow-sm w-full"
          />
          <DatePicker
            selected={endDate}
            onChange={(date) => setEndDate(date)}
            placeholderText="📅 Hasta"
            className="border border-gray-300 p-3 rounded-lg shadow-sm w-full"
          />
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={removeDuplicates}
              onChange={() => setRemoveDuplicates(!removeDuplicates)}
              className="h-5 w-5 text-blue-600"
            />
            <label className="text-sm text-gray-700">Evitar IPs repetidas</label>
          </div>
        </div>

        <div className="flex justify-center mb-6">
          <CSVLink
            data={filtered}
            headers={headers}
            filename={`clicks-${Date.now()}.csv`}
            className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 shadow-md transition"
          >
            📥 Exportar CSV
          </CSVLink>
        </div>

        <div className="overflow-auto max-h-[500px] border rounded-lg shadow">
          <table className="w-full text-sm text-left">
            <thead className="bg-blue-100 sticky top-0 z-10">
              <tr>
                <th className="p-3 font-semibold text-blue-800">📅 Fecha</th>
                <th className="p-3 font-semibold text-blue-800">🌐 Landing</th>
                <th className="p-3 font-semibold text-blue-800">📍 IP</th>
                <th className="p-3 font-semibold text-blue-800">🖥️ User Agent</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr key={i} className="border-b hover:bg-blue-50">
                  <td className="p-3">{new Date(c.createdAt).toLocaleString()}</td>
                  <td className="p-3">{c.landing}</td>
                  <td className="p-3">{c.ip}</td>
                  <td className="p-3">{c.user_agent?.slice(0, 50)}...</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="4" className="p-3 text-center text-gray-500">No hay resultados.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}