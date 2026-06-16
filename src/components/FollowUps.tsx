import { useState } from 'react';
import { useApp } from '../lib/store';
import { FollowUp, FollowUpType } from '../lib/types';
import { followUpTypeLabels, formatDateTime, formatRelativeTime } from '../lib/utils';
import { Plus, X, MessageSquare, Clock, Trash2, CreditCard as Edit3 } from 'lucide-react';

const emptyFollowUp: Omit<FollowUp, 'id' | 'createdAt' | 'updatedAt'> = {
  customerId: '', contactId: '', type: 'phone', customType: '',
  content: '', keyPoints: '', result: '', objections: '',
  mentionedCompetitors: '', nextFollowUpTime: null, attachments: [],
};

export default function FollowUps() {
  const { followUps, customers, contacts, searchQuery, addFollowUp, updateFollowUp, deleteFollowUp, showNotification } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editingFollowUp, setEditingFollowUp] = useState<FollowUp | null>(null);
  const [form, setForm] = useState(emptyFollowUp);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [customerFilter, setCustomerFilter] = useState('all');

  const filtered = followUps.filter((f) => {
    const matchesSearch = !searchQuery ||
      f.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.keyPoints.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || f.type === typeFilter;
    const matchesCustomer = customerFilter === 'all' || f.customerId === customerFilter;
    return matchesSearch && matchesType && matchesCustomer;
  });

  const handleSave = async () => {
    if (!form.customerId || !form.content.trim()) {
      showNotification('请选择客户并输入跟进内容', 'error');
      return;
    }
    if (editingFollowUp) {
      await updateFollowUp({ ...editingFollowUp, ...form });
      showNotification('跟进记录已更新', 'success');
    } else {
      await addFollowUp(form);
      showNotification('跟进记录已添加', 'success');
    }
    setShowForm(false);
    setEditingFollowUp(null);
    setForm(emptyFollowUp);
  };

  const handleEdit = (f: FollowUp) => {
    setEditingFollowUp(f);
    setForm({
      customerId: f.customerId, contactId: f.contactId, type: f.type,
      customType: f.customType, content: f.content, keyPoints: f.keyPoints,
      result: f.result, objections: f.objections, mentionedCompetitors: f.mentionedCompetitors,
      nextFollowUpTime: f.nextFollowUpTime, attachments: f.attachments,
    });
    setShowForm(true);
  };

  const customerContacts = form.customerId ? contacts.filter((c) => c.customerId === form.customerId) : [];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">跟进记录</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">共 {followUps.length} 条记录</p>
        </div>
        <button
          onClick={() => { setForm(emptyFollowUp); setEditingFollowUp(null); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} /> 添加跟进
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <select value={customerFilter} onChange={(e) => setCustomerFilter(e.target.value)}
          className="px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-xs text-gray-700 dark:text-gray-300">
          <option value="all">全部客户</option>
          {customers.map((c) => <option key={c.id} value={c.id}>{c.companyName}</option>)}
        </select>
        <div className="flex gap-1">
          <button onClick={() => setTypeFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium ${typeFilter === 'all' ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
            全部
          </button>
          {Object.entries(followUpTypeLabels).map(([k, v]) => (
            <button key={k} onClick={() => setTypeFilter(k)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium ${typeFilter === k ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingFollowUp ? '编辑跟进记录' : '添加跟进记录'}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">客户 *</label>
                  <select value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value, contactId: '' })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white">
                    <option value="">选择客户</option>
                    {customers.map((c) => <option key={c.id} value={c.id}>{c.companyName}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">联系人</label>
                  <select value={form.contactId} onChange={(e) => setForm({ ...form, contactId: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white">
                    <option value="">选择联系人</option>
                    {customerContacts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">跟进类型</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as FollowUpType })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white">
                    {Object.entries(followUpTypeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">下次跟进时间</label>
                  <input type="datetime-local" value={form.nextFollowUpTime ? new Date(form.nextFollowUpTime).toISOString().slice(0, 16) : ''}
                    onChange={(e) => setForm({ ...form, nextFollowUpTime: e.target.value ? new Date(e.target.value).getTime() : null })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">跟进内容 *</label>
                <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white" rows={3} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">关键点</label>
                <textarea value={form.keyPoints} onChange={(e) => setForm({ ...form, keyPoints: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white" rows={2} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">跟进结果</label>
                  <textarea value={form.result} onChange={(e) => setForm({ ...form, result: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white" rows={2} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">客户异议</label>
                  <textarea value={form.objections} onChange={(e) => setForm({ ...form, objections: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white" rows={2} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">提到的竞争对手</label>
                <input type="text" value={form.mentionedCompetitors} onChange={(e) => setForm({ ...form, mentionedCompetitors: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white" />
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={handleSave} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium">
                  {editingFollowUp ? '保存修改' : '添加记录'}
                </button>
                <button onClick={() => setShowForm(false)} className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm">取消</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-gray-500 dark:text-gray-400">暂无跟进记录</p>
          </div>
        ) : (
          filtered.map((f) => {
            const customer = customers.find((c) => c.id === f.customerId);
            const contact = contacts.find((c) => c.id === f.contactId);
            return (
              <div key={f.id} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full font-medium">
                      {followUpTypeLabels[f.type]}
                    </span>
                    {customer && (
                      <span className="text-xs text-gray-500">{customer.companyName}</span>
                    )}
                    {contact && (
                      <span className="text-xs text-gray-400">| {contact.name}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">{formatRelativeTime(f.createdAt)}</span>
                    <button onClick={() => handleEdit(f)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400">
                      <Edit3 size={14} />
                    </button>
                    <button onClick={async () => { await deleteFollowUp(f.id); showNotification('已删除', 'success'); }}
                      className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">{f.content}</p>
                {f.keyPoints && (
                  <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                    <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-0.5">关键点</p>
                    <p className="text-xs text-amber-600 dark:text-amber-300">{f.keyPoints}</p>
                  </div>
                )}
                {f.result && (
                  <p className="mt-2 text-xs text-gray-500">结果: {f.result}</p>
                )}
                {f.nextFollowUpTime && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-blue-600">
                    <Clock size={12} />
                    <span>下次跟进: {formatDateTime(f.nextFollowUpTime)}</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
