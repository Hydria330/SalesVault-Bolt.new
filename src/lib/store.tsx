/**
 * Global State Store - React Context based state management
 *
 * Manages:
 * - Authentication state (master password -> derived key in memory)
 * - All CRUD operations for each data type
 * - Theme, settings, and navigation state
 *
 * Security: The CryptoKey object exists ONLY in React state (memory).
 * When the user logs out, the key is destroyed by setting state to null.
 */

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import {
  Customer, Contact, FollowUp, Problem, Resource, Reminder, Report,
  AppSettings, PageId, CompetitorAnalysis, DashboardStats, CustomerStatus,
} from './types';
import {
  deriveKey, generateSalt, storeSalt, getStoredSalt,
  createVerificationToken, verifyPassword,
} from './crypto';
import {
  saveRecord, getAllRecords, deleteRecord, clearStore,
  deleteDatabase, getStorageEstimate, STORES, saveRecords,
  StoreName,
} from './db';
import { generateId, isToday, isThisWeek } from './utils';

// ============ State Shape ============

interface AppState {
  // Auth
  isInitialized: boolean;
  isAuthenticated: boolean;
  cryptoKey: CryptoKey | null;
  isUnlocking: boolean;
  authError: string;

  // Navigation
  currentPage: PageId;
  selectedCustomerId: string | null;
  selectedContactId: string | null;

  // Data
  customers: Customer[];
  contacts: Contact[];
  followUps: FollowUp[];
  problems: Problem[];
  resources: Resource[];
  reminders: Reminder[];
  reports: Report[];
  competitors: CompetitorAnalysis[];
  settings: AppSettings;

  // UI
  theme: 'light' | 'dark';
  searchQuery: string;
  isLoading: boolean;
  notification: { message: string; type: 'success' | 'error' | 'info' } | null;

  // Storage
  storageUsed: number;
  storageQuota: number;
}

interface AppActions {
  // Auth
  initialize: (password: string) => Promise<void>;
  unlock: (password: string) => Promise<void>;
  logout: () => void;
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;

  // Navigation
  navigate: (page: PageId, customerId?: string) => void;

  // Customer CRUD
  addCustomer: (data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Customer>;
  updateCustomer: (data: Customer) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;

  // Contact CRUD
  addContact: (data: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Contact>;
  updateContact: (data: Contact) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;

  // FollowUp CRUD
  addFollowUp: (data: Omit<FollowUp, 'id' | 'createdAt' | 'updatedAt'>) => Promise<FollowUp>;
  updateFollowUp: (data: FollowUp) => Promise<void>;
  deleteFollowUp: (id: string) => Promise<void>;

  // Problem CRUD
  addProblem: (data: Omit<Problem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Problem>;
  updateProblem: (data: Problem) => Promise<void>;
  deleteProblem: (id: string) => Promise<void>;

  // Resource CRUD
  addResource: (data: Omit<Resource, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Resource>;
  updateResource: (data: Resource) => Promise<void>;
  deleteResource: (id: string) => Promise<void>;

  // Reminder CRUD
  addReminder: (data: Omit<Reminder, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Reminder>;
  updateReminder: (data: Reminder) => Promise<void>;
  deleteReminder: (id: string) => Promise<void>;
  completeReminder: (id: string) => Promise<void>;

  // Report CRUD
  addReport: (data: Omit<Report, 'id' | 'createdAt'>) => Promise<Report>;
  deleteReport: (id: string) => Promise<void>;

  // Competitor CRUD
  addCompetitor: (data: Omit<CompetitorAnalysis, 'id' | 'createdAt' | 'updatedAt'>) => Promise<CompetitorAnalysis>;
  updateCompetitor: (data: CompetitorAnalysis) => Promise<void>;
  deleteCompetitor: (id: string) => Promise<void>;

  // Settings
  updateSettings: (settings: Partial<AppSettings>) => Promise<void>;

  // Theme
  toggleTheme: () => void;

  // Search
  setSearchQuery: (query: string) => void;

  // Data management
  exportAllData: () => Promise<string>;
  importData: (json: string) => Promise<void>;
  deleteAllData: () => Promise<void>;
  refreshData: () => Promise<void>;
  refreshStorage: () => Promise<void>;

  // Notification
  clearNotification: () => void;
  showNotification: (message: string, type: 'success' | 'error' | 'info') => void;

  // Dashboard
  getDashboardStats: () => DashboardStats;
}

type AppContextType = AppState & AppActions;

const AppContext = createContext<AppContextType | null>(null);

export function useApp(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

// ============ Default Settings ============

const defaultSettings: AppSettings = {
  theme: 'light',
  language: 'zh',
  autoReportEnabled: false,
  autoReportDay: 0,
  autoReportType: 'weekly',
  biometricAuthEnabled: false,
  cloudBackupEnabled: false,
  lastBackupTime: null,
};

// ============ Provider Component ============

export function AppProvider({ children }: { children: React.ReactNode }) {
  // Auth state
  const [isInitialized, setIsInitialized] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [cryptoKey, setCryptoKey] = useState<CryptoKey | null>(null);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [authError, setAuthError] = useState('');

  // Navigation
  const [currentPage, setCurrentPage] = useState<PageId>('login');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [selectedContactId] = useState<string | null>(null);

  // Data
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [competitors, setCompetitors] = useState<CompetitorAnalysis[]>([]);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);

  // UI
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [storageUsed, setStorageUsed] = useState(0);
  const [storageQuota, setStorageQuota] = useState(0);

  const keyRef = useRef<CryptoKey | null>(null);

  // Sync keyRef with cryptoKey state
  useEffect(() => {
    keyRef.current = cryptoKey;
  }, [cryptoKey]);

  // Apply theme
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  // Check if already initialized on mount
  useEffect(() => {
    const salt = getStoredSalt();
    const hasToken = localStorage.getItem('verification_token');
    if (salt && hasToken) {
      setIsInitialized(true);
    }
  }, []);

  // Reminder checker
  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(() => {
      const now = Date.now();
      reminders.forEach((r) => {
        if (!r.isCompleted && r.dueTime - r.advanceMinutes * 60000 <= now && r.dueTime > now - 600000) {
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('SalesVault 提醒', { body: r.title, tag: r.id });
          }
        }
      });
    }, 60000);
    return () => clearInterval(interval);
  }, [isAuthenticated, reminders]);

  // ============ Data Loading ============

  const refreshData = useCallback(async () => {
    const key = keyRef.current;
    if (!key) return;

    setIsLoading(true);
    try {
      const [c, ct, f, p, r, rm, rp, cp] = await Promise.all([
        getAllRecords<Customer>(STORES.CUSTOMERS, key),
        getAllRecords<Contact>(STORES.CONTACTS, key),
        getAllRecords<FollowUp>(STORES.FOLLOWUPS, key),
        getAllRecords<Problem>(STORES.PROBLEMS, key),
        getAllRecords<Resource>(STORES.RESOURCES, key),
        getAllRecords<Reminder>(STORES.REMINDERS, key),
        getAllRecords<Report>(STORES.REPORTS, key),
        getAllRecords<CompetitorAnalysis>(STORES.COMPETITORS, key),
      ]);

      setCustomers(c.sort((a, b) => b.updatedAt - a.updatedAt));
      setContacts(ct.sort((a, b) => b.updatedAt - a.updatedAt));
      setFollowUps(f.sort((a, b) => b.createdAt - a.createdAt));
      setProblems(p.sort((a, b) => b.updatedAt - a.updatedAt));
      setResources(r.sort((a, b) => b.updatedAt - a.updatedAt));
      setReminders(rm.sort((a, b) => (a.isCompleted ? 1 : 0) - (b.isCompleted ? 1 : 0) || a.dueTime - b.dueTime));
      setReports(rp.sort((a, b) => b.createdAt - a.createdAt));
      setCompetitors(cp.sort((a, b) => b.updatedAt - a.updatedAt));
    } catch (e) {
      console.error('Failed to load data:', e);
    }
    setIsLoading(false);
  }, []);

  const refreshStorage = useCallback(async () => {
    const { used, quota } = await getStorageEstimate();
    setStorageUsed(used);
    setStorageQuota(quota);
  }, []);

  // ============ Auth Actions ============

  const initialize = useCallback(async (password: string) => {
    setIsUnlocking(true);
    setAuthError('');
    try {
      const salt = generateSalt();
      storeSalt(salt);
      const key = await deriveKey(password, salt);
      const token = await createVerificationToken(key);
      localStorage.setItem('verification_token', JSON.stringify(token));

      setCryptoKey(key);
      keyRef.current = key;
      setIsInitialized(true);
      setIsAuthenticated(true);
      setCurrentPage('dashboard');
      await refreshData();
      await refreshStorage();
    } catch (e) {
      setAuthError('初始化失败，请重试');
    }
    setIsUnlocking(false);
  }, [refreshData, refreshStorage]);

  const unlock = useCallback(async (password: string) => {
    setIsUnlocking(true);
    setAuthError('');
    try {
      const salt = getStoredSalt();
      if (!salt) {
        setAuthError('未找到加密配置，请重新初始化');
        return;
      }
      const key = await deriveKey(password, salt);
      const tokenStr = localStorage.getItem('verification_token');
      if (!tokenStr) {
        setAuthError('验证信息缺失');
        return;
      }
      const token = JSON.parse(tokenStr);
      const valid = await verifyPassword(key, token);
      if (!valid) {
        setAuthError('主密码错误，请重试');
        return;
      }
      setCryptoKey(key);
      keyRef.current = key;
      setIsAuthenticated(true);
      setCurrentPage('dashboard');
      await refreshData();
      await refreshStorage();
    } catch {
      setAuthError('解锁失败，请检查密码');
    }
    setIsUnlocking(false);
  }, [refreshData, refreshStorage]);

  const logout = useCallback(() => {
    setCryptoKey(null);
    keyRef.current = null;
    setIsAuthenticated(false);
    setCurrentPage('login');
    setCustomers([]);
    setContacts([]);
    setFollowUps([]);
    setProblems([]);
    setResources([]);
    setReminders([]);
    setReports([]);
    setCompetitors([]);
    setSearchQuery('');
  }, []);

  const changePassword = useCallback(async (oldPassword: string, newPassword: string) => {
    const key = keyRef.current;
    if (!key) throw new Error('Not authenticated');

    // Verify old password
    const salt = getStoredSalt();
    if (!salt) throw new Error('Salt not found');
    const oldKey = await deriveKey(oldPassword, salt);
    const tokenStr = localStorage.getItem('verification_token');
    if (!tokenStr) throw new Error('Token not found');
    const token = JSON.parse(tokenStr);
    const valid = await verifyPassword(oldKey, token);
    if (!valid) throw new Error('旧密码错误');

    // Generate new salt and key
    const newSalt = generateSalt();
    storeSalt(newSalt);
    const newKey = await deriveKey(newPassword, newSalt);
    const newToken = await createVerificationToken(newKey);
    localStorage.setItem('verification_token', JSON.stringify(newToken));

    // Re-encrypt all data with new key
    const allData: Array<{ store: string; records: any[] }> = [
      { store: STORES.CUSTOMERS, records: customers },
      { store: STORES.CONTACTS, records: contacts },
      { store: STORES.FOLLOWUPS, records: followUps },
      { store: STORES.PROBLEMS, records: problems },
      { store: STORES.RESOURCES, records: resources },
      { store: STORES.REMINDERS, records: reminders },
      { store: STORES.REPORTS, records: reports },
      { store: STORES.COMPETITORS, records: competitors },
    ];

    for (const { store, records } of allData) {
      await clearStore(store as StoreName);
      await saveRecords(store as StoreName, records, newKey);
    }

    setCryptoKey(newKey);
    keyRef.current = newKey;
  }, [customers, contacts, followUps, problems, resources, reminders, reports, competitors]);

  // ============ Navigation ============

  const navigate = useCallback((page: PageId, customerId?: string) => {
    setCurrentPage(page);
    if (customerId !== undefined) setSelectedCustomerId(customerId);
  }, []);

  // ============ Customer CRUD ============

  const addCustomer = useCallback(async (data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Customer> => {
    const key = keyRef.current!;
    const now = Date.now();
    const customer: Customer = { ...data, id: generateId(), createdAt: now, updatedAt: now };
    await saveRecord(STORES.CUSTOMERS, customer, key);
    setCustomers((prev) => [customer, ...prev]);
    return customer;
  }, []);

  const updateCustomer = useCallback(async (data: Customer) => {
    const key = keyRef.current!;
    await saveRecord(STORES.CUSTOMERS, data, key);
    setCustomers((prev) => prev.map((c) => (c.id === data.id ? data : c)));
  }, []);

  const deleteCustomer = useCallback(async (id: string) => {
    await deleteRecord(STORES.CUSTOMERS, id);
    setCustomers((prev) => prev.filter((c) => c.id !== id));
    setContacts((prev) => prev.filter((c) => c.customerId !== id));
    setFollowUps((prev) => prev.filter((f) => f.customerId !== id));
    setCompetitors((prev) => prev.filter((c) => c.customerId !== id));
  }, []);

  // ============ Contact CRUD ============

  const addContact = useCallback(async (data: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>): Promise<Contact> => {
    const key = keyRef.current!;
    const now = Date.now();
    const contact: Contact = { ...data, id: generateId(), createdAt: now, updatedAt: now };
    await saveRecord(STORES.CONTACTS, contact, key);
    setContacts((prev) => [contact, ...prev]);
    return contact;
  }, []);

  const updateContact = useCallback(async (data: Contact) => {
    const key = keyRef.current!;
    await saveRecord(STORES.CONTACTS, data, key);
    setContacts((prev) => prev.map((c) => (c.id === data.id ? data : c)));
  }, []);

  const deleteContact = useCallback(async (id: string) => {
    await deleteRecord(STORES.CONTACTS, id);
    setContacts((prev) => prev.filter((c) => c.id !== id));
  }, []);

  // ============ Reminder CRUD (must be before FollowUp since addFollowUp depends on it) ============

  const addReminder = useCallback(async (data: Omit<Reminder, 'id' | 'createdAt' | 'updatedAt'>): Promise<Reminder> => {
    const key = keyRef.current!;
    const now = Date.now();
    const reminder: Reminder = { ...data, id: generateId(), createdAt: now, updatedAt: now };
    await saveRecord(STORES.REMINDERS, reminder, key);
    setReminders((prev) => [reminder, ...prev]);
    return reminder;
  }, []);

  // ============ FollowUp CRUD ============

  const addFollowUp = useCallback(async (data: Omit<FollowUp, 'id' | 'createdAt' | 'updatedAt'>): Promise<FollowUp> => {
    const key = keyRef.current!;
    const now = Date.now();
    const followUp: FollowUp = { ...data, id: generateId(), createdAt: now, updatedAt: now };
    await saveRecord(STORES.FOLLOWUPS, followUp, key);
    setFollowUps((prev) => [followUp, ...prev]);

    // Auto-create reminder if nextFollowUpTime is set
    if (data.nextFollowUpTime) {
      const reminder: Omit<Reminder, 'id' | 'createdAt' | 'updatedAt'> = {
        type: 'follow_up',
        title: `跟进提醒: ${customers.find((c) => c.id === data.customerId)?.companyName || '客户'}`,
        description: data.content,
        dueTime: data.nextFollowUpTime,
        customerId: data.customerId,
        followUpId: followUp.id,
        advanceMinutes: 60,
        isRepeating: false,
        repeatIntervalMinutes: 0,
        isCompleted: false,
        completedAt: null,
      };
      await addReminder(reminder);
    }

    return followUp;
  }, [customers, addReminder]);

  const updateFollowUp = useCallback(async (data: FollowUp) => {
    const key = keyRef.current!;
    await saveRecord(STORES.FOLLOWUPS, data, key);
    setFollowUps((prev) => prev.map((f) => (f.id === data.id ? data : f)));
  }, []);

  const deleteFollowUp = useCallback(async (id: string) => {
    await deleteRecord(STORES.FOLLOWUPS, id);
    setFollowUps((prev) => prev.filter((f) => f.id !== id));
  }, []);

  // ============ Problem CRUD ============

  const addProblem = useCallback(async (data: Omit<Problem, 'id' | 'createdAt' | 'updatedAt'>): Promise<Problem> => {
    const key = keyRef.current!;
    const now = Date.now();
    const problem: Problem = { ...data, id: generateId(), createdAt: now, updatedAt: now };
    await saveRecord(STORES.PROBLEMS, problem, key);
    setProblems((prev) => [problem, ...prev]);
    return problem;
  }, []);

  const updateProblem = useCallback(async (data: Problem) => {
    const key = keyRef.current!;
    await saveRecord(STORES.PROBLEMS, data, key);
    setProblems((prev) => prev.map((p) => (p.id === data.id ? data : p)));
  }, []);

  const deleteProblem = useCallback(async (id: string) => {
    await deleteRecord(STORES.PROBLEMS, id);
    setProblems((prev) => prev.filter((p) => p.id !== id));
  }, []);

  // ============ Resource CRUD ============

  const addResource = useCallback(async (data: Omit<Resource, 'id' | 'createdAt' | 'updatedAt'>): Promise<Resource> => {
    const key = keyRef.current!;
    const now = Date.now();
    const resource: Resource = { ...data, id: generateId(), createdAt: now, updatedAt: now };
    await saveRecord(STORES.RESOURCES, resource, key);
    setResources((prev) => [resource, ...prev]);
    return resource;
  }, []);

  const updateResource = useCallback(async (data: Resource) => {
    const key = keyRef.current!;
    await saveRecord(STORES.RESOURCES, data, key);
    setResources((prev) => prev.map((r) => (r.id === data.id ? data : r)));
  }, []);

  const deleteResource = useCallback(async (id: string) => {
    await deleteRecord(STORES.RESOURCES, id);
    setResources((prev) => prev.filter((r) => r.id !== id));
  }, []);

  // ============ Reminder CRUD (continued) ============

  const updateReminder = useCallback(async (data: Reminder) => {
    const key = keyRef.current!;
    await saveRecord(STORES.REMINDERS, data, key);
    setReminders((prev) => prev.map((r) => (r.id === data.id ? data : r)));
  }, []);

  const deleteReminder = useCallback(async (id: string) => {
    await deleteRecord(STORES.REMINDERS, id);
    setReminders((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const completeReminder = useCallback(async (id: string) => {
    const reminder = reminders.find((r) => r.id === id);
    if (!reminder) return;
    const updated = { ...reminder, isCompleted: true, completedAt: Date.now() };
    const key = keyRef.current!;
    await saveRecord(STORES.REMINDERS, updated, key);
    setReminders((prev) => prev.map((r) => (r.id === id ? updated : r)));
  }, [reminders]);

  // ============ Report CRUD ============

  const addReport = useCallback(async (data: Omit<Report, 'id' | 'createdAt'>): Promise<Report> => {
    const key = keyRef.current!;
    const report: Report = { ...data, id: generateId(), createdAt: Date.now() };
    await saveRecord(STORES.REPORTS, report, key);
    setReports((prev) => [report, ...prev]);
    return report;
  }, []);

  const deleteReport = useCallback(async (id: string) => {
    await deleteRecord(STORES.REPORTS, id);
    setReports((prev) => prev.filter((r) => r.id !== id));
  }, []);

  // ============ Competitor CRUD ============

  const addCompetitor = useCallback(async (data: Omit<CompetitorAnalysis, 'id' | 'createdAt' | 'updatedAt'>): Promise<CompetitorAnalysis> => {
    const key = keyRef.current!;
    const now = Date.now();
    const comp: CompetitorAnalysis = { ...data, id: generateId(), createdAt: now, updatedAt: now };
    await saveRecord(STORES.COMPETITORS, comp, key);
    setCompetitors((prev) => [comp, ...prev]);
    return comp;
  }, []);

  const updateCompetitor = useCallback(async (data: CompetitorAnalysis) => {
    const key = keyRef.current!;
    await saveRecord(STORES.COMPETITORS, data, key);
    setCompetitors((prev) => prev.map((c) => (c.id === data.id ? data : c)));
  }, []);

  const deleteCompetitor = useCallback(async (id: string) => {
    await deleteRecord(STORES.COMPETITORS, id);
    setCompetitors((prev) => prev.filter((c) => c.id !== id));
  }, []);

  // ============ Settings ============

  const updateSettings = useCallback(async (partial: Partial<AppSettings>) => {
    const newSettings = { ...settings, ...partial };
    setSettings(newSettings);
    if (partial.theme) {
      setTheme(partial.theme);
    }
    if (cryptoKey) {
      await saveRecord(STORES.SETTINGS, { id: 'app_settings', ...newSettings }, cryptoKey);
    }
  }, [settings, cryptoKey]);

  // ============ Theme ============

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      return next;
    });
  }, []);

  // ============ Data Management ============

  const exportAllData = useCallback(async (): Promise<string> => {
    return JSON.stringify({
      customers,
      contacts,
      followUps,
      problems,
      resources,
      reminders,
      reports,
      competitors,
      settings,
      exportedAt: Date.now(),
      version: 1,
    }, null, 2);
  }, [customers, contacts, followUps, problems, resources, reminders, reports, competitors, settings]);

  const importData = useCallback(async (json: string) => {
    const key = keyRef.current;
    if (!key) throw new Error('Not authenticated');

    const data = JSON.parse(json);
    const stores = [
      { store: STORES.CUSTOMERS, records: data.customers || [] },
      { store: STORES.CONTACTS, records: data.contacts || [] },
      { store: STORES.FOLLOWUPS, records: data.followUps || [] },
      { store: STORES.PROBLEMS, records: data.problems || [] },
      { store: STORES.RESOURCES, records: data.resources || [] },
      { store: STORES.REMINDERS, records: data.reminders || [] },
      { store: STORES.REPORTS, records: data.reports || [] },
      { store: STORES.COMPETITORS, records: data.competitors || [] },
    ];

    for (const { store, records } of stores) {
      await saveRecords(store, records, key);
    }

    await refreshData();
  }, [refreshData]);

  const deleteAllData = useCallback(async () => {
    await deleteDatabase();
    localStorage.removeItem('crypto_salt');
    localStorage.removeItem('verification_token');
    setCryptoKey(null);
    keyRef.current = null;
    setIsAuthenticated(false);
    setIsInitialized(false);
    setCurrentPage('login');
    setCustomers([]);
    setContacts([]);
    setFollowUps([]);
    setProblems([]);
    setResources([]);
    setReminders([]);
    setReports([]);
    setCompetitors([]);
  }, []);

  // ============ Notifications ============

  const clearNotification = useCallback(() => setNotification(null), []);

  const showNotification = useCallback((message: string, type: 'success' | 'error' | 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  // ============ Dashboard Stats ============

  const getDashboardStats = useCallback((): DashboardStats => {
    const todayFollowUps = followUps.filter((f) => isToday(f.createdAt));
    const weekCustomers = customers.filter((c) => isThisWeek(c.createdAt));
    const weekFollowUps = followUps.filter((f) => isThisWeek(f.createdAt));
    const weekClosed = customers.filter((c) => c.status === 'closed' && isThisWeek(c.updatedAt));
    const weekProblemsSolved = problems.filter((p) => p.status === 'solved' && isThisWeek(p.updatedAt));

    const statusDistribution = {} as Record<CustomerStatus, number>;
    const statuses: CustomerStatus[] = ['potential', 'following', 'intention', 'closed', 'lost'];
    statuses.forEach((s) => {
      statusDistribution[s] = customers.filter((c) => c.status === s).length;
    });

    const recentUpdates = [
      ...customers.map((c) => ({ type: 'customer' as const, id: c.id, title: c.companyName, updatedAt: c.updatedAt })),
      ...followUps.map((f) => ({ type: 'followup' as const, id: f.id, title: f.content.slice(0, 30), updatedAt: f.updatedAt })),
      ...problems.map((p) => ({ type: 'problem' as const, id: p.id, title: p.title, updatedAt: p.updatedAt })),
    ].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 10);

    return {
      todayFollowUps,
      weekNewCustomers: weekCustomers.length,
      weekFollowUpCount: weekFollowUps.length,
      weekClosedCount: weekClosed.length,
      weekProblemsSolved: weekProblemsSolved.length,
      statusDistribution,
      recentUpdates,
      pendingProblems: problems.filter((p) => p.status !== 'solved'),
      pendingReminders: reminders.filter((r) => !r.isCompleted),
    };
  }, [customers, followUps, problems, reminders]);

  // ============ Context Value ============

  const value: AppContextType = {
    isInitialized, isAuthenticated, cryptoKey, isUnlocking, authError,
    currentPage, selectedCustomerId, selectedContactId,
    customers, contacts, followUps, problems, resources, reminders, reports, competitors, settings,
    theme, searchQuery, isLoading, notification,
    storageUsed, storageQuota,
    initialize, unlock, logout, changePassword,
    navigate,
    addCustomer, updateCustomer, deleteCustomer,
    addContact, updateContact, deleteContact,
    addFollowUp, updateFollowUp, deleteFollowUp,
    addProblem, updateProblem, deleteProblem,
    addResource, updateResource, deleteResource,
    addReminder, updateReminder, deleteReminder, completeReminder,
    addReport, deleteReport,
    addCompetitor, updateCompetitor, deleteCompetitor,
    updateSettings, toggleTheme, setSearchQuery,
    exportAllData, importData, deleteAllData, refreshData, refreshStorage,
    clearNotification, showNotification,
    getDashboardStats,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
