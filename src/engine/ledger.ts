/**
 * Privacy Shield Ledger & Settings Store:
 * - Persists settings in `~/.dsh/privacy-shield/settings.json`
 * - Appends masking records to `~/.dsh/privacy-shield/masking/YYYY-MM-DD.jsonl`
 * - Optionally merges read-only records from `~/.config/magpie/masking/*.jsonl`
 *   so existing historical masking metrics and charts render immediately
 * - Computes 7-day / 30-day `MaskSummary` (days strip, agent/provider flow,
 *   facets, and ranked values)
 */

import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import type {
  DaySummaryItem,
  MaskRecord,
  MaskSummary,
  PrivacyShieldSettings,
  RankedValueSummary,
} from '../rpc-contract.ts'

export const DEFAULT_SETTINGS: PrivacyShieldSettings = {
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
    bucket: true,
  },
  redactWords: [],
  redactWordsAnyCase: false,
  redactRules: [],
  redactActions: {},
  redactAllow: [],
  conversationBadge: true,
  importLegacyHistory: true,
}

function formatDayLocal(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export class PrivacyLedger {
  public readonly baseDir: string
  private readonly settingsPath: string
  private readonly maskingDir: string
  private readonly legacyArchiveDir: string
  private cachedSettings: PrivacyShieldSettings | null = null

  constructor(
    baseDir: string = join(homedir(), '.dsh', 'privacy-shield'),
    legacyArchiveDir: string = join(homedir(), '.config', 'magpie', 'masking'),
  ) {
    this.baseDir = baseDir
    this.settingsPath = join(this.baseDir, 'settings.json')
    this.maskingDir = join(this.baseDir, 'masking')
    this.legacyArchiveDir = legacyArchiveDir
  }

  getSettings(): PrivacyShieldSettings {
    if (this.cachedSettings) return this.cachedSettings
    try {
      if (existsSync(this.settingsPath)) {
        const raw = JSON.parse(readFileSync(this.settingsPath, 'utf8')) as Partial<PrivacyShieldSettings>
        this.cachedSettings = {
          ...DEFAULT_SETTINGS,
          ...raw,
          redactKinds: { ...DEFAULT_SETTINGS.redactKinds, ...(raw.redactKinds ?? {}) },
          redactActions: { ...(raw.redactActions ?? {}) },
        }
        return this.cachedSettings
      }
    } catch {}
    this.cachedSettings = { ...DEFAULT_SETTINGS }
    return this.cachedSettings
  }

  updateSettings(patch: Partial<PrivacyShieldSettings>): PrivacyShieldSettings {
    const current = this.getSettings()
    const next: PrivacyShieldSettings = {
      ...current,
      ...patch,
      redactKinds: patch.redactKinds ? { ...current.redactKinds, ...patch.redactKinds } : current.redactKinds,
      redactActions: patch.redactActions !== undefined ? { ...patch.redactActions } : current.redactActions,
    }
    this.cachedSettings = next
    mkdirSync(this.baseDir, { recursive: true, mode: 0o700 })
    writeFileSync(this.settingsPath, JSON.stringify(next, null, 2), { mode: 0o600 })
    return next
  }

  appendRecord(record: MaskRecord): void {
    const day = record.t.slice(0, 10)
    mkdirSync(this.maskingDir, { recursive: true, mode: 0o700 })
    const file = join(this.maskingDir, `${day}.jsonl`)
    appendFileSync(file, JSON.stringify(record) + '\n', { mode: 0o600 })
  }

  clearOwnRecords(): void {
    try {
      if (existsSync(this.maskingDir)) {
        for (const name of readdirSync(this.maskingDir)) {
          if (name.endsWith('.jsonl')) {
            rmSync(join(this.maskingDir, name), { force: true })
          }
        }
      }
    } catch {}
  }

  private readDirRecords(dir: string, allowedDays?: Set<string>): MaskRecord[] {
    if (!existsSync(dir)) return []
    let files: string[] = []
    try {
      files = readdirSync(dir)
        .filter((f) => /^\d{4}-\d{2}-\d{2}\.jsonl$/.test(f))
        .sort()
        .reverse()
    } catch {
      return []
    }
    const out: MaskRecord[] = []
    for (const f of files) {
      const day = f.slice(0, 10)
      if (allowedDays && !allowedDays.has(day)) continue
      try {
        const content = readFileSync(join(dir, f), 'utf8')
        const lines = content.split('\n')
        for (let i = lines.length - 1; i >= 0; i--) {
          const line = lines[i].trim()
          if (!line) continue
          try {
            const parsed = JSON.parse(line) as Record<string, unknown>
            if (parsed && parsed.key != null && Array.isArray(parsed.values)) {
              out.push({
                key: String(parsed.key),
                t: String(parsed.t || ''),
                ...(typeof parsed.route === 'number' ? { route: parsed.route } : {}),
                what: String(parsed.what || 'chat'),
                agent: String(parsed.agent || 'dsh'),
                ...(typeof parsed.session === 'string' ? { session: parsed.session } : {}),
                provider: String(parsed.provider || ''),
                model: String(parsed.model || ''),
                n: Number(parsed.n || 0),
                ...(parsed.blocked ? { blocked: true } : {}),
                values: parsed.values as MaskRecord['values'],
                ...(parsed.back && typeof parsed.back === 'object' ? { back: parsed.back as Record<string, number> } : {}),
                ...(parsed.snips && typeof parsed.snips === 'object' ? { snips: parsed.snips as Record<string, string> } : {}),
                ...(typeof parsed.took === 'number' ? { took: parsed.took } : {}),
              })
            }
          } catch {}
        }
      } catch {}
    }
    return out
  }

  /** Load all records (newest first), optionally including Magpie's local masking logs. */
  loadAllRecords(daysWindow?: number): MaskRecord[] {
    let allowedDays: Set<string> | undefined
    if (daysWindow && daysWindow > 0) {
      allowedDays = new Set<string>()
      const now = new Date()
      for (let i = 0; i < daysWindow; i++) {
        const d = new Date(now.getTime() - i * 86_400_000)
        allowedDays.add(formatDayLocal(d))
      }
    }

    const own = this.readDirRecords(this.maskingDir, allowedDays)
    const settings = this.getSettings()
    const legacy = settings.importLegacyHistory ? this.readDirRecords(this.legacyArchiveDir, allowedDays) : []

    const byKey = new Map<string, MaskRecord>()
    for (const r of [...own, ...legacy]) {
      if (!byKey.has(r.key)) byKey.set(r.key, r)
    }

    return [...byKey.values()].sort((a, b) => {
      try {
        const ka = BigInt(a.key)
        const kb = BigInt(b.key)
        return kb > ka ? 1 : kb < ka ? -1 : 0
      } catch {
        return b.t.localeCompare(a.t)
      }
    })
  }

  /** Compute the 7-day or 30-day summary for the Privacy Shield dashboard. */
  getSummary(daysCount: 7 | 30 = 7): MaskSummary {
    const now = new Date()
    const dayKeys: string[] = []
    const dayMap = new Map<string, DaySummaryItem>()
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86_400_000)
      const k = formatDayLocal(d)
      dayKeys.push(k)
      dayMap.set(k, { day: k, n: 0, requests: 0 })
    }

    const records = this.loadAllRecords(daysCount)
    const kindCounts = new Map<string, number>()
    const agentCounts = new Map<string, number>()
    const providerCounts = new Map<string, number>()
    const byCounts: Record<string, number> = {}
    const valueAgg = new Map<string, RankedValueSummary>()

    let totalMasked = 0
    let totalRequests = 0
    let totalBlocked = 0

    for (const r of records) {
      const dayStr = r.t.slice(0, 10)
      const dayItem = dayMap.get(dayStr)
      if (!dayItem) continue

      totalRequests += 1
      dayItem.requests += 1
      if (r.blocked) {
        totalBlocked += 1
      }

      const reqPlaces = r.n || r.values.reduce((acc, v) => acc + (v.n || 1), 0)
      totalMasked += reqPlaces
      dayItem.n += reqPlaces

      if (r.agent) {
        agentCounts.set(r.agent, (agentCounts.get(r.agent) ?? 0) + reqPlaces)
      }
      if (r.provider) {
        providerCounts.set(r.provider, (providerCounts.get(r.provider) ?? 0) + reqPlaces)
      }

      for (const v of r.values || []) {
        const vn = v.n || 1
        kindCounts.set(v.k, (kindCounts.get(v.k) ?? 0) + vn)
        byCounts[v.b] = (byCounts[v.b] ?? 0) + vn

        const existing = valueAgg.get(v.p)
        if (existing) {
          existing.n += vn
          existing.requests += 1
          if (r.t > existing.last) existing.last = r.t
        } else {
          valueAgg.set(v.p, {
            p: v.p,
            kind: v.k,
            by: v.b,
            head: v.h || '',
            len: v.l || 0,
            n: vn,
            requests: 1,
            last: r.t,
          })
        }
      }
    }

    const toSortedNamed = (m: Map<string, number>) =>
      [...m.entries()].map(([name, n]) => ({ name, n })).sort((a, b) => b.n - a.n)

    const rankedValues = [...valueAgg.values()].sort((a, b) => b.n - a.n).slice(0, 100)

    return {
      days: dayKeys.map((k) => dayMap.get(k)!),
      kinds: toSortedNamed(kindCounts),
      agents: toSortedNamed(agentCounts),
      providers: toSortedNamed(providerCounts),
      values: rankedValues,
      by: byCounts,
      n: totalMasked,
      distinct: valueAgg.size,
      requests: totalRequests,
      blocked: totalBlocked,
    }
  }

  /** Filter and paginate records for `shield.records`. */
  queryRecords(filter: {
    limit?: number
    before?: string
    kind?: string
    by?: string
    blocked?: boolean
    agent?: string
    provider?: string
  }): { records: MaskRecord[]; more: boolean } {
    const limit = Math.max(1, Math.min(filter.limit ?? 40, 200))
    const kindSet = filter.kind
      ? new Set(
          filter.kind
            .split(',')
            .map((k) => k.trim())
            .filter(Boolean),
        )
      : null

    const all = this.loadAllRecords(30)
    const matched: MaskRecord[] = []

    for (const r of all) {
      if (filter.before) {
        try {
          if (BigInt(r.key) >= BigInt(filter.before)) continue
        } catch {
          if (r.key >= filter.before) continue
        }
      }
      if (filter.blocked && !r.blocked) continue
      if (filter.agent && r.agent !== filter.agent) continue
      if (filter.provider && r.provider !== filter.provider) continue
      if (kindSet && !r.values.some((v) => kindSet.has(v.k))) continue
      if (filter.by && !r.values.some((v) => v.b === filter.by)) continue

      matched.push(r)
      if (matched.length > limit) break
    }

    return {
      records: matched.slice(0, limit),
      more: matched.length > limit,
    }
  }

  getRecord(key: string): MaskRecord | null {
    const all = this.loadAllRecords(30)
    return all.find((r) => r.key === String(key)) ?? null
  }
}
