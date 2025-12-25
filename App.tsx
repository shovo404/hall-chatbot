
import React, { useState, useEffect } from 'react';
import { Shield, LogOut, LayoutDashboard, MessageSquare, Database, Settings, Menu, X, ChevronRight, LogIn } from 'lucide-react';
import ChatInterface from './components/ChatInterface';
import AdminDashboard from './components/AdminDashboard';
import { Role, KnowledgeItem, AuthState } from './types';

const App: React.FC = () => {
  const [auth, setAuth] = useState<AuthState>({ role: 'User', isAuthenticated: true });
  const [knowledge, setKnowledge] = useState<KnowledgeItem[]>(() => {
    const saved = localStorage.getItem('diu_hall_knowledge');
    if (saved) {
      try {
        return JSON.parse(saved).map((item: any) => ({
          ...item,
          addedAt: new Date(item.addedAt)
        }));
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [showAdminLoginModal, setShowAdminLoginModal] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('diu_hall_knowledge', JSON.stringify(knowledge));
  }, [knowledge]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginForm.username === 'admin' && loginForm.password === '123') {
      setAuth({ role: 'Admin', isAuthenticated: true });
      setShowAdminLoginModal(false);
      setLoginForm({ username: '', password: '' });
    }
  };

  const handleLogout = () => {
    setAuth({ role: 'User', isAuthenticated: true });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-hidden">
      {/* Sidebar - Desktop Admin Only */}
      {auth.role === 'Admin' && (
        <aside className="hidden lg:flex w-72 bg-slate-900 flex-col border-r border-slate-800 h-screen sticky top-0">
          <div className="p-8 flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Shield className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-white font-bold text-lg tracking-tight">DIU Admin</h1>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black">Control Panel</p>
            </div>
          </div>

          <nav className="flex-1 px-4 space-y-2">
            <button className="w-full flex items-center justify-between px-4 py-3 text-slate-300 bg-slate-800 rounded-xl border border-slate-700 font-medium group">
              <div className="flex items-center gap-3">
                <LayoutDashboard size={18} className="text-blue-400" />
                <span>Knowledge Base</span>
              </div>
              <ChevronRight size={14} />
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-slate-300 transition-all">
              <Database size={18} />
              <span>Records</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-slate-300 transition-all">
              <Settings size={18} />
              <span>Settings</span>
            </button>
          </nav>

          <div className="p-4 mt-auto border-t border-slate-800/50">
            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 text-slate-400 hover:text-red-400 transition-all font-bold text-xs uppercase tracking-widest"
            >
              <LogOut size={16} />
              <span>Exit Admin Mode</span>
            </button>
          </div>
        </aside>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-30 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-slate-900 p-1.5 rounded-md text-white">
              <Shield size={18} />
            </div>
            <span className="font-black text-slate-900 tracking-tighter text-lg uppercase">DIU Hall Bot</span>
          </div>
          
          <div className="flex items-center gap-3">
             {auth.role === 'User' ? (
               <button 
                 onClick={() => setShowAdminLoginModal(true)}
                 className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase hover:bg-blue-600 transition-all"
               >
                 <LogIn size={14} />
                 Admin Login
               </button>
             ) : (
               <div className="flex lg:hidden items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-xl text-xs font-bold uppercase border border-blue-100">
                 <Shield size={14} /> Admin
               </div>
             )}
          </div>
        </header>

        <main className="flex-1 p-6 overflow-y-auto bg-slate-50/50 custom-scrollbar">
          <div className="max-w-5xl mx-auto">
            <div className="mb-8">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                {auth.role === 'Admin' ? (
                  <>
                    <LayoutDashboard size={24} className="text-blue-600" />
                    Knowledge Management
                  </>
                ) : (
                  <>
                    <MessageSquare size={24} className="text-blue-600" />
                    Student Inquiry Terminal
                  </>
                )}
              </h2>
            </div>

            {auth.role === 'Admin' ? (
              <AdminDashboard 
                knowledge={knowledge} 
                onAddKnowledge={item => setKnowledge(prev => [item, ...prev])} 
                onRemoveKnowledge={id => setKnowledge(prev => prev.filter(k => k.id !== id))} 
                onLogout={handleLogout}
              />
            ) : (
              <ChatInterface knowledge={knowledge} />
            )}
          </div>
        </main>
      </div>

      {/* Admin Login Modal */}
      {showAdminLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border border-slate-100 animate-fade-in">
            <div className="bg-slate-900 p-8 text-center text-white">
              <Shield size={32} className="mx-auto mb-4 text-blue-50" />
              <h3 className="text-xl font-black uppercase">Admin Portal</h3>
              <p className="text-slate-400 text-xs mt-1">Authorized access only</p>
            </div>
            <form onSubmit={handleLogin} className="p-8 space-y-4">
              <input
                type="text"
                placeholder="Username"
                value={loginForm.username}
                onChange={e => setLoginForm({...loginForm, username: e.target.value})}
                className="w-full px-4 py-3 bg-slate-50 border rounded-xl text-sm text-black outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
              <input
                type="password"
                placeholder="Password"
                value={loginForm.password}
                onChange={e => setLoginForm({...loginForm, password: e.target.value})}
                className="w-full px-4 py-3 bg-slate-50 border rounded-xl text-sm text-black outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowAdminLoginModal(false)} className="flex-1 py-3 text-slate-900 font-bold text-xs uppercase hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-slate-900 text-white font-bold text-xs uppercase rounded-xl shadow-lg hover:bg-blue-600 transition-all">Login</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
