import React, { useState } from 'react';
import { useApp } from '../lib/store';
import { getPasswordStrength } from '../lib/utils';
import { Lock, Shield, Eye, EyeOff, KeyRound } from 'lucide-react';
import { CRYPTO_CONFIG } from '../lib/crypto';

export default function LoginScreen() {
  const { isInitialized, initialize, unlock, isUnlocking, authError } = useApp();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordHint, setPasswordHint] = useState('');

  const strength = getPasswordStrength(password);
  const isSetup = !isInitialized;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSetup) {
      if (password.length < 8) return;
      if (password !== confirmPassword) return;
      await initialize(password);
    } else {
      await unlock(password);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and title */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-600/20">
            <Lock size={28} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">SalesVault</h1>
          <p className="text-gray-400">ToB销售私密记录工具</p>
        </div>

        {/* Security badge */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <Shield size={18} className="text-emerald-500" />
            <span className="text-sm font-medium text-emerald-400">安全架构</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
            <div>加密: {CRYPTO_CONFIG.algorithm}</div>
            <div>密钥派生: {CRYPTO_CONFIG.keyDerivation}</div>
            <div>迭代次数: {CRYPTO_CONFIG.iterations.toLocaleString()}</div>
            <div>密钥长度: {CRYPTO_CONFIG.keyLength} bits</div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6">
          <h2 className="text-xl font-semibold text-white mb-1">
            {isSetup ? '设置主密码' : '输入主密码'}
          </h2>
          <p className="text-sm text-gray-400 mb-6">
            {isSetup
              ? '主密码是您所有数据的唯一密钥，请务必牢记。密码不会被存储，无法找回。'
              : '输入您的主密码解锁数据。密码仅存在于您的设备内存中。'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">主密码</label>
              <div className="relative">
                <KeyRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="输入主密码"
                  className="w-full pl-10 pr-10 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Password strength (setup only) */}
            {isSetup && password && (
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${(strength.score / 5) * 100}%`,
                        backgroundColor: strength.color,
                      }}
                    />
                  </div>
                  <span className="text-xs" style={{ color: strength.color }}>
                    {strength.label}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  建议至少8位，包含大小写字母、数字和符号
                </p>
              </div>
            )}

            {/* Confirm password (setup only) */}
            {isSetup && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">确认密码</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="再次输入主密码"
                  className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-xs text-red-400 mt-1">两次密码不一致</p>
                )}
              </div>
            )}

            {/* Password hint (setup only) */}
            {isSetup && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">密码提示（可选）</label>
                <input
                  type="text"
                  value={passwordHint}
                  onChange={(e) => setPasswordHint(e.target.value)}
                  placeholder="给自己一个提示，帮助回忆密码"
                  className="w-full px-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">提示不会包含密码本身</p>
              </div>
            )}

            {/* Error message */}
            {authError && (
              <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 text-sm text-red-400">
                {authError}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={
                isUnlocking ||
                (isSetup && (password.length < 8 || password !== confirmPassword))
              }
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
            >
              {isUnlocking
                ? '处理中...'
                : isSetup
                ? '创建加密空间'
                : '解锁'}
            </button>
          </form>
        </div>

        {/* Trust section */}
        <div className="mt-6 space-y-3">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Shield size={12} className="text-emerald-500" />
            <span>所有数据使用 AES-256-GCM 加密，仅存储在您的设备上</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Lock size={12} className="text-emerald-500" />
            <span>加密密钥仅存在于设备内存中，退出后立即销毁</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Shield size={12} className="text-emerald-500" />
            <span>平台无法访问您的明文数据，零数据收集</span>
          </div>
        </div>
      </div>
    </div>
  );
}
