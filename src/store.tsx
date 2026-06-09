import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Task, ActivityLogEntry, User, Department, TaskStatus } from './types';
import { db, OperationType, handleFirestoreError } from './firebase';
import { collection, doc, onSnapshot, setDoc, updateDoc, deleteDoc, query, orderBy, getDoc } from 'firebase/firestore';

interface AppStore {
  currentUser: User | null;
  firebaseUser: any;
  isUserLoading: boolean;
  tasks: Task[];
  logs: ActivityLogEntry[];
  addTask: (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  loginGoogle: () => Promise<void>;
  loginEmail: (email: string, pass: string) => Promise<void>;
  registerEmail: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  registerUser: (name: string, role: string, dept: string) => Promise<void>;
}

const AppContext = createContext<AppStore | undefined>(undefined);

const DUMMY_USER: User = {
  id: 'admin_user',
  name: 'Admin',
  role: 'Director',
  department: 'All',
  email: 'admin@local.test'
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);

  useEffect(() => {
    const tasksQuery = query(collection(db, 'tasks'), orderBy('createdAt', 'desc'));
    const unsubTasks = onSnapshot(tasksQuery, (snapshot) => {
      setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'tasks');
    });

    const logsQuery = query(collection(db, 'logs'), orderBy('timestamp', 'desc'));
    const unsubLogs = onSnapshot(logsQuery, (snapshot) => {
      setLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ActivityLogEntry)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'logs');
    });

    return () => {
      unsubTasks();
      unsubLogs();
    };
  }, []);

  const addLog = useCallback(async (taskId: string, action: string) => {
    const logRef = doc(collection(db, 'logs'));
    await setDoc(logRef, {
      taskId,
      action,
      timestamp: new Date().toISOString(),
      userId: DUMMY_USER.id,
      userName: DUMMY_USER.name
    }).catch(e => handleFirestoreError(e, OperationType.CREATE, `logs/${logRef.id}`));
  }, []);

  const addTask = useCallback(async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    const taskRef = doc(collection(db, 'tasks'));
    const newTask = {
      ...taskData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await setDoc(taskRef, newTask).catch(e => handleFirestoreError(e, OperationType.CREATE, `tasks/${taskRef.id}`));
    await addLog(taskRef.id, `Created Task: ${newTask.description}`);
  }, [addLog]);

  const updateTask = useCallback(async (id: string, updates: Partial<Task>) => {
    const taskRef = doc(db, 'tasks', id);
    const existingSnap = await getDoc(taskRef);
    if (!existingSnap.exists()) return;
    
    const existing = existingSnap.data() as Task;
    const newUpdates = { ...updates, updatedAt: new Date().toISOString() };
    await updateDoc(taskRef, newUpdates).catch(e => handleFirestoreError(e, OperationType.UPDATE, `tasks/${id}`));
    
    if (updates.status && updates.status !== existing.status) {
      await addLog(id, `Changed status from ${existing.status} to ${updates.status}`);
    } else {
      await addLog(id, `Updated task details`);
    }
  }, [addLog]);

  const deleteTask = useCallback(async (id: string) => {
    const taskRef = doc(db, 'tasks', id);
    const existingSnap = await getDoc(taskRef);
    if (!existingSnap.exists()) return;
    const taskDesc = existingSnap.data().description;

    await deleteDoc(taskRef).catch(e => handleFirestoreError(e, OperationType.DELETE, `tasks/${id}`));
    await addLog(id, `Deleted Task: ${taskDesc}`);
  }, [addLog]);

  const loginGoogle = useCallback(async () => {}, []);
  const loginEmail = useCallback(async () => {}, []);
  const registerEmail = useCallback(async () => {}, []);
  const logout = useCallback(async () => {}, []);
  const registerUser = useCallback(async () => {}, []);

  return (
    <AppContext.Provider value={{ currentUser: DUMMY_USER, firebaseUser: {}, isUserLoading: false, tasks, logs, addTask, updateTask, deleteTask, loginGoogle, loginEmail, registerEmail, logout, registerUser }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppStore() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppStore must be used within an AppProvider');
  }
  return context;
}
