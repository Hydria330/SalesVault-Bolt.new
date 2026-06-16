import { useState } from 'react';
import { useApp } from '../lib/store';
import { Resource, ResourceType } from '../lib/types';
import { resourceTypeLabels, maskPhone } from '../lib/utils';
import { Plus, X, Briefcase, Trash2, CreditCard as Edit3, Star } from 'lucide-react';

const emptyResource: Omit<Resource, 'id' | 'createdAt' | 'updatedAt'> = {
  type: 'channel', name: '', contactInfo: '', expertise: '',
  networkDescription: '', relationshipType: '', relationshipStrength: 3,
  tags: [], notes: '', relatedCustomerIds: [], relatedProblemIds: [],
};

export default function Resources() {
  const { resources, searchQuery, addResource, updateResource, deleteResource, showNotification } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [form, setForm] = useState(emptyResource);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [tagInput, setTagInput] = useState('');

  const filtered = resources.filter((r) => {
    const matchesSearch = !searchQuery ||
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.expertise.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || r.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const handleSave = async () => {
    if (!form.name.trim()) {
      showNotification('请输入资源名称', 'error');
      return;
    }
    if (editingResource) {
      await updateResource({ ...editingResource, ...form });
      showNotification('资源已更新', 'success');
    } else {
      await addResource(form);
      showNotification('资源已添加', 'success');
    }
    setShowForm(false);
    setEditingResource(null);
    setForm(emptyResource);
  };

  const handleEdit = (r: Resource) => {
    setEditingResource(r);
    setForm({
      type: r.type, name: r.name, contactInfo: r.contactInfo, expertise: r.expertise,
      networkDescription: r.networkDescription, relationshipType: r.relationshipType,
      relationshipStrength: r.relationshipStrength, tags: r.tags, notes: r.notes,
      relatedCustomerIds: r.relatedCustomerIds, relatedProblemIds: r.relatedProblemIds,
    });
    setShowForm(true);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">资源管理</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">渠道、伙伴、专家、工具</p>
        </div>
        <button
          onClick={() => { setForm(emptyResource); setEditingResource(null); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} /> 添加资源
        </button>
      </div>

      {/* Type filter */}
      <div className="flex gap-2">
        <button onClick={() => setTypeFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium ${typeFilter === 'all' ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
          全部
        </button>
        {Object.entries(resourceTypeLabels).map(([k, v]) => (
          <button key={k} onClick={() => setTypeFilter(k)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium ${typeFilter === k ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
            {v}
          </button>
        ))}
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingResource ? '编辑资源' : '添加资源'}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">名称 *</label>
                  <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">类型</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as ResourceType })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white">
                    {Object.entries(resourceTypeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">联系方式 (加密)</label>
                  <input type="text" value={form.contactInfo} onChange={(e) => setForm({ ...form, contactInfo: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">专长领域</label>
                  <input type="text" value={form.expertise} onChange={(e) => setForm({ ...form, expertise: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">关系类型</label>
                  <input type="text" value={form.relationshipType} onChange={(e) => setForm({ ...form, relationshipType: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">关系强度</label>
                  <div className="flex gap-1 pt-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button key={s} onClick={() => setForm({ ...form, relationshipStrength: s })}
                        className={`p-1 ${s <= form.relationshipStrength ? 'text-amber-400' : 'text-gray-300'}`}>
                        <Star size={18} fill={s <= form.relationshipStrength ? 'currentColor' : 'none'} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">关系网络</label>
                <textarea value={form.networkDescription} onChange={(e) => setForm({ ...form, networkDescription: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white" rows={2} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">备注</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white" rows={2} />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">标签</label>
                <div className="flex gap-2 flex-wrap mb-2">
                  {form.tags.map((t, i) => (
                    <span key={i} className="text-xs px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full flex items-center gap-1">
                      {t} <button onClick={() => setForm({ ...form, tags: form.tags.filter((_, j) => j !== i) })}><X size={10} /></button>
                    </span>
                  ))}
                </div>
                <input type="text" value={tagInput} onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && tagInput.trim()) { setForm({ ...form, tags: [...form.tags, tagInput.trim()] }); setTagInput(''); } }}
                  placeholder="输入标签后按回车" className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white" />
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={handleSave} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium">
                  {editingResource ? '保存修改' : '添加资源'}
                </button>
                <button onClick={() => setShowForm(false)} className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm">取消</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resource list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-2 text-center py-12">
            <Briefcase size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-gray-500 dark:text-gray-400">暂无资源记录</p>
          </div>
        ) : (
          filtered.map((r) => (
            <div key={r.id} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full">
                    {resourceTypeLabels[r.type]}
                  </span>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{r.name}</h3>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleEdit(r)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400">
                    <Edit3 size={14} />
                  </button>
                  <button onClick={async () => { await deleteResource(r.id); showNotification('已删除', 'success'); }}
                    className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              {r.expertise && <p className="text-xs text-gray-500 mb-1">专长: {r.expertise}</p>}
              {r.contactInfo && <p className="text-xs text-gray-400">联系: {maskPhone(r.contactInfo)}</p>}
              <div className="flex gap-0.5 mt-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} size={12} className={s <= r.relationshipStrength ? 'text-amber-400' : 'text-gray-300'}
                    fill={s <= r.relationshipStrength ? 'currentColor' : 'none'} />
                ))}
              </div>
              {r.tags.length > 0 && (
                <div className="flex gap-1.5 mt-2">
                  {r.tags.map((t, i) => (
                    <span key={i} className="text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 rounded">{t}</span>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
