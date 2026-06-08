import React from 'react';
import { Task, Department } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface DashboardProps {
  tasks: Task[];
  filterDept: Department;
}

export default function Dashboard({ tasks, filterDept }: DashboardProps) {
  
  // Calculate stats
  const filteredTasks = tasks; // It's already filtered in App
  
  const totalOpen = filteredTasks.filter(t => t.status === 'Open').length;
  const totalOnProgress = filteredTasks.filter(t => t.status === 'On Progress').length;
  const totalClosed = filteredTasks.filter(t => t.status === 'Closed').length;
  const totalOverdue = filteredTasks.filter(t => {
    return t.status !== 'Closed' && new Date(t.dueDate).getTime() < new Date().getTime();
  }).length;

  const dataStatus = [
    { name: 'Open', value: totalOpen, color: '#94a3b8' }, // slate-400
    { name: 'On Progress', value: totalOnProgress, color: '#4f46e5' }, // indigo-600
    { name: 'Closed', value: totalClosed, color: '#10b981' } // emerald-500
  ];

  // Group by department if 'All' is selected, else group by Staff
  const barData = [];
  if (filterDept === 'All') {
    const depts = ['Finance', 'HR', 'GA'];
    depts.forEach(d => {
      const deptTasks = tasks.filter(t => t.department === d);
      barData.push({
        name: d,
        Open: deptTasks.filter(t => t.status === 'Open').length,
        'On Progress': deptTasks.filter(t => t.status === 'On Progress').length,
        Closed: deptTasks.filter(t => t.status === 'Closed').length,
      });
    });
  } else {
    // group by staff
    const staffNames = Array.from(new Set(filteredTasks.map(t => t.staffName)));
    staffNames.forEach(st => {
      const stTasks = filteredTasks.filter(t => t.staffName === st);
      barData.push({
        name: st.split(' ')[0], // short name
        Open: stTasks.filter(t => t.status === 'Open').length,
        'On Progress': stTasks.filter(t => t.status === 'On Progress').length,
        Closed: stTasks.filter(t => t.status === 'Closed').length,
      });
    });
  }

  return (
    <div className="flex flex-col gap-6">
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Tugas Aktif" value={filteredTasks.length} />
        <StatCard title="Status Open" value={totalOpen} color="text-slate-500" />
        <StatCard title="Status On Progress" value={totalOnProgress} color="text-indigo-600" />
        <StatCard title="Overdue / Terlambat" value={totalOverdue} color="text-rose-500" badge="Kritis" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Pie Chart */}
        <div className="bg-white p-5 border border-slate-200 shadow-sm col-span-1 flex flex-col min-h-[350px]">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest mb-4 border-l-4 border-indigo-600 pl-3">Distribusi Status</h3>
          <div className="flex-1 w-full min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 20 }}>
                <Pie
                  data={dataStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {dataStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: '12px', border: '1px solid #e2e8f0', borderRadius: '0' }} />
                <Legend iconType="square" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', paddingTop: '20px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="bg-white p-5 border border-slate-200 shadow-sm col-span-1 lg:col-span-2 flex flex-col min-h-[350px]">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest mb-4 border-l-4 border-indigo-600 pl-3">
            {filterDept === 'All' ? 'Distribusi Tugas per Departemen & Status' : 'Kinerja Staf (Distribusi Status)'}
          </h3>
          <div className="flex-1 w-full min-h-[250px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={barData}
                margin={{ top: 20, right: 10, left: -20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold', fill: '#64748b' }} dy={10} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ fontSize: '12px', border: '1px solid #e2e8f0', borderRadius: '0' }} />
                <Legend iconType="square" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', paddingTop: '20px' }} />
                <Bar dataKey="Open" fill="#94a3b8" radius={[2, 2, 0, 0]} />
                <Bar dataKey="On Progress" fill="#4f46e5" radius={[2, 2, 0, 0]} />
                <Bar dataKey="Closed" fill="#10b981" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}

function StatCard({ title, value, color = "text-slate-800", badge }: { title: string, value: number, color?: string, badge?: string }) {
  return (
    <div className={`bg-white border border-slate-200 p-5 flex flex-col justify-between h-32 shadow-sm`}>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{title}</p>
      <div className="flex items-end justify-between">
        <span className={`text-4xl font-light ${color}`}>{value}</span>
        {badge && value > 0 && (
          <span className="px-2 py-0.5 bg-rose-50 text-rose-600 text-[10px] font-bold rounded-sm mb-2 uppercase tracking-widest shadow-sm border border-rose-100">
            {badge}
          </span>
        )}
      </div>
    </div>
  );
}
