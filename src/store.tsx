import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Task, ActivityLogEntry, User, Department, TaskStatus } from './types';
import { db, OperationType, handleFirestoreError } from './firebase';
import { collection, doc, onSnapshot, setDoc, updateDoc, deleteDoc, query, orderBy, getDoc } from 'firebase/firestore';

interface AppStore {
  currentUser: User | null;
  isUserLoading: boolean;
  tasks: Task[];
  logs: ActivityLogEntry[];
  addTask: (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  loginWithPin: (name: string, pin: string) => Promise<void>;
  registerWithPin: (name: string, pin: string, role: string, dept: string) => Promise<void>;
  logout: () => Promise<void>;
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
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);

  useEffect(() => {
    // Auto-login from localStorage
    const savedUserId = localStorage.getItem('deptMonitorUserId');
    if (savedUserId) {
      getDoc(doc(db, 'users', savedUserId)).then(docSnap => {
        if (docSnap.exists()) {
          setCurrentUser({ id: docSnap.id, ...docSnap.data() } as User);
        } else {
          localStorage.removeItem('deptMonitorUserId');
        }
      }).catch(e => {
        console.error("Error loading user:", e);
      }).finally(() => {
        setIsUserLoading(false);
      });
    } else {
      setIsUserLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!currentUser) return;
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
  }, [currentUser]);

  const addLog = useCallback(async (taskId: string, action: string) => {
    if (!currentUser) return;
    const logRef = doc(collection(db, 'logs'));
    await setDoc(logRef, {
      taskId,
      action,
      timestamp: new Date().toISOString(),
      userId: currentUser.id,
      userName: currentUser.name
    }).catch(e => handleFirestoreError(e, OperationType.CREATE, `logs/${logRef.id}`));
  }, [currentUser]);

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

  const loginWithPin = useCallback(async (name: string, pin: string) => {
    // Instead of querying all users and filtering (which requires index), we'll do a simple trick: use `{name}_{pin}` as doc ID, or just store a flat list or query 'name'
    // Since firestore doesn't have unique constraints, we can use the `name` as document ID to ensure name uniqueness.
    const userId = name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const userSnap = await getDoc(doc(db, 'users', userId));
    if (!userSnap.exists()) {
      throw new Error("Pengguna tidak ditemukan. Silakan Register dulu.");
    }
    const userData = userSnap.data();
    if (userData.pin !== pin) {
      throw new Error("PIN salah!");
    }
    const validatedUser = { id: userSnap.id, ...userData } as User;
    setCurrentUser(validatedUser);
    localStorage.setItem('deptMonitorUserId', validatedUser.id);
    localStorage.setItem('deptMonitorName', validatedUser.name);
  }, []);

  const registerWithPin = useCallback(async (name: string, pin: string, role: string, department: string) => {
    if (!name || !pin) throw new Error("Nama dan PIN tidak boleh kosong.");
    const userId = name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const userRef = doc(db, 'users', userId);
    const existing = await getDoc(userRef);
    if (existing.exists()) {
      throw new Error("Nama sudah digunakan, silakan pilih nama lain atau langsung login.");
    }
    const newUser = {
      name,
      pin,
      role,
      department
    };
    await setDoc(userRef, newUser);
    const validatedUser = { id: userId, ...newUser } as User;
    setCurrentUser(validatedUser);
    localStorage.setItem('deptMonitorUserId', validatedUser.id);
    localStorage.setItem('deptMonitorName', validatedUser.name);
  }, []);

  const logout = useCallback(async () => {
    setCurrentUser(null);
    setTasks([]);
    setLogs([]);
    localStorage.removeItem('deptMonitorUserId');
    localStorage.removeItem('deptMonitorName');
  }, []);

  return (
    <AppContext.Provider value={{ currentUser, isUserLoading, tasks, logs, addTask, updateTask, deleteTask, loginWithPin, registerWithPin, logout }}>
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
