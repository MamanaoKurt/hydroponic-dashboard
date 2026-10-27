import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Thermometer, Droplets, CloudRain, Fan, Lightbulb, Power, Waves, Search, Plus, Trash2, Printer, Calendar } from 'lucide-react';

const App = () => {
  // --- AUTHENTICATION STATE ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // --- SENSORS & TELEMETRY ---
  const [sensors, setSensors] = useState({ temp: 24.5, humidity: 60, moisture: 45, waterLevel: 85 });
  const [history, setHistory] = useState([
    { id: 1, time: '10:00 AM', temp: 24.5, moisture: 45, waterLevel: 85, status: 'Optimal' },
    { id: 2, time: '10:03 AM', temp: 26.0, moisture: 42, waterLevel: 84, status: 'Optimal' },
    { id: 3, time: '10:06 AM', temp: 28.2, moisture: 38, waterLevel: 82, status: 'Warning' }
  ]);
  
  // --- THRESHOLDS ---
  const [thresholds, setThresholds] = useState({
    hotTemp: 30, 
    coldTemp: 20, 
    dryMoisture: 30 
  });

  const [actuators, setActuators] = useState({ fan: false, light: false, pump: false });

  // --- MODULE STATES ---
  const [searchQuery, setSearchQuery] = useState('');
  const [plantingDate, setPlantingDate] = useState('2026-03-01');
  const [newLogTime, setNewLogTime] = useState('');
  const [newLogTemp, setNewLogTemp] = useState('');

  // Simulation effect
  useEffect(() => {
    if (!isLoggedIn) return;
    const interval = setInterval(() => {
      const newTemp = parseFloat((22 + Math.random() * 10).toFixed(1));
      const newMoisture = parseFloat((30 + Math.random() * 40).toFixed(1));
      const newWater = parseFloat((75 + Math.random() * 15).toFixed(1));
      const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      
      setSensors({
        temp: newTemp,
        humidity: parseFloat((55 + Math.random() * 20).toFixed(1)),
        moisture: newMoisture,
        waterLevel: newWater
      });

      setActuators({
        fan: newTemp > thresholds.hotTemp,
        light: newTemp < thresholds.coldTemp,
        pump: newMoisture < thresholds.dryMoisture
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [isLoggedIn, thresholds]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (username === 'admin' && password === 'pechay123') {
      setIsLoggedIn(true);
      setAuthError('');
    } else {
      setAuthError('Invalid username or password (try admin / pechay123)');
    }
  };

  // --- DATA MANIPULATION MODULE (CRUD) ---
  const handleAddLog = (e) => {
    e.preventDefault();
    if (!newLogTime || !newLogTemp) return;
    const newItem = {
      id: Date.now(),
      time: newLogTime,
      temp: parseFloat(newLogTemp),
      moisture: 50,
      waterLevel: 80,
      status: 'Manual Entry'
    };
    setHistory([newItem, ...history]);
    setNewLogTime('');
    setNewLogTemp('');
  };

  const handleDeleteLog = (id) => {
    setHistory(history.filter(item => item.id !== id));
  };

  // --- HARVEST TIME APPROXIMATION ---
  const calculateHarvestProgress = () => {
    const planted = new Date(plantingDate);
    const today = new Date();
    const diffTime = Math.abs(today - planted);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const maturityDays = 32; // Tech Pechay standard cycle
    const progress = Math.min(Math.floor((diffDays / maturityDays) * 100), 100);
    
    const estimatedHarvestDate = new Date(planted);
    estimatedHarvestDate.setDate(estimatedHarvestDate.getDate() + maturityDays);

    return {
      daysElapsed: diffDays,
      progress: progress,
      targetDate: estimatedHarvestDate.toDateString()
    };
  };

  const harvestInfo = calculateHarvestProgress();

  // Search Module Filter
  const filteredHistory = history.filter(item => 
    item.time.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
    String(item.temp).includes(searchQuery)
  );

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="bg-gray-900 border border-gray-800 p-8 rounded-2xl shadow-2xl w-full max-w-md">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-green-400">🌱 Tech Pechay Hub</h1>
            <p className="text-gray-400 text-sm mt-1">Greenhouse Authentication Portal</p>
          </div>
          {authError && <div className="bg-red-500/10 border border-red-500 text-red-400 p-3 rounded-lg text-sm mb-4">{authError}</div>}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-gray-300 text-sm block mb-1">Username</label>
              <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="admin" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-green-400" required />
            </div>
            <div>
              <label className="text-gray-300 text-sm block mb-1">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="pechay123" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-green-400" required />
            </div>
            <button type="submit" className="w-full bg-green-500 hover:bg-green-600 text-gray-950 font-bold py-3 rounded-lg transition duration-200">Secure Login</button>
          </form>
          <p className="text-xs text-gray-500 text-center mt-4">Hint: Use user <code className="text-green-400">admin</code> and password <code className="text-green-400">pechay123</code></p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-4 md:p-8 font-sans">
      {/* Header & Print Module */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-gray-800 pb-4">
        <div>
          <h1 className="text-3xl font-bold text-green-400 flex items-center gap-2">🌱 Tech Pechay Hydroponic System</h1>
          <p className="text-gray-400">Smart Greenhouse Monitoring & Management Console</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => window.print()} className="bg-gray-800 hover:bg-gray-700 border border-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition">
            <Printer className="w-4 h-4 text-green-400" /> Print Report
          </button>
          <button onClick={() => setIsLoggedIn(false)} className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 px-4 py-2 rounded-lg text-sm font-medium transition">
            Logout
          </button>
        </div>
      </header>

      {/* Harvest Time Approximation Module */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-850 p-6 rounded-2xl border border-gray-700 shadow-xl mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
          <div>
            <h2 className="text-lg font-semibold text-green-300 flex items-center gap-2">
              <Calendar className="w-5 h-5" /> Harvest Time Approximation (Batch Maturity)
            </h2>
            <p className="text-sm text-gray-400">Estimated Maturity Window: 30–35 days for optimal Tech Pechay harvest.</p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-400">Planting Date:</label>
            <input type="date" value={plantingDate} onChange={(e) => setPlantingDate(e.target.value)} className="bg-gray-900 border border-gray-700 text-sm px-3 py-1.5 rounded-lg text-white" />
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-300">Days Elapsed: <strong className="text-white">{harvestInfo.daysElapsed} Days</strong></span>
            <span className="text-gray-300">Estimated Target Date: <strong className="text-green-400">{harvestInfo.targetDate}</strong></span>
            <span className="text-green-400 font-bold">{harvestInfo.progress}% Complete</span>
          </div>
          <div className="w-full bg-gray-900 rounded-full h-3 border border-gray-700 overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-emerald-400 h-full transition-all duration-500" style={{ width: `${harvestInfo.progress}%` }}></div>
          </div>
        </div>
      </div>

      {/* Sensor Cards (Including Water Level) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400 mb-1">Temperature</p>
            <p className="text-3xl font-bold">{sensors.temp}°C</p>
          </div>
          <Thermometer className="text-orange-400 w-10 h-10" />
        </div>
        
        <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400 mb-1">Humidity</p>
            <p className="text-3xl font-bold">{sensors.humidity}%</p>
          </div>
          <CloudRain className="text-blue-400 w-10 h-10" />
        </div>

        <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400 mb-1">Substrate Moisture</p>
            <p className="text-3xl font-bold">{sensors.moisture}%</p>
          </div>
          <Droplets className="text-teal-400 w-10 h-10" />
        </div>

        <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400 mb-1">Water Reservoir</p>
            <p className="text-3xl font-bold">{sensors.waterLevel}%</p>
          </div>
          <Waves className="text-cyan-400 w-10 h-10" />
        </div>
      </div>

      {/* Main Grid: Telemetry & Actuators */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-lg">
          <h2 className="text-xl font-semibold mb-4">Live Telemetry History</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="time" stroke="#9CA3AF" fontSize={12} />
                <YAxis stroke="#9CA3AF" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none' }} />
                <Line type="monotone" dataKey="temp" stroke="#F97316" strokeWidth={2} name="Temp (°C)" />
                <Line type="monotone" dataKey="moisture" stroke="#14B8A6" strokeWidth={2} name="Moisture (%)" />
                <Line type="monotone" dataKey="waterLevel" stroke="#06B6D4" strokeWidth={2} name="Water Level (%)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-lg flex flex-col justify-between gap-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Actuator Status</h2>
            <div className="flex gap-4">
              <div className={`flex flex-col items-center p-3 rounded-xl flex-1 ${actuators.fan ? 'bg-orange-500/20 text-orange-400 border border-orange-500/50' : 'bg-gray-900 text-gray-500'}`}>
                <Fan className={`w-7 h-7 mb-1 ${actuators.fan ? 'animate-spin' : ''}`} />
                <span className="text-xs font-medium">Exhaust Fan</span>
              </div>
              <div className={`flex flex-col items-center p-3 rounded-xl flex-1 ${actuators.light ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50' : 'bg-gray-900 text-gray-500'}`}>
                <Lightbulb className="w-7 h-7 mb-1" />
                <span className="text-xs font-medium">Grow Lights</span>
              </div>
              <div className={`flex flex-col items-center p-3 rounded-xl flex-1 ${actuators.pump ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50' : 'bg-gray-900 text-gray-500'}`}>
                <Power className="w-7 h-7 mb-1" />
                <span className="text-xs font-medium">Water Pump</span>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-3">Automation Thresholds</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <label className="text-gray-300">Max Temp (Fan On) °C</label>
                <input type="number" value={thresholds.hotTemp} onChange={(e) => setThresholds({...thresholds, hotTemp: parseFloat(e.target.value)})} className="bg-gray-900 text-white px-3 py-1 rounded-lg w-20 text-center border border-gray-700" />
              </div>
              <div className="flex justify-between items-center text-sm">
                <label className="text-gray-300">Min Temp (Lights On) °C</label>
                <input type="number" value={thresholds.coldTemp} onChange={(e) => setThresholds({...thresholds, coldTemp: parseFloat(e.target.value)})} className="bg-gray-900 text-white px-3 py-1 rounded-lg w-20 text-center border border-gray-700" />
              </div>
              <div className="flex justify-between items-center text-sm">
                <label className="text-gray-300">Min Moisture (Pump On) %</label>
                <input type="number" value={thresholds.dryMoisture} onChange={(e) => setThresholds({...thresholds, dryMoisture: parseFloat(e.target.value)})} className="bg-gray-900 text-white px-3 py-1 rounded-lg w-20 text-center border border-gray-700" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Data Manipulation Modules */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-lg">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><Plus className="w-5 h-5 text-green-400" /> Add Manual Log</h3>
          <form onSubmit={handleAddLog} className="space-y-3">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Time Label</label>
              <input type="text" value={newLogTime} onChange={(e) => setNewLogTime(e.target.value)} placeholder="e.g. 10:30 AM" className="w-full bg-gray-900 border border-gray-700 text-sm px-3 py-2 rounded-lg text-white" required />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Recorded Temp (°C)</label>
              <input type="number" step="0.1" value={newLogTemp} onChange={(e) => setNewLogTemp(e.target.value)} placeholder="25.4" className="w-full bg-gray-900 border border-gray-700 text-sm px-3 py-2 rounded-lg text-white" required />
            </div>
            <button type="submit" className="w-full bg-green-500 hover:bg-green-600 text-gray-950 font-semibold py-2 rounded-lg text-sm transition">Insert Record</button>
          </form>
        </div>

        <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-lg lg:col-span-2">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
            <h3 className="text-lg font-semibold">Telemetry Log Database</h3>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search logs..." className="w-full bg-gray-900 border border-gray-700 text-sm pl-9 pr-4 py-1.5 rounded-lg text-white focus:outline-none focus:border-green-400" />
            </div>
          </div>

          <div className="overflow-x-auto max-h-48 overflow-y-auto">
            <table className="w-full text-left text-sm text-gray-300">
              <thead className="bg-gray-900 text-gray-400 uppercase text-xs sticky top-0">
                <tr>
                  <th className="p-3">Time</th>
                  <th className="p-3">Temp</th>
                  <th className="p-3">Moisture</th>
                  <th className="p-3">Water</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {filteredHistory.length > 0 ? (
                  filteredHistory.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-750">
                      <td className="p-3 font-medium text-white">{item.time}</td>
                      <td className="p-3">{item.temp}°C</td>
                      <td className="p-3">{item.moisture}%</td>
                      <td className="p-3">{item.waterLevel}%</td>
                      <td className="p-3"><span className="px-2 py-0.5 rounded text-xs bg-green-500/10 text-green-400 border border-green-500/20">{item.status}</span></td>
                      <td className="p-3 text-right">
                        <button onClick={() => handleDeleteLog(item.id)} className="text-red-400 hover:text-red-300 p-1"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="p-4 text-center text-gray-500">No matching records found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;