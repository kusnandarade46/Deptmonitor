export type Department = 'Finance' | 'HR' | 'GA' | 'All';

export type TaskStatus = 'Open' | 'On Progress' | 'Closed';

export type Role = 'Director' | 'Manager' | 'Staff';

export interface User {
  id: string;
  name: string;
  role: Role;
  department: Department; // Director has 'All', Manager/Staff have specific
}

export interface Task {
  id: string;
  staffName: string;
  department: Department;
  description: string;
  startDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  status: TaskStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLogEntry {
  id: string;
  taskId: string;
  action: string;
  timestamp: string;
  userName: string;
}
