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

  useEffect(() => {
    fetchData();
  }, [startDate, endDate]);

  const fetchData = async () => {
    const params = new URLSearchParams();
    if (startDate) params.append('start', startDate.toISOString().split('T')[0]);
    if (endDate) params.append('end', endDate.toISOString().split('T')[0]);
    const res = await fetch(`/api/clicks?${params.toString()}`);
    const data = await res.json();
    setClicks(data);
    setFiltered(data);
  };

  const handleSearch = (text) => {
    setSearch(text);
    const lower = text.toLowerCase();
    setFiltered(clicks.filter(c =>
      c.phone?.includes(lower) || c.fbclid?.toLowerCase().includes(lower)
    ));
  };

  const handleTestClick = async () => {
    const fbclid = 'fbclid-' + Math.random().toString(36).substring(2, 10);
    const phone = '+549' + Math.floor(Math.random() * 1000000000);
    const res = await fetch('/api/track-click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fbclid, phone, timestamp: Date.now() })
    });
    const result = await res.json();
    alert(result.success ? '✅ Enviado correctamente' : '❌ Error al enviar');
    fetchData();
  };

  const headers = [
    { label: "Fecha", key: "createdAt" },
    { label: "FBCLID", key: "fbclid" },
    { label: "Teléfono", key: "phone" },
    { label: "IP", key: "ip" },
    { label: "User Agent", key: "user_agent" },
    { label: "Landing", key: "landing" }
  ];

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold mb-6 text-center text-blue-700">
          📊 Panel de Clicks desde WhatsApp
        </h1>
  
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <input
            type="text"
            placeholder="Buscar por teléfono o fbclid"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="border border-gray-300 p-2 rounded shadow-sm w-full"
          />
          <DatePicker
            selected={startDate}
            onChange={(date) => setStartDate(date)}
            placeholderText="Desde"
            className="border border-gray-300 p-2 rounded shadow-sm w-full"
          />
          <DatePicker
            selected={endDate}
            onChange={(date) => setEndDate(date)}
            placeholderText="Hasta"
            className="border border-gray-300 p-2 rounded shadow-sm w-full"
          />
        </div>
  
        <div className="flex flex-wrap gap-4 mb-6 justify-center">
          <CSVLink
            data={filtered}
            headers={headers}
            filename={`clicks-${Date.now()}.csv`}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 shadow"
          >
            Exportar CSV
          </CSVLink>
          <button
            onClick={handleTestClick}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 shadow"
          >
            🔄 Simular Clic de Prueba
          </button>
        </div>
  
        <div className="overflow-auto max-h-[500px] border rounded shadow">
          <table className="w-full text-sm">
            <thead className="bg-gray-200 sticky top-0 z-10">
              <tr>
                <th className="text-left p-2">Fecha</th>
                <th className="text-left p-2">FBCLID</th>
                <th className="text-left p-2">Teléfono</th>
                <th className="text-left p-2">IP</th>
                <th className="text-left p-2">User Agent</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr key={i} className="border-b hover:bg-gray-50">
                  <td className="p-2">{new Date(c.createdAt).toLocaleString()}</td>
                  <td className="p-2">{c.fbclid}</td>
                  <td className="p-2">{c.phone}</td>
                  <td className="p-2">{c.ip}</td>
                  <td className="p-2">{c.user_agent?.slice(0, 50)}...</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}