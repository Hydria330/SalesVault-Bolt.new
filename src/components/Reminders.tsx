import { useState } from 'react';
import { useApp } from '../lib/store';
import { Reminder, ReminderType } from '../lib/types';
import { formatDateTime, formatRelativeTime } from '../lib/utils';
import { Plus, X, Bell, BellOff, Check, Trash2, Clock, Calendar } from 'lucide-react';

const emptyReminder: Omit<Reminder, 'id' | 'createdAt' | 'updatedAt'> = {
  type: 'follow_up', title: '', description: '', dueTime: Date.now() + 86400000,
  customerId: '', followUpId: '', advanceMinutes: 60,
  isRepeating: false, repeatIntervalMinutes: 0,
  isCompleted: false, completedAt: null,
};

export default function Reminders() {
  const { reminders, customers, addReminder, deleteReminder, completeReminder, showNotification } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyReminder);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('pending');

  const filtered = reminders.filter((r) => {
    if (filter === 'pending') return !r.isCompleted;
    if (filter === 'completed') return r.isCompleted;
    return true;
  }).sort((a, b) => {
    if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
    return a.dueTime - b.dueTime;
  });

  const handleSave = async () => {
    if (!form.title.trim()) {
      showNotification('请输入提醒标题', 'error');
      return;
    }
    await addReminder(form);
    showNotification('提醒已添加', 'success');
    setShowForm(false);
    setForm(emptyReminder);
  };

  const advanceOptions = [
    { label: '15分钟', value: 15 },
    { label: '30分钟', value: 30 },
    { label: '1小时', value: 60 },
    { label: '2小时', value: 120 },
    { label: '1天', value: 1440 },
    { label: '2天', value: 2880 },
  ];

  const now = Date.now();
  const overdue = filtered.filter((r) => !r.isCompleted && r.dueTime < now);
  const upcoming = filtered.filter((r) => !r.isCompleted && r.dueTime >= now);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">提醒中心</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {reminders.filter((r) => !r.isCompleted).length} 条待处理
          </p>
        </div>
        <button
          onClick={() => { setForm(emptyReminder); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} /> 添加提醒
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {(['pending', 'completed', 'all'] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
              filter === f ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
            }`}>
            {f === 'pending' ? '待处理' : f === 'completed' ? '已完成' : '全部'}
          </button>
        ))}
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">添加提醒</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">标题 *</label>
                <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">描述</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white" rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">类型</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as ReminderType })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white">
                    <option value="follow_up">跟进提醒</option>
                    <option value="task">任务提醒</option>
                    <option value="report">报告提醒</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">关联客户</label>
                  <select value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white">
                    <option value="">无</option>
                    {customers.map((c) => <option key={c.id} value={c.id}>{c.companyName}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">到期时间</label>
                <input type="datetime-local" value={new Date(form.dueTime).toISOString().slice(0, 16)}
                  onChange={(e) => setForm({ ...form, dueTime: new Date(e.target.value).getTime() })}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">提前提醒</label>
                <div className="flex gap-2 flex-wrap">
                  {advanceOptions.map((opt) => (
                    <button key={opt.value} onClick={() => setForm({ ...form, advanceMinutes: opt.value })}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                        form.advanceMinutes === opt.value ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                      }`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="repeat" checked={form.isRepeating}
                  onChange={(e) => setForm({ ...form, isRepeating: e.target.checked })} className="rounded" />
                <label htmlFor="repeat" className="text-sm text-gray-700 dark:text-gray-300">重复提醒</label>
              </div>
              {form.isRepeating && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">重复间隔（分钟）</label>
                  <input type="number" value={form.repeatIntervalMinutes}
                    onChange={(e) => setForm({ ...form, repeatIntervalMinutes: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white" />
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button onClick={handleSave} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium">添加提醒</button>
                <button onClick={() => setShowForm(false)} className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm">取消</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Overdue */}
      {overdue.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-red-600 mb-3 flex items-center gap-2">
            <Clock size={14} /> 已过期 ({overdue.length})
          </h3>
          <div className="space-y-2">
            {overdue.map((r) => {
              const customer = customers.find((c) => c.id === r.customerId);
              return (
                <div key={r.id} className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-200 dark:border-red-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Bell size={16} className="text-red-500" />
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">{r.title}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-red-500">已过期</span>
                          {customer && <span className="text-xs text-gray-400">| {customer.companyName}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={async () => { await completeReminder(r.id); showNotification('已完成', 'success'); }}
                        className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 hover:bg-emerald-200">
                        <Check size={14} />
                      </button>
                      <button onClick={async () => { await deleteReminder(r.id); showNotification('已删除', 'success'); }}
                        className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-400">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
            <Calendar size={14} /> 即将到来 ({upcoming.length})
          </h3>
          <div className="space-y-2">
            {upcoming.map((r) => {
              const customer = customers.find((c) => c.id === r.customerId);
              return (
                <div key={r.id} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Bell size={16} className="text-amber-500" />
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">{r.title}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-gray-400">{formatDateTime(r.dueTime)}</span>
                          {customer && <span className="text-xs text-gray-400">| {customer.companyName}</span>}
                          {r.isRepeating && <span className="text-xs text-blue-500">重复</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={async () => { await completeReminder(r.id); showNotification('已完成', 'success'); }}
                        className="p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/30 text-emerald-600">
                        <Check size={14} />
                      </button>
                      <button onClick={async () => { await deleteReminder(r.id); showNotification('已删除', 'success'); }}
                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Completed */}
      {filter !== 'pending' && filtered.filter((r) => r.isCompleted).length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-500 mb-3 flex items-center gap-2">
            <BellOff size={14} /> 已完成
          </h3>
          <div className="space-y-2">
            {filtered.filter((r) => r.isCompleted).map((r) => (
              <div key={r.id} className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4 opacity-60">
                <div className="flex items-center gap-3">
                  <Check size={16} className="text-emerald-500" />
                  <div className="flex-1">
                    <h4 className="text-sm text-gray-500 dark:text-gray-400 line-through">{r.title}</h4>
                    <span className="text-xs text-gray-400">{r.completedAt ? formatRelativeTime(r.completedAt) : ''}</span>
                  </div>
                  <button onClick={async () => { await deleteReminder(r.id); }}
                    className="p-1 rounded text-gray-400 hover:text-red-500">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <Bell size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-500 dark:text-gray-400">暂无提醒</p>
        </div>
      )}
    </div>
  );
}
