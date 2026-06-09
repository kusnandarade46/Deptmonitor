import React, { useState, useEffect } from 'react';
import { Department, Task, TaskStatus, User } from '../types';
import { X } from 'lucide-react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
  currentUser: User;
  initialData?: Task;
  isViewMode?: boolean;
}

export default function TaskFormModal({ isOpen, onClose, onSave, currentUser, initialData, isViewMode = false }: TaskFormModalProps) {
  const [description, setDescription] = useState('');
  const [department, setDepartment] = useState<Department>('Finance');
  const [staffName, setStaffName] = useState('');
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [dueDate, setDueDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [status, setStatus] = useState<TaskStatus>('Open');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (initialData) {
      setDescription(initialData.description);
      setDepartment(initialData.department);
      setStaffName(initialData.staffName);
      setStartDate(initialData.startDate);
      setDueDate(initialData.dueDate);
      setStatus(initialData.status);
      setNotes(initialData.notes);
    } else {
      setDescription('');
      setDepartment(currentUser.department === 'All' ? 'Finance' : currentUser.department as Department);
      setStaffName(currentUser.name);
      setStartDate(format(new Date(), 'yyyy-MM-dd'));
      setDueDate(format(new Date(), 'yyyy-MM-dd'));
      setStatus('Open');
      setNotes('');
    }
  }, [initialData, currentUser, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      description,
      department,
      staffName,
      startDate,
      dueDate,
      status,
      notes
    });
    onClose();
  };

  const isStaff = currentUser.role === 'Staff';
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 sm:p-0">
      <div className="bg-white border border-slate-200 shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50 text-slate-800">
          <h2 className="text-xs font-bold uppercase tracking-widest pl-2 border-l-4 border-indigo-600">
            {isViewMode ? 'Detail Tugas' : initialData ? 'Update Detail Tugas' : 'Entry Tugas Baru'}
          </h2>
          <button type="button" onClick={onClose} className="p-1 hover:bg-slate-200 hover:text-slate-700 rounded-none text-slate-400 transition-colors">
            <X size={18} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 flex flex-col gap-5 bg-white">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Deskripsi Pekerjaan</label>
            <input
              required
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-none focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 text-slate-800 disabled:bg-slate-50 disabled:text-slate-500"
              readOnly={isViewMode || (isStaff && !!initialData)}
              disabled={isViewMode}
              placeholder="Masukan detail instruksi tugas..."
            />
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Departemen</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value as Department)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-none focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 bg-white disabled:bg-slate-50 disabled:text-slate-500 disabled:opacity-75"
                disabled={isViewMode || (!!initialData && currentUser.name !== initialData.staffName)}
              >
                <option value="Finance">Finance</option>
                <option value="HR">HR</option>
                <option value="GA">GA</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Nama Staf</label>
              <input
                required
                type="text"
                value={staffName}
                onChange={(e) => setStaffName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-none focus:outline-none bg-slate-50 text-slate-500"
                readOnly
                disabled={isViewMode}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Tgl Mulai</label>
              <input
                required
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-none focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 font-mono disabled:bg-slate-50 disabled:text-slate-500"
                readOnly={isViewMode || (isStaff && !!initialData)}
                disabled={isViewMode}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Due Date</label>
              <input
                required
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-none focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 font-mono disabled:bg-slate-50 disabled:text-slate-500"
                readOnly={isViewMode || (isStaff && !!initialData)}
                disabled={isViewMode}
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Status Eksekusi</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-none focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 bg-white disabled:bg-slate-50 disabled:text-slate-500 disabled:opacity-75"
              disabled={isViewMode}
            >
              <option value="Open">Open (Belum Dimulai)</option>
              <option value="On Progress">On Progress (Sedang Dikerjakan)</option>
              <option value="Closed">Closed (Selesai/Tuntas)</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Keterangan / Log Note (Opsional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Tambahkan catatan khusus terkait tugas..."
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-none focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 resize-none font-sans disabled:bg-slate-50 disabled:text-slate-500"
              readOnly={isViewMode}
              disabled={isViewMode}
            />
          </div>
          
          {!isViewMode && (
            <div className="mt-2 pt-5 border-t border-slate-200 flex justify-end gap-3 bg-white">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-600 bg-white border border-slate-200 rounded-none hover:bg-slate-50 focus:outline-none"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-[10px] font-bold uppercase tracking-wider text-white bg-indigo-600 border border-indigo-600 rounded-none hover:bg-indigo-700 focus:outline-none"
              >
                Save Record
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
