import React from 'react';
import { ActivityLogEntry } from '../types';
import { format } from 'date-fns';

export default function ActivityLogView({ logs }: { logs: ActivityLogEntry[] }) {
  return (
    <div className="bg-white border border-slate-200 shadow-sm overflow-hidden h-full flex flex-col rounded-none">
      <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest">Sistem Log Audit & Aktivitas</h3>
        <span className="text-[10px] text-slate-400 font-medium italic select-none">Read-only view</span>
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-0 relative">
        {/* Continuous timeline line */}
        <div className="absolute left-10 top-6 bottom-6 w-px bg-slate-200 z-0"></div>
        {logs.length === 0 ? (
          <div className="text-center text-[10px] uppercase tracking-widest text-slate-400 font-bold py-10 relative z-10 bg-white">
            Belum ada aktivitas tercatat di sistem.
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="relative z-10 flex gap-6 pb-6">
              <div className="flex flex-col items-center shrink-0">
                <div className="w-2.5 h-2.5 shadow-[0_0_0_4px_#ffffff] rounded-none bg-indigo-500 transform rotate-45 mt-1 border border-indigo-700"></div>
              </div>
              <div className="bg-white border border-slate-100 shadow-sm px-4 py-3 rounded-none flex-1 -mt-2 hover:border-slate-200 transition-colors">
                <p className="text-xs font-medium text-slate-800">{log.action}</p>
                <div className="flex items-center gap-3 mt-2 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded-sm">User: {log.userName.split(' ')[0]}</span>
                  <span className="font-mono text-slate-400">{format(new Date(log.timestamp), 'dd MMM yyyy • HH:mm:ss')}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
