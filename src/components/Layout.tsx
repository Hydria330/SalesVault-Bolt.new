import React, { useState } from 'react';
import { useApp } from '../lib/store';
import { PageId } from '../lib/types';
import { LayoutDashboard, Users, CircleUser as UserCircle, MessageSquare, Lightbulb, Briefcase, Bell, FileText, Download, Settings, Shield, LogOut, Menu, X, Search, Moon, Sun, Lock } from 'lucide-react';

const navItems: { id: PageId; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: '仪表盘', icon: <LayoutDashboard size={20} /> },
  { id: 'customers', label: '客户管理', icon: <Users size={20} /> },
  { id: 'contacts', label: '联系人', icon: <UserCircle size={20} /> },
  { id: 'followups', label: '跟进记录', icon: <MessageSquare size={20} /> },
  { id: 'problems', label: '难题与经验', icon: <Lightbulb size={20} /> },
  { id: 'resources', label: '资源管理', icon: <Briefcase size={20} /> },
  { id: 'reminders', label: '提醒中心', icon: <Bell size={20} /> },
  { id: 'reports', label: '报告生成', icon: <FileText size={20} /> },
  { id: 'export', label: '数据导出', icon: <Download size={20} /> },
  { id: 'settings', label: '设置', icon: <Settings size={20} /> },
  { id: 'trust', label: '安全与信任', icon: <Shield size={20} /> },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { currentPage, navigate, toggleTheme, theme, searchQuery, setSearchQuery, logout, reminders } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const pendingReminders = reminders.filter((r) => !r.isCompleted).length;

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-200 lg:transform-none ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-200 dark:border-gray-700">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
            <Lock size={16} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">SalesVault</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">私密销售记录</p>
          </div>
          <button
            className="ml-auto lg:hidden text-gray-500"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="px-3 py-4 space-y-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 180px)' }}>
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                navigate(item.id);
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                currentPage === item.id
                  ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
              {item.id === 'reminders' && pendingReminders > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {pendingReminders}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-3 px-2">
            <Lock size={14} className="text-emerald-600" />
            <span className="text-xs text-emerald-600 font-medium">AES-256-GCM 已加密</span>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <LogOut size={16} />
            <span>安全退出</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center px-4 lg:px-6 gap-4 shrink-0">
          <button
            className="lg:hidden text-gray-500 dark:text-gray-400"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={24} />
          </button>

          <div className="flex-1 relative max-w-md">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="搜索客户、联系人、记录..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            <button
              onClick={() => navigate('reminders')}
              className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors relative"
            >
              <Bell size={20} />
              {pendingReminders > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {pendingReminders}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
