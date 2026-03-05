import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import {
  Activity, Database, Shield, Server, Box, Fingerprint,
  CheckCircle2, PlayCircle, Loader2, ScrollText, Network,
  Maximize2, Minimize2, Github, ExternalLink, Code2, Heart
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

  const terminalRef = useRef(null);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    // Correct internal terminal-only auto-scroll to avoid page viewport jumping
    if (autoScroll && terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

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
      addLog({ source: 'Blockchain', log: `Mined Block: ${entry.modelHash.substring(0, 12)}...` });
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
    <div className="min-h-screen bg-[#070709] text-slate-200 font-sans selection:bg-blue-500/30 overflow-x-hidden flex flex-col">

      {/* ── Main Dashboard Area (Forces min 90vh viewport) ── */}
      <div className="flex-1 flex flex-col max-w-[1600px] w-full mx-auto p-4 sm:p-6 min-h-[92vh]">
        {/* Header */}
        <header className="flex w-full shrink-0 items-center justify-between border-b border-white/5 pb-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-[0_0_30px_rgba(59,130,246,0.2)] ring-1 ring-white/10">
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
            <div className="hidden sm:flex items-center gap-2 text-sm text-emerald-400/90 font-medium tracking-wide">
              <Shield className="w-4 h-4" />
              <span>Zero Data Egress Design</span>
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

        {/* Dynamic Main Grid */}
        <main className={`flex-1 grid grid-cols-1 ${maximizedPanel ? 'lg:grid-cols-1' : 'lg:grid-cols-12'} gap-6 min-h-0 relative`}>

          {/* Left Column: Visualizer & Ledger */}
          <div className={`flex flex-col gap-6 transition-all duration-500 ${maximizedPanel === 'ledger' ? 'col-span-12 h-[75vh]' : maximizedPanel === 'logs' ? 'hidden' : 'lg:col-span-7 h-[75vh] md:h-auto'}`}>

            {/* Edge Nodes Visualizer (Hidden when ledger is maximized) */}
            {!maximizedPanel && (
              <div className="bg-[#111115] border border-white/5 rounded-2xl p-6 shadow-2xl relative overflow-hidden group hover:border-white/10 transition-colors shrink-0">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                <div className="flex items-center justify-between mb-8 relative">
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
                  <div className="absolute top-1/2 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-y-1/2" />
                  {[
                    { id: 'Bhopal City', icon: Database, color: 'text-emerald-400' },
                    { id: 'Aggregator', icon: Server, color: 'text-blue-400', isCenter: true },
                    { id: 'Balaghat Clinic', icon: Database, color: 'text-amber-400' }
                  ].map((node, i) => (
                    <div key={i} className={`flex flex-col items-center gap-3 relative z-10 ${node.isCenter ? 'transform -translate-y-3' : ''}`}>
                      <div className={`
                        w-16 h-16 rounded-2xl flex items-center justify-center 
                        backdrop-blur-xl border shadow-xl
                        transition-all duration-700
                        ${isTraining && node.isCenter ? 'bg-blue-500/20 shadow-blue-500/20 border-blue-500/50 scale-110' : 'bg-[#1a1a20] border-white/10 hover:bg-[#22222a]'}
                        ${isTraining && !node.isCenter ? 'animate-pulse' : ''}
                      `}>
                        <node.icon className={`w-8 h-8 ${node.color} ${isTraining && node.isCenter ? 'animate-bounce' : ''}`} />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-slate-200">{node.id}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{node.isCenter ? 'Global Model' : 'Local EHR Split'}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-center mt-6 z-10 relative">
                  <div className="flex flex-col items-center gap-3">
                    <div className={`
                        w-16 h-16 rounded-2xl flex items-center justify-center 
                        backdrop-blur-xl border border-white/10 shadow-xl
                        transition-all duration-500 bg-[#1a1a20]
                        ${isTraining ? 'animate-pulse' : ''}
                      `}>
                      <Database className={`w-8 h-8 text-purple-400`} />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-slate-200">Indore Med Center</p>
                      <p className="text-xs text-slate-500 mt-0.5">Local EHR Split</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Blockchain Ledger Document */}
            <div className={`bg-[#111115] border border-white/5 rounded-2xl p-6 shadow-2xl flex-1 flex flex-col min-h-[300px] hover:border-white/10 transition-colors`}>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <ScrollText className="w-5 h-5 text-fuchsia-400" />
                  Immutable Contribution Ledger
                </h2>
                <div className="flex items-center gap-4">
                  <span className="px-3 py-1 rounded-full bg-fuchsia-500/10 text-fuchsia-400 text-xs font-semibold tracking-wide border border-fuchsia-500/20 shadow-[0_0_15px_rgba(217,70,239,0.1)]">
                    Live Smart Contract
                  </span>
                  <button
                    onClick={() => setMaximizedPanel(maximizedPanel === 'ledger' ? null : 'ledger')}
                    className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all text-slate-300 hover:text-white"
                  >
                    {maximizedPanel === 'ledger' ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-auto rounded-xl border border-white/5 bg-[#0d0d10] custom-scrollbar shadow-inner relative">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-[#15151a]/95 backdrop-blur sticky top-0 z-10 text-slate-400 font-medium border-b border-white/10">
                    <tr>
                      <th className="px-6 py-4">Round</th>
                      <th className="px-6 py-4">Hospital Node</th>
                      <th className="px-6 py-4">Hash Proof (SHA-256)</th>
                      <th className="px-6 py-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {ledger.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="px-6 py-16 text-center">
                          <div className="flex flex-col items-center justify-center text-slate-500">
                            <Box className="w-10 h-10 mb-3 opacity-40 shrink-0" />
                            <p className="italic">No cryptographic proofs recorded yet.</p>
                            <p className="text-xs mt-1 opacity-70">Trigger a round to begin decentralized training.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      [...ledger].reverse().map((entry, idx) => (
                        <tr key={idx} className="hover:bg-white/[0.03] transition-colors group">
                          <td className="px-6 py-4 font-mono text-slate-300 font-medium">#{entry.roundId}</td>
                          <td className="px-6 py-4 text-slate-300">
                            <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${getSourceColor(entry.hospitalId)}`}>
                              {entry.hospitalId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-mono text-xs text-slate-400 flex items-center gap-2 group-hover:text-slate-300 transition-colors">
                            <Fingerprint className="w-3.5 h-3.5 text-fuchsia-500/50" />
                            {entry.modelHash.substring(0, 24)}...
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5 text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded-md inline-flex border border-emerald-400/20">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span className="text-xs font-bold tracking-wide">VERIFIED</span>
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
          <div className={`transition-all duration-500 ${maximizedPanel === 'logs' ? 'col-span-12 h-[75vh]' : maximizedPanel === 'ledger' ? 'hidden' : 'lg:col-span-5 h-[50vh] md:h-auto min-h-[300px]'} bg-[#09090b] border border-white/5 rounded-2xl overflow-hidden shadow-2xl flex flex-col font-mono relative ring-1 ring-white/5 group hover:border-white/10`}>
            {/* Terminal Header */}
            <div className="bg-[#111115] px-5 py-3.5 border-b border-white/5 flex items-center justify-between z-10 shrink-0">
              <div className="flex gap-2.5">
                <div className="w-3 h-3 rounded-full bg-red-500/80 shadow-[0_0_10px_rgba(239,68,68,0.4)]"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/80 shadow-[0_0_10px_rgba(234,179,8,0.4)]"></div>
                <div className="w-3 h-3 rounded-full bg-emerald-500/80 shadow-[0_0_10px_rgba(16,185,129,0.4)]"></div>
              </div>
              <span className="text-xs text-slate-400 font-bold tracking-widest text-center flex-1">ORCHESTRATOR.LOG</span>
              <div className="flex justify-end">
                <button
                  onClick={() => setMaximizedPanel(maximizedPanel === 'logs' ? null : 'logs')}
                  className="p-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-md transition-all text-slate-400 hover:text-white"
                >
                  {maximizedPanel === 'logs' ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div
              ref={terminalRef}
              className="flex-1 p-5 overflow-y-auto text-xs sm:text-sm leading-relaxed scroll-smooth flex flex-col gap-1.5 custom-scrollbar relative"
              onScroll={(e) => {
                const bottom = e.currentTarget.scrollHeight - e.currentTarget.scrollTop <= e.currentTarget.clientHeight + 100;
                setAutoScroll(bottom);
              }}
            >
              <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.15)_50%)] bg-[length:100%_4px] pointer-events-none opacity-30 sticky top-0" />

              {logs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-4 animate-pulse">
                  <Box className="w-12 h-12 opacity-40 shrink-0" />
                  <p className="font-sans font-medium tracking-wide">Waiting for orchestration signal...</p>
                </div>
              ) : (
                logs.map((L, i) => (
                  <div key={i} className="flex gap-3 hover:bg-white/5 px-2 py-1.5 -mx-2 rounded transition-colors break-words text-slate-300">
                    <span className="text-slate-500 select-none shrink-0 w-20 font-medium">
                      {new Date().toISOString().substring(11, 19)}
                    </span>
                    <span className={`shrink-0 w-28 sm:w-36 truncate font-bold uppercase tracking-wider ${L.source === 'Aggregator' ? 'text-blue-400' :
                      L.source === 'System' ? 'text-slate-100' :
                        L.source.includes('Error') ? 'text-red-400' :
                          L.source.includes('Blockchain') ? 'text-fuchsia-400' :
                            'text-emerald-400'
                      }`}>
                      [{L.source}]
                    </span>
                    <span className={`flex-1 font-medium tracking-wide break-words ${L.source.includes('Error') ? 'text-red-400 bg-red-400/10 px-2 py-0.5 rounded' :
                      L.log.includes('[OK]') ? 'text-emerald-300 font-bold' :
                        L.log.includes('======') ? 'text-blue-300 font-bold' : ''
                      }`}>
                      {L.log.trim()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </main>
      </div>

      {/* ── Modern "About Developer" Footer ── */}
      <footer className="w-full bg-[#030304] border-t border-white/5 relative overflow-hidden mt-8">
        {/* Subtle Background Glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[200px] left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-blue-600/10 blur-[120px] rounded-full" />
        </div>

        <div className="max-w-[1600px] mx-auto px-6 py-16 relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">

          {/* Brand/Info */}
          <div className="flex flex-col items-center md:items-start max-w-lg text-center md:text-left">
            <h3 className="text-2xl font-bold text-white mb-3">Architected by Inayat</h3>
            <p className="text-slate-400 leading-relaxed font-medium">
              A high-precision demonstration of zero-trust ML architectures. Sovereign-Health proves that we can train performant clinical AI without centralizing sensitive patient EHR data.
            </p>
            <div className="flex items-center gap-3 mt-6 text-sm font-medium text-slate-500">
              <span className="flex items-center gap-1.5"><Code2 className="w-4 h-4" /> Built with React v18</span>
              <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
              <span className="flex items-center gap-1.5"><Database className="w-4 h-4" /> PyTorch Edge</span>
            </div>
          </div>

          {/* Social / Connect Card */}
          <a
            href="https://github.com/Inayat-0007/sovereign-health-by-INAYAT"
            target="_blank"
            rel="noreferrer"
            className="group relative flex items-center gap-5 bg-[#0a0a0c] border border-white/10 hover:border-blue-500/30 p-5 rounded-2xl shadow-2xl transition-all duration-300 hover:scale-105 hover:bg-[#0f0f14]"
          >
            {/* Dynamic Card Glow */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/0 to-indigo-500/0 group-hover:from-blue-500/5 group-hover:to-indigo-500/5 transition-colors" />

            <div className="bg-white/5 p-4 rounded-xl border border-white/10 group-hover:bg-blue-500/10 transition-colors">
              <Github className="w-8 h-8 text-slate-200 group-hover:text-blue-400 transition-colors" />
            </div>

            <div className="pr-4">
              <p className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                Open Source
              </p>
              <h4 className="text-lg font-bold text-white group-hover:text-blue-50 flex items-center gap-2">
                View Repository
                <ExternalLink className="w-4 h-4 opacity-50 group-hover:opacity-100 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all" />
              </h4>
            </div>
          </a>

        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/5 bg-[#020202]">
          <div className="max-w-[1600px] mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium text-slate-500">
            <p className="flex items-center gap-1.5">
              Developed with <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500/20" /> for decentralized healthcare.
            </p>
            <p>
              © {new Date().getFullYear()} Sovereign-Health AI. All rights strictly reserved.
            </p>
          </div>
        </div>
      </footer >
    </div >
  );
}

export default App;
