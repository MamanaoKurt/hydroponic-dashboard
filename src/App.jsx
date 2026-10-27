import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Thermometer, Droplets, CloudRain, Fan, Lightbulb, Power, Waves, Search, Plus, Trash2, FileText, Calendar, UserPlus, LogIn, Wifi, RefreshCw, Lock, CheckCircle, X, PlusCircle, Download } from 'lucide-react';
import { Document, Packer, Paragraph, TextRun, Table, TableCell, TableRow, WidthType, HeadingLevel } from 'docx';

const App = () => {
  // --- PERSISTENT AUTHENTICATION STATE ---
  const [users, setUsers] = useState(() => JSON.parse(localStorage.getItem('pekinensis_users') || '[]'));
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem('pekinensis_logged') === 'true');
  const [currentUser, setCurrentUser] = useState(() => localStorage.getItem('pekinensis_currUser') || '');
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  // --- PWA INSTALL STATE ---
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [installModalOpen, setInstallModalOpen] = useState(false);

  // --- ESP32 WIFI MODAL STATE ---
  const [wifiModalOpen, setWifiModalOpen] = useState(false);
  const [scanningWifi, setScanningWifi] = useState(false);
  const [availableNetworks, setAvailableNetworks] = useState([]);
  const [selectedNetwork, setSelectedNetwork] = useState(null);
  const [wifiPassword, setWifiPassword] = useState('');
  const [espIpAddress, setEspIpAddress] = useState('192.168.4.1');
  const [activeSsid, setActiveSsid] = useState(() => localStorage.getItem('pekinensis_activeSsid') || 'Not Connected');
  const [connectingStatus, setConnectingStatus] = useState(false);
  const [customSsidModal, setCustomSsidModal] = useState(false);
  const [customSsid, setCustomSsid] = useState('');

  // --- SENSORS & TELEMETRY ---
  const [sensors, setSensors] = useState({ temp: 24.5, humidity: 60, moisture: 45, waterLevel: 85 });
  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem('pekinensis_history');
    return saved ? JSON.parse(saved) : [
      { id: 1, time: '10:00 AM', temp: 24.5, humidity: 60, moisture: 45, waterLevel: 85, status: 'Optimal' },
      { id: 2, time: '10:03 AM', temp: 26.0, humidity: 58, moisture: 42, waterLevel: 84, status: 'Optimal' },
      { id: 3, time: '10:06 AM', temp: 28.2, humidity: 55, moisture: 38, waterLevel: 82, status: 'Warning' }
    ];
  });
  
  const [thresholds, setThresholds] = useState(() => {
    const saved = localStorage.getItem('pekinensis_thresholds');
    return saved ? JSON.parse(saved) : { hotTemp: 30, coldTemp: 20, dryMoisture: 30 };
  });

  const [actuators, setActuators] = useState({
    fan: { state: false, mode: 'auto' },
    light: { state: false, mode: 'auto' },
    pump: { state: false, mode: 'auto' }
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [plantingDate, setPlantingDate] = useState(() => localStorage.getItem('pekinensis_plantingDate') || '2026-03-01');

  // Manual Log Form State
  const [newLogTime, setNewLogTime] = useState('');
  const [newLogTemp, setNewLogTemp] = useState('');
  const [newLogHumidity, setNewLogHumidity] = useState('');
  const [newLogMoisture, setNewLogMoisture] = useState('');
  const [newLogWater, setNewLogWater] = useState('');

  useEffect(() => {
    localStorage.setItem('pekinensis_users', JSON.stringify(users));
    localStorage.setItem('pekinensis_history', JSON.stringify(history));
    localStorage.setItem('pekinensis_thresholds', JSON.stringify(thresholds));
    localStorage.setItem('pekinensis_plantingDate', plantingDate);
    localStorage.setItem('pekinensis_logged', isLoggedIn);
    localStorage.setItem('pekinensis_currUser', currentUser);
    localStorage.setItem('pekinensis_activeSsid', activeSsid);

    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
      setIsInstalled(true);
    }

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [users, history, thresholds, plantingDate, isLoggedIn, currentUser, activeSsid]);

  const handleInstallClick = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
        setInstallPrompt(null);
      }
    } else {
      setInstallModalOpen(true);
    }
  };

  // Live Simulation & Actuator Logic
  useEffect(() => {
    if (!isLoggedIn) return;
    const interval = setInterval(() => {
      const newTemp = parseFloat((22 + Math.random() * 10).toFixed(1));
      const newMoisture = parseFloat((30 + Math.random() * 40).toFixed(1));
      const newWater = parseFloat((75 + Math.random() * 15).toFixed(1));
      const newHumid = parseFloat((55 + Math.random() * 20).toFixed(1));
      
      setSensors({ temp: newTemp, humidity: newHumid, moisture: newMoisture, waterLevel: newWater });

      setActuators(prev => ({
        fan: { state: prev.fan.mode === 'auto' ? newTemp > thresholds.hotTemp : prev.fan.state, mode: prev.fan.mode },
        light: { state: prev.light.mode === 'auto' ? newTemp < thresholds.coldTemp : prev.light.state, mode: prev.light.mode },
        pump: { state: prev.pump.mode === 'auto' ? newMoisture < thresholds.dryMoisture : prev.pump.state, mode: prev.pump.mode }
      }));
    }, 4000);

    return () => clearInterval(interval);
  }, [isLoggedIn, thresholds]);

  const handleToggleActuator = (key) => {
    setActuators(prev => {
      const current = prev[key];
      if (current.mode === 'auto') return { ...prev, [key]: { state: true, mode: 'manual' } };
      if (current.state === true) return { ...prev, [key]: { state: false, mode: 'manual' } };
      return { ...prev, [key]: { state: false, mode: 'auto' } };
    });
  };

  const handleScanRealWifi = async () => {
    setScanningWifi(true);
    try {
      const res = await fetch(`http://${espIpAddress}/scan`);
      if (res.ok) {
        const data = await res.json();
        setAvailableNetworks(data);
      } else {
        setAvailableNetworks([]);
      }
    } catch (err) {
      console.log('ESP32 offline or IP unreachable.');
      setAvailableNetworks([]);
    } finally {
      setScanningWifi(false);
    }
  };

  const handleConnectToNetwork = () => {
    if (!selectedNetwork) return;
    setConnectingStatus(true);
    setTimeout(() => {
      setActiveSsid(selectedNetwork.ssid);
      setConnectingStatus(false);
      setWifiModalOpen(false);
      setSelectedNetwork(null);
      setWifiPassword('');
    }, 1200);
  };

  const handleRegister = (e) => {
    e.preventDefault();
    setAuthError(''); setAuthSuccess('');
    if (!username || !password) { setAuthError('Please fill in all fields.'); return; }
    if (users.some(u => u.username === username)) { setAuthError('Username already exists.'); return; }
    setUsers([...users, { username, password }]);
    setAuthSuccess('Account created successfully! You can now log in.');
    setIsRegistering(false); setUsername(''); setPassword('');
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setAuthError(''); setAuthSuccess('');
    const found = users.find(u => u.username === username && u.password === password);
    if (found) { setIsLoggedIn(true); setCurrentUser(username); setUsername(''); setPassword(''); }
    else { setAuthError('Invalid username or password.'); }
  };

  const handleLogout = () => {
    setIsLoggedIn(false); setCurrentUser('');
    localStorage.setItem('pekinensis_logged', 'false');
    localStorage.removeItem('pekinensis_currUser');
  };

  const handleAddLog = (e) => {
    e.preventDefault();
    if (!newLogTime || !newLogTemp || !newLogHumidity || !newLogMoisture || !newLogWater) return;
    const newItem = {
      id: Date.now(), time: newLogTime, temp: parseFloat(newLogTemp),
      humidity: parseFloat(newLogHumidity), moisture: parseFloat(newLogMoisture),
      waterLevel: parseFloat(newLogWater), status: 'Manual Entry'
    };
    setHistory([newItem, ...history]);
    setNewLogTime(''); setNewLogTemp(''); setNewLogHumidity(''); setNewLogMoisture(''); setNewLogWater('');
  };

  const handleDeleteLog = (id) => setHistory(history.filter(item => item.id !== id));

  const calculateHarvestProgress = () => {
    const planted = new Date(plantingDate);
    const today = new Date();
    const diffDays = Math.ceil(Math.abs(today - planted) / (1000 * 60 * 60 * 24));
    const maturityDays = 32; 
    const progress = Math.min(Math.floor((diffDays / maturityDays) * 100), 100);
    const target = new Date(planted);
    target.setDate(target.getDate() + maturityDays);
    return { daysElapsed: diffDays, progress, targetDate: target.toDateString() };
  };
  const harvestInfo = calculateHarvestProgress();

  const filteredHistory = history.filter(item => 
    item.time.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
    String(item.temp).includes(searchQuery)
  );

  const handleDownloadDocx = async () => {
    try {
      const tableRows = [
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Time", bold: true, color: "FFFFFF" })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Temp (°C)", bold: true, color: "FFFFFF" })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Humidity (%)", bold: true, color: "FFFFFF" })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Moisture (%)", bold: true, color: "FFFFFF" })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Water (%)", bold: true, color: "FFFFFF" })] })] }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Status", bold: true, color: "FFFFFF" })] })] }),
          ],
        }),
      ];

      history.forEach(item => {
        tableRows.push(
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph(item.time)] }),
              new TableCell({ children: [new Paragraph(String(item.temp))] }),
              new TableCell({ children: [new Paragraph(String(item.humidity ?? '-'))] }),
              new TableCell({ children: [new Paragraph(String(item.moisture))] }),
              new TableCell({ children: [new Paragraph(String(item.waterLevel ?? '-'))] }),
              new TableCell({ children: [new Paragraph(item.status)] }),
            ],
          })
        );
      });

      const doc = new Document({
        sections: [
          {
            properties: {},
            children: [
              new Paragraph({ text: "🌱 Pekinensis Greenhouse Report", heading: HeadingLevel.HEADING_1 }),
              new Paragraph({ text: `Generated By: ${currentUser || 'Admin'}` }),
              new Paragraph({ text: `Date Generated: ${new Date().toLocaleString()}` }),
              new Paragraph({ text: `Planting Date: ${plantingDate} (${harvestInfo.daysElapsed} Days Elapsed - ${harvestInfo.progress}% Maturity)` }),
              new Paragraph({ text: `Estimated Target Harvest Date: ${harvestInfo.targetDate}` }),
              new Paragraph({ text: "" }),
              new Paragraph({ text: "Current Sensor Telemetry", heading: HeadingLevel.HEADING_2 }),
              new Paragraph({ text: `• Temperature: ${sensors.temp} °C` }),
              new Paragraph({ text: `• Humidity: ${sensors.humidity} %` }),
              new Paragraph({ text: `• Substrate Moisture: ${sensors.moisture} %` }),
              new Paragraph({ text: `• Water Reservoir Level: ${sensors.waterLevel} %` }),
              new Paragraph({ text: "" }),
              new Paragraph({ text: "Historical Telemetry Database", heading: HeadingLevel.HEADING_2 }),
              new Table({
                rows: tableRows,
                width: { size: 100, type: WidthType.PERCENTAGE },
              }),
            ],
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Pekinensis_Greenhouse_Report_${new Date().toISOString().slice(0, 10)}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error generating Word document:", err);
      alert("Failed to generate DOCX file.");
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center p-4">
        <div className="bg-[#111827] border border-[#1F2937] p-8 rounded-3xl shadow-[8px_8px_20px_#05070c,-8px_-8px_20px_#1d283c] w-full max-w-md">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-[#34D399]">🌱 Pekinensis</h1>
            <p className="text-gray-400 text-sm mt-1">{isRegistering ? 'Create New Account' : 'Secure Login Portal'}</p>
          </div>
          {authError && <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl text-sm mb-4">{authError}</div>}
          {authSuccess && <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-3 rounded-xl text-sm mb-4">{authSuccess}</div>}
          {!isRegistering ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-gray-300 text-xs uppercase font-semibold block mb-1">Username</label>
                <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" className="w-full bg-[#0B0F19] border border-[#1F2937] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#34D399]" required />
              </div>
              <div>
                <label className="text-gray-300 text-xs uppercase font-semibold block mb-1">Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" className="w-full bg-[#0B0F19] border border-[#1F2937] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#34D399]" required />
              </div>
              <button type="submit" className="w-full bg-[#10B981] hover:bg-[#059669] text-[#0B0F19] font-bold py-3.5 rounded-xl transition flex items-center justify-center gap-2">
                <LogIn className="w-4 h-4" /> Sign In
              </button>
              <div className="text-center mt-4">
                <button type="button" onClick={() => { setIsRegistering(true); setAuthError(''); setAuthSuccess(''); }} className="text-xs text-[#22D3EE] hover:underline">Don't have an account? Sign up</button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="text-gray-300 text-xs uppercase font-semibold block mb-1">New Username</label>
                <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" className="w-full bg-[#0B0F19] border border-[#1F2937] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#34D399]" required />
              </div>
              <div>
                <label className="text-gray-300 text-xs uppercase font-semibold block mb-1">New Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" className="w-full bg-[#0B0F19] border border-[#1F2937] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#34D399]" required />
              </div>
              <button type="submit" className="w-full bg-[#06B6D4] hover:bg-[#0891B2] text-[#0B0F19] font-bold py-3.5 rounded-xl transition flex items-center justify-center gap-2">
                <UserPlus className="w-4 h-4" /> Create Account
              </button>
              <div className="text-center mt-4">
                <button type="button" onClick={() => { setIsRegistering(false); setAuthError(''); setAuthSuccess(''); }} className="text-xs text-gray-400 hover:underline">Already have an account? Log in</button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B0F19] text-gray-100 p-4 md:p-8 font-sans">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 bg-[#111827] p-6 rounded-3xl border border-[#1F2937] shadow-[6px_6px_16px_#05070c,-6px_-6px_16px_#1d283c]">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#34D399] flex items-center gap-2">🌱 Pekinensis</h1>
          <p className="text-gray-400 text-sm mt-1">Greenhouse Intelligence Console • User: <strong className="text-[#22D3EE]">{currentUser}</strong></p>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          {!isInstalled ? (
            <button onClick={handleInstallClick} className="bg-[#10B981]/20 hover:bg-[#10B981]/30 border border-[#34D399] px-4 py-2.5 rounded-xl flex items-center gap-2 text-xs font-semibold text-[#34D399] transition shadow-md">
              <Download className="w-4 h-4" /> Install App
            </button>
          ) : (
            <div className="bg-[#10B981]/10 border border-[#34D399]/40 px-4 py-2.5 rounded-xl flex items-center gap-2 text-xs font-semibold text-[#34D399]">
              <CheckCircle className="w-4 h-4" /> App Installed
            </div>
          )}
          <button onClick={() => setWifiModalOpen(true)} className="px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition bg-[#0B0F19] border border-[#1F2937] text-[#34D399]">
            <Wifi className="w-4 h-4" /> {activeSsid}
          </button>
          <button onClick={handleDownloadDocx} className="bg-[#0B0F19] hover:bg-[#161e31] border border-[#1F2937] px-4 py-2.5 rounded-xl flex items-center gap-2 text-xs font-semibold text-[#22D3EE]">
            <FileText className="w-4 h-4" /> Export Tabular .DOCX
          </button>
          <button onClick={handleLogout} className="bg-[#0B0F19] border border-[#1F2937] text-red-400 px-4 py-2.5 rounded-xl text-xs font-semibold">Logout</button>
        </div>
      </header>

      {/* Install Guide Modal */}
      {installModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#111827] border border-[#1F2937] p-6 rounded-3xl w-full max-w-md relative shadow-2xl">
            <button onClick={() => setInstallModalOpen(false)} className="absolute top-6 right-6 text-gray-400 hover:text-white"><X className="w-5 h-5"/></button>
            <h3 className="text-lg font-bold text-[#34D399] mb-2 flex items-center gap-2">🌱 Install Pekinensis</h3>
            <p className="text-xs text-gray-300 mb-4">
              Your browser is currently holding the installation prompt. You can install this app instantly with one click:
            </p>
            <div className="bg-[#0B0F19] p-4 rounded-2xl border border-[#1F2937] space-y-2 text-xs text-gray-300 mb-4">
              <p>• Look at your browser's address bar at the top right.</p>
              <p>• Click the <strong className="text-[#34D399]">Install icon (➕ or monitor)</strong> inside the URL bar.</p>
              <p>• Or, click your browser menu (<strong className="text-white">⋮</strong>) and select <strong className="text-[#22D3EE]">'Install Pekinensis Hydroponic Hub'</strong>.</p>
            </div>
            <button onClick={() => setInstallModalOpen(false)} className="w-full bg-[#10B981] text-[#0B0F19] font-bold py-3 rounded-xl text-xs transition">
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Wi-Fi Modal */}
      {wifiModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#111827] border border-[#1F2937] p-6 rounded-3xl w-full max-w-md shadow-[8px_8px_20px_#05070c] relative">
            <button onClick={() => setWifiModalOpen(false)} className="absolute top-6 right-6 text-gray-400 hover:text-white"><X className="w-5 h-5"/></button>
            
            <div className="flex items-center gap-2 mb-1">
              <Wifi className="w-5 h-5 text-[#34D399]" />
              <h3 className="text-lg font-bold text-white">ESP32 Wi-Fi</h3>
            </div>
            <p className="text-xs text-gray-400 mb-3">Pick the network the ESP32 should use. No re-flashing needed.</p>

            <div className="mb-3">
              <label className="text-[10px] text-gray-400 uppercase block mb-1">ESP32 Device IP Address</label>
              <input type="text" value={espIpAddress} onChange={e => setEspIpAddress(e.target.value)} className="w-full bg-[#0B0F19] border border-[#1F2937] rounded-xl px-3 py-1.5 text-xs text-white" />
            </div>

            <div className="space-y-2 mb-4 max-h-52 overflow-y-auto pr-1">
              {scanningWifi ? (
                <div className="text-center py-6 text-gray-400 text-xs flex flex-col items-center gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin text-[#22D3EE]" />
                  Scanning nearby networks from ESP32...
                </div>
              ) : availableNetworks.length > 0 ? (
                availableNetworks.map((net, idx) => {
                  const isConnected = net.ssid === activeSsid;
                  const isSelected = selectedNetwork?.ssid === net.ssid;
                  return (
                    <div 
                      key={idx} 
                      onClick={() => { setSelectedNetwork(net); setWifiPassword(''); }} 
                      className={`p-3.5 rounded-2xl border cursor-pointer transition flex justify-between items-center ${isSelected ? 'bg-[#1e293b] border-[#34D399] text-white' : 'bg-[#161e31] border-[#1F2937] text-gray-200 hover:bg-[#1a2338]'}`}
                    >
                      <div>
                        <p className="text-xs font-bold">{net.ssid}</p>
                        {isConnected ? (
                          <p className="text-[10px] text-[#34D399] font-semibold mt-0.5">CONNECTED</p>
                        ) : (
                          <p className="text-[10px] text-gray-500 mt-0.5">RSSI: {net.rssi} dBm • {net.secure ? 'Secured' : 'Open'}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        {net.secure && <Lock className="w-3.5 h-3.5 text-gray-400" />}
                        <Wifi className="w-4 h-4 text-[#34D399]" />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-gray-500 text-xs bg-[#0B0F19] rounded-2xl border border-[#1F2937]">
                  No networks loaded. Click 'Rescan' to fetch live Wi-Fi list from your ESP32.
                </div>
              )}
            </div>

            {selectedNetwork && selectedNetwork.ssid !== activeSsid && (
              <div className="space-y-3 mb-4 bg-[#0B0F19] p-4 rounded-2xl border border-[#1F2937]">
                <p className="text-xs font-bold text-[#34D399]">Connect to: {selectedNetwork.ssid}</p>
                <input type="password" value={wifiPassword} onChange={e => setWifiPassword(e.target.value)} placeholder="Network Password" className="w-full bg-[#111827] border border-[#1F2937] rounded-xl px-3 py-2 text-xs text-white" autoFocus />
                <button onClick={handleConnectToNetwork} disabled={connectingStatus} className="w-full bg-[#10B981] text-[#0B0F19] font-bold py-2.5 rounded-xl text-xs transition">
                  {connectingStatus ? 'Configuring ESP32...' : 'Connect'}
                </button>
              </div>
            )}

            <div className="flex gap-3 pt-2 border-t border-[#1F2937]">
              <button onClick={handleScanRealWifi} className="flex-1 bg-[#0B0F19] hover:bg-[#161e31] border border-[#1F2937] text-gray-200 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2">
                <RefreshCw className={`w-3.5 h-3.5 ${scanningWifi ? 'animate-spin text-[#34D399]' : ''}`} /> Rescan
              </button>
              <button onClick={() => setCustomSsidModal(true)} className="flex-1 bg-[#0B0F19] hover:bg-[#161e31] border border-[#1F2937] text-gray-200 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2">
                <PlusCircle className="w-3.5 h-3.5 text-[#22D3EE]" /> + Other network
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Network Modal */}
      {customSsidModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#111827] border border-[#1F2937] p-6 rounded-3xl w-full max-w-sm">
            <h3 className="text-sm font-bold text-white mb-2">Connect to Hidden/Other Network</h3>
            <input type="text" value={customSsid} onChange={e => setCustomSsid(e.target.value)} placeholder="SSID Name" className="w-full bg-[#0B0F19] border border-[#1F2937] rounded-xl px-3 py-2 text-xs text-white mb-3" />
            <input type="password" placeholder="Password" className="w-full bg-[#0B0F19] border border-[#1F2937] rounded-xl px-3 py-2 text-xs text-white mb-4" />
            <div className="flex gap-2">
              <button onClick={() => { if(customSsid) { setActiveSsid(customSsid); setCustomSsidModal(false); setWifiModalOpen(false); }}} className="flex-1 bg-[#10B981] text-[#0B0F19] font-bold py-2 rounded-xl text-xs">Connect</button>
              <button onClick={() => setCustomSsidModal(false)} className="flex-1 bg-gray-800 text-gray-300 py-2 rounded-xl text-xs">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Harvest Time Approximation Module */}
      <div className="bg-[#111827] p-6 rounded-3xl border border-[#1F2937] mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
          <div>
            <h2 className="text-base font-semibold text-[#34D399] flex items-center gap-2">
              <Calendar className="w-5 h-5" /> Harvest Time Approximation (Chinese Cabbage / Pekinensis)
            </h2>
            <p className="text-xs text-gray-400">Optimal Maturity Window: 30–35 days in hydroponic system.</p>
          </div>
          <div className="flex items-center gap-2 bg-[#0B0F19] px-3 py-1.5 rounded-xl border border-[#1F2937]">
            <label className="text-xs text-gray-400">Planting Date:</label>
            <input type="date" value={plantingDate} onChange={e => setPlantingDate(e.target.value)} className="bg-transparent text-xs text-white focus:outline-none" />
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-xs md:text-sm">
            <span className="text-gray-300">Days Elapsed: <strong className="text-white">{harvestInfo.daysElapsed} Days</strong></span>
            <span className="text-gray-300">Target Harvest Date: <strong className="text-[#34D399]">{harvestInfo.targetDate}</strong></span>
            <span className="text-[#22D3EE] font-bold">{harvestInfo.progress}% Complete</span>
          </div>
          <div className="w-full bg-[#0B0F19] rounded-full h-3 border border-[#1F2937] overflow-hidden">
            <div className="bg-gradient-to-r from-[#06B6D4] to-[#10B981] h-full transition-all duration-500" style={{ width: `${harvestInfo.progress}%` }}></div>
          </div>
        </div>
      </div>

      {/* Sensor Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-[#111827] p-6 rounded-3xl border border-[#1F2937] flex items-center justify-between">
          <div><p className="text-xs font-semibold text-gray-400 uppercase mb-1">Temperature</p><p className="text-3xl font-bold text-white">{sensors.temp}<span className="text-lg text-orange-400">°C</span></p></div>
          <Thermometer className="text-orange-400 w-7 h-7" />
        </div>
        <div className="bg-[#111827] p-6 rounded-3xl border border-[#1F2937] flex items-center justify-between">
          <div><p className="text-xs font-semibold text-gray-400 uppercase mb-1">Humidity</p><p className="text-3xl font-bold text-white">{sensors.humidity}<span className="text-lg text-[#22D3EE]">%</span></p></div>
          <CloudRain className="text-[#22D3EE] w-7 h-7" />
        </div>
        <div className="bg-[#111827] p-6 rounded-3xl border border-[#1F2937] flex items-center justify-between">
          <div><p className="text-xs font-semibold text-gray-400 uppercase mb-1">Substrate Moisture</p><p className="text-3xl font-bold text-white">{sensors.moisture}<span className="text-lg text-[#34D399]">%</span></p></div>
          <Droplets className="text-[#34D399] w-7 h-7" />
        </div>
        <div className="bg-[#111827] p-6 rounded-3xl border border-[#1F2937] flex items-center justify-between">
          <div><p className="text-xs font-semibold text-gray-400 uppercase mb-1">Water Reservoir</p><p className="text-3xl font-bold text-white">{sensors.waterLevel}<span className="text-lg text-cyan-400">%</span></p></div>
          <Waves className="text-cyan-400 w-7 h-7" />
        </div>
      </div>

      {/* Main Grid: Telemetry & Actuator Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-[#111827] p-6 rounded-3xl border border-[#1F2937]">
          <h2 className="text-lg font-semibold mb-4 text-gray-200">Live Telemetry History</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
                <XAxis dataKey="time" stroke="#9CA3AF" fontSize={11} />
                <YAxis stroke="#9CA3AF" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #1F2937', borderRadius: '12px' }} />
                <Line type="monotone" dataKey="temp" stroke="#F97316" strokeWidth={2} name="Temp (°C)" />
                <Line type="monotone" dataKey="moisture" stroke="#34D399" strokeWidth={2} name="Moisture (%)" />
                <Line type="monotone" dataKey="waterLevel" stroke="#22D3EE" strokeWidth={2} name="Water (%)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#111827] p-6 rounded-3xl border border-[#1F2937] flex flex-col justify-between gap-6">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-200">Actuators & Manual Override</h2>
              <span className="text-xs text-gray-400 bg-[#0B0F19] px-3 py-1 rounded-xl border border-[#1F2937]">Click card to override</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <button onClick={() => handleToggleActuator('fan')} className={`p-4 rounded-2xl flex flex-col items-center transition ${actuators.fan.state ? 'bg-[#10B981]/10 border border-[#34D399]/40 text-[#34D399]' : 'bg-[#0B0F19] border border-[#1F2937] text-gray-400'}`}>
                <Fan className={`w-7 h-7 mb-2 ${actuators.fan.state ? 'animate-spin text-[#34D399]' : ''}`} />
                <span className="text-xs font-bold">Exhaust Fan</span>
                <span className="text-[10px] mt-1 px-2 py-0.5 rounded-md bg-[#111827] uppercase">{actuators.fan.mode}: {actuators.fan.state ? 'ON' : 'OFF'}</span>
              </button>
              <button onClick={() => handleToggleActuator('light')} className={`p-4 rounded-2xl flex flex-col items-center transition ${actuators.light.state ? 'bg-[#22D3EE]/10 border border-[#22D3EE]/40 text-[#22D3EE]' : 'bg-[#0B0F19] border border-[#1F2937] text-gray-400'}`}>
                <Lightbulb className={`w-7 h-7 mb-2 ${actuators.light.state ? 'text-[#22D3EE]' : ''}`} />
                <span className="text-xs font-bold">Grow Lights</span>
                <span className="text-[10px] mt-1 px-2 py-0.5 rounded-md bg-[#111827] uppercase">{actuators.light.mode}: {actuators.light.state ? 'ON' : 'OFF'}</span>
              </button>
              <button onClick={() => handleToggleActuator('pump')} className={`p-4 rounded-2xl flex flex-col items-center transition ${actuators.pump.state ? 'bg-cyan-500/10 border border-cyan-400/40 text-cyan-400' : 'bg-[#0B0F19] border border-[#1F2937] text-gray-400'}`}>
                <Power className={`w-7 h-7 mb-2 ${actuators.pump.state ? 'text-cyan-400' : ''}`} />
                <span className="text-xs font-bold">Water Pump</span>
                <span className="text-[10px] mt-1 px-2 py-0.5 rounded-md bg-[#111827] uppercase">{actuators.pump.mode}: {actuators.pump.state ? 'ON' : 'OFF'}</span>
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-3 text-gray-300">Automation Thresholds</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400">Max Temp (Fan On) °C</span>
                <input type="number" value={thresholds.hotTemp} onChange={e => setThresholds({...thresholds, hotTemp: parseFloat(e.target.value)})} className="bg-[#0B0F19] text-white px-3 py-1.5 rounded-xl w-20 text-center border border-[#1F2937]" />
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400">Min Temp (Lights On) °C</span>
                <input type="number" value={thresholds.coldTemp} onChange={e => setThresholds({...thresholds, coldTemp: parseFloat(e.target.value)})} className="bg-[#0B0F19] text-white px-3 py-1.5 rounded-xl w-20 text-center border border-[#1F2937]" />
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400">Min Moisture (Pump On) %</span>
                <input type="number" value={thresholds.dryMoisture} onChange={e => setThresholds({...thresholds, dryMoisture: parseFloat(e.target.value)})} className="bg-[#0B0F19] text-white px-3 py-1.5 rounded-xl w-20 text-center border border-[#1F2937]" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Manual Log & Database */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-[#111827] p-6 rounded-3xl border border-[#1F2937]">
          <h3 className="text-base font-semibold mb-4 text-gray-200 flex items-center gap-2"><Plus className="w-5 h-5 text-[#34D399]" /> Add Manual Log Entry</h3>
          <form onSubmit={handleAddLog} className="space-y-3">
            <div>
              <label className="text-[10px] uppercase text-gray-400 font-semibold block mb-1">Time Label</label>
              <input type="text" value={newLogTime} onChange={e => setNewLogTime(e.target.value)} placeholder="e.g. 10:30 AM" className="w-full bg-[#0B0F19] border border-[#1F2937] text-xs px-3.5 py-2.5 rounded-xl text-white" required />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] uppercase text-gray-400 font-semibold block mb-1">Temp (°C)</label>
                <input type="number" step="0.1" value={newLogTemp} onChange={e => setNewLogTemp(e.target.value)} placeholder="25.4" className="w-full bg-[#0B0F19] border border-[#1F2937] text-xs px-3.5 py-2.5 rounded-xl text-white" required />
              </div>
              <div>
                <label className="text-[10px] uppercase text-gray-400 font-semibold block mb-1">Humidity (%)</label>
                <input type="number" step="0.1" value={newLogHumidity} onChange={e => setNewLogHumidity(e.target.value)} placeholder="60" className="w-full bg-[#0B0F19] border border-[#1F2937] text-xs px-3.5 py-2.5 rounded-xl text-white" required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] uppercase text-gray-400 font-semibold block mb-1">Moisture (%)</label>
                <input type="number" step="0.1" value={newLogMoisture} onChange={e => setNewLogMoisture(e.target.value)} placeholder="45" className="w-full bg-[#0B0F19] border border-[#1F2937] text-xs px-3.5 py-2.5 rounded-xl text-white" required />
              </div>
              <div>
                <label className="text-[10px] uppercase text-gray-400 font-semibold block mb-1">Water (%)</label>
                <input type="number" step="0.1" value={newLogWater} onChange={e => setNewLogWater(e.target.value)} placeholder="80" className="w-full bg-[#0B0F19] border border-[#1F2937] text-xs px-3.5 py-2.5 rounded-xl text-white" required />
              </div>
            </div>
            <button type="submit" className="w-full bg-[#34D399] hover:bg-[#10B981] text-[#0B0F19] font-bold py-3 rounded-xl text-xs transition mt-2">Save to Database</button>
          </form>
        </div>

        <div className="bg-[#111827] p-6 rounded-3xl border border-[#1F2937] lg:col-span-2">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
            <h3 className="text-base font-semibold text-gray-200">Telemetry Log Database</h3>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search records..." className="w-full bg-[#0B0F19] border border-[#1F2937] text-xs pl-9 pr-4 py-2 rounded-xl text-white" />
            </div>
          </div>
          <div className="overflow-x-auto max-h-60 overflow-y-auto">
            <table className="w-full text-left text-xs text-gray-300">
              <thead className="bg-[#0B0F19] text-gray-400 uppercase text-[10px] sticky top-0">
                <tr><th className="p-3">Time</th><th className="p-3">Temp</th><th className="p-3">Humidity</th><th className="p-3">Moisture</th><th className="p-3">Water</th><th className="p-3">Status</th><th className="p-3 text-right">Action</th></tr>
              </thead>
              <tbody className="divide-y divide-[#1F2937]">
                {filteredHistory.length > 0 ? (
                  filteredHistory.map(item => (
                    <tr key={item.id} className="hover:bg-[#161e31]">
                      <td className="p-3 font-medium text-white">{item.time}</td>
                      <td className="p-3">{item.temp}°C</td>
                      <td className="p-3">{item.humidity ?? '-'}%</td>
                      <td className="p-3">{item.moisture}%</td>
                      <td className="p-3">{item.waterLevel ?? '-'}%</td>
                      <td className="p-3"><span className="px-2 py-0.5 rounded-lg text-[10px] bg-[#34D399]/10 text-[#34D399] border border-[#34D399]/30">{item.status}</span></td>
                      <td className="p-3 text-right">
                        <button onClick={() => handleDeleteLog(item.id)} className="text-red-400 hover:text-red-300 p-1"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="7" className="p-4 text-center text-gray-500">No matching records found.</td></tr>
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