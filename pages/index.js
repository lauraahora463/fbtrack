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
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">📊 Clicks desde WhatsApp</h1>
      <div className="flex flex-wrap gap-4 mb-4 items-center">
        <input
          type="text"
          placeholder="Buscar por teléfono o fbclid"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="border p-2 rounded w-full md:w-72"
        />
        <DatePicker
          selected={startDate}
          onChange={(date) => setStartDate(date)}
          placeholderText="Desde"
          className="border p-2 rounded"
        />
        <DatePicker
          selected={endDate}
          onChange={(date) => setEndDate(date)}
          placeholderText="Hasta"
          className="border p-2 rounded"
        />
        <CSVLink
          data={filtered}
          headers={headers}
          filename={`clicks-${Date.now()}.csv`}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Exportar CSV
        </CSVLink>
      </div>

      <div className="overflow-auto max-h-[500px] border rounded">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 sticky top-0">
            <tr>
              <th className="text-left p-2">Fecha</th>
              <th className="text-left p-2">FBCLID</th>
              <th className="text-left p-2">Teléfono</th>
              <th className="text-left p-2">IP</th>
              <th className="text-left p-2">User Agent</th>
              <th className="text-left p-2">Landing</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c, i) => (
              <tr key={i} className="border-b">
                <td className="p-2">{new Date(c.createdAt).toLocaleString()}</td>
                <td className="p-2">{c.fbclid}</td>
                <td className="p-2">{c.phone}</td>
                <td className="p-2">{c.ip}</td>
                <td className="p-2">{c.user_agent?.slice(0, 50)}...</td>
                <td className="p-2">{c.landing || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}