// app/page.tsx (Next.js 13+ con App Router) o pages/index.js (Next.js 12)
'use client';
import React, { useEffect, useState } from 'react';
import DatePicker from 'react-datepicker';
import { CSVLink } from 'react-csv';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Title, Tooltip, Legend,
} from 'chart.js';
import 'react-datepicker/dist/react-datepicker.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function Home() {
  const [auth, setAuth] = useState(false);
  const [password, setPassword] = useState('');
  const [clicks, setClicks] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [hideDuplicates, setHideDuplicates] = useState(false);

  const storedPassword = process.env.NEXT_PUBLIC_PANEL_PASSWORD;

  useEffect(() => {
    if (auth) fetchData();
  }, [startDate, endDate]);

  useEffect(() => {
    filterData();
  }, [search, clicks, hideDuplicates]);

  const fetchData = async () => {
    const params = new URLSearchParams();
    if (startDate) params.append('start', startDate.toISOString().split('T')[0]);
    if (endDate) params.append('end', endDate.toISOString().split('T')[0]);
    const res = await fetch(`/api/clicks?${params.toString()}`);
    const data = await res.json();
    setClicks(data);
    setFiltered(data);
  };

  const filterData = () => {
    const lower = search.toLowerCase();
    let filteredData = clicks.filter(c => c.landing?.toLowerCase().includes(lower));
    if (hideDuplicates) {
      const seenIps = new Set();
      filteredData = filteredData.filter(c => {
        if (seenIps.has(c.ip)) return false;
        seenIps.add(c.ip);
        return true;
      });
    }
    setFiltered(filteredData);
  };

  const headers = [
    { label: "Fecha", key: "createdAt" },
    { label: "Landing", key: "landing" },
    { label: "IP", key: "ip" },
    { label: "User Agent", key: "user_agent" }
  ];

  const groupedData = filtered.reduce((acc, curr) => {
    const date = new Date(curr.createdAt).toLocaleDateString();
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});

  const chartData = {
    labels: Object.keys(groupedData),
    datasets: [{
      label: 'Clicks por día',
      data: Object.values(groupedData),
      fill: false,
      backgroundColor: 'rgba(59, 130, 246, 0.6)',
      borderColor: 'rgba(59, 130, 246, 1)',
      tension: 0.3
    }]
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === storedPassword) setAuth(true);
    else alert('Contraseña incorrecta');
  };

  if (!auth) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <form onSubmit={handleLogin} className="bg-white p-8 rounded shadow-lg w-full max-w-sm">
          <h2 className="text-xl font-semibold mb-4 text-center">🔐 Iniciar sesión</h2>
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded mb-4"
          />
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
            Entrar
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl bg-white p-6 rounded-lg shadow-xl">
        <h1 className="text-3xl font-bold text-center text-blue-700 mb-6">📊 Panel de Clicks desde WhatsApp</h1>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <input
            type="text"
            placeholder="Buscar por landing"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-gray-300 p-2 rounded w-full md:w-1/3"
          />
          <DatePicker
            selected={startDate}
            onChange={(date) => setStartDate(date)}
            placeholderText="Desde"
            className="border border-gray-300 p-2 rounded w-full md:w-1/3"
          />
          <DatePicker
            selected={endDate}
            onChange={(date) => setEndDate(date)}
            placeholderText="Hasta"
            className="border border-gray-300 p-2 rounded w-full md:w-1/3"
          />
        </div>

        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={hideDuplicates}
              onChange={() => setHideDuplicates(!hideDuplicates)}
            />
            Evitar IPs duplicadas
          </label>

          <CSVLink
            data={filtered}
            headers={headers}
            filename={`clicks-${Date.now()}.csv`}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Exportar CSV
          </CSVLink>
        </div>

        <div className="mb-8">
          <Line data={chartData} options={{ responsive: true, maintainAspectRatio: false }} height={200} />
        </div>

        <div className="overflow-auto max-h-[400px] border border-gray-300 rounded-lg shadow">
          <table className="min-w-full text-sm bg-white">
            <thead className="bg-blue-100 sticky top-0 z-10">
              <tr>
                <th className="text-left p-3 border-r border-gray-300">Fecha</th>
                <th className="text-left p-3 border-r border-gray-300">Landing</th>
                <th className="text-left p-3 border-r border-gray-300">IP</th>
                <th className="text-left p-3">User Agent</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr key={i} className="border-t border-gray-200 hover:bg-gray-50">
                  <td className="p-3 border-r border-gray-100">{new Date(c.createdAt).toLocaleString()}</td>
                  <td className="p-3 border-r border-gray-100">{c.landing}</td>
                  <td className="p-3 border-r border-gray-100">{c.ip}</td>
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