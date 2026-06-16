import React, { useState } from 'react';
import { useApp } from '../lib/store';
import { CRYPTO_CONFIG } from '../lib/crypto';
import { formatFileSize, downloadFile, getPasswordStrength } from '../lib/utils';
import {
  Shield, HardDrive, Download,
  Moon, Sun, KeyRound, AlertTriangle
} from 'lucide-react';

export default function Settings() {
  const {
    theme, toggleTheme, storageUsed, storageQuota,
    exportAllData, importData, deleteAllData, changePassword,
    showNotification,
  } = useApp();

  const [showChangePassword, setShowChangePassword] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [importing, setImporting] = useState(false);

  const strength = getPasswordStrength(newPassword);

  const handleChangePassword = async () => {
    if (newPassword.length < 8) {
      showNotification('新密码至少8位', 'error');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      showNotification('两次密码不一致', 'error');
      return;
    }
    try {
      await changePassword(oldPassword, newPassword);
      showNotification('密码修改成功，所有数据已重新加密', 'success');
      setShowChangePassword(false);
      setOldPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (e: any) {
      showNotification(e.message || '密码修改失败', 'error');
    }
  };

  const handleExportAll = async () => {
    try {
      const data = await exportAllData();
      downloadFile(data, `salesvault_backup_${new Date().toISOString().slice(0, 10)}.json`, 'application/json');
      showNotification('数据已导出', 'success');
    } catch {
      showNotification('导出失败', 'error');
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const text = await file.text();
      await importData(text);
      showNotification('数据导入成功', 'success');
    } catch {
      showNotification('导入失败，请检查文件格式', 'error');
    }
    setImporting(false);
    e.target.value = '';
  };

  const handleDeleteAll = async () => {
    if (deleteConfirmText !== 'DELETE ALL') return;
    try {
      await deleteAllData();
      showNotification('所有数据已彻底删除', 'success');
    } catch {
      showNotification('删除失败', 'error');
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">设置</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">安全与数据管理</p>
      </div>

      {/* Theme */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">外观</h3>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-300">主题模式</span>
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            {theme === 'light' ? '深色模式' : '浅色模式'}
          </button>
        </div>
      </div>

      {/* Encryption info */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <Shield size={16} className="text-emerald-600" /> 加密信息
        </h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">加密算法</p>
            <p className="font-medium text-gray-900 dark:text-white">{CRYPTO_CONFIG.algorithm}</p>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">密钥派生</p>
            <p className="font-medium text-gray-900 dark:text-white">{CRYPTO_CONFIG.keyDerivation}</p>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">迭代次数</p>
            <p className="font-medium text-gray-900 dark:text-white">{CRYPTO_CONFIG.iterations.toLocaleString()}</p>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p className="text-xs text-gray-500 mb-1">密钥长度</p>
            <p className="font-medium text-gray-900 dark:text-white">{CRYPTO_CONFIG.keyLength} bits</p>
          </div>
        </div>
        <div className="mt-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
          <p className="text-xs text-emerald-600 dark:text-emerald-400">
            加密密钥仅存在于设备内存中，退出应用后立即销毁。平台无法访问您的明文数据。
          </p>
        </div>
      </div>

      {/* Storage */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <HardDrive size={16} className="text-blue-600" /> 存储
        </h3>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600 dark:text-gray-300">已使用</span>
          <span className="text-sm font-medium text-gray-900 dark:text-white">{formatFileSize(storageUsed)}</span>
        </div>
        <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
          <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${Math.min((storageUsed / storageQuota) * 100, 100)}%` }} />
        </div>
        <p className="text-xs text-gray-400 mt-1">总容量: {formatFileSize(storageQuota)}</p>
      </div>

      {/* Change password */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <KeyRound size={16} className="text-amber-600" /> 修改主密码
        </h3>
        {!showChangePassword ? (
          <button onClick={() => setShowChangePassword(true)}
            className="px-4 py-2 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-lg text-sm font-medium hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors">
            修改密码
          </button>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">当前密码</label>
              <input type={showPasswords ? 'text' : 'password'} value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">新密码</label>
              <input type={showPasswords ? 'text' : 'password'} value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white" />
              {newPassword && (
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${(strength.score / 5) * 100}%`, backgroundColor: strength.color }} />
                  </div>
                  <span className="text-xs" style={{ color: strength.color }}>{strength.label}</span>
                </div>
              )}
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">确认新密码</label>
              <input type={showPasswords ? 'text' : 'password'} value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white" />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="showPw" checked={showPasswords}
                onChange={(e) => setShowPasswords(e.target.checked)} className="rounded" />
              <label htmlFor="showPw" className="text-xs text-gray-500">显示密码</label>
            </div>
            <p className="text-xs text-amber-600">注意: 修改密码后，所有数据将使用新密码重新加密，请确保牢记新密码。</p>
            <div className="flex gap-2">
              <button onClick={handleChangePassword}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium">
                确认修改
              </button>
              <button onClick={() => { setShowChangePassword(false); setOldPassword(''); setNewPassword(''); setConfirmNewPassword(''); }}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm">
                取消
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Data management */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <Download size={16} className="text-blue-600" /> 数据管理
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-700 dark:text-gray-300">导出所有数据</p>
              <p className="text-xs text-gray-400">JSON格式，包含所有加密数据</p>
            </div>
            <button onClick={handleExportAll}
              className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-lg text-sm font-medium hover:bg-blue-100 dark:hover:bg-blue-900/30">
              导出
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-700 dark:text-gray-300">导入数据</p>
              <p className="text-xs text-gray-400">从JSON备份文件恢复</p>
            </div>
            <label className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-lg text-sm font-medium hover:bg-blue-100 dark:hover:bg-blue-900/30 cursor-pointer">
              {importing ? '导入中...' : '选择文件'}
              <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            </label>
          </div>
        </div>
      </div>

      {/* Danger zone */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-red-200 dark:border-red-800">
        <h3 className="text-sm font-semibold text-red-600 mb-3 flex items-center gap-2">
          <AlertTriangle size={16} /> 危险操作
        </h3>
        {!showDeleteConfirm ? (
          <button onClick={() => setShowDeleteConfirm(true)}
            className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 dark:hover:bg-red-900/30">
            删除所有数据
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-red-600">此操作将永久删除所有本地数据，包括加密密钥。此操作不可恢复！</p>
            <p className="text-sm text-gray-600 dark:text-gray-300">请输入 <code className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-sm font-mono">DELETE ALL</code> 确认删除:</p>
            <input type="text" value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-red-200 dark:border-red-800 rounded-lg text-sm text-gray-900 dark:text-white" />
            <div className="flex gap-2">
              <button onClick={handleDeleteAll} disabled={deleteConfirmText !== 'DELETE ALL'}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium">
                确认删除
              </button>
              <button onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(''); }}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm">
                取消
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
