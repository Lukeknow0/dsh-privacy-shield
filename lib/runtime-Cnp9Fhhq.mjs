import { appendFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { createHmac, randomBytes } from "node:crypto";
// src/engine/ledger.ts
/**
* Privacy Shield Ledger & Settings Store:
* - Persists settings in `~/.dsh/privacy-shield/settings.json`
* - Appends masking records to `~/.dsh/privacy-shield/masking/YYYY-MM-DD.jsonl`
* - Optionally merges read-only records from `~/.config/magpie/masking/*.jsonl`
*   so existing historical masking metrics and charts render immediately
* - Computes 7-day / 30-day `MaskSummary` (days strip, agent/provider flow,
*   facets, and ranked values)
*/
const DEFAULT_SETTINGS = {
	redact: true,
	redactShape: false,
	redactPersonal: false,
	redactKinds: {
		ssn: true,
		passport: true,
		iban: true,
		birthday: true,
		mac: true,
		serial: true,
		home: true,
		userhost: true,
		ip: true,
		bucket: true
	},
	redactWords: [],
	redactWordsAnyCase: false,
	redactRules: [],
	redactActions: {},
	redactAllow: [],
	conversationBadge: true,
	importLegacyHistory: true
};
function formatDayLocal(d) {
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
var PrivacyLedger = class {
	baseDir;
	settingsPath;
	maskingDir;
	legacyArchiveDir;
	cachedSettings = null;
	constructor(baseDir = join(homedir(), ".dsh", "privacy-shield"), legacyArchiveDir = join(homedir(), ".config", "magpie", "masking")) {
		this.baseDir = baseDir;
		this.settingsPath = join(this.baseDir, "settings.json");
		this.maskingDir = join(this.baseDir, "masking");
		this.legacyArchiveDir = legacyArchiveDir;
	}
	getSettings() {
		if (this.cachedSettings) return this.cachedSettings;
		try {
			if (existsSync(this.settingsPath)) {
				const raw = JSON.parse(readFileSync(this.settingsPath, "utf8"));
				this.cachedSettings = {
					...DEFAULT_SETTINGS,
					...raw,
					redactKinds: {
						...DEFAULT_SETTINGS.redactKinds,
						...raw.redactKinds ?? {}
					},
					redactActions: { ...raw.redactActions ?? {} }
				};
				return this.cachedSettings;
			}
		} catch {}
		this.cachedSettings = { ...DEFAULT_SETTINGS };
		return this.cachedSettings;
	}
	updateSettings(patch) {
		const current = this.getSettings();
		const next = {
			...current,
			...patch,
			redactKinds: patch.redactKinds ? {
				...current.redactKinds,
				...patch.redactKinds
			} : current.redactKinds,
			redactActions: patch.redactActions !== void 0 ? { ...patch.redactActions } : current.redactActions
		};
		this.cachedSettings = next;
		mkdirSync(this.baseDir, {
			recursive: true,
			mode: 448
		});
		writeFileSync(this.settingsPath, JSON.stringify(next, null, 2), { mode: 384 });
		return next;
	}
	appendRecord(record) {
		const day = record.t.slice(0, 10);
		mkdirSync(this.maskingDir, {
			recursive: true,
			mode: 448
		});
		const file = join(this.maskingDir, `${day}.jsonl`);
		appendFileSync(file, JSON.stringify(record) + "\n", { mode: 384 });
	}
	clearOwnRecords() {
		try {
			if (existsSync(this.maskingDir)) {
				for (const name of readdirSync(this.maskingDir)) if (name.endsWith(".jsonl")) rmSync(join(this.maskingDir, name), { force: true });
			}
		} catch {}
	}
	readDirRecords(dir, allowedDays) {
		if (!existsSync(dir)) return [];
		let files = [];
		try {
			files = readdirSync(dir).filter((f) => /^\d{4}-\d{2}-\d{2}\.jsonl$/.test(f)).sort().reverse();
		} catch {
			return [];
		}
		const out = [];
		for (const f of files) {
			const day = f.slice(0, 10);
			if (allowedDays && !allowedDays.has(day)) continue;
			try {
				const lines = readFileSync(join(dir, f), "utf8").split("\n");
				for (let i = lines.length - 1; i >= 0; i--) {
					const line = lines[i].trim();
					if (!line) continue;
					try {
						const parsed = JSON.parse(line);
						if (parsed && parsed.key != null && Array.isArray(parsed.values)) out.push({
							key: String(parsed.key),
							t: String(parsed.t || ""),
							...typeof parsed.route === "number" ? { route: parsed.route } : {},
							what: String(parsed.what || "chat"),
							agent: String(parsed.agent || "dsh"),
							...typeof parsed.session === "string" ? { session: parsed.session } : {},
							provider: String(parsed.provider || ""),
							model: String(parsed.model || ""),
							n: Number(parsed.n || 0),
							...parsed.blocked ? { blocked: true } : {},
							values: parsed.values,
							...parsed.back && typeof parsed.back === "object" ? { back: parsed.back } : {},
							...parsed.snips && typeof parsed.snips === "object" ? { snips: parsed.snips } : {},
							...typeof parsed.took === "number" ? { took: parsed.took } : {}
						});
					} catch {}
				}
			} catch {}
		}
		return out;
	}
	/** Load all records (newest first), optionally including Magpie's local masking logs. */
	loadAllRecords(daysWindow) {
		let allowedDays;
		if (daysWindow && daysWindow > 0) {
			allowedDays = /* @__PURE__ */ new Set();
			const now = /* @__PURE__ */ new Date();
			for (let i = 0; i < daysWindow; i++) {
				const d = /* @__PURE__ */ new Date(now.getTime() - i * 864e5);
				allowedDays.add(formatDayLocal(d));
			}
		}
		const own = this.readDirRecords(this.maskingDir, allowedDays);
		const legacy = this.getSettings().importLegacyHistory ? this.readDirRecords(this.legacyArchiveDir, allowedDays) : [];
		const byKey = /* @__PURE__ */ new Map();
		for (const r of [...own, ...legacy]) if (!byKey.has(r.key)) byKey.set(r.key, r);
		return [...byKey.values()].sort((a, b) => {
			try {
				const ka = BigInt(a.key);
				const kb = BigInt(b.key);
				return kb > ka ? 1 : kb < ka ? -1 : 0;
			} catch {
				return b.t.localeCompare(a.t);
			}
		});
	}
	/** Compute the 7-day or 30-day summary for the Privacy Shield dashboard. */
	getSummary(daysCount = 7) {
		const now = /* @__PURE__ */ new Date();
		const dayKeys = [];
		const dayMap = /* @__PURE__ */ new Map();
		for (let i = daysCount - 1; i >= 0; i--) {
			const k = formatDayLocal(/* @__PURE__ */ new Date(now.getTime() - i * 864e5));
			dayKeys.push(k);
			dayMap.set(k, {
				day: k,
				n: 0,
				requests: 0
			});
		}
		const records = this.loadAllRecords(daysCount);
		const kindCounts = /* @__PURE__ */ new Map();
		const agentCounts = /* @__PURE__ */ new Map();
		const providerCounts = /* @__PURE__ */ new Map();
		const byCounts = {};
		const valueAgg = /* @__PURE__ */ new Map();
		let totalMasked = 0;
		let totalRequests = 0;
		let totalBlocked = 0;
		for (const r of records) {
			const dayStr = r.t.slice(0, 10);
			const dayItem = dayMap.get(dayStr);
			if (!dayItem) continue;
			totalRequests += 1;
			dayItem.requests += 1;
			if (r.blocked) totalBlocked += 1;
			const reqPlaces = r.n || r.values.reduce((acc, v) => acc + (v.n || 1), 0);
			totalMasked += reqPlaces;
			dayItem.n += reqPlaces;
			if (r.agent) agentCounts.set(r.agent, (agentCounts.get(r.agent) ?? 0) + reqPlaces);
			if (r.provider) providerCounts.set(r.provider, (providerCounts.get(r.provider) ?? 0) + reqPlaces);
			for (const v of r.values || []) {
				const vn = v.n || 1;
				kindCounts.set(v.k, (kindCounts.get(v.k) ?? 0) + vn);
				byCounts[v.b] = (byCounts[v.b] ?? 0) + vn;
				const existing = valueAgg.get(v.p);
				if (existing) {
					existing.n += vn;
					existing.requests += 1;
					if (r.t > existing.last) existing.last = r.t;
				} else valueAgg.set(v.p, {
					p: v.p,
					kind: v.k,
					by: v.b,
					head: v.h || "",
					len: v.l || 0,
					n: vn,
					requests: 1,
					last: r.t
				});
			}
		}
		const toSortedNamed = (m) => [...m.entries()].map(([name, n]) => ({
			name,
			n
		})).sort((a, b) => b.n - a.n);
		const rankedValues = [...valueAgg.values()].sort((a, b) => b.n - a.n).slice(0, 100);
		return {
			days: dayKeys.map((k) => dayMap.get(k)),
			kinds: toSortedNamed(kindCounts),
			agents: toSortedNamed(agentCounts),
			providers: toSortedNamed(providerCounts),
			values: rankedValues,
			by: byCounts,
			n: totalMasked,
			distinct: valueAgg.size,
			requests: totalRequests,
			blocked: totalBlocked
		};
	}
	/** Filter and paginate records for `shield.records`. */
	queryRecords(filter) {
		const limit = Math.max(1, Math.min(filter.limit ?? 40, 200));
		const kindSet = filter.kind ? new Set(filter.kind.split(",").map((k) => k.trim()).filter(Boolean)) : null;
		const all = this.loadAllRecords(30);
		const matched = [];
		for (const r of all) {
			if (filter.before) try {
				if (BigInt(r.key) >= BigInt(filter.before)) continue;
			} catch {
				if (r.key >= filter.before) continue;
			}
			if (filter.blocked && !r.blocked) continue;
			if (filter.agent && r.agent !== filter.agent) continue;
			if (filter.provider && r.provider !== filter.provider) continue;
			if (kindSet && !r.values.some((v) => kindSet.has(v.k))) continue;
			if (filter.by && !r.values.some((v) => v.b === filter.by)) continue;
			matched.push(r);
			if (matched.length > limit) break;
		}
		return {
			records: matched.slice(0, limit),
			more: matched.length > limit
		};
	}
	getRecord(key) {
		return this.loadAllRecords(30).find((r) => r.key === String(key)) ?? null;
	}
};
// src/engine/rules.ts
/** GB 11643-1999 18-digit Chinese ID card checksum validation. */
function isValidChineseID(s) {
	if (s.length !== 18) return false;
	const weights = [
		7,
		9,
		10,
		5,
		8,
		4,
		2,
		1,
		6,
		3,
		7,
		9,
		10,
		5,
		8,
		4,
		2
	];
	const codes = [
		"1",
		"0",
		"X",
		"9",
		"8",
		"7",
		"6",
		"5",
		"4",
		"3",
		"2"
	];
	let sum = 0;
	for (let i = 0; i < 17; i++) {
		const d = s.charCodeAt(i) - 48;
		if (d < 0 || d > 9) return false;
		sum += d * weights[i];
	}
	return s[17].toUpperCase() === codes[sum % 11];
}
/** Luhn mod-10 bank card validation. */
function isValidLuhn(s) {
	const digits = s.replace(/[ -]/g, "");
	if (digits.length < 13 || digits.length > 19 || !/^\d+$/.test(digits)) return false;
	if (/^(\d)\1+$/.test(digits) || digits.startsWith("12345678")) return false;
	let sum = 0;
	let doubleIt = false;
	for (let i = digits.length - 1; i >= 0; i--) {
		let n = digits.charCodeAt(i) - 48;
		if (doubleIt) {
			n *= 2;
			if (n > 9) n -= 9;
		}
		sum += n;
		doubleIt = !doubleIt;
	}
	return sum % 10 === 0;
}
/** ISO 13616 IBAN mod-97 validation. */
function isValidIBAN(s) {
	const clean = s.replace(/\s+/g, "").toUpperCase();
	if (clean.length < 15 || clean.length > 34) return false;
	const rearranged = clean.slice(4) + clean.slice(0, 4);
	let rem = 0;
	for (let i = 0; i < rearranged.length; i++) {
		const code = rearranged.charCodeAt(i);
		const val = code >= 65 && code <= 90 ? String(code - 55) : rearranged[i];
		for (let j = 0; j < val.length; j++) rem = (rem * 10 + (val.charCodeAt(j) - 48)) % 97;
	}
	return rem === 1;
}
const IGNORED_EMAIL_DOMAINS = /* @__PURE__ */ new Set([
	"example.com",
	"example.org",
	"example.net",
	"test.com",
	"localhost",
	"localdomain",
	"domain.com",
	"company.com",
	"yourcompany.com"
]);
const IMAGE_ASSET_EXTS = /\.(?:png|jpe?g|gif|webp|svg|ico|bmp|tiff?|avif|heic|woff2?|ttf|eot|css|js|ts|map)$/i;
function isRealEmail(m) {
	if (IMAGE_ASSET_EXTS.test(m)) return false;
	const at = m.indexOf("@");
	if (at <= 0) return false;
	const user = m.slice(0, at).toLowerCase();
	const domain = m.slice(at + 1).toLowerCase();
	if (IGNORED_EMAIL_DOMAINS.has(domain)) return false;
	if (domain.endsWith(".example") || domain.endsWith(".test") || domain.endsWith(".invalid") || domain.endsWith(".localhost")) return false;
	if (user === "git" || user === "noreply" || user === "no-reply") return false;
	return true;
}
const DUMMY_MACS = /* @__PURE__ */ new Set([
	"00:00:00:00:00:00",
	"ff:ff:ff:ff:ff:ff",
	"00:11:22:33:44:55",
	"01:23:45:67:89:ab",
	"12:34:56:78:9a:bc",
	"aa:bb:cc:dd:ee:ff"
]);
function isValidMac(m) {
	return !DUMMY_MACS.has(m.toLowerCase().replace(/-/g, ":"));
}
const PUBLIC_DNS_AND_LOCAL_IPS = /* @__PURE__ */ new Set([
	"0.0.0.0",
	"127.0.0.1",
	"255.255.255.255",
	"1.1.1.1",
	"1.0.0.1",
	"8.8.8.8",
	"8.8.4.4",
	"9.9.9.9",
	"114.114.114.114",
	"119.29.29.29",
	"180.76.76.76",
	"223.5.5.5",
	"223.6.6.6",
	"208.67.222.222",
	"208.67.220.220"
]);
function isMaskWorthyIPv4(m, fullText, index) {
	if (PUBLIC_DNS_AND_LOCAL_IPS.has(m)) return false;
	if (m.startsWith("127.") || m.startsWith("0.") || m.startsWith("192.0.2.") || m.startsWith("198.51.100.") || m.startsWith("203.0.113.")) return false;
	const prev = index > 0 ? fullText[index - 1] : "";
	const next = index + m.length < fullText.length ? fullText[index + m.length] : "";
	if (prev === "v" || prev === "V" || prev === "." || next === ".") return false;
	return true;
}
const SYSTEM_USERNAMES = /* @__PURE__ */ new Set([
	"root",
	"admin",
	"ubuntu",
	"debian",
	"centos",
	"fedora",
	"nobody",
	"runner",
	"shared",
	"public",
	"default",
	"guest",
	"vagrant",
	"user",
	"username",
	"yourusername",
	"someone",
	"example",
	"git"
]);
function isRealUsername(u) {
	const clean = u.trim().toLowerCase();
	if (!clean || clean.length < 2 || SYSTEM_USERNAMES.has(clean)) return false;
	if (clean.startsWith("$") || clean.startsWith("{") || clean.startsWith("<")) return false;
	return true;
}
const FALSE_POSITIVE_SECRET_WORDS = /* @__PURE__ */ new Set([
	"true",
	"false",
	"null",
	"undefined",
	"none",
	"auto",
	"default",
	"required",
	"optional",
	"string",
	"number",
	"boolean",
	"object",
	"array",
	"function",
	"Bearer",
	"bearer",
	"Basic",
	"basic",
	"application/json"
]);
function isLikelySecretValue(val) {
	if (val.length < 8) return false;
	if (FALSE_POSITIVE_SECRET_WORDS.has(val)) return false;
	if (/^\$[A-Za-z_{]/.test(val) || /^process\.env\./.test(val) || /^\{\{.*\}\}$/.test(val)) return false;
	if (/^(?:https?:\/\/|\/[A-Za-z0-9_.-]+\/)/.test(val)) return false;
	return true;
}
const BUILTIN_RULES = [
	{
		kind: "PRIVATE_KEY",
		category: "secret",
		triggers: ["PRIVATE KEY"],
		re: /-----BEGIN (?:[A-Z0-9]+ )*PRIVATE KEY(?: BLOCK)?-----[\s\S]+?-----END (?:[A-Z0-9]+ )*PRIVATE KEY(?: BLOCK)?-----/g
	},
	{
		kind: "API_KEY",
		category: "secret",
		triggers: ["sk-"],
		re: /\bsk-(?:ant-|proj-|or-|svcacct-|admin-)?[A-Za-z0-9_-]{20,}/g
	},
	{
		kind: "API_KEY",
		category: "secret",
		triggers: ["_sk_"],
		re: /\b[a-z]{2,4}_sk_[A-Za-z0-9_-]{20,}/g
	},
	{
		kind: "API_KEY",
		category: "secret",
		triggers: [
			"gh",
			"github_pat_",
			"glpat-"
		],
		re: /\b(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,}|glpat-[A-Za-z0-9_-]{20,})/g
	},
	{
		kind: "API_KEY",
		category: "secret",
		triggers: ["AIza"],
		re: /\bAIza[0-9A-Za-z_-]{35}\b/g
	},
	{
		kind: "API_KEY",
		category: "secret",
		triggers: ["xox"],
		re: /\bxox[abposr]-[0-9A-Za-z-]{10,}/g
	},
	{
		kind: "API_KEY",
		category: "secret",
		triggers: ["_live_"],
		re: /\b(?:sk|rk)_live_[0-9A-Za-z]{20,}/g
	},
	{
		kind: "API_KEY",
		category: "secret",
		triggers: ["AKIA", "ASIA"],
		re: /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/g
	},
	{
		kind: "API_KEY",
		category: "secret",
		triggers: [
			"hf_",
			"gsk_",
			"xai-",
			"npm_",
			"pypi-",
			"dop_v1_",
			"SG."
		],
		re: /\b(?:hf_[A-Za-z0-9]{30,}|gsk_[A-Za-z0-9]{40,}|xai-[A-Za-z0-9]{40,}|npm_[A-Za-z0-9]{36}|pypi-[A-Za-z0-9_-]{50,}|dop_v1_[a-f0-9]{64}|SG\.[A-Za-z0-9_-]{22}\.[A-Za-z0-9_-]{43})/g
	},
	{
		kind: "TOKEN",
		category: "secret",
		triggers: ["eyJ"],
		re: /\beyJ[A-Za-z0-9_-]{8,}\.eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/g
	},
	{
		kind: "PASSWORD",
		category: "secret",
		triggers: ["://"],
		re: /[A-Za-z][A-Za-z0-9+.-]*:\/\/[^\s:@/?#"'<>]*:([^\s@/?#"'<>]{3,})@/g,
		group: 1
	},
	{
		kind: "PASSWORD",
		category: "secret",
		re: /(?:[A-Za-z0-9_.-]*(?:password|passwd|pwd|passphrase)[A-Za-z0-9_.-]*|密码|密碼|口令)\s*[:=：]\s*["']?([A-Za-z0-9_\-./+=~!@#%^&*]{6,64})["']?/gi,
		group: 1,
		validate: isLikelySecretValue
	},
	{
		kind: "SECRET",
		category: "secret",
		re: /(?:[A-Za-z0-9_.-]*(?:secret|token|api_?key|access_?key|private_?key|client_?secret|auth_?token)[A-Za-z0-9_.-]*|密钥|密鑰|私钥|令牌)\s*[:=：]\s*["']?([A-Za-z0-9_\-./+=~!@#%^&*]{8,128})["']?/gi,
		group: 1,
		validate: isLikelySecretValue
	},
	{
		kind: "SECRET",
		category: "secret",
		re: /(?:^|[^A-Za-z0-9_.-])\\?["']?key\\?["']?\s*[:=]\s*\\?["']?([A-Za-z0-9_\-./+=~!@#%^&*]{16,128})\\?["']?/gi,
		group: 1,
		validate: isLikelySecretValue
	},
	{
		kind: "EMAIL",
		category: "personal",
		triggers: ["@"],
		re: /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/g,
		validate: isRealEmail
	},
	{
		kind: "ID_CARD",
		category: "personal",
		re: /\b[1-9]\d{5}(?:18|19|20)\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])\d{3}[\dXx]\b/g,
		validate: isValidChineseID
	},
	{
		kind: "PHONE",
		category: "personal",
		re: /(?:\+?86[- ]?)?\b1[3-9]\d{9}\b/g
	},
	{
		kind: "BANK_CARD",
		category: "personal",
		re: /\b[3-6]\d{3}(?:[ -]?\d{4}){2,3}(?:[ -]?\d{1,3})?\b/g,
		validate: isValidLuhn
	},
	{
		kind: "SSN",
		category: "personal",
		personalSubKind: "ssn",
		re: /\b(?!000|666|9\d\d)\d{3}-(?!00)\d{2}-(?!0000)\d{4}\b/g
	},
	{
		kind: "IBAN",
		category: "personal",
		personalSubKind: "iban",
		re: /\b[A-Z]{2}\d{2}(?:[A-Z0-9]{11,30}|(?: [A-Z0-9]{4}){2,7}(?: [A-Z0-9]{1,3})?)\b/g,
		validate: isValidIBAN
	},
	{
		kind: "MAC",
		category: "personal",
		personalSubKind: "mac",
		re: /\b(?:[0-9A-Fa-f]{2}(?::[0-9A-Fa-f]{2}){5}|[0-9A-Fa-f]{2}(?:-[0-9A-Fa-f]{2}){5})\b/g,
		validate: isValidMac
	},
	{
		kind: "USERNAME",
		category: "personal",
		personalSubKind: "home",
		triggers: [
			"/Users/",
			"/home/",
			"/users/"
		],
		re: /(?:^|[^A-Za-z0-9_.~/\\-])(?:file:\/\/)?(?:\/mnt\/[a-z])?\/(?:Users|home)\/([^\s/\\:*?"'<>|,;()[\]{}`$%]{2,64})/gi,
		group: 1,
		validate: isRealUsername
	},
	{
		kind: "IP",
		category: "personal",
		personalSubKind: "ip",
		re: /\b(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}\b/g,
		validate: isMaskWorthyIPv4
	},
	{
		kind: "BUCKET",
		category: "personal",
		personalSubKind: "bucket",
		triggers: ["://"],
		re: /\b(?:s3a?|s3n|gs|oss|cosn?|obs|r2|ks3|bos|tos):\/\/([A-Za-z0-9](?:[A-Za-z0-9._-]{1,61}[A-Za-z0-9])?)/gi,
		group: 1
	}
];
// src/engine/vault.ts
/**
* Privacy Shield Vault & Masking Engine:
* - Manages the 32-byte local HMAC key (`redact.key`)
* - Generates deterministic `{{KIND_xxxxxxxx}}` placeholders or shape-preserving fake keys
* - Holds the in-memory `placeholder -> rawValue` mapping (never written to disk)
* - Holds a bounded in-memory ring of recent masked request bodies (`sentBody`)
* - Performs streaming cross-chunk unmasking (`splitPartialTail` + `restoreText`)
*/
const BASE32_ALPHABET = "abcdefghijklmnopqrstuvwxyz234567";
const MAX_VAULT_ENTRIES = 1e4;
const MAX_SENT_BODIES = 100;
function toBase32Lower8(buf) {
	let bits = 0;
	let value = 0;
	let out = "";
	for (let i = 0; i < buf.length && out.length < 8; i++) {
		value = value << 8 | buf[i];
		bits += 8;
		while (bits >= 5 && out.length < 8) {
			out += BASE32_ALPHABET[value >>> bits - 5 & 31];
			bits -= 5;
		}
	}
	return out;
}
const KNOWN_KEY_HEADS = [
	"sk-ant-api03-",
	"sk-ant-oat01-",
	"sk-ant-admin01-",
	"sk-proj-",
	"sk-svcacct-",
	"sk-or-v1-",
	"github_pat_",
	"ghp_",
	"gho_",
	"ghu_",
	"ghs_",
	"ghr_",
	"glpat-",
	"xoxb-",
	"xoxp-",
	"xoxa-",
	"xoxr-",
	"xoxs-",
	"sk_live_",
	"rk_live_",
	"dop_v1_",
	"pypi-",
	"gsk_",
	"xai-",
	"npm_",
	"hf_",
	"AIza",
	"AKIA",
	"ASIA",
	"sk-"
];
function normalizeRuleKind(k) {
	return String(k || "").trim().toUpperCase().replace(/[ .-]/g, "_").replace(/[^A-Z0-9_]/g, "").replace(/^_+|_+$/g, "") || "CUSTOM";
}
const PLACEHOLDER_REGEX = /\{\{[A-Z][A-Z0-9_]*_[a-z2-7]{8}\}\}/g;
var PrivacyVault = class {
	secretKey;
	byPlaceholder = /* @__PURE__ */ new Map();
	knownValues = /* @__PURE__ */ new Map();
	sentBodies = /* @__PURE__ */ new Map();
	baseDir;
	constructor(baseDir = join(homedir(), ".dsh", "privacy-shield"), legacyKeyFallback = join(homedir(), ".config", "magpie", "redact.key")) {
		this.baseDir = baseDir;
		const keyPath = join(this.baseDir, "redact.key");
		if (existsSync(keyPath)) {
			const b = readFileSync(keyPath);
			if (b.length >= 32) {
				this.secretKey = b.subarray(0, 32);
				return;
			}
		}
		if (existsSync(legacyKeyFallback)) try {
			const mb = readFileSync(legacyKeyFallback);
			if (mb.length >= 32) {
				mkdirSync(this.baseDir, {
					recursive: true,
					mode: 448
				});
				this.secretKey = mb.subarray(0, 32);
				writeFileSync(keyPath, this.secretKey, { mode: 384 });
				return;
			}
		} catch {}
		mkdirSync(this.baseDir, {
			recursive: true,
			mode: 448
		});
		this.secretKey = randomBytes(32);
		writeFileSync(keyPath, this.secretKey, { mode: 384 });
	}
	/** Compute deterministic `{{KIND_xxxxxxxx}}` or shape-preserving key. */
	placeholderFor(kind, raw, keepShape = false, recordInVault = true) {
		if (keepShape && (kind === "API_KEY" || kind === "SECRET" || kind === "TOKEN")) {
			const shaped = this.shapeOf(kind, raw);
			if (shaped) {
				if (recordInVault) this.storeMapping(shaped, raw, kind);
				return shaped;
			}
		}
		const ph = `{{${kind}_${toBase32Lower8(createHmac("sha256", this.secretKey).update(`${kind}\0${raw}`).digest())}}}`;
		if (recordInVault) this.storeMapping(ph, raw, kind);
		return ph;
	}
	/** Shape-preserving key generator (`sk-proj-...` -> `sk-proj-...` with HMAC-derived chars). */
	shapeOf(kind, raw) {
		if (raw.length < 12 || raw.includes("\n") || raw.includes(" ")) return null;
		let headLen = 0;
		for (const h of KNOWN_KEY_HEADS) if (raw.startsWith(h)) {
			headLen = h.length;
			break;
		}
		if (headLen === 0) {
			const m = /^[A-Za-z0-9]{2,6}[_-]/.exec(raw);
			if (m) headLen = m[0].length;
			else headLen = Math.min(4, Math.floor(raw.length / 4));
		}
		const stream = Buffer.concat([
			createHmac("sha256", this.secretKey).update(`shape:0:${kind}\0${raw}`).digest(),
			createHmac("sha256", this.secretKey).update(`shape:1:${kind}\0${raw}`).digest(),
			createHmac("sha256", this.secretKey).update(`shape:2:${kind}\0${raw}`).digest()
		]);
		const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
		const lower = "abcdefghijklmnopqrstuvwxyz";
		const digits = "0123456789";
		let out = raw.slice(0, headLen);
		let si = 0;
		for (let i = headLen; i < raw.length; i++) {
			const ch = raw[i];
			const byte = stream[si++ % stream.length];
			if (ch >= "A" && ch <= "Z") out += upper[byte % 26];
			else if (ch >= "a" && ch <= "z") out += lower[byte % 26];
			else if (ch >= "0" && ch <= "9") out += digits[byte % 10];
			else out += ch;
		}
		return out === raw ? null : out;
	}
	storeMapping(ph, raw, kind) {
		if (this.byPlaceholder.size >= MAX_VAULT_ENTRIES && !this.byPlaceholder.has(ph)) {
			const oldest = this.byPlaceholder.keys().next().value;
			if (oldest) this.byPlaceholder.delete(oldest);
		}
		this.byPlaceholder.set(ph, raw);
		if (raw.length >= 12) this.knownValues.set(raw, {
			kind,
			ph
		});
	}
	/** Extract 1-4 character visible prefix hint (matching Magpie's `redact.Hint`). */
	hintOf(raw) {
		const runes = [...raw];
		if (runes.length === 0) return "";
		if (runes.length <= 4) return runes[0];
		for (const h of KNOWN_KEY_HEADS) if (raw.startsWith(h) && h.length <= 8) return h.slice(0, 4);
		return runes.slice(0, Math.min(4, Math.max(1, Math.floor(runes.length / 4)))).join("");
	}
	getValue(ph) {
		return this.byPlaceholder.get(ph) ?? null;
	}
	getValues(ps) {
		const out = {};
		for (const p of ps) {
			const v = this.byPlaceholder.get(p);
			if (v !== void 0) out[p] = v;
		}
		return out;
	}
	saveSentBody(key, body) {
		if (this.sentBodies.size >= MAX_SENT_BODIES && !this.sentBodies.has(key)) {
			const oldest = this.sentBodies.keys().next().value;
			if (oldest) this.sentBodies.delete(oldest);
		}
		this.sentBodies.set(key, body);
	}
	getSentBody(key) {
		return this.sentBodies.get(key) ?? null;
	}
	/** Mask a single text string according to active settings and collect hits. */
	maskText(text, settings, hits, snips, recordInVault = true) {
		if (!text) return text;
		const allowSet = new Set((settings.redactAllow ?? []).map((x) => x.trim().toLowerCase()).filter(Boolean));
		const isAllowed = (raw) => allowSet.has(raw.trim().toLowerCase());
		const actionFor = (kind) => settings.redactActions?.[kind] ?? "mask";
		const recordHit = (raw, kind, by, fullStr, matchIndex) => {
			if (!raw || isAllowed(raw) || /^\{\{[A-Z][A-Z0-9_]*_[a-z2-7]{8}\}\}$/.test(raw)) return raw;
			const act = actionFor(kind);
			const ph = this.placeholderFor(kind, raw, settings.redactShape, recordInVault && act === "mask");
			const existing = hits.get(ph);
			if (existing) existing.n += 1;
			else hits.set(ph, {
				p: ph,
				k: kind,
				b: by,
				...act !== "mask" ? { a: act } : {},
				h: this.hintOf(raw),
				l: [...raw].length,
				n: 1,
				raw
			});
			if (snips && !snips[ph]) {
				const start = Math.max(0, matchIndex - 48);
				const end = Math.min(fullStr.length, matchIndex + raw.length + 48);
				const prefix = start > 0 ? "…" : "";
				const suffix = end < fullStr.length ? "…" : "";
				snips[ph] = prefix + fullStr.slice(start, matchIndex) + (act === "warn" ? raw : ph) + fullStr.slice(matchIndex + raw.length, end) + suffix;
			}
			return act === "mask" ? ph : raw;
		};
		let out = text;
		if (settings.redactWords?.length) {
			const sortedWords = [...settings.redactWords].map((w) => w.trim()).filter((w) => w.length >= 2).sort((a, b) => b.length - a.length);
			for (const word of sortedWords) {
				const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
				const re = new RegExp(escaped, settings.redactWordsAnyCase ? "gi" : "g");
				out = out.replace(re, (m, offset) => recordHit(m, "TERM", "word", out, offset));
			}
		}
		if (settings.redact && settings.redactRules?.length) for (const r of settings.redactRules) {
			const kind = normalizeRuleKind(r.kind);
			try {
				const re = r.prefix ? new RegExp(r.prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "[A-Za-z0-9_\\-./+=]{4,}", "g") : r.regex ? new RegExp(r.regex, "g") : null;
				if (!re) continue;
				out = out.replace(re, (m, offset) => recordHit(m, kind, "yours", out, offset));
			} catch {}
		}
		for (const rule of BUILTIN_RULES) {
			if (rule.category === "secret" && !settings.redact) continue;
			if (rule.category === "personal") {
				if (!settings.redactPersonal) continue;
				if (rule.personalSubKind && settings.redactKinds?.[rule.personalSubKind] === false) continue;
			}
			if (rule.triggers && !rule.triggers.some((t) => out.includes(t))) continue;
			const re = new RegExp(rule.re.source, rule.re.flags);
			out = out.replace(re, (...args) => {
				const fullMatch = args[0];
				const offset = args[args.length - 2];
				const wholeStr = args[args.length - 1];
				if (rule.group !== void 0) {
					const captured = args[rule.group];
					if (!captured) return fullMatch;
					const capOffsetInMatch = fullMatch.lastIndexOf(captured);
					const absOffset = offset + (capOffsetInMatch >= 0 ? capOffsetInMatch : 0);
					if (rule.validate && !rule.validate(captured, wholeStr, absOffset)) return fullMatch;
					const rep = recordHit(captured, rule.kind, "rule", wholeStr, absOffset);
					if (rep === captured) return fullMatch;
					return fullMatch.slice(0, capOffsetInMatch) + rep + fullMatch.slice(capOffsetInMatch + captured.length);
				}
				if (rule.validate && !rule.validate(fullMatch, wholeStr, offset)) return fullMatch;
				return recordHit(fullMatch, rule.kind, "rule", wholeStr, offset);
			});
		}
		if (settings.redact && this.knownValues.size > 0) {
			for (const [raw, info] of this.knownValues) if (out.includes(raw)) {
				const idx = out.indexOf(raw);
				out = out.split(raw).join(recordHit(raw, info.kind, "known", out, idx));
			}
		}
		return out;
	}
	/** Preview masking on sample text without persisting to vault or disk. */
	preview(text, settings) {
		const startNs = process.hrtime.bigint();
		const hits = /* @__PURE__ */ new Map();
		const maskedText = this.maskText(text, settings, hits, void 0, false);
		const tookUs = Number((process.hrtime.bigint() - startNs) / 1000n);
		return {
			maskedText,
			values: [...hits.values()].map((v) => ({
				p: v.p,
				k: v.k,
				b: v.b,
				a: v.a ?? "mask",
				h: v.h,
				l: v.l,
				n: v.n,
				raw: v.raw ?? ""
			})),
			tookUs
		};
	}
	/** Restore all known placeholders and shape-preserved keys in `text`. */
	restoreText(text, backCounts) {
		if (!text) return text;
		let out = text;
		if (out.includes("{{")) out = out.replace(PLACEHOLDER_REGEX, (ph) => {
			const raw = this.byPlaceholder.get(ph);
			if (raw === void 0) return ph;
			if (backCounts) backCounts[ph] = (backCounts[ph] ?? 0) + 1;
			return raw;
		});
		for (const [ph, raw] of this.byPlaceholder) if (!ph.startsWith("{{") && out.includes(ph)) {
			const parts = out.split(ph);
			if (parts.length > 1) {
				if (backCounts) backCounts[ph] = (backCounts[ph] ?? 0) + (parts.length - 1);
				out = parts.join(raw);
			}
		}
		return out;
	}
	/** Split a streaming chunk into safe prefix and a partial `{{...` tail buffer. */
	splitPartialTail(text) {
		const lastOpen = text.lastIndexOf("{{");
		if (lastOpen === -1) {
			if (text.endsWith("{")) return {
				safe: text.slice(0, -1),
				tail: "{"
			};
			return {
				safe: text,
				tail: ""
			};
		}
		const suffix = text.slice(lastOpen);
		if (!suffix.includes("}}") && suffix.length <= 40) return {
			safe: text.slice(0, lastOpen),
			tail: suffix
		};
		return {
			safe: text,
			tail: ""
		};
	}
};
// src/runtime.ts
/**
* Shared singleton runtime for `dsh-privacy-shield` so both the main `llm/stream`
* entry (`src/index.ts`) and the management RPC entry (`src/web/plugin.ts`)
* share the exact same in-memory `PrivacyVault` and `PrivacyLedger`.
*/
let sharedRuntime;
function getPrivacyShieldRuntime() {
	if (!sharedRuntime) sharedRuntime = {
		vault: new PrivacyVault(),
		ledger: new PrivacyLedger()
	};
	return sharedRuntime;
}
export { getPrivacyShieldRuntime as t };
