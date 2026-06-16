import { useState } from 'react';
import { useApp } from '../lib/store';
import { downloadFile, objectsToCsv, customerStatusLabels, formatDate } from '../lib/utils';
import { Download, FileJson, FileSpreadsheet, Shield } from 'lucide-react';

export default function DataExport() {
  const { customers, contacts, followUps, showNotification } = useApp();
  const [exportScope, setExportScope] = useState<'all' | 'week' | 'month' | 'custom'>('all');
  const [exportType, setExportType] = useState<'customers' | 'followups' | 'contacts'>('customers');
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv');
  const [hideSensitive, setHideSensitive] = useState(true);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const getFilteredData = () => {
    const now = Date.now();
    let startTime = 0;

    if (exportScope === 'week') {
      startTime = now - 7 * 86400000;
    } else if (exportScope === 'month') {
      startTime = now - 30 * 86400000;
    } else if (exportScope === 'custom' && customStart) {
      startTime = new Date(customStart).getTime();
    }

    const endTime = exportScope === 'custom' && customEnd ? new Date(customEnd).getTime() : now;

    if (exportType === 'customers') {
      return customers.filter((c) => c.updatedAt >= startTime && c.updatedAt <= endTime);
    } else if (exportType === 'followups') {
      return followUps.filter((f) => f.createdAt >= startTime && f.createdAt <= endTime);
    } else {
      return contacts.filter((c) => c.updatedAt >= startTime && c.updatedAt <= endTime);
    }
  };

  const handleExport = () => {
    const data = getFilteredData();
    if (data.length === 0) {
      showNotification('没有符合条件的数据', 'info');
      return;
    }

    let content: string;
    let filename: string;
    let mimeType: string;

    if (exportFormat === 'json') {
      const exportData = hideSensitive
        ? data.map((d: any) => {
            const obj = { ...d };
            if (obj.phone) obj.phone = '***';
            if (obj.email) obj.email = '***';
            if (obj.wechat) obj.wechat = '***';
            if (obj.personalInfo) obj.personalInfo = '***';
            return obj;
          })
        : data;
      content = JSON.stringify(exportData, null, 2);
      filename = `${exportType}_${formatDate(Date.now())}.json`;
      mimeType = 'application/json';
    } else {
      let fields: string[];
      if (exportType === 'customers') {
        fields = ['companyName', 'industry', 'status', 'source', 'budget', 'winProbability', 'needs', 'painPoints'];
      } else if (exportType === 'followups') {
        fields = ['customerId', 'type', 'content', 'keyPoints', 'result', 'createdAt'];
      } else {
        fields = hideSensitive
          ? ['name', 'title', 'department', 'role', 'influenceScore', 'isKeyDecisionMaker']
          : ['name', 'title', 'department', 'phone', 'email', 'wechat', 'role', 'influenceScore', 'isKeyDecisionMaker'];
      }
      const processedData = data.map((d: any) => {
        const obj: any = {};
        fields.forEach((f) => {
          if (f === 'status' && exportType === 'customers') {
            obj[f] = customerStatusLabels[d[f]] || d[f];
          } else if (f === 'createdAt' || f === 'updatedAt') {
            obj[f] = formatDate(d[f]);
          } else {
            obj[f] = d[f];
          }
        });
        return obj;
      });
      content = objectsToCsv(processedData, fields);
      filename = `${exportType}_${formatDate(Date.now())}.csv`;
      mimeType = 'text/csv';
    }

    downloadFile(content, filename, mimeType);
    showNotification('数据已导出', 'success');
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">数据导出</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">自主选择，对接企业CRM</p>
      </div>

      {/* Privacy notice */}
      <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <Shield size={16} className="text-emerald-600" />
          <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">隐私保护</span>
        </div>
        <ul className="text-xs text-emerald-600 dark:text-emerald-300 space-y-1">
          <li>- 导出数据仅保存在您的本地设备</li>
          <li>- 您可自主选择隐藏敏感信息（电话、微信、邮箱等）</li>
          <li>- 平台不参与任何数据传输，导出后由您手动上传至企业CRM</li>
        </ul>
      </div>

      {/* Export settings */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 space-y-5">
        {/* Data type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">导出数据类型</label>
          <div className="flex gap-3">
            {[
              { id: 'customers', label: '客户数据' },
              { id: 'followups', label: '跟进记录' },
              { id: 'contacts', label: '联系人' },
            ].map((t) => (
              <button key={t.id} onClick={() => setExportType(t.id as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  exportType === t.id ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                }`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Time scope */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">时间范围</label>
          <div className="flex gap-3 flex-wrap">
            {[
              { id: 'all', label: '全部' },
              { id: 'week', label: '本周' },
              { id: 'month', label: '本月' },
              { id: 'custom', label: '自定义' },
            ].map((s) => (
              <button key={s.id} onClick={() => setExportScope(s.id as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  exportScope === s.id ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                }`}>
                {s.label}
              </button>
            ))}
          </div>
          {exportScope === 'custom' && (
            <div className="flex gap-3 mt-3">
              <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)}
                className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white" />
              <span className="text-gray-400 self-center">至</span>
              <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)}
                className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white" />
            </div>
          )}
        </div>

        {/* Format */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">导出格式</label>
          <div className="flex gap-3">
            <button onClick={() => setExportFormat('csv')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
                exportFormat === 'csv' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
              }`}>
              <FileSpreadsheet size={16} /> CSV
            </button>
            <button onClick={() => setExportFormat('json')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
                exportFormat === 'json' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
              }`}>
              <FileJson size={16} /> JSON
            </button>
          </div>
        </div>

        {/* Sensitive data toggle */}
        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <input type="checkbox" id="hideSensitive" checked={hideSensitive}
            onChange={(e) => setHideSensitive(e.target.checked)} className="rounded" />
          <label htmlFor="hideSensitive" className="text-sm text-gray-700 dark:text-gray-300">
            隐藏敏感信息（电话、微信、邮箱、个人备注将替换为 ***）
          </label>
        </div>

        {/* Preview count */}
        <div className="text-sm text-gray-500">
          将导出 {getFilteredData().length} 条记录
        </div>

        {/* Export button */}
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Download size={16} /> 导出数据
        </button>
      </div>
    </div>
  );
}
