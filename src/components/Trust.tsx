import { useState } from 'react';
import { useApp } from '../lib/store';
import { demoEncrypt, demoDecrypt } from '../lib/crypto';
import { Shield, Lock, Eye, Code, Heart, ExternalLink, Play } from 'lucide-react';

export default function Trust() {
  const { cryptoKey } = useApp();
  const [demoInput, setDemoInput] = useState('这是我的客户敏感信息');
  const [demoResult, setDemoResult] = useState<{ original: string; encrypted: string } | null>(null);
  const [demoDecryptResult, setDemoDecryptResult] = useState<{ encrypted: string; decrypted: string } | null>(null);
  const [demoIv, setDemoIv] = useState('');
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [activeTab, setActiveTab] = useState<'demo' | 'code' | 'about' | 'promise'>('demo');

  const handleEncryptDemo = async () => {
    if (!cryptoKey || !demoInput.trim()) return;
    setIsEncrypting(true);
    try {
      const result = await demoEncrypt(demoInput, cryptoKey);
      setDemoResult(result);
      setDemoIv(result.iv);
    } catch {
      // silently fail
    }
    setIsEncrypting(false);
  };

  const handleDecryptDemo = async () => {
    if (!cryptoKey || !demoResult) return;
    setIsDecrypting(true);
    try {
      const result = await demoDecrypt(demoResult.encrypted, demoIv, cryptoKey);
      setDemoDecryptResult(result);
    } catch {
      // silently fail
    }
    setIsDecrypting(false);
  };

  const coreCodeSnippet = `// === 核心加密逻辑 (Web Crypto API) ===

// 1. 使用 PBKDF2 从主密码派生加密密钥
async function deriveKey(password, salt) {
  const keyMaterial = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(password),
    'PBKDF2', false, ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,  // 不可导出 - 密钥无法被提取
    ['encrypt', 'decrypt']
  );
}

// 2. 使用 AES-256-GCM 加密数据
async function encrypt(plaintext, key) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv }, key,
    new TextEncoder().encode(plaintext)
  );
  return { data: arrayBufferToBase64(encrypted), iv };
}

// 3. 使用 AES-256-GCM 解密数据
async function decrypt(ciphertext, iv, key) {
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: base64ToArrayBuffer(iv) },
    key, base64ToArrayBuffer(ciphertext)
  );
  return new TextDecoder().decode(decrypted);
}`;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">安全与信任</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">透明、可验证的安全承诺</p>
      </div>

      {/* Three promises */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: <Shield size={24} />, title: '不收集任何数据', desc: '我们不会收集、上传或存储您的任何个人数据' },
          { icon: <Lock size={24} />, title: '不访问明文数据', desc: '所有数据加密存储，平台无法解密您的数据' },
          { icon: <Eye size={24} />, title: '不存储加密密钥', desc: '密钥仅存在于设备内存，退出后立即销毁' },
        ].map((p, i) => (
          <div key={i} className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-5 text-center">
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl flex items-center justify-center mx-auto mb-3 text-emerald-600">
              {p.icon}
            </div>
            <h3 className="text-sm font-bold text-emerald-700 dark:text-emerald-400 mb-1">{p.title}</h3>
            <p className="text-xs text-emerald-600 dark:text-emerald-300">{p.desc}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 pb-0">
        {[
          { id: 'demo', label: '加密演示', icon: <Play size={14} /> },
          { id: 'code', label: '核心代码', icon: <Code size={14} /> },
          { id: 'about', label: '关于我们', icon: <Heart size={14} /> },
          { id: 'promise', label: '安全承诺', icon: <Shield size={14} /> },
        ].map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Demo tab */}
      {activeTab === 'demo' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">加密演示</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            亲眼见证您的数据如何被加密成无法识别的密文，只有输入正确的主密码才能解密。
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">输入明文数据</label>
              <input type="text" value={demoInput} onChange={(e) => setDemoInput(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white" />
            </div>

            <button onClick={handleEncryptDemo} disabled={isEncrypting || !cryptoKey}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium">
              <Lock size={14} /> {isEncrypting ? '加密中...' : '加密数据'}
            </button>

            {demoResult && (
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-xs font-medium text-blue-700 dark:text-blue-400 mb-1">原始数据</p>
                  <p className="text-sm text-blue-900 dark:text-blue-200">{demoResult.original}</p>
                </div>
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <p className="text-xs font-medium text-red-700 dark:text-red-400 mb-1">加密后（密文）</p>
                  <p className="text-xs text-red-900 dark:text-red-200 break-all font-mono">{demoResult.encrypted}</p>
                </div>

                <button onClick={handleDecryptDemo} disabled={isDecrypting}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium">
                  <Eye size={14} /> {isDecrypting ? '解密中...' : '解密数据'}
                </button>

                {demoDecryptResult && (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                    <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400 mb-1">解密后</p>
                    <p className="text-sm text-emerald-900 dark:text-emerald-200">{demoDecryptResult.decrypted}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Code tab */}
      {activeTab === 'code' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">核心加密代码</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            以下是核心加密逻辑的代码展示。所有加密操作均使用浏览器原生 Web Crypto API，不依赖任何第三方加密库。
          </p>
          <pre className="bg-gray-900 text-gray-100 rounded-xl p-4 text-xs overflow-x-auto leading-relaxed">
            {coreCodeSnippet}
          </pre>
          <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
            <ExternalLink size={14} />
            <span>核心加密代码已开源至 GitHub，接受全球安全研究者审查</span>
          </div>
        </div>
      )}

      {/* About tab */}
      {activeTab === 'about' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">关于我们</h3>
          <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300">
            <p>
              SalesVault 的创始人是一名在校大学生，并不精通编程。这个产品是通过 AI 辅助生成的。
            </p>
            <p>
              但我们深知，安全不是靠"信任开发者"来保证的，而是靠<strong className="text-gray-900 dark:text-white">可验证的技术架构</strong>来保证的。
            </p>
            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
              <h4 className="font-medium text-emerald-700 dark:text-emerald-400 mb-2">为什么您可以放心使用？</h4>
              <ul className="space-y-1.5 text-emerald-600 dark:text-emerald-300">
                <li>1. 加密算法采用行业成熟标准（AES-256-GCM），与 1Password/Bitwarden 同级</li>
                <li>2. 密钥派生使用 PBKDF2 + 100,000 次迭代，暴力破解几乎不可能</li>
                <li>3. 所有数据存储在您的本地设备，平台无法访问</li>
                <li>4. 加密密钥仅存在于内存中，退出即销毁</li>
                <li>5. 核心加密代码开源可审查</li>
              </ul>
            </div>
            <p>
              即使开发者也无法访问您的数据 -- 因为密钥只存在于您的设备内存中，我们从未也永远无法获取。
            </p>
          </div>
        </div>
      )}

      {/* Promise tab */}
      {activeTab === 'promise' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">安全承诺与合规说明</h3>
          <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300">
            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">数据处理流程</h4>
              <ol className="list-decimal list-inside space-y-1">
                <li>{'用户输入数据 -> JSON 序列化'}</li>
                <li>{'使用 AES-256-GCM 加密 -> 生成密文 + 随机 IV'}</li>
                <li>密文存储到本地 IndexedDB</li>
                <li>{'读取时: 从 IndexedDB 读取密文 -> 使用内存中的密钥解密 -> 显示'}</li>
                <li>退出应用: 内存中的密钥立即销毁</li>
              </ol>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">合规说明</h4>
              <ul className="space-y-1">
                <li>- 遵循《个人信息保护法》最小必要原则</li>
                <li>- 遵循《数据安全法》数据分类分级要求</li>
                <li>- 实现知情同意原则: 用户完全知晓数据存储位置和方式</li>
                <li>- 数据主权 100% 归用户所有</li>
              </ul>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">安全措施</h4>
              <ul className="space-y-1">
                <li>- AES-256-GCM 认证加密（防篡改 + 保密性）</li>
                <li>- PBKDF2-SHA256 密钥派生（100,000 次迭代）</li>
                <li>- 每次加密使用随机 IV（防止密文分析）</li>
                <li>- 密钥不可导出（CryptoKey extractable=false）</li>
                <li>- 所有用户输入经过 HTML 转义（防 XSS）</li>
                <li>- 敏感信息默认脱敏显示</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
