/**
 * Built-in secret & personal data detection rules and validators,
 * reconstructed from Magpie's `internal/redact` engine.
 */

export interface BuiltinRule {
  kind: string
  category: 'secret' | 'personal'
  personalSubKind?: string
  triggers?: string[]
  re: RegExp
  group?: number
  validate?: (match: string, fullText: string, index: number) => boolean
}

/** GB 11643-1999 18-digit Chinese ID card checksum validation. */
export function isValidChineseID(s: string): boolean {
  if (s.length !== 18) return false
  const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2]
  const codes = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2']
  let sum = 0
  for (let i = 0; i < 17; i++) {
    const d = s.charCodeAt(i) - 48
    if (d < 0 || d > 9) return false
    sum += d * weights[i]
  }
  const last = s[17].toUpperCase()
  return last === codes[sum % 11]
}

/** Luhn mod-10 bank card validation. */
export function isValidLuhn(s: string): boolean {
  const digits = s.replace(/[ -]/g, '')
  if (digits.length < 13 || digits.length > 19 || !/^\d+$/.test(digits)) return false
  // Reject all-same digits or obvious sequential test numbers
  if (/^(\d)\1+$/.test(digits) || digits.startsWith('12345678')) return false
  let sum = 0
  let doubleIt = false
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = digits.charCodeAt(i) - 48
    if (doubleIt) {
      n *= 2
      if (n > 9) n -= 9
    }
    sum += n
    doubleIt = !doubleIt
  }
  return sum % 10 === 0
}

/** ISO 13616 IBAN mod-97 validation. */
export function isValidIBAN(s: string): boolean {
  const clean = s.replace(/\s+/g, '').toUpperCase()
  if (clean.length < 15 || clean.length > 34) return false
  const rearranged = clean.slice(4) + clean.slice(0, 4)
  let rem = 0
  for (let i = 0; i < rearranged.length; i++) {
    const code = rearranged.charCodeAt(i)
    const val = code >= 65 && code <= 90 ? String(code - 55) : rearranged[i]
    for (let j = 0; j < val.length; j++) {
      rem = (rem * 10 + (val.charCodeAt(j) - 48)) % 97
    }
  }
  return rem === 1
}

const IGNORED_EMAIL_DOMAINS = new Set([
  'example.com',
  'example.org',
  'example.net',
  'test.com',
  'localhost',
  'localdomain',
  'domain.com',
  'company.com',
  'yourcompany.com',
])

const IMAGE_ASSET_EXTS = /\.(?:png|jpe?g|gif|webp|svg|ico|bmp|tiff?|avif|heic|woff2?|ttf|eot|css|js|ts|map)$/i

export function isRealEmail(m: string): boolean {
  if (IMAGE_ASSET_EXTS.test(m)) return false
  const at = m.indexOf('@')
  if (at <= 0) return false
  const user = m.slice(0, at).toLowerCase()
  const domain = m.slice(at + 1).toLowerCase()
  if (IGNORED_EMAIL_DOMAINS.has(domain)) return false
  if (domain.endsWith('.example') || domain.endsWith('.test') || domain.endsWith('.invalid') || domain.endsWith('.localhost')) {
    return false
  }
  if (user === 'git' || user === 'noreply' || user === 'no-reply') return false
  return true
}

const DUMMY_MACS = new Set([
  '00:00:00:00:00:00',
  'ff:ff:ff:ff:ff:ff',
  '00:11:22:33:44:55',
  '01:23:45:67:89:ab',
  '12:34:56:78:9a:bc',
  'aa:bb:cc:dd:ee:ff',
])

export function isValidMac(m: string): boolean {
  return !DUMMY_MACS.has(m.toLowerCase().replace(/-/g, ':'))
}

const PUBLIC_DNS_AND_LOCAL_IPS = new Set([
  '0.0.0.0',
  '127.0.0.1',
  '255.255.255.255',
  '1.1.1.1',
  '1.0.0.1',
  '8.8.8.8',
  '8.8.4.4',
  '9.9.9.9',
  '114.114.114.114',
  '119.29.29.29',
  '180.76.76.76',
  '223.5.5.5',
  '223.6.6.6',
  '208.67.222.222',
  '208.67.220.220',
])

export function isMaskWorthyIPv4(m: string, fullText: string, index: number): boolean {
  if (PUBLIC_DNS_AND_LOCAL_IPS.has(m)) return false
  if (m.startsWith('127.') || m.startsWith('0.') || m.startsWith('192.0.2.') || m.startsWith('198.51.100.') || m.startsWith('203.0.113.')) {
    return false
  }
  // Avoid matching version numbers like v1.2.3.4 or 1.2.3.4.5
  const prev = index > 0 ? fullText[index - 1] : ''
  const next = index + m.length < fullText.length ? fullText[index + m.length] : ''
  if (prev === 'v' || prev === 'V' || prev === '.' || next === '.') return false
  return true
}

const SYSTEM_USERNAMES = new Set([
  'root',
  'admin',
  'ubuntu',
  'debian',
  'centos',
  'fedora',
  'nobody',
  'runner',
  'shared',
  'public',
  'default',
  'guest',
  'vagrant',
  'user',
  'username',
  'yourusername',
  'someone',
  'example',
  'git',
])

export function isRealUsername(u: string): boolean {
  const clean = u.trim().toLowerCase()
  if (!clean || clean.length < 2 || SYSTEM_USERNAMES.has(clean)) return false
  if (clean.startsWith('$') || clean.startsWith('{') || clean.startsWith('<')) return false
  return true
}

const FALSE_POSITIVE_SECRET_WORDS = new Set([
  'true',
  'false',
  'null',
  'undefined',
  'none',
  'auto',
  'default',
  'required',
  'optional',
  'string',
  'number',
  'boolean',
  'object',
  'array',
  'function',
  'Bearer',
  'bearer',
  'Basic',
  'basic',
  'application/json',
])

export function isLikelySecretValue(val: string): boolean {
  if (val.length < 8) return false
  if (FALSE_POSITIVE_SECRET_WORDS.has(val)) return false
  if (/^\$[A-Za-z_{]/.test(val) || /^process\.env\./.test(val) || /^\{\{.*\}\}$/.test(val)) return false
  // Exclude pure paths or URLs without credentials
  if (/^(?:https?:\/\/|\/[A-Za-z0-9_.-]+\/)/.test(val)) return false
  return true
}

export const BUILTIN_RULES: BuiltinRule[] = [
  // 0. Private Keys (PEM blocks)
  {
    kind: 'PRIVATE_KEY',
    category: 'secret',
    triggers: ['PRIVATE KEY'],
    re: /-----BEGIN (?:[A-Z0-9]+ )*PRIVATE KEY(?: BLOCK)?-----[\s\S]+?-----END (?:[A-Z0-9]+ )*PRIVATE KEY(?: BLOCK)?-----/g,
  },
  // 1. OpenAI / Anthropic / OpenRouter sk- keys
  {
    kind: 'API_KEY',
    category: 'secret',
    triggers: ['sk-'],
    re: /\bsk-(?:ant-|proj-|or-|svcacct-|admin-)?[A-Za-z0-9_-]{20,}/g,
  },
  // 2. Vendor *_sk_* keys (e.g. oc_sk_...)
  {
    kind: 'API_KEY',
    category: 'secret',
    triggers: ['_sk_'],
    re: /\b[a-z]{2,4}_sk_[A-Za-z0-9_-]{20,}/g,
  },
  // 3. GitHub & GitLab tokens
  {
    kind: 'API_KEY',
    category: 'secret',
    triggers: ['gh', 'github_pat_', 'glpat-'],
    re: /\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,}|glpat-[A-Za-z0-9_-]{20,})/g,
  },
  // 4. Google AIza keys
  {
    kind: 'API_KEY',
    category: 'secret',
    triggers: ['AIza'],
    re: /\bAIza[0-9A-Za-z_-]{35}\b/g,
  },
  // 5. Slack xox* tokens
  {
    kind: 'API_KEY',
    category: 'secret',
    triggers: ['xox'],
    re: /\bxox[abposr]-[0-9A-Za-z-]{10,}/g,
  },
  // 6. Stripe live keys
  {
    kind: 'API_KEY',
    category: 'secret',
    triggers: ['_live_'],
    re: /\b(?:sk|rk)_live_[0-9A-Za-z]{20,}/g,
  },
  // 7. AWS Access Key ID
  {
    kind: 'API_KEY',
    category: 'secret',
    triggers: ['AKIA', 'ASIA'],
    re: /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/g,
  },
  // 8. HuggingFace, Groq, xAI, npm, PyPI, DigitalOcean, SendGrid
  {
    kind: 'API_KEY',
    category: 'secret',
    triggers: ['hf_', 'gsk_', 'xai-', 'npm_', 'pypi-', 'dop_v1_', 'SG.'],
    re: /\b(?:hf_[A-Za-z0-9]{30,}|gsk_[A-Za-z0-9]{40,}|xai-[A-Za-z0-9]{40,}|npm_[A-Za-z0-9]{36}|pypi-[A-Za-z0-9_-]{50,}|dop_v1_[a-f0-9]{64}|SG\.[A-Za-z0-9_-]{22}\.[A-Za-z0-9_-]{43})/g,
  },
  // 9. JWT Tokens
  {
    kind: 'TOKEN',
    category: 'secret',
    triggers: ['eyJ'],
    re: /\beyJ[A-Za-z0-9_-]{8,}\.eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/g,
  },
  // 10. URI userinfo password (scheme://user:password@host)
  {
    kind: 'PASSWORD',
    category: 'secret',
    triggers: ['://'],
    re: /[A-Za-z][A-Za-z0-9+.-]*:\/\/[^\s:@/?#"'<>]*:([^\s@/?#"'<>]{3,})@/g,
    group: 1,
  },
  // 11. Key-value assigned passwords
  {
    kind: 'PASSWORD',
    category: 'secret',
    re: /(?:[A-Za-z0-9_.-]*(?:password|passwd|pwd|passphrase)[A-Za-z0-9_.-]*|密码|密碼|口令)\s*[:=：]\s*["']?([A-Za-z0-9_\-./+=~!@#%^&*]{6,64})["']?/gi,
    group: 1,
    validate: isLikelySecretValue,
  },
  // 12. Key-value assigned secrets/tokens/keys
  {
    kind: 'SECRET',
    category: 'secret',
    re: /(?:[A-Za-z0-9_.-]*(?:secret|token|api_?key|access_?key|private_?key|client_?secret|auth_?token)[A-Za-z0-9_.-]*|密钥|密鑰|私钥|令牌)\s*[:=：]\s*["']?([A-Za-z0-9_\-./+=~!@#%^&*]{8,128})["']?/gi,
    group: 1,
    validate: isLikelySecretValue,
  },
  // 13. Standalone key = "..." (16+ chars)
  {
    kind: 'SECRET',
    category: 'secret',
    re: /(?:^|[^A-Za-z0-9_.-])\\?["']?key\\?["']?\s*[:=]\s*\\?["']?([A-Za-z0-9_\-./+=~!@#%^&*]{16,128})\\?["']?/gi,
    group: 1,
    validate: isLikelySecretValue,
  },
  // 14. Email addresses
  {
    kind: 'EMAIL',
    category: 'personal',
    triggers: ['@'],
    re: /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/g,
    validate: isRealEmail,
  },
  // 15. Chinese 18-digit ID Card
  {
    kind: 'ID_CARD',
    category: 'personal',
    re: /\b[1-9]\d{5}(?:18|19|20)\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])\d{3}[\dXx]\b/g,
    validate: isValidChineseID,
  },
  // 16. Chinese Mainland Phone Number
  {
    kind: 'PHONE',
    category: 'personal',
    re: /(?:\+?86[- ]?)?\b1[3-9]\d{9}\b/g,
  },
  // 17. Bank Card (13-19 digits with Luhn check)
  {
    kind: 'BANK_CARD',
    category: 'personal',
    re: /\b[3-6]\d{3}(?:[ -]?\d{4}){2,3}(?:[ -]?\d{1,3})?\b/g,
    validate: isValidLuhn,
  },
  // 18. US SSN
  {
    kind: 'SSN',
    category: 'personal',
    personalSubKind: 'ssn',
    re: /\b(?!000|666|9\d\d)\d{3}-(?!00)\d{2}-(?!0000)\d{4}\b/g,
  },
  // 19. IBAN
  {
    kind: 'IBAN',
    category: 'personal',
    personalSubKind: 'iban',
    re: /\b[A-Z]{2}\d{2}(?:[A-Z0-9]{11,30}|(?: [A-Z0-9]{4}){2,7}(?: [A-Z0-9]{1,3})?)\b/g,
    validate: isValidIBAN,
  },
  // 20. MAC Address
  {
    kind: 'MAC',
    category: 'personal',
    personalSubKind: 'mac',
    re: /\b(?:[0-9A-Fa-f]{2}(?::[0-9A-Fa-f]{2}){5}|[0-9A-Fa-f]{2}(?:-[0-9A-Fa-f]{2}){5})\b/g,
    validate: isValidMac,
  },
  // 21. Unix Home Directory Username (/Users/<name> or /home/<name>)
  {
    kind: 'USERNAME',
    category: 'personal',
    personalSubKind: 'home',
    triggers: ['/Users/', '/home/', '/users/'],
    re: /(?:^|[^A-Za-z0-9_.~/\\-])(?:file:\/\/)?(?:\/mnt\/[a-z])?\/(?:Users|home)\/([^\s/\\:*?"'<>|,;()[\]{}`$%]{2,64})/gi,
    group: 1,
    validate: isRealUsername,
  },
  // 22. IPv4 Address
  {
    kind: 'IP',
    category: 'personal',
    personalSubKind: 'ip',
    re: /\b(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}\b/g,
    validate: isMaskWorthyIPv4,
  },
  // 23. Cloud Storage Bucket URI
  {
    kind: 'BUCKET',
    category: 'personal',
    personalSubKind: 'bucket',
    triggers: ['://'],
    re: /\b(?:s3a?|s3n|gs|oss|cosn?|obs|r2|ks3|bos|tos):\/\/([A-Za-z0-9](?:[A-Za-z0-9._-]{1,61}[A-Za-z0-9])?)/gi,
    group: 1,
  },
]

export const MASK_SECRET_KINDS = ['API_KEY', 'PRIVATE_KEY', 'TOKEN', 'PASSWORD', 'SECRET'] as const
export const MASK_PERSONAL_KINDS = [
  'EMAIL',
  'PHONE',
  'ID_CARD',
  'BANK_CARD',
  'PERSON',
  'ADDRESS',
  'ACCOUNT',
  'SSN',
  'PASSPORT',
  'IBAN',
  'BIRTHDAY',
  'MAC',
  'SERIAL',
  'USERNAME',
  'HOSTNAME',
  'IP',
  'BUCKET',
] as const
