import { useState } from 'react';
import { useApp } from '../lib/store';
import { Contact, ContactRole } from '../lib/types';
import { contactRoleLabels, maskPhone, maskEmail, maskWechat } from '../lib/utils';
import { Plus, X, CircleUser as UserCircle, Star, Phone, Mail, MessageCircle, Trash2, CreditCard as Edit3 } from 'lucide-react';

const emptyContact: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'> = {
  customerId: '', name: '', title: '', department: '',
  phone: '', email: '', wechat: '', role: 'influencer',
  influenceScore: 3, personality: '', communicationPreference: '',
  personalInfo: '', isKeyDecisionMaker: false, notes: '',
};

export default function Contacts() {
  const { contacts, customers, searchQuery, addContact, updateContact, deleteContact, showNotification } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [form, setForm] = useState(emptyContact);
  const [customerFilter, setCustomerFilter] = useState('all');
  const [showSensitive, setShowSensitive] = useState<Record<string, boolean>>({});

  const filtered = contacts.filter((c) => {
    const matchesSearch = !searchQuery ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCustomer = customerFilter === 'all' || c.customerId === customerFilter;
    return matchesSearch && matchesCustomer;
  });

  const handleSave = async () => {
    if (!form.name.trim() || !form.customerId) {
      showNotification('请输入姓名并选择客户', 'error');
      return;
    }
    if (editingContact) {
      await updateContact({ ...editingContact, ...form });
      showNotification('联系人已更新', 'success');
    } else {
      await addContact(form);
      showNotification('联系人已添加', 'success');
    }
    setShowForm(false);
    setEditingContact(null);
    setForm(emptyContact);
  };

  const handleEdit = (c: Contact) => {
    setEditingContact(c);
    setForm({
      customerId: c.customerId, name: c.name, title: c.title, department: c.department,
      phone: c.phone, email: c.email, wechat: c.wechat, role: c.role,
      influenceScore: c.influenceScore, personality: c.personality,
      communicationPreference: c.communicationPreference, personalInfo: c.personalInfo,
      isKeyDecisionMaker: c.isKeyDecisionMaker, notes: c.notes,
    });
    setShowForm(true);
  };

  const toggleSensitive = (id: string) => {
    setShowSensitive((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">联系人管理</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">共 {contacts.length} 位联系人</p>
        </div>
        <button
          onClick={() => { setForm(emptyContact); setEditingContact(null); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} /> 添加联系人
        </button>
      </div>

      {/* Customer filter */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setCustomerFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
            customerFilter === 'all' ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
          }`}
        >
          全部
        </button>
        {customers.slice(0, 10).map((c) => (
          <button
            key={c.id}
            onClick={() => setCustomerFilter(c.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium truncate max-w-32 ${
              customerFilter === c.id ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
            }`}
          >
            {c.companyName}
          </button>
        ))}
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingContact ? '编辑联系人' : '添加联系人'}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">所属客户 *</label>
                  <select value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white">
                    <option value="">选择客户</option>
                    {customers.map((c) => <option key={c.id} value={c.id}>{c.companyName}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">姓名 *</label>
                  <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">职位</label>
                  <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">部门</label>
                  <input type="text" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">电话 (加密存储)</label>
                  <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">邮箱 (加密存储)</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">微信 (加密存储)</label>
                  <input type="text" value={form.wechat} onChange={(e) => setForm({ ...form, wechat: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">角色</label>
                  <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as ContactRole })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white">
                    {Object.entries(contactRoleLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">影响力评分</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button key={s} onClick={() => setForm({ ...form, influenceScore: s })}
                        className={`p-1 ${s <= form.influenceScore ? 'text-amber-400' : 'text-gray-300'}`}>
                        <Star size={18} fill={s <= form.influenceScore ? 'currentColor' : 'none'} />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input type="checkbox" id="keyDecision" checked={form.isKeyDecisionMaker}
                    onChange={(e) => setForm({ ...form, isKeyDecisionMaker: e.target.checked })}
                    className="rounded border-gray-300" />
                  <label htmlFor="keyDecision" className="text-sm text-gray-700 dark:text-gray-300">关键决策人</label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">性格特点</label>
                <input type="text" value={form.personality} onChange={(e) => setForm({ ...form, personality: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">沟通偏好</label>
                <input type="text" value={form.communicationPreference} onChange={(e) => setForm({ ...form, communicationPreference: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">个人信息 (加密存储)</label>
                <textarea value={form.personalInfo} onChange={(e) => setForm({ ...form, personalInfo: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white" rows={2} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">备注</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white" rows={2} />
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={handleSave} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium">
                  {editingContact ? '保存修改' : '添加联系人'}
                </button>
                <button onClick={() => setShowForm(false)} className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm">取消</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contact list */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <UserCircle size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-gray-500 dark:text-gray-400">暂无联系人</p>
          </div>
        ) : (
          filtered.map((c) => {
            const customer = customers.find((cu) => cu.id === c.customerId);
            const isSensitive = showSensitive[c.id];
            return (
              <div key={c.id} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 font-bold text-sm">
                      {c.name[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{c.name}</h3>
                        {c.isKeyDecisionMaker && (
                          <span className="text-xs px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded">关键决策人</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-400">{c.title}</span>
                        {customer && <span className="text-xs text-gray-400">| {customer.companyName}</span>}
                        <span className="text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 rounded">{contactRoleLabels[c.role]}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} size={12} className={s <= c.influenceScore ? 'text-amber-400' : 'text-gray-300'}
                          fill={s <= c.influenceScore ? 'currentColor' : 'none'} />
                      ))}
                    </div>
                    <button onClick={() => handleEdit(c)} className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400">
                      <Edit3 size={14} />
                    </button>
                    <button onClick={async () => { await deleteContact(c.id); showNotification('已删除', 'success'); }}
                      className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Contact info with masking */}
                <div className="flex gap-4 mt-3 ml-13 text-xs">
                  {c.phone && (
                    <button onClick={() => toggleSensitive(c.id)} className="flex items-center gap-1 text-gray-500 hover:text-gray-700">
                      <Phone size={12} />
                      <span>{isSensitive ? c.phone : maskPhone(c.phone)}</span>
                    </button>
                  )}
                  {c.email && (
                    <button onClick={() => toggleSensitive(c.id)} className="flex items-center gap-1 text-gray-500 hover:text-gray-700">
                      <Mail size={12} />
                      <span>{isSensitive ? c.email : maskEmail(c.email)}</span>
                    </button>
                  )}
                  {c.wechat && (
                    <button onClick={() => toggleSensitive(c.id)} className="flex items-center gap-1 text-gray-500 hover:text-gray-700">
                      <MessageCircle size={12} />
                      <span>{isSensitive ? c.wechat : maskWechat(c.wechat)}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
