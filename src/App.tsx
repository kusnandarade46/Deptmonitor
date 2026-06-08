import React, { useState } from 'react';
import { LayoutDashboard, CheckSquare, List, BarChart3, Plus, Bell, LogOut, ChevronDown } from 'lucide-react';
import Dashboard from './components/Dashboard';
import KanbanBoard from './components/KanbanBoard';
import TableView from './components/TableView';
import TaskFormModal from './components/TaskFormModal';
import ActivityLogView from './components/ActivityLogView';
import { useAppStore } from './store';
import { Task } from './types';

export default function App() {
  const { firebaseUser, currentUser, tasks, logs, addTask, updateTask, deleteTask, login, logout, registerUser } = useAppStore();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'kanban' | 'list' | 'audit'>('dashboard');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [nameInput, setNameInput] = useState('');
  const [roleInput, setRoleInput] = useState('Staff');
  const [deptInput, setDeptInput] = useState('Finance');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  React.useEffect(() => {
    if (firebaseUser?.displayName && !nameInput) {
      setNameInput(firebaseUser.displayName);
    }
  }, [firebaseUser, nameInput]);

  const handleSaveProfile = async () => {
    if (!nameInput.trim()) {
      setSaveError('Nama harus diisi/Name is required');
      return;
    }
    setSaveError('');
    setIsSaving(true);
    try {
      await registerUser(nameInput, roleInput, roleInput === 'Director' ? 'All' : deptInput);
    } catch (e: any) {
      console.error(e);
      setSaveError('Gagal menyimpan profil. Coba lagi.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!firebaseUser) {
    return (
      <div className="flex h-screen bg-slate-50 items-center justify-center font-sans">
        <div className="bg-white p-12 rounded shadow-sm border border-slate-200 text-center max-w-sm w-full">
          <div className="w-12 h-12 bg-indigo-600 rounded flex items-center justify-center mx-auto mb-6">
            <div className="w-6 h-6 border-2 border-white rotate-45"></div>
          </div>
          <h1 className="font-bold text-2xl tracking-tight text-slate-800 uppercase mb-2">DeptMonitor</h1>
          <p className="text-sm text-slate-500 mb-8">Login to access your tasks and dashboard.</p>
          <button 
            onClick={login}
            className="w-full bg-slate-900 text-white font-bold uppercase tracking-wider text-xs py-3 rounded shadow-sm hover:bg-slate-800 transition-colors"
          >
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex h-screen bg-slate-50 items-center justify-center font-sans">
        <div className="bg-white p-8 rounded shadow-sm border border-slate-200 max-w-md w-full">
          <h2 className="font-bold text-xl tracking-tight text-slate-800 uppercase mb-6 text-center">Complete Profile</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Full Name</label>
              <input 
                type="text" 
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                className="w-full text-sm font-bold border border-slate-200 rounded px-3 py-2 bg-slate-50 text-slate-800 focus:outline-none focus:border-indigo-500"
                placeholder="Enter your name"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Role</label>
              <select 
                value={roleInput}
                onChange={e => setRoleInput(e.target.value)}
                className="w-full text-sm font-bold border border-slate-200 rounded px-3 py-2 bg-slate-50 text-slate-800 focus:outline-none focus:border-indigo-500 appearance-none"
              >
                <option value="Staff">Staff</option>
                <option value="Manager">Manager</option>
                <option value="Director">Director</option>
              </select>
            </div>
            {roleInput !== 'Director' && (
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Department</label>
                <select 
                  value={deptInput}
                  onChange={e => setDeptInput(e.target.value)}
                  className="w-full text-sm font-bold border border-slate-200 rounded px-3 py-2 bg-slate-50 text-slate-800 focus:outline-none focus:border-indigo-500 appearance-none"
                >
                  <option value="Finance">Finance</option>
                  <option value="HR">HR</option>
                  <option value="GA">GA</option>
                </select>
              </div>
            )}
            {saveError && (
              <div className="text-rose-500 font-bold text-xs mt-2 text-center">{saveError}</div>
            )}
            <button 
              onClick={handleSaveProfile}
              disabled={isSaving}
              className="w-full bg-indigo-600 text-white font-bold uppercase tracking-wider text-xs py-3 rounded mt-4 hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {isSaving ? 'Menyimpan...' : 'Save Profile'}
            </button>
            <button 
              onClick={logout}
              disabled={isSaving}
              className="w-full bg-white text-slate-500 border border-slate-200 font-bold uppercase tracking-wider text-xs py-3 rounded mt-2 hover:bg-slate-50 hover:text-slate-700 transition-colors disabled:opacity-50"
            >
              Cancel / Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Filter tasks based on role/department
  const filteredTasks = tasks.filter(t => {
    if (currentUser.department === 'All') return true;
    if (currentUser.role === 'Staff') return t.staffName === currentUser.name;
    return t.department === currentUser.department;
  });

  const handleOpenNewTask = () => {
    setEditingTask(undefined);
    setIsModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleSaveTask = (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingTask) {
      updateTask(editingTask.id, taskData);
    } else {
      addTask(taskData);
    }
    setIsModalOpen(false);
  };

  // Check for overdue or nearing due notifications (just a simple count for UI)
  const overdueCount = filteredTasks.filter(t => t.status !== 'Closed' && new Date(t.dueDate).getTime() < new Date().getTime()).length;

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
      
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-full z-10 shrink-0 hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b border-slate-200 shrink-0">
          <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center mr-3 shrink-0">
            <div className="w-4 h-4 border-2 border-white rotate-45"></div>
          </div>
          <h1 className="font-bold text-lg tracking-tight text-slate-800 uppercase">DeptMonitor</h1>
        </div>
        
        <div className="flex-1 py-6 px-4 space-y-2">
          <NavItem 
            icon={<LayoutDashboard size={18} />} 
            label="Dashboard" 
            isActive={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
          />
          <NavItem 
            icon={<CheckSquare size={18} />} 
            label="Kanban Board" 
            isActive={activeTab === 'kanban'} 
            onClick={() => setActiveTab('kanban')} 
          />
          <NavItem 
            icon={<List size={18} />} 
            label="Daftar Tugas" 
            isActive={activeTab === 'list'} 
            onClick={() => setActiveTab('list')} 
          />
          {(currentUser.role === 'Director' || currentUser.role === 'Manager') && (
            <NavItem 
              icon={<BarChart3 size={18} />} 
              label="Audit Log" 
              isActive={activeTab === 'audit'} 
              onClick={() => setActiveTab('audit')} 
            />
          )}
        </div>
        
        <div className="p-4 border-t border-slate-200 text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center">
          Monitoring System v1.0
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-bold tracking-tight text-slate-800 uppercase hidden sm:block">
              {activeTab === 'dashboard' ? 'Overview' : 
               activeTab === 'kanban' ? 'Papan Tugas' : 
               activeTab === 'list' ? 'Monitoring Daftar Tugas' : 'Audit Trail'}
            </h2>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <span className="h-6 w-px bg-slate-200 mx-2 hidden sm:block"></span>
              <div className="relative cursor-pointer text-slate-500 hover:text-slate-800">
                <Bell size={20} />
                {overdueCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[10px] flex items-center justify-center rounded-full font-bold shadow-sm">
                    {overdueCount}
                  </span>
                )}
              </div>
            </div>

            {/* Profile Dropdown Simulation */}
            <div className="flex items-center gap-3 border-l border-slate-200 pl-6 h-10 group relative">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-slate-800 uppercase tracking-widest">{currentUser.name}</p>
                <p className="text-[9px] text-slate-400 uppercase tracking-widest mt-0.5">{currentUser.role}</p>
              </div>
              <div className="w-9 h-9 bg-slate-200 rounded text-slate-500 font-bold flex items-center justify-center border hover:border-slate-400 transition-colors pointer-events-none">
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <div className="absolute right-0 top-12 mt-2 w-48 bg-white border border-slate-200 rounded shadow-sm opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 p-2">
                <button 
                  onClick={logout}
                  className="w-full text-left px-3 py-2 text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-rose-600 hover:bg-slate-50 rounded flex items-center gap-2"
                >
                  <LogOut size={14} /> Logout
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-6">
          
          <div className="flex justify-between items-end mb-6">
             <div>
                <h3 className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Filter Departemen</h3>
                <p className="font-bold text-slate-800 uppercase tracking-widest mt-1">
                  {currentUser.department === 'All' ? 'Semua Dept' : currentUser.department}
                </p>
             </div>
             
             {currentUser.role !== 'Director' && (
               <button 
                 onClick={handleOpenNewTask}
                 className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded text-xs font-bold uppercase tracking-wider shadow-sm transition-colors"
               >
                 <Plus size={16} />
                 <span>Tambah Tugas</span>
               </button>
             )}
          </div>

          {activeTab === 'dashboard' && <Dashboard tasks={filteredTasks} filterDept={currentUser.department} />}
          {activeTab === 'kanban' && <KanbanBoard tasks={filteredTasks} onEditTask={handleEditTask} />}
          {activeTab === 'list' && <TableView tasks={filteredTasks} onEditTask={handleEditTask} />}
          {activeTab === 'audit' && <ActivityLogView logs={logs} />}

        </div>
      </main>

      {/* Forms Modal */}
      <TaskFormModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveTask}
        currentUser={currentUser}
        initialData={editingTask}
      />

    </div>
  );
}

function NavItem({ icon, label, isActive, onClick }: { icon: React.ReactNode, label: string, isActive: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-2.5 transition-all text-[11px] font-bold uppercase tracking-wider border rounded
        ${isActive 
          ? 'bg-indigo-50 text-indigo-700 border-indigo-100' 
          : 'bg-white text-slate-500 border-transparent hover:border-slate-200 hover:bg-slate-50 hover:text-slate-700'
        }
      `}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

