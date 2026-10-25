import React from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { Bell, Sparkles } from 'lucide-react';

export default function Navbar({ title = 'Dashboard' }) {
  const { admin } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-10">
      <div>
        <h2 className="text-lg font-bold text-slate-800">{title}</h2>
      </div>

      <div className="flex items-center gap-4">
        {/* System Status Pill */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-200/60">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>System Online</span>
        </div>

        {/* Admin Pill */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200 text-xs text-slate-500 font-medium">
          <span>Signed in as</span>
          <span className="font-semibold text-slate-700">{admin?.email}</span>
        </div>
      </div>
    </header>
  );
}
