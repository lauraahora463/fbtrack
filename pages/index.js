import React, { useEffect, useState } from 'react';
import DatePicker from 'react-datepicker';
import { CSVLink } from 'react-csv';
import Chart from 'chart.js/auto';
import { Line } from 'react-chartjs-2';
import "react-datepicker/dist/react-datepicker.css";

export default function Home() {
  const [clicks, setClicks] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [hideDuplicates, setHideDuplicates] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');

  useEffect(() => {
    if (!isLoggedIn) return;
    fetchData();
  }, [startDate, endDate, isLoggedIn]);

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
    const filteredList = clicks.filter(c =>
      c.landing?.toLowerCase().includes(lower)
    );
    setFiltered(filteredList);
  };

  const handleLogin = () => {
    if (passwordInput === process.env.NEXT_PUBLIC_PANEL_PASSWORD) {
      setIsLoggedIn(true);
      setPasswordInput('');
    } else {
      alert("Contraseña incorrecta");
    }
  };

  const uniqueByIp = (arr) => {
    const seen = new Set();
    return arr.filter(item => {
      if (seen.has(item.ip)) return false;
      seen.add(item.ip);
      return true;
    });
  };

  const displayedData = hideDuplicates ? uniqueByIp(filtered) : filtered;

  const headers = [
    { label: "Fecha", key: "createdAt" },
    { label: "Landing", key: "landing" },
    { label: "IP", key: "ip" },
    { label: "User Agent", key: "user_agent" },
  ];

  const chartData = {
    labels: clicks.map(c => new Date(c.createdAt).toLocaleDateString()),
    datasets: [{
      label: 'Clicks',
      data: clicks.map((_, i) => i + 1),
      fill: false,
      borderColor: '#3b82f6',
      tension: 0.3
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    height: 200
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
        <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-sm">
          <h2 className="text-xl font-bold mb-4 text-center text-blue-700">🔐 Acceso al Panel</h2>
          <input
            type="password"
            placeholder="Contraseña"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            className="border border-gray-300 p-2 rounded w-full mb-4"
          />
          <button
            onClick={handleLogin}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white p-2 rounded"
          >
            Ingresar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6 flex items-center justify-center">
      <div className="max-w-7xl w-full bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold mb-6 text-center text-blue-700">
          📊 Panel de Clicks desde WhatsApp
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <input
            type="text"
            placeholder="Buscar por landing"
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
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={hideDuplicates}
              onChange={(e) => setHideDuplicates(e.target.checked)}
              className="w-5 h-5"
            />
            <span className="text-sm">Evitar IPs duplicadas</span>
          </label>
        </div>

        <div className="mb-6 flex flex-wrap gap-4 justify-center">
          <CSVLink
            data={displayedData}
            headers={headers}
            filename={`clicks-${Date.now()}.csv`}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 shadow"
          >
            Exportar CSV
          </CSVLink>
        </div>

        <div className="mb-8 h-64">
          <Line data={chartData} options={chartOptions} />
        </div>

        <div className="overflow-auto border rounded shadow">
          <table className="w-full text-sm table-fixed border border-gray-300">
            <thead className="bg-blue-100 sticky top-0 z-10">
              <tr>
                <th className="p-3 border border-gray-300">Fecha & Hora</th>
                <th className="p-3 border border-gray-300">Landing</th>
                <th className="p-3 border border-gray-300">IP</th>
                <th className="p-3 border border-gray-300">User Agent</th>
              </tr>
            </thead>
            <tbody>
              {displayedData.map((c, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="p-3 border border-gray-200">{new Date(c.createdAt).toLocaleString()}</td>
                  <td className="p-3 border border-gray-200">{c.landing}</td>
                  <td className="p-3 border border-gray-200">{c.ip}</td>
                  <td className="p-3 border border-gray-200 break-all">{c.user_agent?.slice(0, 70)}...</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}