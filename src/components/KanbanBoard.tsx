import React from 'react';
import { Task, TaskStatus } from '../types';
import { format, isBefore, startOfDay, addDays } from 'date-fns';
import { Clock, AlertCircle, Edit2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface KanbanBoardProps {
  tasks: Task[];
  onEditTask: (task: Task) => void;
}

const STATUSES: { value: TaskStatus, label: string, color: string, headerBorder: string }[] = [
  { value: 'Open', label: 'Open', color: 'bg-slate-50 border-slate-200 pt-0', headerBorder: 'border-slate-300' },
  { value: 'On Progress', label: 'On Progress', color: 'bg-indigo-50/50 border-indigo-100 pt-0', headerBorder: 'border-indigo-400' },
  { value: 'Closed', label: 'Closed', color: 'bg-emerald-50/50 border-emerald-100 pt-0', headerBorder: 'border-emerald-400' }
];

export default function KanbanBoard({ tasks, onEditTask }: KanbanBoardProps) {
  
  const getOverdueStatus = (dueDate: string, status: TaskStatus) => {
    if (status === 'Closed') return null;
    
    const due = startOfDay(new Date(dueDate));
    const today = startOfDay(new Date());
    
    if (isBefore(due, today)) {
      return { label: 'Terlambat', color: 'text-rose-600 border-rose-200 font-bold', bg: 'bg-rose-50' };
    }
    
    const warningDate = addDays(today, 2);
    if (!isBefore(warningDate, due)) {
      return { label: 'Mendekati Due', color: 'text-amber-600 border-amber-200 font-bold', bg: 'bg-amber-50' };
    }
    
    return null;
  };

  return (
    <div className="flex gap-6 overflow-x-auto pb-4 h-full">
      {STATUSES.map(statusData => {
        const columnTasks = tasks.filter(t => t.status === statusData.value);
        return (
          <div key={statusData.value} className={cn("flex flex-col min-w-[300px] w-[350px] border shadow-sm rounded-none", statusData.color)}>
            <div className={cn("flex items-center justify-between p-4 border-b bg-white/60 backdrop-blur-sm", statusData.headerBorder, "border-b-2")}>
              <h3 className="text-[10px] font-bold text-slate-700 uppercase tracking-widest">{statusData.label}</h3>
              <span className="text-[10px] font-bold bg-white border border-slate-200 px-2 py-0.5 rounded-sm text-slate-500 shadow-sm">
                {columnTasks.length}
              </span>
            </div>
            
            <div className="flex flex-col gap-4 overflow-y-auto p-4 pr-3 mt-1">
              {columnTasks.map(task => {
                const overdueStatus = getOverdueStatus(task.dueDate, task.status);
                
                return (
                  <div key={task.id} className="bg-white p-4 border border-slate-200 shadow-sm hover:shadow relative group cursor-pointer rounded-none transition-shadow" onClick={() => onEditTask(task)}>
                    <button 
                      className="absolute top-3 right-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity hover:text-indigo-600 bg-white border border-slate-200 p-1 rounded-sm shadow-sm"
                      onClick={(e) => { e.stopPropagation(); onEditTask(task); }}
                    >
                      <Edit2 size={12} />
                    </button>
                    
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-[9px] font-bold px-2 py-0.5 bg-slate-100 text-slate-500 rounded-sm uppercase tracking-wider">
                        {task.department}
                      </span>
                      <span className="text-slate-400 font-mono text-[9px] uppercase">{task.id}</span>
                    </div>
                    
                    <h4 className="font-medium text-slate-800 text-sm mb-3 leading-snug">{task.description}</h4>
                    
                    <div className="flex flex-col gap-1.5 text-xs text-slate-600 mt-2 pt-3 border-t border-slate-100">
                      <div className="flex justify-between items-center text-[10px] uppercase tracking-wider">
                        <span className="text-slate-400 font-bold">Staf</span>
                        <span className="font-bold text-slate-700">{task.staffName.split(' ')[0]}</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] uppercase tracking-wider">
                        <span className="text-slate-400 font-bold">Due</span>
                        <span className={cn("font-mono font-bold", overdueStatus?.color ? "text-rose-500" : "text-slate-600")}>
                          {format(new Date(task.dueDate), 'dd MMM yyyy')}
                        </span>
                      </div>
                    </div>
                    
                    {overdueStatus && (
                      <div className={cn("mt-3 flex items-center justify-center text-[9px] font-bold px-2 py-1.5 rounded-sm border uppercase tracking-widest", overdueStatus.color, overdueStatus.bg)}>
                        {overdueStatus.label}
                      </div>
                    )}
                  </div>
                );
              })}
              
              {columnTasks.length === 0 && (
                <div className="text-center p-6 text-[10px] uppercase tracking-widest text-slate-400 border border-dashed border-slate-300 bg-white/50">
                  Tidak ada tugas
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
