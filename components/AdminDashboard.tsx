
import React, { useState, useEffect } from 'react';
import { Upload, Link as LinkIcon, Trash2, Plus, Type as TypeIcon, CheckCircle2, AlertCircle, RefreshCw, Database, LogOut, FileText, Key, ExternalLink } from 'lucide-react';
import { KnowledgeItem } from '../types';
import { validateApiKey } from '../services/geminiService';

interface AdminDashboardProps {
  knowledge: KnowledgeItem[];
  onAddKnowledge: (item: KnowledgeItem) => void;
  onRemoveKnowledge: (id: string) => void;
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ knowledge, onAddKnowledge, onRemoveKnowledge, onLogout }) => {
  const [url, setUrl] = useState('');
  const [manualTitle, setManualTitle] = useState('');
  const [manualText, setManualText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: '' });
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    const checkKeyStatus = async () => {
      const aistudio = (window as any).aistudio;
      if (aistudio && typeof aistudio.hasSelectedApiKey === 'function') {
        const selected = await aistudio.hasSelectedApiKey();
        setHasApiKey(selected);
      }
    };
    checkKeyStatus();
  }, []);

  const handleSelectKey = async () => {
    const aistudio = (window as any).aistudio;
    if (aistudio && typeof aistudio.openSelectKey === 'function') {
      await aistudio.openSelectKey();
      // Assume success as per platform requirements to mitigate race conditions
      setHasApiKey(true);
      showStatus('success', 'API Key session initialized.');
    } else {
      showStatus('error', 'API Key management is not available in this environment.');
    }
  };

  const handleVerifyKey = async () => {
    setIsVerifying(true);
    try {
      const res = await validateApiKey();
      if (res.ok) {
        setHasApiKey(true);
        showStatus('success', 'API Key verified successfully.');
      } else {
        setHasApiKey(false);
        showStatus('error', res.message || 'Key verification failed.');
      }
    } catch (err) {
      showStatus('error', 'Key verification failed.');
    } finally {
      setIsVerifying(false);
    }
  };

  const showStatus = (type: 'success' | 'error', message: string) => {
    setStatus({ type, message });
    setTimeout(() => setStatus({ type: null, message: '' }), 3000);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      onAddKnowledge({
        id: Math.random().toString(36).substr(2, 9),
        type: 'file',
        name: file.name,
        content: reader.result as string,
        source: 'Local Upload',
        addedAt: new Date(),
      });
      showStatus('success', 'File indexed successfully.');
      e.target.value = ''; 
    };
    reader.readAsText(file);
  };

  const handleUrlAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl = url.trim();
    if (!cleanUrl) return;

    setIsProcessing(true);
    try {
      const finalUrl = cleanUrl.startsWith('http') ? cleanUrl : `https://${cleanUrl}`;
      const fetchUrl = `https://r.jina.ai/${finalUrl}`;
      const response = await fetch(fetchUrl);
      
      if (!response.ok) throw new Error('Failed to fetch website');
      
      const text = await response.text();
      
      let hostname = 'Website Source';
      try {
        hostname = new URL(finalUrl).hostname;
      } catch (e) {
        hostname = cleanUrl;
      }
      
      onAddKnowledge({
        id: Math.random().toString(36).substr(2, 9),
        type: 'url',
        name: hostname,
        content: text,
        source: finalUrl,
        addedAt: new Date(),
      });
      setUrl('');
      showStatus('success', 'Website "words" extracted successfully.');
    } catch (err) {
      console.error(err);
      showStatus('error', 'Could not index website. Please check the URL.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle.trim() || !manualText.trim()) {
      showStatus('error', 'Title and content are required.');
      return;
    }
    
    onAddKnowledge({
      id: Math.random().toString(36).substr(2, 9),
      type: 'file',
      name: manualTitle.trim(),
      content: manualText.trim(),
      source: 'Manual Entry',
      addedAt: new Date(),
    });
    setManualTitle('');
    setManualText('');
    showStatus('success', 'Record saved to knowledge base.');
  };

  const formatSize = (text: string) => {
    const chars = text.length;
    if (chars < 1000) return `${chars} chars`;
    return `${(chars / 1000).toFixed(1)}k chars`;
  };

  return (
    <div className="space-y-6">
      {/* AI Engine Configuration Card */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-3xl -mr-20 -mt-20 rounded-full" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
             <div className="bg-blue-600 p-2 rounded-lg"><Key size={20} /></div>
             <h3 className="text-lg font-black uppercase tracking-tight">AI Engine Configuration</h3>
          </div>
          <p className="text-slate-400 text-sm max-w-lg leading-relaxed">
            Configure the Gemini API key for live deployment. A paid API key from a Google Cloud project is required for stable performance on GitHub Pages.
          </p>
          <div className="flex items-center gap-4 mt-4">
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
              hasApiKey ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full ${hasApiKey ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
              {hasApiKey ? 'System Online' : 'Key Required'}
            </div>
            <a 
              href="https://ai.google.dev/gemini-api/docs/billing" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 text-[10px] font-bold uppercase flex items-center gap-1.5 transition-colors"
            >
              Billing Info <ExternalLink size={12} />
            </a>
          </div>
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <button 
              onClick={handleSelectKey}
              className="w-full md:w-auto bg-white text-slate-900 hover:bg-blue-50 px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg transition-all transform active:scale-95"
            >
              {hasApiKey ? 'Update API Key' : 'Configure API Key'}
            </button>
            <button
              onClick={handleVerifyKey}
              disabled={isVerifying}
              className="hidden md:inline-flex bg-slate-700 text-white px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-slate-600"
            >
              {isVerifying ? 'Verifying...' : 'Verify Key'}
            </button>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 lg:hidden mb-4 shadow-sm">
        <h3 className="font-black text-slate-800 text-[10px] uppercase tracking-widest">Session Management</h3>
        <button 
          onClick={onLogout}
          className="flex items-center gap-2 text-red-600 hover:text-red-700 font-bold text-[10px] uppercase tracking-wider"
        >
          <LogOut size={14} />
          Sign Out
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-blue-50 p-2 rounded-lg text-blue-600"><Upload size={18} /></div>
            <h3 className="font-bold text-slate-800">Upload Docs</h3>
          </div>
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-100 rounded-xl cursor-pointer hover:bg-slate-50 transition-all">
            <Plus className="text-slate-300" size={24} />
            <span className="text-xs text-slate-400 mt-2 font-bold uppercase tracking-wider">Select File</span>
            <input type="file" className="hidden" onChange={handleFileUpload} accept=".txt,.md,.json" />
          </label>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600"><LinkIcon size={18} /></div>
            <h3 className="font-bold text-slate-800">Index Website</h3>
          </div>
          <form onSubmit={handleUrlAdd} className="space-y-3">
            <input
              type="text"
              placeholder="Enter URL (e.g. google.com)"
              value={url}
              onChange={e => setUrl(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500 font-medium transition-all"
            />
            <button 
              type="submit"
              disabled={isProcessing || !url.trim()}
              className="w-full bg-slate-900 hover:bg-indigo-600 disabled:bg-slate-200 text-white py-2 rounded-lg text-xs font-black uppercase flex items-center justify-center gap-2 transition-all"
            >
              {isProcessing ? <RefreshCw className="animate-spin" size={14} /> : <Plus size={14} />}
              {isProcessing ? 'Extracting Words...' : 'Add URL'}
            </button>
          </form>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-emerald-50 p-2 rounded-lg text-emerald-600"><TypeIcon size={18} /></div>
            <h3 className="font-bold text-slate-800">Manual Entry</h3>
          </div>
          <form onSubmit={handleManualAdd} className="space-y-2">
            <input
              type="text"
              placeholder="Information Title"
              value={manualTitle}
              onChange={e => setManualTitle(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 font-medium transition-all"
            />
            <textarea
              placeholder="Paste information here..."
              value={manualText}
              onChange={e => setManualText(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 outline-none h-16 resize-none focus:ring-2 focus:ring-emerald-500 font-medium transition-all"
            />
            <button 
              type="submit"
              disabled={!manualTitle.trim() || !manualText.trim()}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 text-white py-2 rounded-lg text-xs font-black uppercase transition-all"
            >
              Save Record
            </button>
          </form>
        </div>
      </div>

      {status.type && (
        <div className={`p-4 rounded-xl flex items-center gap-3 animate-fade-in ${
          status.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
        }`}>
          {status.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span className="text-sm font-bold uppercase tracking-tight">{status.message}</span>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
          <h3 className="font-black text-slate-800 text-xs uppercase tracking-widest">Database Inventory ({knowledge.length})</h3>
          <button 
            onClick={onLogout}
            className="hidden lg:flex items-center gap-2 text-slate-400 hover:text-red-500 font-bold text-[10px] uppercase tracking-wider transition-colors"
          >
            <LogOut size={14} />
            Logout Administrative Session
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] text-slate-400 font-black uppercase tracking-widest border-b border-slate-50">
                <th className="px-6 py-4">Knowledge Identity</th>
                <th className="px-6 py-4">Source Type</th>
                <th className="px-6 py-4">Data Size</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {knowledge.map(item => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-slate-800">{item.name}</p>
                    <p className="text-[10px] text-slate-400 truncate max-w-xs">{item.source}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[9px] font-black rounded uppercase tracking-tighter">
                      {item.type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <FileText size={12} />
                      <span className="text-xs font-medium">{formatSize(item.content)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => onRemoveKnowledge(item.id)} 
                      className="text-slate-300 hover:text-red-500 p-2 transition-colors"
                      title="Delete entry"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {knowledge.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <Database size={32} className="mx-auto text-slate-200 mb-3" />
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">System records are currently empty</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
