import React, { useState } from 'react';
import { Task } from '../types';
import { format, isBefore, isAfter, startOfDay, isSameDay } from 'date-fns';
import { Edit2, Filter, Trash2, Eye, Download } from 'lucide-react';
import { cn } from '../lib/utils';

import * as XLSX from 'xlsx';

interface TableViewProps {
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onViewTask: (task: Task) => void;
}

export default function TableView({ tasks, onEditTask, onDeleteTask, onViewTask }: TableViewProps) {
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  const filteredTasks = tasks.filter(task => {
    let matchesDate = true;
    let matchesStatus = true;

    // Date filter logic
    if (startDateFilter || endDateFilter) {
      const taskDate = startOfDay(new Date(task.startDate));
      const start = startDateFilter ? startOfDay(new Date(startDateFilter)) : null;
      const end = endDateFilter ? startOfDay(new Date(endDateFilter)) : null;

      if (start && end) {
        matchesDate = (isAfter(taskDate, start) || isSameDay(taskDate, start)) && 
               (isBefore(taskDate, end) || isSameDay(taskDate, end));
      } else if (start) {
        matchesDate = isAfter(taskDate, start) || isSameDay(taskDate, start);
      } else if (end) {
        matchesDate = isBefore(taskDate, end) || isSameDay(taskDate, end);
      }
    }

    // Status filter logic
    if (statusFilter !== 'All') {
      const isOverdue = task.status !== 'Closed' && isBefore(startOfDay(new Date(task.dueDate)), startOfDay(new Date()));
      if (statusFilter === 'Overdue') {
        matchesStatus = isOverdue;
      } else {
        matchesStatus = task.status === statusFilter && !isOverdue; // Option to separate overdue from Open/OnProgress, or just filter by raw status. Let's just filter by raw status unless it's explicitly querying overdue
      }
    }

    return matchesDate && matchesStatus;
  });

  const handleExportExcel = () => {
    const data = filteredTasks.map(task => ({
      'Deskripsi Pekerjaan': task.description,
      'Staf/Dept': `${task.staffName} (${task.department})`,
      'Tgl Mulai': format(new Date(task.startDate), 'dd MMM yyyy'),
      'Due Date': format(new Date(task.dueDate), 'dd MMM yyyy'),
      'Status': task.status
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Daftar Tugas");

    XLSX.writeFile(workbook, `Daftar_Tugas_Export_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`);
  };

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
          <div className="h-4 w-px bg-slate-300 mx-1"></div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-[10px] px-3 py-1.5 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold text-slate-600 uppercase"
          >
            <option value="All">Semua Status</option>
            <option value="Open">Open</option>
            <option value="On Progress">On Progress</option>
            <option value="Closed">Closed</option>
            <option value="Overdue">Overdue</option>
          </select>
          {(startDateFilter || endDateFilter || statusFilter !== 'All') && (
            <button 
              onClick={() => { setStartDateFilter(''); setEndDateFilter(''); setStatusFilter('All'); }}
              className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold ml-2 uppercase tracking-wider"
            >
              Clear
            </button>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="text-[10px] text-slate-400 font-medium italic">
            Menampilkan {filteredTasks.length} entri
          </div>
          <button 
            onClick={handleExportExcel}
            className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 border border-slate-300 rounded text-[10px] font-bold uppercase tracking-widest transition-colors"
          >
            <Download size={12} /> Export Excel
          </button>
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
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <button 
                          onClick={() => onViewTask(task)}
                          className="text-slate-500 hover:text-slate-800 p-1 rounded hover:bg-slate-100 transition-colors inline-flex border border-transparent hover:border-slate-200 mr-2"
                        >
                          <Eye size={14} />
                        </button>
                        <button 
                          onClick={() => onEditTask(task)}
                          className="text-indigo-600 hover:text-indigo-800 p-1 rounded hover:bg-slate-100 transition-colors inline-flex border border-transparent hover:border-slate-200 mr-2"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          onClick={() => {
                            if (window.confirm('Yakin ingin menghapus tugas ini?')) {
                              onDeleteTask(task.id);
                            }
                          }}
                          className="text-rose-600 hover:text-rose-800 p-1 rounded hover:bg-slate-100 transition-colors inline-flex border border-transparent hover:border-slate-200"
                        >
                          <Trash2 size={14} />
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
