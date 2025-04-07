import React, { useEffect, useState } from 'react';
import DatePicker from 'react-datepicker';
import { CSVLink } from 'react-csv';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import "react-datepicker/dist/react-datepicker.css";
ChartJS.register(ArcElement, Tooltip, Legend);

export default function Home() {
  const [clicks, setClicks] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [avoidDuplicates, setAvoidDuplicates] = useState(false);
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);

  const PANEL_PASSWORD = process.env.NEXT_PUBLIC_PANEL_PASSWORD;

  useEffect(() => {
    const storedPassword = localStorage.getItem('panelPassword');
    if (storedPassword === PANEL_PASSWORD) setAuthenticated(true);
  }, []);

  useEffect(() => {
    if (authenticated) fetchData();
  }, [startDate, endDate, authenticated]);

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
    const filteredData = clicks.filter(c => c.landing?.toLowerCase().includes(lower));
    setFiltered(filteredData);
  };

  const handleAvoidDuplicates = () => {
    setAvoidDuplicates(!avoidDuplicates);
    if (!avoidDuplicates) {
      const uniqueIps = Array.from(new Map(filtered.map(item => [item.ip, item])).values());
      setFiltered(uniqueIps);
    } else {
      setFiltered(clicks);
    }
  };

  const handleLogin = () => {
    if (password === PANEL_PASSWORD) {
      localStorage.setItem('panelPassword', password);
      setAuthenticated(true);
    } else {
      alert('Contraseña incorrecta');
    }
  };

  const headers = [
    { label: "Fecha", key: "createdAt" },
    { label: "Landing", key: "landing" },
    { label: "IP", key: "ip" },
    { label: "User Agent", key: "user_agent" },
  ];

  const chartData = {
    labels: [...new Set(filtered.map(c => c.landing))],
    datasets: [{
      label: '# de clics',
      data: [...new Set(filtered.map(c => c.landing))].map(l =>
        filtered.filter(f => f.landing === l).length
      ),
      backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#6366F1'],
      borderWidth: 1,
    }]
  };

  if (!authenticated) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100 p-6">
        <div className="bg-white shadow-md p-8 rounded-lg max-w-sm w-full">
          <h2 className="text-xl font-bold mb-4 text-center text-blue-600">🔐 Ingresar al Panel</h2>
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border border-gray-300 w-full p-2 rounded mb-4"
          />
          <button
            onClick={handleLogin}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
          >
            Ingresar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto bg-white p-6 md:p-10 rounded-xl shadow-lg space-y-8">
        <h1 className="text-3xl font-bold text-center text-blue-700">📊 Panel de Clicks desde WhatsApp</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={avoidDuplicates}
              onChange={handleAvoidDuplicates}
              className="w-5 h-5"
            />
            Evitar IPs repetidas
          </label>
        </div>

        <div className="flex flex-wrap gap-4 justify-center">
          <CSVLink
            data={filtered}
            headers={headers}
            filename={`clicks-${Date.now()}.csv`}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 shadow"
          >
            Exportar CSV
          </CSVLink>
        </div>

        <div className="w-full max-w-md mx-auto">
          <Pie data={chartData} />
        </div>

        <div className="overflow-auto max-h-[500px] border border-gray-300 rounded-xl shadow-inner">
          <table className="min-w-full text-sm table-auto">
            <thead className="bg-blue-100 sticky top-0">
              <tr>
                <th className="text-left p-3 border border-gray-300">Fecha</th>
                <th className="text-left p-3 border border-gray-300">Landing</th>
                <th className="text-left p-3 border border-gray-300">IP</th>
                <th className="text-left p-3 border border-gray-300">User Agent</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr key={i} className="hover:bg-blue-50">
                  <td className="p-3 border border-gray-200">{new Date(c.createdAt).toLocaleString()}</td>
                  <td className="p-3 border border-gray-200">{c.landing}</td>
                  <td className="p-3 border border-gray-200">{c.ip}</td>
                  <td className="p-3 border border-gray-200">{c.user_agent?.slice(0, 60)}...</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}