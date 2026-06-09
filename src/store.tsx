import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Task, ActivityLogEntry, User, Department, TaskStatus } from './types';
import { db, auth, OperationType, handleFirestoreError } from './firebase';
import { collection, doc, onSnapshot, setDoc, updateDoc, deleteDoc, query, orderBy, serverTimestamp, getDoc } from 'firebase/firestore';
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User as FirebaseUser, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

interface AppStore {
  currentUser: User | null;
  firebaseUser: FirebaseUser | null;
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

export function AppProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
  const [authInitialized, setAuthInitialized] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setAuthInitialized(true);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!firebaseUser) {
      setCurrentUser(null);
      setIsUserLoading(false);
      return;
    }
    setIsUserLoading(true);
    const unsub = onSnapshot(doc(db, 'users', firebaseUser.uid), (docSnap) => {
      if (docSnap.exists()) {
        setCurrentUser({ id: docSnap.id, ...docSnap.data() } as User);
      } else {
        setCurrentUser(null);
      }
      setIsUserLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${firebaseUser.uid}`);
      setIsUserLoading(false);
    });
    return unsub;
  }, [firebaseUser]);

  useEffect(() => {
    if (!currentUser) {
      setTasks([]);
      setLogs([]);
      return;
    }

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
    if (!currentUser) return;
    const taskRef = doc(collection(db, 'tasks'));
    const newTask = {
      ...taskData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await setDoc(taskRef, newTask).catch(e => handleFirestoreError(e, OperationType.CREATE, `tasks/${taskRef.id}`));
    await addLog(taskRef.id, `Created Task: ${newTask.description}`);
  }, [currentUser, addLog]);

  const updateTask = useCallback(async (id: string, updates: Partial<Task>) => {
    if (!currentUser) return;
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
  }, [currentUser, addLog]);

  const deleteTask = useCallback(async (id: string) => {
    if (!currentUser) return;
    const taskRef = doc(db, 'tasks', id);
    const existingSnap = await getDoc(taskRef);
    if (!existingSnap.exists()) return;
    const taskDesc = existingSnap.data().description;

    await deleteDoc(taskRef).catch(e => handleFirestoreError(e, OperationType.DELETE, `tasks/${id}`));
    await addLog(id, `Deleted Task: ${taskDesc}`);
  }, [currentUser, addLog]);

  const loginGoogle = useCallback(async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  }, []);

  const loginEmail = useCallback(async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  }, []);

  const registerEmail = useCallback(async (email: string, pass: string) => {
    await createUserWithEmailAndPassword(auth, email, pass);
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);
  }, []);

  const registerUser = useCallback(async (name: string, role: string, department: string) => {
    if (!firebaseUser) return;
    const userRef = doc(db, 'users', firebaseUser.uid);
    await setDoc(userRef, {
      email: firebaseUser.email || '',
      name,
      role,
      department
    }).catch(e => handleFirestoreError(e, OperationType.CREATE, `users/${firebaseUser.uid}`));
  }, [firebaseUser]);

  if (!authInitialized) {
    return <div className="h-screen w-screen flex items-center justify-center bg-slate-50 text-slate-500 font-mono tracking-widest uppercase py-8">Initializing...</div>;
  }

  return (
    <AppContext.Provider value={{ currentUser, firebaseUser, isUserLoading, tasks, logs, addTask, updateTask, deleteTask, loginGoogle, loginEmail, registerEmail, logout, registerUser }}>
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
