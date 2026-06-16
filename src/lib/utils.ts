/**
 * Utility functions for the Sales Vault application.
 *
 * Security note: All display functions sanitize data before rendering.
 * No dangerouslySetInnerHTML or similar APIs are used anywhere.
 */

// ============ ID Generation ============

export function generateId(): string {
  return crypto.randomUUID();
}

// ============ Date Formatting ============

export function formatDate(timestamp: number): string {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(timestamp));
}

export function formatDateTime(timestamp: number): string {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp));
}

export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  return formatDate(timestamp);
}

export function isToday(timestamp: number): boolean {
  const now = new Date();
  const date = new Date(timestamp);
  return (
    now.getFullYear() === date.getFullYear() &&
    now.getMonth() === date.getMonth() &&
    now.getDate() === date.getDate()
  );
}

export function isThisWeek(timestamp: number): boolean {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);
  return timestamp >= weekStart.getTime();
}

// ============ Data Masking (Privacy) ============

/**
 * Mask phone number: 13812345678 -> 138****5678
 */
export function maskPhone(phone: string): string {
  if (!phone || phone.length < 7) return phone;
  return phone.slice(0, 3) + '****' + phone.slice(-4);
}

/**
 * Mask email: user@example.com -> u***@example.com
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return email;
  const [local, domain] = email.split('@');
  if (local.length <= 1) return email;
  return local[0] + '***@' + domain;
}

/**
 * Mask WeChat ID: show first and last char only
 */
export function maskWechat(wechat: string): string {
  if (!wechat || wechat.length < 3) return wechat;
  return wechat[0] + '***' + wechat.slice(-1);
}

// ============ Input Sanitization ============

/**
 * Escape HTML special characters to prevent XSS.
 * All user input is escaped before being rendered in the DOM.
 */
export function escapeHtml(str: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return str.replace(/[&<>"']/g, (c) => map[c]);
}

// ============ Password Strength ============

export function getPasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
} {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  const levels = [
    { label: '非常弱', color: '#ef4444' },
    { label: '弱', color: '#f97316' },
    { label: '一般', color: '#eab308' },
    { label: '强', color: '#22c55e' },
    { label: '非常强', color: '#16a34a' },
  ];

  const level = levels[Math.min(score, levels.length - 1)];
  return { score, ...level };
}

// ============ File Size Formatting ============

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// ============ Status Labels ============

export const customerStatusLabels: Record<string, string> = {
  potential: '潜在',
  following: '跟进中',
  intention: '有意向',
  closed: '已成交',
  lost: '已流失',
};

export const customerStatusColors: Record<string, string> = {
  potential: 'bg-gray-100 text-gray-700',
  following: 'bg-blue-100 text-blue-700',
  intention: 'bg-amber-100 text-amber-700',
  closed: 'bg-emerald-100 text-emerald-700',
  lost: 'bg-red-100 text-red-700',
};

export const contactRoleLabels: Record<string, string> = {
  decision_maker: '决策者',
  influencer: '影响者',
  user: '使用者',
  gatekeeper: '守门人',
};

export const followUpTypeLabels: Record<string, string> = {
  phone: '电话',
  meeting: '会议',
  email: '邮件',
  wechat: '微信',
  visit: '拜访',
  other: '其他',
};

export const problemSeverityLabels: Record<string, string> = {
  low: '低',
  medium: '中',
  high: '高',
  critical: '严重',
};

export const problemSeverityColors: Record<string, string> = {
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
};

export const problemStatusLabels: Record<string, string> = {
  unsolved: '未解决',
  solving: '解决中',
  solved: '已解决',
};

export const resourceTypeLabels: Record<string, string> = {
  channel: '渠道',
  partner: '合作伙伴',
  expert: '专家',
  tool: '工具',
};

export const competitorStatusLabels: Record<string, string> = {
  involved: '已介入',
  competing: '正在竞争',
  won: '已胜出',
  lost: '已失败',
};

// ============ Export Helpers ============

export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function objectsToCsv<T extends Record<string, any>>(objects: T[], fields: string[]): string {
  const header = fields.join(',');
  const rows = objects.map((obj) =>
    fields
      .map((f) => {
        const val = obj[f];
        if (val === null || val === undefined) return '';
        const str = String(val);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return '"' + str.replace(/"/g, '""') + '"';
        }
        return str;
      })
      .join(',')
  );
  return header + '\n' + rows.join('\n');
}

// ============ Notification Helpers ============

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

export function showNotification(title: string, body: string, tag?: string): void {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  new Notification(title, {
    body,
    icon: '/vite.svg',
    tag,
  });
}
