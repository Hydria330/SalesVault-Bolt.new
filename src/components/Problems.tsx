import { useState } from 'react';
import { useApp } from '../lib/store';
import { Problem, ProblemSeverity, ProblemStatus } from '../lib/types';
import { problemSeverityLabels, problemSeverityColors, problemStatusLabels } from '../lib/utils';
import { Plus, X, Lightbulb, Trash2, CreditCard as Edit3, AlertCircle, CheckCircle, Clock } from 'lucide-react';

const emptyProblem: Omit<Problem, 'id' | 'createdAt' | 'updatedAt'> = {
  title: '', description: '', severity: 'medium', status: 'unsolved',
  attemptedSolutions: [], finalSolution: '', lessonsLearned: '',
  tags: [], relatedCustomerId: '', relatedFollowUpId: '',
};

export default function Problems() {
  const { problems, customers, searchQuery, addProblem, updateProblem, deleteProblem, showNotification } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editingProblem, setEditingProblem] = useState<Problem | null>(null);
  const [form, setForm] = useState(emptyProblem);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tagInput, setTagInput] = useState('');
  const [solutionInput, setSolutionInput] = useState({ description: '', result: '' });

  const filtered = problems.filter((p) => {
    const matchesSearch = !searchQuery ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSave = async () => {
    if (!form.title.trim()) {
      showNotification('请输入问题标题', 'error');
      return;
    }
    if (editingProblem) {
      await updateProblem({ ...editingProblem, ...form });
      showNotification('问题已更新', 'success');
    } else {
      await addProblem(form);
      showNotification('问题已记录', 'success');
    }
    setShowForm(false);
    setEditingProblem(null);
    setForm(emptyProblem);
  };

  const handleEdit = (p: Problem) => {
    setEditingProblem(p);
    setForm({
      title: p.title, description: p.description, severity: p.severity,
      status: p.status, attemptedSolutions: p.attemptedSolutions,
      finalSolution: p.finalSolution, lessonsLearned: p.lessonsLearned,
      tags: p.tags, relatedCustomerId: p.relatedCustomerId, relatedFollowUpId: p.relatedFollowUpId,
    });
    setShowForm(true);
  };

  const addSolution = () => {
    if (!solutionInput.description.trim()) return;
    setForm({
      ...form,
      attemptedSolutions: [...form.attemptedSolutions, { ...solutionInput, timestamp: Date.now() }],
    });
    setSolutionInput({ description: '', result: '' });
  };

  const statusIcon = (status: ProblemStatus) => {
    switch (status) {
      case 'unsolved': return <AlertCircle size={16} className="text-red-500" />;
      case 'solving': return <Clock size={16} className="text-amber-500" />;
      case 'solved': return <CheckCircle size={16} className="text-emerald-500" />;
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">难题与经验</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">记录问题、沉淀经验</p>
        </div>
        <button
          onClick={() => { setForm(emptyProblem); setEditingProblem(null); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} /> 记录难题
        </button>
      </div>

      {/* Status filter */}
      <div className="flex gap-2">
        {['all', ...Object.keys(problemStatusLabels)].map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
              statusFilter === s ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
            }`}>
            {s === 'all' ? '全部' : problemStatusLabels[s as ProblemStatus]}
          </button>
        ))}
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingProblem ? '编辑问题' : '记录难题'}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">问题标题 *</label>
                <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">严重程度</label>
                  <select value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value as ProblemSeverity })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white">
                    {Object.entries(problemSeverityLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">状态</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ProblemStatus })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white">
                    {Object.entries(problemStatusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">关联客户</label>
                  <select value={form.relatedCustomerId} onChange={(e) => setForm({ ...form, relatedCustomerId: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white">
                    <option value="">无</option>
                    {customers.map((c) => <option key={c.id} value={c.id}>{c.companyName}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">问题描述</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white" rows={3} />
              </div>

              {/* Attempted solutions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">尝试过的解决方案</label>
                {form.attemptedSolutions.length > 0 && (
                  <div className="space-y-2 mb-2">
                    {form.attemptedSolutions.map((s, i) => (
                      <div key={i} className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-sm">
                        <p className="text-gray-900 dark:text-white">{s.description}</p>
                        <p className="text-xs text-gray-500 mt-0.5">结果: {s.result}</p>
                        <button onClick={() => setForm({ ...form, attemptedSolutions: form.attemptedSolutions.filter((_, j) => j !== i) })}
                          className="text-xs text-red-500 mt-1">删除</button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <input type="text" placeholder="方案描述" value={solutionInput.description}
                    onChange={(e) => setSolutionInput({ ...solutionInput, description: e.target.value })}
                    className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white" />
                  <input type="text" placeholder="结果" value={solutionInput.result}
                    onChange={(e) => setSolutionInput({ ...solutionInput, result: e.target.value })}
                    className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white" />
                  <button onClick={addSolution} className="px-3 py-2 bg-gray-200 dark:bg-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300">添加</button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">最终解决方案</label>
                <textarea value={form.finalSolution} onChange={(e) => setForm({ ...form, finalSolution: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white" rows={2} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">经验教训</label>
                <textarea value={form.lessonsLearned} onChange={(e) => setForm({ ...form, lessonsLearned: e.target.value })}
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
                  {editingProblem ? '保存修改' : '记录难题'}
                </button>
                <button onClick={() => setShowForm(false)} className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm">取消</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Problem list */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <Lightbulb size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-gray-500 dark:text-gray-400">暂无难题记录</p>
          </div>
        ) : (
          filtered.map((p) => {
            const customer = customers.find((c) => c.id === p.relatedCustomerId);
            return (
              <div key={p.id} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {statusIcon(p.status)}
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{p.title}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded ${problemSeverityColors[p.severity]}`}>
                      {problemSeverityLabels[p.severity]}
                    </span>
                    <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded">
                      {problemStatusLabels[p.status]}
                    </span>
                    <button onClick={() => handleEdit(p)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400">
                      <Edit3 size={14} />
                    </button>
                    <button onClick={async () => { await deleteProblem(p.id); showNotification('已删除', 'success'); }}
                      className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                {p.description && <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{p.description}</p>}
                {customer && <p className="text-xs text-gray-400 mb-2">关联客户: {customer.companyName}</p>}
                {p.finalSolution && (
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg mb-2">
                    <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">最终方案</p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-300">{p.finalSolution}</p>
                  </div>
                )}
                {p.lessonsLearned && (
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-xs font-medium text-blue-700 dark:text-blue-400">经验教训</p>
                    <p className="text-xs text-blue-600 dark:text-blue-300">{p.lessonsLearned}</p>
                  </div>
                )}
                {p.tags.length > 0 && (
                  <div className="flex gap-1.5 mt-2">
                    {p.tags.map((t, i) => (
                      <span key={i} className="text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 rounded">{t}</span>
                    ))}
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
