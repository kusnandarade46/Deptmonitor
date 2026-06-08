import React, { useState } from 'react';
import { Task } from '../types';
import { format, isBefore, isAfter, startOfDay, isSameDay } from 'date-fns';
import { Edit2, Filter } from 'lucide-react';
import { cn } from '../lib/utils';

interface TableViewProps {
  tasks: Task[];
  onEditTask: (task: Task) => void;
}

export default function TableView({ tasks, onEditTask }: TableViewProps) {
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');

  const filteredTasks = tasks.filter(task => {
    if (!startDateFilter && !endDateFilter) return true;
    
    const taskDate = startOfDay(new Date(task.startDate));
    const start = startDateFilter ? startOfDay(new Date(startDateFilter)) : null;
    const end = endDateFilter ? startOfDay(new Date(endDateFilter)) : null;

    if (start && end) {
      return (isAfter(taskDate, start) || isSameDay(taskDate, start)) && 
             (isBefore(taskDate, end) || isSameDay(taskDate, end));
    }
    if (start) {
      return isAfter(taskDate, start) || isSameDay(taskDate, start);
    }
    if (end) {
      return isBefore(taskDate, end) || isSameDay(taskDate, end);
    }
    
    return true;
  });

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center justify-between bg-slate-50/50 p-4 border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-slate-700">
            <Filter size={16} />
            <span className="font-bold text-[10px] uppercase tracking-wider">Tanggal Mulai:</span>
          </div>
          <input 
            type="date" 
            value={startDateFilter}
            onChange={(e) => setStartDateFilter(e.target.value)}
            className="text-[10px] px-3 py-1.5 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-slate-600"
          />
          <span className="text-slate-400 text-[10px] font-bold">s/d</span>
          <input 
            type="date" 
            value={endDateFilter}
            onChange={(e) => setEndDateFilter(e.target.value)}
            className="text-[10px] px-3 py-1.5 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-slate-600"
          />
          {(startDateFilter || endDateFilter) && (
            <button 
              onClick={() => { setStartDateFilter(''); setEndDateFilter(''); }}
              className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold ml-2 uppercase tracking-wider"
            >
              Clear
            </button>
          )}
        </div>
        <div className="text-[10px] text-slate-400 font-medium italic">
          Menampilkan {filteredTasks.length} entri
        </div>
      </div>

      <div className="bg-white border border-slate-200 shadow-sm flex-1 overflow-hidden flex flex-col">
        <div className="overflow-auto flex-1">
          <table className="w-full border-collapse text-left">
            <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Deskripsi Pekerjaan</th>
                <th className="px-6 py-4">Staf / Dept</th>
                <th className="px-6 py-4">Tgl Mulai</th>
                <th className="px-6 py-4">Due Date</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                    Tidak ada tugas ditemukan.
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task) => {
                  const isOverdue = task.status !== 'Closed' && isBefore(startOfDay(new Date(task.dueDate)), startOfDay(new Date()));
                  
                  return (
                    <tr key={task.id} className={cn("hover:bg-slate-50 transition-colors", isOverdue ? "bg-rose-50/30" : "")}>
                      <td className="px-6 py-4 font-mono text-slate-400 uppercase text-[10px]">
                        {task.id}
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-800 max-w-[200px] truncate" title={task.description}>
                        {task.description}
                      </td>
                      <td className="px-6 py-4">
                        {task.staffName.split(' ')[0]} 
                        <span className="text-[10px] text-indigo-600 font-bold ml-1 uppercase">{task.department.substring(0, 3)}</span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 font-mono text-[10px]">{format(new Date(task.startDate), 'dd MMM yyyy')}</td>
                      <td className={cn("px-6 py-4 font-mono text-[10px]", isOverdue ? "text-rose-500 font-bold italic underline" : "text-slate-500")}>
                        {format(new Date(task.dueDate), 'dd MMM yyyy')}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={cn(
                          "px-2 py-1 rounded-sm font-bold text-[9px] uppercase tracking-tighter inline-block text-center",
                          task.status === 'Open' ? "bg-slate-100 text-slate-500" :
                          task.status === 'On Progress' ? "bg-amber-50 text-amber-600" :
                          task.status === 'Closed' ? "bg-emerald-100 text-emerald-700" :
                          "bg-rose-500 text-white shadow-sm shadow-rose-200" // Overdue state override logic could go here if needed
                        )}>
                          {isOverdue && task.status !== 'Closed' ? 'Overdue' : task.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => onEditTask(task)}
                          className="text-indigo-600 hover:text-indigo-800 p-1 rounded hover:bg-slate-100 transition-colors inline-flex border border-transparent hover:border-slate-200"
                        >
                          <Edit2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
