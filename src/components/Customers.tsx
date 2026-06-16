import { useState } from 'react';
import { useApp } from '../lib/store';
import { Customer, CustomerStatus, CompetitorAnalysis } from '../lib/types';
import {
  customerStatusLabels, customerStatusColors, competitorStatusLabels,
  maskPhone,
} from '../lib/utils';
import { Plus, ChevronRight, X, Trash2, CreditCard as Edit3, Users, Building2 } from 'lucide-react';

const emptyCustomer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'> = {
  companyName: '', industry: '', scale: '', address: '', website: '',
  source: '', budget: '', decisionCycle: '', status: 'potential',
  needs: '', painPoints: '', decisionFactors: '', riskLevel: '',
  winProbability: 0, tags: [], notes: '',
};

export default function Customers() {
  const {
    customers, contacts, competitors, searchQuery,
    addCustomer, updateCustomer, deleteCustomer,
    addCompetitor, deleteCompetitor,
    navigate, showNotification,
  } = useApp();

  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [form, setForm] = useState(emptyCustomer);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCompetitorForm, setShowCompetitorForm] = useState(false);
  const [competitorForm, setCompetitorForm] = useState({
    name: '', status: 'competing' as CompetitorAnalysis['status'],
    theirStrengths: '', theirWeaknesses: '', ourAdvantages: '', notes: '',
  });

  const filtered = customers.filter((c) => {
    const matchesSearch = !searchQuery ||
      c.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.industry.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const selected = selectedId ? customers.find((c) => c.id === selectedId) : null;
  const selectedContacts = selectedId ? contacts.filter((c) => c.customerId === selectedId) : [];
  const selectedCompetitors = selectedId ? competitors.filter((c) => c.customerId === selectedId) : [];

  const handleSave = async () => {
    if (!form.companyName.trim()) {
      showNotification('请输入公司名称', 'error');
      return;
    }
    if (editingCustomer) {
      await updateCustomer({ ...editingCustomer, ...form });
      showNotification('客户信息已更新', 'success');
    } else {
      await addCustomer(form);
      showNotification('客户已添加', 'success');
    }
    setShowForm(false);
    setEditingCustomer(null);
    setForm(emptyCustomer);
  };

  const handleEdit = (c: Customer) => {
    setEditingCustomer(c);
    setForm({
      companyName: c.companyName, industry: c.industry, scale: c.scale,
      address: c.address, website: c.website, source: c.source,
      budget: c.budget, decisionCycle: c.decisionCycle, status: c.status,
      needs: c.needs, painPoints: c.painPoints, decisionFactors: c.decisionFactors,
      riskLevel: c.riskLevel, winProbability: c.winProbability,
      tags: c.tags, notes: c.notes,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('确定删除此客户？相关联系人和跟进记录也将被删除。')) {
      await deleteCustomer(id);
      if (selectedId === id) setSelectedId(null);
      showNotification('客户已删除', 'success');
    }
  };

  const handleAddCompetitor = async () => {
    if (!selectedId || !competitorForm.name.trim()) return;
    await addCompetitor({
      customerId: selectedId,
      ...competitorForm,
    });
    setShowCompetitorForm(false);
    setCompetitorForm({
      name: '', status: 'competing', theirStrengths: '', theirWeaknesses: '',
      ourAdvantages: '', notes: '',
    });
    showNotification('竞品分析已添加', 'success');
  };

  const [tagInput, setTagInput] = useState('');

  if (selected) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <button onClick={() => setSelectedId(null)} className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-1">
          <ChevronRight size={14} className="rotate-180" /> 返回客户列表
        </button>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selected.companyName}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${customerStatusColors[selected.status]}`}>
                    {customerStatusLabels[selected.status]}
                  </span>
                  {selected.industry && <span className="text-xs text-gray-500">{selected.industry}</span>}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(selected)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500">
                  <Edit3 size={16} />
                </button>
                <button onClick={() => handleDelete(selected.id)} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {selected.scale && <div><span className="text-gray-500">规模:</span> <span className="text-gray-900 dark:text-white">{selected.scale}</span></div>}
              {selected.address && <div><span className="text-gray-500">地址:</span> <span className="text-gray-900 dark:text-white">{selected.address}</span></div>}
              {selected.website && <div><span className="text-gray-500">官网:</span> <span className="text-gray-900 dark:text-white">{selected.website}</span></div>}
              {selected.source && <div><span className="text-gray-500">来源:</span> <span className="text-gray-900 dark:text-white">{selected.source}</span></div>}
              {selected.budget && <div><span className="text-gray-500">预算:</span> <span className="text-gray-900 dark:text-white">{selected.budget}</span></div>}
              {selected.decisionCycle && <div><span className="text-gray-500">决策周期:</span> <span className="text-gray-900 dark:text-white">{selected.decisionCycle}</span></div>}
              {selected.riskLevel && <div><span className="text-gray-500">风险等级:</span> <span className="text-gray-900 dark:text-white">{selected.riskLevel}</span></div>}
              <div><span className="text-gray-500">赢单概率:</span> <span className="text-gray-900 dark:text-white">{selected.winProbability}%</span></div>
            </div>

            {selected.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-4">
                {selected.tags.map((t, i) => (
                  <span key={i} className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">{t}</span>
                ))}
              </div>
            )}
          </div>

          {/* Tabs for detail sections */}
          <div className="border-t border-gray-200 dark:border-gray-700">
            {['needs', 'painPoints', 'decisionFactors', 'notes'].map((field) => {
              const val = selected[field as keyof Customer];
              if (!val || typeof val !== 'string' || !val.trim()) return null;
              const labels: Record<string, string> = {
                needs: '需求', painPoints: '痛点', decisionFactors: '决策关键因素', notes: '备注',
              };
              return (
                <div key={field} className="px-6 py-3 border-b border-gray-100 dark:border-gray-700/50">
                  <h4 className="text-xs font-medium text-gray-500 mb-1">{labels[field]}</h4>
                  <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">{val}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Contacts */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">联系人 ({selectedContacts.length})</h3>
            <button onClick={() => navigate('contacts')} className="text-xs text-emerald-600 hover:text-emerald-700">管理联系人</button>
          </div>
          {selectedContacts.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-2">暂无联系人</p>
          ) : (
            <div className="space-y-2">
              {selectedContacts.map((c) => (
                <div key={c.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 text-xs font-bold">
                    {c.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{c.name}</p>
                    <p className="text-xs text-gray-400">{c.title} | {c.department}</p>
                  </div>
                  <div className="text-xs text-gray-400">
                    {c.phone && <span className="mr-2">{maskPhone(c.phone)}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Competitor Analysis */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">竞品分析 ({selectedCompetitors.length})</h3>
            <button onClick={() => setShowCompetitorForm(true)} className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
              <Plus size={12} /> 添加竞品
            </button>
          </div>

          {showCompetitorForm && (
            <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-3">
              <input
                type="text" placeholder="竞争对手名称" value={competitorForm.name}
                onChange={(e) => setCompetitorForm({ ...competitorForm, name: e.target.value })}
                className="w-full px-3 py-2 bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white"
              />
              <select
                value={competitorForm.status}
                onChange={(e) => setCompetitorForm({ ...competitorForm, status: e.target.value as CompetitorAnalysis['status'] })}
                className="w-full px-3 py-2 bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white"
              >
                {Object.entries(competitorStatusLabels).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
              <textarea placeholder="对手优势" value={competitorForm.theirStrengths}
                onChange={(e) => setCompetitorForm({ ...competitorForm, theirStrengths: e.target.value })}
                className="w-full px-3 py-2 bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white" rows={2}
              />
              <textarea placeholder="对手劣势" value={competitorForm.theirWeaknesses}
                onChange={(e) => setCompetitorForm({ ...competitorForm, theirWeaknesses: e.target.value })}
                className="w-full px-3 py-2 bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white" rows={2}
              />
              <textarea placeholder="我方优势" value={competitorForm.ourAdvantages}
                onChange={(e) => setCompetitorForm({ ...competitorForm, ourAdvantages: e.target.value })}
                className="w-full px-3 py-2 bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white" rows={2}
              />
              <div className="flex gap-2">
                <button onClick={handleAddCompetitor} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm">保存</button>
                <button onClick={() => setShowCompetitorForm(false)} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm">取消</button>
              </div>
            </div>
          )}

          {selectedCompetitors.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-2">暂无竞品分析</p>
          ) : (
            <div className="space-y-3">
              {selectedCompetitors.map((comp) => (
                <div key={comp.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{comp.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-600 rounded text-gray-600 dark:text-gray-300">
                        {competitorStatusLabels[comp.status]}
                      </span>
                      <button onClick={async () => { await deleteCompetitor(comp.id); showNotification('已删除', 'success'); }}
                        className="text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                    </div>
                  </div>
                  {comp.theirStrengths && <p className="text-xs text-gray-500 mb-1">对手优势: {comp.theirStrengths}</p>}
                  {comp.theirWeaknesses && <p className="text-xs text-gray-500 mb-1">对手劣势: {comp.theirWeaknesses}</p>}
                  {comp.ourAdvantages && <p className="text-xs text-emerald-600">我方优势: {comp.ourAdvantages}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">客户管理</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">共 {customers.length} 个客户</p>
        </div>
        <button
          onClick={() => { setForm(emptyCustomer); setEditingCustomer(null); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} /> 添加客户
        </button>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            statusFilter === 'all' ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
          }`}
        >
          全部
        </button>
        {Object.entries(customerStatusLabels).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setStatusFilter(key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              statusFilter === key ? customerStatusColors[key] : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Customer form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingCustomer ? '编辑客户' : '添加客户'}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">公司名称 *</label>
                  <input type="text" value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">行业</label>
                  <input type="text" value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">规模</label>
                  <input type="text" value={form.scale} onChange={(e) => setForm({ ...form, scale: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">客户来源</label>
                  <input type="text" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">预算</label>
                  <input type="text" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">决策周期</label>
                  <input type="text" value={form.decisionCycle} onChange={(e) => setForm({ ...form, decisionCycle: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">状态</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as CustomerStatus })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white">
                    {Object.entries(customerStatusLabels).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">赢单概率 ({form.winProbability}%)</label>
                  <input type="range" min="0" max="100" value={form.winProbability}
                    onChange={(e) => setForm({ ...form, winProbability: parseInt(e.target.value) })}
                    className="w-full" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">标签</label>
                <div className="flex gap-2 flex-wrap mb-2">
                  {form.tags.map((t, i) => (
                    <span key={i} className="text-xs px-2 py-0.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full flex items-center gap-1">
                      {t}
                      <button onClick={() => setForm({ ...form, tags: form.tags.filter((_, j) => j !== i) })}>
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input type="text" value={tagInput} onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && tagInput.trim()) {
                        setForm({ ...form, tags: [...form.tags, tagInput.trim()] });
                        setTagInput('');
                      }
                    }}
                    placeholder="输入标签后按回车" className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">需求</label>
                <textarea value={form.needs} onChange={(e) => setForm({ ...form, needs: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white" rows={2} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">痛点</label>
                <textarea value={form.painPoints} onChange={(e) => setForm({ ...form, painPoints: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white" rows={2} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">决策关键因素</label>
                <textarea value={form.decisionFactors} onChange={(e) => setForm({ ...form, decisionFactors: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white" rows={2} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">备注</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white" rows={2} />
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={handleSave} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium">
                  {editingCustomer ? '保存修改' : '添加客户'}
                </button>
                <button onClick={() => setShowForm(false)} className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm">
                  取消
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Customer list */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <Users size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-gray-500 dark:text-gray-400">暂无客户记录</p>
            <p className="text-sm text-gray-400">点击"添加客户"开始记录</p>
          </div>
        ) : (
          filtered.map((c) => (
            <div
              key={c.id}
              onClick={() => setSelectedId(c.id)}
              className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-600 cursor-pointer transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                    <Building2 size={18} className="text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{c.companyName}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${customerStatusColors[c.status]}`}>
                        {customerStatusLabels[c.status]}
                      </span>
                      {c.industry && <span className="text-xs text-gray-400">{c.industry}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs text-gray-400">赢单概率</div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">{c.winProbability}%</div>
                  </div>
                  <ChevronRight size={16} className="text-gray-400" />
                </div>
              </div>
              {c.tags.length > 0 && (
                <div className="flex gap-1.5 mt-2 ml-13">
                  {c.tags.slice(0, 3).map((t, i) => (
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
