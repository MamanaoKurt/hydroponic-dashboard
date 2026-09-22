import React, { useState, useEffect, useMemo } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { 
  Thermometer, Droplets, CloudRain, Fan, Lightbulb, 
  Power, Settings, Wifi, Activity, CheckCircle2, RotateCcw
} from 'lucide-react';

// Helper to generate 24 hours of mock historical data
const generateInitialHistory = () => {
  const data = [];
  const now = new Date();
  for (let i = 24; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60 * 60 * 1000);
    data.push({
      time: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      temp: +(22 + Math.random() * 8).toFixed(1),      // 22-30 C
      humidity: +(50 + Math.random() * 20).toFixed(1), // 50-70 %
      moisture: +(30 + Math.random() * 30).toFixed(1), // 30-60 %
    });
  }
  return data;
};

export default function HydroponicsDashboard() {
  // --- STATE ---
  // 1. Current Sensor Readings
  const [readings, setReadings] = useState({
    temp: 26.5,
    humidity: 62.0,
    moisture: 45.0,
  });

  // 2. Historical Data for Chart
  const [history, setHistory] = useState(generateInitialHistory());

  // 3. System Thresholds (Settings)
  const [thresholds, setThresholds] = useState({
    fanTempTarget: 28,     // Turn on Fan if Temp > 28
    lightTempTarget: 20,   // Turn on Lights if Temp < 20
    pumpMoistureTarget: 40 // Turn on Pump if Moisture < 40
  });

  // 4. Actuator States
  const [actuators, setActuators] = useState({
    fan: { mode: 'auto', isOn: false },
    lights: { mode: 'auto', isOn: false },
    pump: { mode: 'auto', isOn: false }
  });

  const [isConnected, setIsConnected] = useState(true);

  // --- SIMULATION & AUTO-LOGIC ---
  
  // Simulate incoming ESP32 telemetry every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setReadings(prev => {
        // Random walk for natural-looking variations
        const newTemp = prev.temp + (Math.random() - 0.5) * 0.5;
        const newHum = prev.humidity + (Math.random() - 0.5) * 1.5;
        const newMoist = prev.moisture + (Math.random() - 0.5) * 1.0 + (actuators.pump.isOn ? 2.0 : -0.2); // Pump increases moisture
        
        const newReadings = {
          temp: Math.max(10, Math.min(40, newTemp)),
          humidity: Math.max(20, Math.min(90, newHum)),
          moisture: Math.max(10, Math.min(90, newMoist)),
        };

        // Update history periodically
        setHistory(currHistory => {
          const now = new Date();
          const newPoint = {
            time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second:'2-digit' }),
            temp: +(newReadings.temp).toFixed(1),
            humidity: +(newReadings.humidity).toFixed(1),
            moisture: +(newReadings.moisture).toFixed(1),
          };
          return [...currHistory.slice(1), newPoint]; // Keep last 24 points
        });

        return newReadings;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [actuators.pump.isOn]); // Re-run if pump state changes so moisture logic updates

  // Evaluate Auto-Logic based on thresholds and current readings
  useEffect(() => {
    setActuators(prev => {
      const next = { ...prev };
      
      // Fan Logic
      if (next.fan.mode === 'auto') {
        next.fan.isOn = readings.temp > thresholds.fanTempTarget;
      }
      // Light Logic
      if (next.lights.mode === 'auto') {
        next.lights.isOn = readings.temp < thresholds.lightTempTarget;
      }
      // Pump Logic
      if (next.pump.mode === 'auto') {
        next.pump.isOn = readings.moisture < thresholds.pumpMoistureTarget;
      }

      // Check if anything actually changed to prevent infinite re-renders
      if (
        next.fan.isOn !== prev.fan.isOn || 
        next.lights.isOn !== prev.lights.isOn || 
        next.pump.isOn !== prev.pump.isOn
      ) {
        return next;
      }
      return prev;
    });
  }, [readings, thresholds]);

  // --- HANDLERS ---
  const handleThresholdChange = (key, value) => {
    setThresholds(prev => ({ ...prev, [key]: Number(value) }));
  };

  const toggleActuatorMode = (device) => {
    setActuators(prev => ({
      ...prev,
      [device]: { ...prev[device], mode: prev[device].mode === 'auto' ? 'manual' : 'auto' }
    }));
  };

  const toggleActuatorState = (device) => {
    setActuators(prev => {
      if (prev[device].mode === 'auto') return prev; // Cannot manually toggle in auto mode
      return {
        ...prev,
        [device]: { ...prev[device], isOn: !prev[device].isOn }
      };
    });
  };

  // --- UI COMPONENTS ---
  
  const StatCard = ({ title, value, unit, icon: Icon, color, trend }) => (
    <div className="bg-slate-800/80 backdrop-blur-md border border-slate-700/50 rounded-2xl p-5 flex items-center justify-between shadow-xl">
      <div>
        <p className="text-slate-400 text-sm font-medium mb-1">{title}</p>
        <div className="flex items-baseline gap-1">
          <h3 className="text-3xl font-bold text-slate-100">{value.toFixed(1)}</h3>
          <span className="text-slate-500 font-semibold">{unit}</span>
        </div>
      </div>
      <div className={`p-4 rounded-full ${color} bg-opacity-10 border border-current border-opacity-20`}>
        <Icon className={`w-8 h-8 ${color}`} strokeWidth={1.5} />
      </div>
    </div>
  );

  const ActuatorCard = ({ title, deviceKey, icon: Icon, colorClass, activeColorClass }) => {
    const data = actuators[deviceKey];
    const isAuto = data.mode === 'auto';
    const isActive = data.isOn;

    return (
      <div className={`relative overflow-hidden rounded-2xl border transition-all duration-300 ${isActive ? 'bg-slate-800/90 border-slate-600' : 'bg-slate-800/40 border-slate-700/50'} p-5 shadow-lg`}>
        {isActive && (
          <div className={`absolute -top-10 -right-10 w-32 h-32 blur-3xl opacity-20 rounded-full ${activeColorClass.split(' ')[0]} bg-current pointer-events-none`} />
        )}
        
        <div className="flex justify-between items-start mb-6 relative z-10">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl ${isActive ? activeColorClass + ' bg-opacity-10' : 'text-slate-500 bg-slate-700/30'}`}>
              <Icon className={`w-6 h-6 ${isActive && deviceKey === 'fan' ? 'animate-spin-slow' : ''}`} />
            </div>
            <div>
              <h4 className="font-semibold text-slate-200">{title}</h4>
              <p className={`text-xs font-medium uppercase tracking-wider ${isActive ? activeColorClass : 'text-slate-500'}`}>
                {isActive ? 'Running' : 'Standby'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-2 relative z-10">
          <button 
            onClick={() => toggleActuatorMode(deviceKey)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-colors ${isAuto ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' : 'bg-slate-700/50 text-slate-400 border-slate-600 hover:bg-slate-700'}`}
          >
            Auto
          </button>
          <button 
            onClick={() => toggleActuatorState(deviceKey)}
            disabled={isAuto}
            className={`flex-1 py-2 flex items-center justify-center gap-2 text-sm font-medium rounded-lg border transition-colors ${
              isAuto 
                ? 'opacity-50 cursor-not-allowed bg-slate-800 border-slate-700 text-slate-500' 
                : isActive
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30'
                  : 'bg-slate-700/50 text-slate-300 border-slate-600 hover:bg-slate-700'
            }`}
          >
            <Power className="w-4 h-4" />
            {isActive ? 'Turn Off' : 'Turn On'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 p-4 md:p-6 lg:p-8 font-sans selection:bg-indigo-500/30">
      
      {/* HEADER */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Activity className="text-emerald-500 w-8 h-8" />
            Greenhouse Core
          </h1>
          <p className="text-slate-400 text-sm mt-1 ml-11">ESP32 Telemetry & Control System</p>
        </div>
        <div className="flex items-center gap-3 px-4 py-2 bg-slate-800/80 border border-slate-700 rounded-full shadow-sm">
          <div className="relative">
             <Wifi className={`w-4 h-4 ${isConnected ? 'text-emerald-400' : 'text-red-400'}`} />
             {isConnected && <span className="absolute top-0 right-0 w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />}
          </div>
          <span className="text-sm font-medium text-slate-300">
            {isConnected ? 'ESP32 Connected (MQTT)' : 'Disconnected'}
          </span>
        </div>
      </header>

      {/* TOP STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <StatCard 
          title="Ambient Temperature" 
          value={readings.temp} 
          unit="°C" 
          icon={Thermometer} 
          color="text-orange-400" 
        />
        <StatCard 
          title="Air Humidity" 
          value={readings.humidity} 
          unit="%" 
          icon={Droplets} 
          color="text-blue-400" 
        />
        <StatCard 
          title="Substrate Moisture" 
          value={readings.moisture} 
          unit="%" 
          icon={CloudRain} 
          color="text-emerald-400" 
        />
      </div>

      {/* MIDDLE CHART */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5 mb-6 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-400" />
            24H Telemetry History
          </h2>
        </div>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={history} margin={{ top: 5, right: 20, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis 
                dataKey="time" 
                stroke="#64748b" 
                fontSize={12}
                tickLine={false}
                axisLine={false}
                minTickGap={30}
              />
              <YAxis 
                stroke="#64748b" 
                fontSize={12}
                tickLine={false}
                axisLine={false}
                domain={['auto', 'auto']}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '0.5rem', color: '#f8fafc' }}
                itemStyle={{ fontWeight: 500 }}
              />
              <Legend iconType="circle" wrapperStyle={{ fontSize: '14px', paddingTop: '10px' }}/>
              <Line type="monotone" dataKey="temp" name="Temp (°C)" stroke="#fb923c" strokeWidth={2} dot={false} activeDot={{ r: 6, strokeWidth: 0 }} />
              <Line type="monotone" dataKey="humidity" name="Humidity (%)" stroke="#60a5fa" strokeWidth={2} dot={false} activeDot={{ r: 6, strokeWidth: 0 }} />
              <Line type="monotone" dataKey="moisture" name="Moisture (%)" stroke="#34d399" strokeWidth={2} dot={false} activeDot={{ r: 6, strokeWidth: 0 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* BOTTOM SECTION: Controls & Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Actuators (Takes up 2 columns on large screens) */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2 px-1">
            <Power className="w-5 h-5 text-slate-400" />
            Actuator Override
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <ActuatorCard 
              title="Exhaust Fan" 
              deviceKey="fan" 
              icon={Fan} 
              colorClass="text-slate-400"
              activeColorClass="text-cyan-400"
            />
            <ActuatorCard 
              title="Grow Lights" 
              deviceKey="lights" 
              icon={Lightbulb} 
              colorClass="text-slate-400"
              activeColorClass="text-yellow-400"
            />
            <ActuatorCard 
              title="Water Pump" 
              deviceKey="pump" 
              icon={RotateCcw} 
              colorClass="text-slate-400"
              activeColorClass="text-blue-400"
            />
          </div>
        </div>

        {/* Settings Panel */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2 px-1">
            <Settings className="w-5 h-5 text-slate-400" />
            Automation Triggers
          </h2>
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5 shadow-lg space-y-5">
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 flex justify-between">
                <span>Fan Target (Cooling)</span>
                <span className="text-cyan-400">{thresholds.fanTempTarget}°C</span>
              </label>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500">Trigger if &gt;</span>
                <input 
                  type="range" 
                  min="20" max="40" step="1"
                  value={thresholds.fanTempTarget}
                  onChange={(e) => handleThresholdChange('fanTempTarget', e.target.value)}
                  className="w-full accent-cyan-500 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 flex justify-between">
                <span>Light Target (Heating)</span>
                <span className="text-yellow-400">{thresholds.lightTempTarget}°C</span>
              </label>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500">Trigger if &lt;</span>
                <input 
                  type="range" 
                  min="10" max="30" step="1"
                  value={thresholds.lightTempTarget}
                  onChange={(e) => handleThresholdChange('lightTempTarget', e.target.value)}
                  className="w-full accent-yellow-500 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300 flex justify-between">
                <span>Pump Target (Watering)</span>
                <span className="text-blue-400">{thresholds.pumpMoistureTarget}%</span>
              </label>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500">Trigger if &lt;</span>
                <input 
                  type="range" 
                  min="10" max="80" step="1"
                  value={thresholds.pumpMoistureTarget}
                  onChange={(e) => handleThresholdChange('pumpMoistureTarget', e.target.value)}
                  className="w-full accent-blue-500 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .animate-spin-slow {
          animation: spin 3s linear infinite;
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: currentColor;
          cursor: pointer;
        }
      `}} />
    </div>
  );
}