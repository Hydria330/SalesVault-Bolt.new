import { useApp } from '../lib/store';
import {
  customerStatusLabels, formatRelativeTime,
  problemSeverityColors, problemSeverityLabels, problemStatusLabels,
  followUpTypeLabels, formatFileSize,
} from '../lib/utils';
import {
  Users, MessageSquare, Lightbulb, Bell, Plus,
  CheckCircle, AlertCircle, Clock, Shield, HardDrive
} from 'lucide-react';

export default function Dashboard() {
  const { navigate, getDashboardStats, storageUsed } = useApp();
  const stats = getDashboardStats();

  const statusColors: Record<string, string> = {
    potential: '#9ca3af',
    following: '#3b82f6',
    intention: '#f59e0b',
    closed: '#10b981',
    lost: '#ef4444',
  };

  const totalCustomers = Object.values(stats.statusDistribution).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">仪表盘</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">高效查看，快速操作</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg">
            <Shield size={14} className="text-emerald-600" />
            <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">数据已加密</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <HardDrive size={14} className="text-gray-500" />
            <span className="text-xs text-gray-500 dark:text-gray-400">{formatFileSize(storageUsed)}</span>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex gap-3 flex-wrap">
        <button
          onClick={() => navigate('customers')}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} /> 添加客户
        </button>
        <button
          onClick={() => navigate('followups')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} /> 添加跟进
        </button>
        <button
          onClick={() => navigate('problems')}
          className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} /> 记录难题
        </button>
      </div>

      {/* Week stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: '新增客户', value: stats.weekNewCustomers, icon: <Users size={20} />, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30' },
          { label: '跟进次数', value: stats.weekFollowUpCount, icon: <MessageSquare size={20} />, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30' },
          { label: '成交数', value: stats.weekClosedCount, icon: <CheckCircle size={20} />, color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/30' },
          { label: '难题解决', value: stats.weekProblemsSolved, icon: <Lightbulb size={20} />, color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/30' },
        ].map((item) => (
          <div key={item.label} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">{item.label}</span>
              <div className={`p-2 rounded-lg ${item.color}`}>{item.icon}</div>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{item.value}</p>
            <p className="text-xs text-gray-400">本周</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer status distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">客户状态分布</h3>
          <div className="space-y-3">
            {Object.entries(stats.statusDistribution).map(([status, count]) => (
              <div key={status} className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: statusColors[status] }} />
                <span className="text-sm text-gray-600 dark:text-gray-300 flex-1">
                  {customerStatusLabels[status]}
                </span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{count}</span>
                <div className="w-20 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: totalCustomers > 0 ? `${(count / totalCustomers) * 100}%` : '0%',
                      backgroundColor: statusColors[status],
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pending reminders */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">待处理提醒</h3>
            <button onClick={() => navigate('reminders')} className="text-xs text-emerald-600 hover:text-emerald-700">
              查看全部
            </button>
          </div>
          {stats.pendingReminders.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">暂无待处理提醒</p>
          ) : (
            <div className="space-y-2">
              {stats.pendingReminders.slice(0, 5).map((r) => (
                <div key={r.id} className="flex items-start gap-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <Bell size={14} className="text-amber-500 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm text-gray-900 dark:text-white truncate">{r.title}</p>
                    <p className="text-xs text-gray-400">{new Date(r.dueTime).toLocaleDateString('zh-CN')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending problems */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">待解决难题</h3>
            <button onClick={() => navigate('problems')} className="text-xs text-emerald-600 hover:text-emerald-700">
              查看全部
            </button>
          </div>
          {stats.pendingProblems.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">暂无待解决难题</p>
          ) : (
            <div className="space-y-2">
              {stats.pendingProblems.slice(0, 5).map((p) => (
                <div key={p.id} className="flex items-start gap-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <AlertCircle size={14} className="text-orange-500 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm text-gray-900 dark:text-white truncate">{p.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-xs px-1.5 py-0.5 rounded ${problemSeverityColors[p.severity]}`}>
                        {problemSeverityLabels[p.severity]}
                      </span>
                      <span className="text-xs text-gray-400">{problemStatusLabels[p.status]}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent updates */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">最近更新</h3>
        <div className="space-y-2">
          {stats.recentUpdates.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">暂无记录</p>
          ) : (
            stats.recentUpdates.map((item) => (
              <div
                key={`${item.type}-${item.id}`}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                onClick={() => {
                  if (item.type === 'customer') navigate('customer-detail', item.id);
                  else if (item.type === 'followup') navigate('followups');
                  else navigate('problems');
                }}
              >
                <div className={`p-1.5 rounded-lg ${
                  item.type === 'customer' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600' :
                  item.type === 'followup' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600' :
                  'bg-amber-50 dark:bg-amber-900/30 text-amber-600'
                }`}>
                  {item.type === 'customer' ? <Users size={14} /> :
                   item.type === 'followup' ? <MessageSquare size={14} /> :
                   <Lightbulb size={14} />}
                </div>
                <span className="text-sm text-gray-900 dark:text-white truncate flex-1">{item.title}</span>
                <span className="text-xs text-gray-400 shrink-0">{formatRelativeTime(item.updatedAt)}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Today follow-ups */}
      {stats.todayFollowUps.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">今日跟进</h3>
          <div className="space-y-2">
            {stats.todayFollowUps.map((f) => (
              <div key={f.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <Clock size={14} className="text-blue-500 shrink-0" />
                <span className="text-sm text-gray-900 dark:text-white truncate flex-1">{f.content}</span>
                <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-gray-600 dark:text-gray-300">
                  {followUpTypeLabels[f.type]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
