import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import {
  Activity, Database, Shield, Server, Box, Fingerprint,
  CheckCircle2, PlayCircle, Loader2, ScrollText, Network,
  Maximize2, Minimize2
} from 'lucide-react';

const SOCKET_URL = 'http://localhost:4000';
const API_URL = 'http://localhost:4000/api';

function App() {
  const [isTraining, setIsTraining] = useState(false);
  const [logs, setLogs] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [socket, setSocket] = useState(null);
  const [maximizedPanel, setMaximizedPanel] = useState(null); // 'ledger', 'logs', or null
  const logsEndRef = useRef(null);

  useEffect(() => {
    // Scroll to bottom of logs
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  useEffect(() => {
    // Initial fetch of status and ledger
    axios.get(`${API_URL}/status`).then(res => setIsTraining(res.data.active)).catch(console.error);
    axios.get(`${API_URL}/ledger`).then(res => setLedger(res.data)).catch(console.error);

    // Socket Connection
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    newSocket.on('training_status', (data) => {
      setIsTraining(data.active);
      if (data.message) {
        addLog({ source: 'System', log: data.message });
      }
    });

    newSocket.on('training_log', (data) => {
      addLog(data);
    });

    newSocket.on('new_ledger_entry', (entry) => {
      setLedger(prev => [...prev, entry]);
      addLog({ source: 'Blockchain_Mock', log: `Mined Block: ${entry.modelHash.substring(0, 12)}...` });
    });

    return () => newSocket.close();
  }, []);

  const addLog = (logObj) => {
    setLogs(prev => [...prev, logObj]);
  };

  const handleTriggerRound = async () => {
    if (isTraining) return;
    try {
      await axios.post(`${API_URL}/trigger-round`);
      setLogs([]); // Clear logs for new round
    } catch (error) {
      console.error("Failed to trigger training", error);
      addLog({ source: 'Frontend', log: `Error: ${error.response?.data?.error || error.message}` });
    }
  };

  const getSourceColor = (source) => {
    if (source.includes('bhopal')) return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
    if (source.includes('balaghat')) return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
    if (source.includes('indore')) return 'text-purple-400 bg-purple-400/10 border-purple-400/20';
    if (source.includes('Server')) return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
    if (source.includes('Blockchain')) return 'text-fuchsia-400 bg-fuchsia-400/10 border-fuchsia-400/20';
    return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
  };

  return (
    <div className="h-screen bg-[#0a0a0c] text-slate-200 font-sans p-4 sm:p-6 flex flex-col overflow-hidden selection:bg-blue-500/30">
      {/* Header */}
      <header className="max-w-[1600px] w-full mx-auto flex shrink-0 items-center justify-between border-b border-white/5 pb-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg shadow-blue-900/20 ring-1 ring-white/10">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Sovereign-Health <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">v1.0-alpha</span>
            </h1>
            <p className="text-sm text-slate-400 mt-1">Federated Learning meets Blockchain Verification</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Shield className="w-4 h-4 text-emerald-500" />
            <span>Zero Data Egress</span>
          </div>
          <button
            onClick={handleTriggerRound}
            disabled={isTraining}
            className={`
              relative overflow-hidden group px-6 py-2.5 rounded-lg font-medium tracking-wide flex items-center gap-2 transition-all duration-300 shadow-xl
              ${isTraining
                ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700'
                : 'bg-white text-black hover:bg-slate-100 hover:scale-[1.02] border border-white focus:ring-4 focus:ring-white/20 active:scale-95'}
            `}
          >
            {isTraining ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Training in Progress...</span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
              </>
            ) : (
              <>
                <PlayCircle className="w-4 h-4" />
                <span>Trigger Federated Round</span>
              </>
            )}
          </button>
        </div>
      </header>

      <main className="max-w-[1600px] w-full mx-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0 relative">

        {/* Left Column: Visualizer & Ledger */}
        <div className={`flex flex-col gap-6 transition-all duration-500 ${maximizedPanel === 'ledger' ? 'lg:col-span-12 absolute inset-0 z-50 bg-[#0a0a0c]' : maximizedPanel === 'logs' ? 'hidden' : 'lg:col-span-7 h-full min-h-0'}`}>

          {/* Edge Nodes Visualizer (hides when ledger is maximized) */}
          {!maximizedPanel && (
            <div className="bg-[#111115] border border-white/5 rounded-2xl p-5 shadow-2xl relative overflow-hidden group hover:border-white/10 transition-colors shrink-0">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

              <div className="flex items-center justify-between mb-6 relative">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Network className="w-5 h-5 text-blue-400" />
                  The Tri-Layer Network
                </h2>
                <div className="flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    {isTraining && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
                    <span className={`relative inline-flex rounded-full h-3 w-3 ${isTraining ? 'bg-emerald-500' : 'bg-slate-600'}`}></span>
                  </span>
                  <span className="text-xs text-slate-400 font-medium tracking-wider uppercase">
                    {isTraining ? 'Network Active' : 'Idle'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 relative">
                {/* Central Aggregator Line (CSS visual hack) */}
                <div className="absolute top-1/2 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-y-1/2" />

                {/* Nodes */}
                {[
                  { id: 'Bhopal City', icon: Database, color: 'text-emerald-400' },
                  { id: 'Aggregator', icon: Server, color: 'text-blue-400', isCenter: true },
                  { id: 'Balaghat Clinic', icon: Database, color: 'text-amber-400' }
                ].map((node, i) => (
                  <div key={i} className={`flex flex-col items-center gap-3 relative z-10 ${node.isCenter ? 'transform -translate-y-3' : ''}`}>
                    <div className={`
                      w-14 h-14 rounded-2xl flex items-center justify-center 
                      backdrop-blur-xl border border-white/10 shadow-xl
                      transition-all duration-500
                      ${isTraining && node.isCenter ? 'bg-blue-500/20 shadow-blue-500/20 scale-110' : 'bg-[#1a1a20] hover:bg-[#22222a]'}
                      ${isTraining && !node.isCenter ? 'animate-pulse' : ''}
                    `}>
                      <node.icon className={`w-7 h-7 ${node.color} ${isTraining && node.isCenter ? 'animate-bounce' : ''}`} />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-slate-300">{node.id}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{node.isCenter ? 'Global Model' : 'Local EHR Split'}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-center mt-4 z-10 relative">
                <div className="flex flex-col items-center gap-3">
                  <div className={`
                      w-14 h-14 rounded-2xl flex items-center justify-center 
                      backdrop-blur-xl border border-white/10 shadow-xl
                      transition-all duration-500 bg-[#1a1a20]
                      ${isTraining ? 'animate-pulse' : ''}
                    `}>
                    <Database className={`w-7 h-7 text-purple-400`} />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-slate-300">Indore Med Center</p>
                    <p className="text-xs text-slate-500 mt-0.5">Local EHR Split</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Blockchain Ledger Document */}
          <div className="bg-[#111115] border border-white/5 rounded-2xl p-5 shadow-2xl flex-1 flex flex-col min-h-0 hover:border-white/10 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <ScrollText className="w-5 h-5 text-fuchsia-400" />
                Immutable Contribution Ledger
              </h2>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full bg-fuchsia-500/10 text-fuchsia-400 text-xs font-medium tracking-wide border border-fuchsia-500/20">
                  Mock Contract
                </span>
                <button
                  onClick={() => setMaximizedPanel(maximizedPanel === 'ledger' ? null : 'ledger')}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white"
                >
                  {maximizedPanel === 'ledger' ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto rounded-xl border border-white/5 bg-[#0d0d10] custom-scrollbar">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-[#15151a] sticky top-0 z-10 text-slate-400 font-medium shadow-md">
                  <tr>
                    <th className="px-5 py-3 border-b border-white/5">Round</th>
                    <th className="px-5 py-3 border-b border-white/5">Hospital Node</th>
                    <th className="px-5 py-3 border-b border-white/5">Hash Proof</th>
                    <th className="px-5 py-3 border-b border-white/5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {ledger.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-5 py-12 text-center text-slate-500 italic">
                        No cryptographic proofs recorded yet. Trigger a round.
                      </td>
                    </tr>
                  ) : (
                    ledger.map((entry, idx) => (
                      <tr key={idx} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="px-5 py-3 font-mono text-slate-300">#{entry.roundId}</td>
                        <td className="px-5 py-3 text-slate-300">
                          <span className={`px-2 py-1 rounded-md text-xs border ${getSourceColor(entry.hospitalId)}`}>
                            {entry.hospitalId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                        </td>
                        <td className="px-5 py-3 font-mono text-xs text-slate-400 flex items-center gap-2">
                          <Fingerprint className="w-3 h-3 text-fuchsia-500/50" />
                          {entry.modelHash.substring(0, 16)}...
                        </td>
                        <td className="px-5 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5 text-emerald-400">
                            <CheckCircle2 className="w-4 h-4" />
                            <span className="text-xs font-semibold">Verified</span>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Right Column: Terminal Logs */}
        <div className={`transition-all duration-500 ${maximizedPanel === 'logs' ? 'lg:col-span-12 absolute inset-0 z-50 bg-[#0a0a0c]' : maximizedPanel === 'ledger' ? 'hidden' : 'lg:col-span-5 h-full min-h-0'} bg-[#09090b] border border-white/5 rounded-2xl overflow-hidden shadow-2xl flex flex-col font-mono relative ring-1 ring-white/5`}>
          <div className="bg-[#111115] px-4 py-3 border-b border-white/5 flex items-center justify-between z-10 shrink-0">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
            </div>
            <span className="text-xs text-slate-500 font-medium tracking-wider">docker_logs_v2.log</span>
            <div className="w-[52px] flex justify-end">
              <button
                onClick={() => setMaximizedPanel(maximizedPanel === 'logs' ? null : 'logs')}
                className="p-1 -mr-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white"
              >
                {maximizedPanel === 'logs' ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex-1 p-5 overflow-y-auto text-xs sm:text-sm leading-relaxed scroll-smooth flex flex-col gap-1 custom-scrollbar relative">
            {/* Subtle scanline effect */}
            <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.1)_50%)] bg-[length:100%_4px] pointer-events-none opacity-20" />

            {logs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-4 animate-pulse">
                <Box className="w-12 h-12 opacity-50" />
                <p>Waiting for orchestration signal...</p>
              </div>
            ) : (
              logs.map((L, i) => (
                <div key={i} className="flex gap-4 hover:bg-white/5 px-2 py-1 -mx-2 rounded transition-colors break-words text-slate-300">
                  <span className="text-slate-500 select-none shrink-0 w-16">
                    {new Date().toISOString().substring(11, 19)}
                  </span>
                  <span className={`shrink-0 w-24 sm:w-32 truncate font-semibold ${L.source === 'Server' ? 'text-blue-400' :
                    L.source === 'System' ? 'text-white' :
                      L.source.includes('Error') ? 'text-red-400' :
                        'text-emerald-400'
                    }`}>
                    [{L.source}]
                  </span>
                  <span className={`flex-1 break-all ${L.source.includes('Error') ? 'text-red-400' : ''}`}>
                    {L.log.trim()}
                  </span>
                </div>
              ))
            )}
            <div ref={logsEndRef} />
          </div>
        </div>

      </main>
    </div>
  );
}

export default App;
