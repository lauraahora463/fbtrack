import React, { useEffect, useState } from 'react';
import DatePicker from 'react-datepicker';
import styles from '../login.module.css'
import { CSVLink } from 'react-csv';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
} from 'chart.js';
import "react-datepicker/dist/react-datepicker.css";

ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend
);

export default function Home() {
  const [clicks, setClicks] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [hideDuplicates, setHideDuplicates] = useState(false);
  const [excludeNoFbclid, setExcludeNoFbclid] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [usernameInput, setUsernameInput] = useState('');

  const dominios = ["ahora463.io", "ahora4633.io"];

  const [dominiosActivos, setDominiosActivos] = useState(() => {
    const initial = {};
    dominios.forEach(d => { initial[d] = true });
    return initial;
  });

  useEffect(() => {
    if (!isLoggedIn) return;
    fetchData();
  }, [startDate, endDate, isLoggedIn]);

  const adjustToArgentinaTimezone = (date) => {
    const argentinaOffset = -3 * 60; // GMT-3 en minutos
    const newDate = new Date(date);
    newDate.setMinutes(newDate.getMinutes() + argentinaOffset); // Ajusta a la zona horaria de Argentina
    return newDate;
  };

  const fetchData = async () => {
    const params = new URLSearchParams();
    if (startDate) params.append('start', adjustToArgentinaTimezone(startDate).toISOString().split('T')[0]);
    if (endDate) params.append('end', adjustToArgentinaTimezone(endDate).toISOString().split('T')[0]);
  
    const res = await fetch(`/api/clicks?${params.toString()}`);
    const data = await res.json();

    console.log('Datos crudos del backend:', data);
    console.log('createdAt recibidos:', data.map(c => c.createdAt));

    setClicks(data);
    setFiltered(data);
  };

  const handleSearch = (text) => {
    setSearch(text);
    const lower = text.toLowerCase();
    const filteredList = clicks.filter(c =>
      c.landing?.toLowerCase() === lower
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
      const key = `${item.ip}-${item.dominio}-${item.landing}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  const filteredByDominio = filtered.filter(item => dominiosActivos[item.dominio]);

  let tempData = filteredByDominio;
  if (excludeNoFbclid) {
    tempData = tempData.filter(item => item.fbclid);
  }
  const displayedData = hideDuplicates ? uniqueByIp(tempData) : tempData;

  const headers = [
    { label: "Fecha", key: "createdAt" },
    { label: "Landing", key: "landing" },
    { label: "IP", key: "ip" },
    { label: "User Agent", key: "user_agent" },
  ];

  const chartData = {
    labels: clicks.map(c => new Date(c.createdAt).toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })),
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

  const handleToggleDominio = (dom) => {
    setDominiosActivos(prev => ({
      ...prev,
      [dom]: !prev[dom]
    }));
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
      <div className={styles.estadisticas}>
        <h1 className="text-3xl font-bold mb-6 text-center text-blue-700">
          📊 Panel de Clicks desde WhatsApp
        </h1>

        <div className={styles.busqueda}>
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
        </div>
        <div className="flex flex-col space-y-2">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={hideDuplicates}
                onChange={(e) => setHideDuplicates(e.target.checked)}
                className="w-5 h-5"
              />
              <span className="text-sm">Evitar IPs duplicadas</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={excludeNoFbclid}
                onChange={(e) => setExcludeNoFbclid(e.target.checked)}
                className="w-5 h-5"
              />
              <span className="text-sm">Excluir sin fbclid</span>
            </label>
          </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {dominios.map((dom) => (
            <label key={dom} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={dominiosActivos[dom]}
                onChange={() => handleToggleDominio(dom)}
                className="w-5 h-5"
              />
              <span className="text-sm">Mostrar {dom}</span>
            </label>
          ))}
        </div>

        <div className="mb-8 h-64">
          <Line data={chartData} options={chartOptions} />
        </div>

        <div className="overflow-auto border rounded shadow">
          <table className="w-full text-sm table-fixed border border-gray-300">
            <thead className="bg-blue-100 sticky top-0 z-10">
              <tr>
                <th className="p-4 border border-black-300">Fecha & Hora</th>
                <th className="p-4 border border-black-300">Landing</th>
                <th className="p-4 border border-black-300">IP</th>
                <th className="p-4 border border-black-300">User Agent</th>
                <th className="p-4 border border-black-300">fbclid</th>
              </tr>
            </thead>
            <tbody>
              {displayedData.map((c, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="p-4 border border-black-200">{new Date(c.createdAt).toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}</td>
                  <td className="p-4 border border-black-200">{c.landing}.{c.dominio}</td>
                  <td className="p-4 border border-black-200">{c.ip}</td>
                  <td className="p-4 border border-black-200 break-all">{c.user_agent?.slice(0, 70)}...</td>
                  <td className="p-4 border border-black-200 text-center">
                    {c.fbclid ? '✅' : '❌'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 text-center">
          <p className="text-lg font-semibold text-gray-700">
            Total de clics mostrados: <span className="text-blue-600">{displayedData.length}</span>
          </p>
        </div>
      </div>
    </div>
  );
}