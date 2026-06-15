'use client';

import { useState, useEffect } from 'react';
import { 
  Database, 
  Sparkles, 
  Send, 
  Activity, 
  Users, 
  CheckCircle2, 
  MailOpen, 
  XCircle,
  Play
} from 'lucide-react';

export default function Home() {
  const [segments, setSegments] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isSeeding, setIsSeeding] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Campaign Form State
  const [selectedSegment, setSelectedSegment] = useState('');
  const [campaignName, setCampaignName] = useState('');
  const [message, setMessage] = useState('');
  const [channel, setChannel] = useState('WHATSAPP');

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const segRes = await fetch('/api/segment');
      if (segRes.ok) setSegments((await segRes.json()).segments);
      
      const campRes = await fetch('/api/campaigns');
      if (campRes.ok) setCampaigns((await campRes.json()).campaigns);
    } catch (e) {}
  };

  const handleSeed = async () => {
    setIsSeeding(true);
    await fetch('/api/seed', { method: 'POST' });
    setIsSeeding(false);
    fetchData();
  };

  const handleCreateSegment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt) return;
    setIsGenerating(true);
    await fetch('/api/segment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: aiPrompt })
    });
    setAiPrompt('');
    setIsGenerating(false);
    fetchData();
  };

  const handleLaunchCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSegment || !campaignName || !message) return;
    
    await fetch('/api/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: campaignName, segmentId: selectedSegment, message, channel })
    });
    
    setCampaignName('');
    setMessage('');
    fetchData();
  };

  return (
    <main className="min-h-screen bg-[#F0F4F8] text-slate-800 font-sans selection:bg-blue-500/20 overflow-hidden relative">
      {/* Soft Blue Accents */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-400/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-300/10 blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 py-12 relative z-10 space-y-12">
        
        {/* Navbar / Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center pb-6 border-b border-blue-200/50 gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-blue-900 tracking-tight">Xeno AI</h1>
              <p className="text-sm text-blue-600/70 font-medium">Intelligent CRM Platform</p>
            </div>
          </div>
          <button 
            onClick={handleSeed}
            disabled={isSeeding}
            className="group flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-blue-50 rounded-full text-sm font-bold text-blue-700 transition-all border border-blue-200 shadow-sm hover:shadow-md"
          >
            <Database className={`w-4 h-4 text-blue-500 ${isSeeding ? 'animate-spin' : 'group-hover:scale-110 transition-transform'}`} />
            {isSeeding ? 'Initializing...' : 'Initialize Demo Data'}
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Segment Builder */}
          <div className="col-span-1 lg:col-span-5 space-y-8">
            <div className="bg-white border border-blue-100 p-8 rounded-[2rem] shadow-xl shadow-blue-900/5 relative group overflow-hidden transition-all hover:border-blue-300">
              
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-blue-50 rounded-xl border border-blue-100">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-blue-900">AI Audience Builder</h2>
              </div>

              <form onSubmit={handleCreateSegment} className="space-y-5">
                <div className="relative group/input">
                  <input 
                    type="text" 
                    value={aiPrompt}
                    onChange={e => setAiPrompt(e.target.value)}
                    placeholder="e.g. Find shoppers who spent over $100"
                    className="w-full bg-[#F8FAFC] border border-blue-100 rounded-2xl pl-5 pr-14 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all text-blue-900 placeholder-blue-400 font-medium"
                  />
                  <button 
                    type="submit" 
                    disabled={isGenerating || !aiPrompt}
                    className="absolute right-2 top-2 bottom-2 aspect-square bg-blue-600 hover:bg-blue-700 disabled:bg-blue-100 disabled:text-blue-300 text-white rounded-xl flex items-center justify-center transition-all shadow-md"
                  >
                    <Send className={`w-4 h-4 ${isGenerating ? 'animate-pulse' : ''}`} />
                  </button>
                </div>
              </form>

              <div className="mt-8">
                <h3 className="text-xs font-bold text-blue-400 mb-4 uppercase tracking-widest">Target Segments</h3>
                <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                  {segments.map((s, i) => (
                    <div key={s.id} className="p-4 bg-blue-50/50 hover:bg-blue-50 rounded-2xl border border-blue-100 flex flex-col gap-1.5 transition-colors cursor-default animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: `${i * 50}ms` }}>
                      <span className="font-semibold text-blue-900 text-sm flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-500" />
                        {s.name}
                      </span>
                      <span className="text-xs text-blue-600/70 ml-6 font-medium">{s.description}</span>
                    </div>
                  ))}
                  {segments.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-8 text-blue-300 text-sm font-medium">
                      <Users className="w-8 h-8 mb-3 opacity-50" />
                      <p>No segments generated yet.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Campaign Sender */}
          <div className="col-span-1 lg:col-span-7">
            <div className="bg-white border border-blue-100 p-8 rounded-[2rem] shadow-xl shadow-blue-900/5 relative group hover:border-blue-300 transition-all">

              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-blue-50 rounded-xl border border-blue-100">
                  <Play className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-blue-900">Campaign Launcher</h2>
              </div>

              <form onSubmit={handleLaunchCampaign} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-blue-500 uppercase tracking-wider ml-1">Campaign Name</label>
                    <input 
                      type="text" 
                      required
                      value={campaignName}
                      onChange={e => setCampaignName(e.target.value)}
                      placeholder="e.g. Winter Sale 2026"
                      className="w-full bg-[#F8FAFC] border border-blue-100 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all text-blue-900 placeholder-blue-400 font-medium"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-blue-500 uppercase tracking-wider ml-1">Channel</label>
                    <div className="relative">
                      <select 
                        value={channel}
                        onChange={e => setChannel(e.target.value)}
                        className="w-full bg-[#F8FAFC] border border-blue-100 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all appearance-none cursor-pointer text-blue-900 font-medium"
                      >
                        <option value="WHATSAPP">WhatsApp</option>
                        <option value="SMS">SMS</option>
                        <option value="EMAIL">Email</option>
                        <option value="RCS">RCS</option>
                      </select>
                      <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-blue-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-blue-500 uppercase tracking-wider ml-1">Target Audience</label>
                  <div className="relative">
                    <select 
                      required
                      value={selectedSegment}
                      onChange={e => setSelectedSegment(e.target.value)}
                      className="w-full bg-[#F8FAFC] border border-blue-100 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all appearance-none cursor-pointer text-blue-900 font-medium"
                    >
                      <option value="" disabled>Select AI Segment...</option>
                      {segments.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-blue-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                      </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-blue-500 uppercase tracking-wider ml-1">Message Content</label>
                  <textarea 
                    required
                    rows={4}
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="Craft your personalized message here..."
                    className="w-full bg-[#F8FAFC] border border-blue-100 rounded-xl px-4 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all resize-none text-blue-900 placeholder-blue-400 font-medium"
                  />
                </div>

                <div className="pt-3">
                  <button 
                    type="submit" 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold shadow-lg shadow-blue-600/20 hover:shadow-xl hover:shadow-blue-600/30 transition-all flex items-center justify-center gap-2 group"
                  >
                    Deploy Campaign
                    <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Bottom Section: Live Analytics */}
        <div className="bg-white border border-blue-100 p-8 rounded-[2rem] shadow-xl shadow-blue-900/5">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-50 rounded-xl border border-blue-100 relative">
                <div className="absolute inset-0 border-2 border-blue-400/50 rounded-xl animate-ping opacity-30"></div>
                <Activity className="w-5 h-5 text-blue-600 relative z-10" />
              </div>
              <h2 className="text-xl font-bold text-blue-900">Live Operations Center</h2>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-5">
            {campaigns.map((camp, i) => {
              const total = camp.communications.length;
              const sent = camp.communications.filter((c: any) => c.status !== 'PENDING').length;
              const delivered = camp.communications.filter((c: any) => ['DELIVERED', 'OPENED', 'CLICKED'].includes(c.status)).length;
              const opened = camp.communications.filter((c: any) => ['OPENED', 'CLICKED'].includes(c.status)).length;
              const failed = camp.communications.filter((c: any) => c.status === 'FAILED').length;

              const isComplete = sent === total && total > 0;

              return (
                <div key={camp.id} className="p-6 bg-white hover:bg-blue-50/30 rounded-2xl border border-blue-100 shadow-sm transition-all animate-in fade-in zoom-in-95" style={{ animationDelay: `${i * 100}ms` }}>
                  <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
                    <div>
                      <h4 className="text-lg font-bold text-blue-900 flex items-center gap-2">
                        {camp.name}
                        {isComplete && <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" title="Processing Complete"></div>}
                        {!isComplete && <div className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse shadow-[0_0_8px_rgba(96,165,250,0.5)]" title="Processing..."></div>}
                      </h4>
                      <p className="text-sm text-blue-600/80 mt-1 font-medium">
                        <span className="text-blue-700 font-bold">{camp.segment.name}</span> • Via {camp.channel}
                      </p>
                    </div>
                    <span className="px-4 py-1.5 bg-blue-50 border border-blue-100 text-blue-700 rounded-full text-xs font-bold tracking-wide">
                      {camp.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Metric Card */}
                    <div className="bg-[#F8FAFC] p-4 rounded-xl flex items-center gap-4 border border-blue-100/50">
                      <div className="p-2.5 bg-blue-100/50 rounded-lg">
                        <Users className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-[11px] text-blue-500 font-bold uppercase tracking-wider mb-0.5">Audience</div>
                        <div className="text-2xl font-extrabold text-blue-900">{total}</div>
                      </div>
                    </div>

                    <div className="bg-[#F8FAFC] p-4 rounded-xl flex items-center gap-4 border border-blue-100/50">
                      <div className="p-2.5 bg-blue-100/50 rounded-lg">
                        <Send className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-[11px] text-blue-500 font-bold uppercase tracking-wider mb-0.5">Dispatched</div>
                        <div className="text-2xl font-extrabold text-blue-900">{sent}</div>
                      </div>
                    </div>

                    <div className="bg-[#F8FAFC] p-4 rounded-xl flex items-center gap-4 border border-blue-100/50">
                      <div className="p-2.5 bg-blue-100/50 rounded-lg">
                        <CheckCircle2 className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-[11px] text-blue-500 font-bold uppercase tracking-wider mb-0.5">Delivered</div>
                        <div className="text-2xl font-extrabold text-blue-900">{delivered}</div>
                      </div>
                    </div>

                    <div className="bg-[#F8FAFC] p-4 rounded-xl flex flex-col justify-center border border-blue-100/50">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-xs text-blue-600 font-bold flex items-center gap-1.5">
                          <MailOpen className="w-4 h-4 text-blue-500" /> Opened
                        </span>
                        <span className="text-sm font-extrabold text-blue-900">{opened}</span>
                      </div>
                      <div className="w-full bg-blue-100 rounded-full h-1.5 mb-2.5 overflow-hidden">
                        <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${total ? (opened/total)*100 : 0}%` }}></div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-blue-600 font-bold flex items-center gap-1.5">
                          <XCircle className="w-4 h-4 text-rose-500" /> Failed
                        </span>
                        <span className="text-sm font-extrabold text-rose-600">{failed}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {campaigns.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-blue-400 border-2 border-dashed border-blue-200 rounded-2xl bg-blue-50/30">
                <Activity className="w-12 h-12 mb-4 text-blue-300" />
                <p className="text-lg font-bold text-blue-800">Awaiting Deployments</p>
                <p className="text-sm font-medium mt-1 text-blue-500">Your metrics will appear here in real-time.</p>
              </div>
            )}
          </div>
        </div>

      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(59, 130, 246, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(59, 130, 246, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(59, 130, 246, 0.3);
        }
      `}</style>
    </main>
  );
}
