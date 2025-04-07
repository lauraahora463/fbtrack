import React, { useEffect, useState } from 'react';
import DatePicker from 'react-datepicker';
import { CSVLink } from 'react-csv';
import { Line } from 'react-chartjs-2';
import "react-datepicker/dist/react-datepicker.css";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function Home() {
  const [clicks, setClicks] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [uniqueIPs, setUniqueIPs] = useState(false);

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
    const result = clicks.filter(c => c.landing?.toLowerCase().includes(lower));
    setFiltered(uniqueIPs ? removeDuplicateIPs(result) : result);
  };

  const removeDuplicateIPs = (arr) => {
    const seen = new Set();
    return arr.filter((item) => {
      if (seen.has(item.ip)) return false;
      seen.add(item.ip);
      return true;
    });
  };

  useEffect(() => {
    const result = clicks.filter(c => c.landing?.toLowerCase().includes(search.toLowerCase()));
    setFiltered(uniqueIPs ? removeDuplicateIPs(result) : result);
  }, [uniqueIPs]);

  const headers = [
    { label: "Fecha", key: "createdAt" },
    { label: "Landing", key: "landing" },
    { label: "IP", key: "ip" },
    { label: "User Agent", key: "user_agent" },
  ];

  // Datos para el gráfico
  const graphData = (() => {
    const counts = {};
    filtered.forEach(c => {
      const date = new Date(c.createdAt).toLocaleDateString();
      counts[date] = (counts[date] || 0) + 1;
    });
    const labels = Object.keys(counts);
    return {
      labels,
      datasets: [{
        label: 'Clicks por día',
        data: Object.values(counts),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        tension: 0.3
      }]
    };
  })();

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto bg-white p-6 sm:p-10 rounded-xl shadow-xl space-y-8">
        <h1 className="text-3xl font-bold text-center text-blue-700">📊 Panel de Clicks desde WhatsApp</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Buscar por landing"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="border border-gray-300 p-3 rounded-lg shadow-sm w-full"
          />
          <DatePicker
            selected={startDate}
            onChange={(date) => setStartDate(date)}
            placeholderText="Desde"
            className="border border-gray-300 p-3 rounded-lg shadow-sm w-full"
          />
          <DatePicker
            selected={endDate}
            onChange={(date) => setEndDate(date)}
            placeholderText="Hasta"
            className="border border-gray-300 p-3 rounded-lg shadow-sm w-full"
          />
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={uniqueIPs}
              onChange={() => setUniqueIPs(!uniqueIPs)}
              className="w-5 h-5"
            />
            Evitar IPs repetidas
          </label>
        </div>

        <div className="flex justify-between items-center flex-wrap gap-4">
          <CSVLink
            data={filtered}
            headers={headers}
            filename={`clicks-${Date.now()}.csv`}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 shadow"
          >
            Exportar CSV
          </CSVLink>
        </div>

        <div className="bg-white rounded-xl overflow-hidden shadow">
          <Line data={graphData} options={{ responsive: true, plugins: { legend: { display: true } } }} />
        </div>

        <div className="overflow-auto max-h-[500px] border rounded-lg shadow">
          <table className="w-full text-sm table-auto">
            <thead className="bg-blue-100 sticky top-0 z-10">
              <tr>
                <th className="text-left p-3">Fecha</th>
                <th className="text-left p-3">Landing</th>
                <th className="text-left p-3">IP</th>
                <th className="text-left p-3">User Agent</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr key={i} className="border-b hover:bg-gray-50">
                  <td className="p-3">{new Date(c.createdAt).toLocaleString()}</td>
                  <td className="p-3">{c.landing}</td>
                  <td className="p-3">{c.ip}</td>
                  <td className="p-3">{c.user_agent?.slice(0, 50)}...</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}