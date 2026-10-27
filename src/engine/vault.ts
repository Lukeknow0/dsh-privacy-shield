/**
 * Privacy Shield Vault & Masking Engine:
 * - Manages the 32-byte local HMAC key (`redact.key`)
 * - Generates deterministic `{{KIND_xxxxxxxx}}` placeholders or shape-preserving fake keys
 * - Holds the in-memory `placeholder -> rawValue` mapping (never written to disk)
 * - Holds a bounded in-memory ring of recent masked request bodies (`sentBody`)
 * - Performs streaming cross-chunk unmasking (`splitPartialTail` + `restoreText`)
 */

import { createHmac, randomBytes } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import type {
  MaskAction,
  MaskedValueItem,
  MaskSourceBy,
  PreviewMatchItem,
  PreviewResult,
  PrivacyShieldSettings,
} from '../rpc-contract.ts'
import { BUILTIN_RULES } from './rules.ts'

const BASE32_ALPHABET = 'abcdefghijklmnopqrstuvwxyz234567'
const MAX_VAULT_ENTRIES = 10_000
const MAX_SENT_BODIES = 100

export function toBase32Lower8(buf: Buffer): string {
  let bits = 0
  let value = 0
  let out = ''
  for (let i = 0; i < buf.length && out.length < 8; i++) {
    value = (value << 8) | buf[i]
    bits += 8
    while (bits >= 5 && out.length < 8) {
      out += BASE32_ALPHABET[(value >>> (bits - 5)) & 31]
      bits -= 5
    }
  }
  return out
}

const KNOWN_KEY_HEADS = [
  'sk-ant-api03-',
  'sk-ant-oat01-',
  'sk-ant-admin01-',
  'sk-proj-',
  'sk-svcacct-',
  'sk-or-v1-',
  'github_pat_',
  'ghp_',
  'gho_',
  'ghu_',
  'ghs_',
  'ghr_',
  'glpat-',
  'xoxb-',
  'xoxp-',
  'xoxa-',
  'xoxr-',
  'xoxs-',
  'sk_live_',
  'rk_live_',
  'dop_v1_',
  'pypi-',
  'gsk_',
  'xai-',
  'npm_',
  'hf_',
  'AIza',
  'AKIA',
  'ASIA',
  'sk-',
]

export function normalizeRuleKind(k: string): string {
  const clean = String(k || '')
    .trim()
    .toUpperCase()
    .replace(/[ .-]/g, '_')
    .replace(/[^A-Z0-9_]/g, '')
    .replace(/^_+|_+$/g, '')
  return clean || 'CUSTOM'
}

export const PLACEHOLDER_REGEX = /\{\{[A-Z][A-Z0-9_]*_[a-z2-7]{8}\}\}/g

export class PrivacyVault {
  private readonly secretKey: Buffer
  private readonly byPlaceholder = new Map<string, string>()
  private readonly knownValues = new Map<string, { kind: string; ph: string }>()
  private readonly sentBodies = new Map<string, string>()

  public readonly baseDir: string

  constructor(
    baseDir: string = join(homedir(), '.dsh', 'privacy-shield'),
    legacyKeyFallback: string = join(homedir(), '.config', 'magpie', 'redact.key'),
  ) {
    this.baseDir = baseDir
    const keyPath = join(this.baseDir, 'redact.key')
    if (existsSync(keyPath)) {
      const b = readFileSync(keyPath)
      if (b.length >= 32) {
        this.secretKey = b.subarray(0, 32)
        return
      }
    }
    // Reuse local master key if present so placeholders remain consistent across sessions
    if (existsSync(legacyKeyFallback)) {
      try {
        const mb = readFileSync(legacyKeyFallback)
        if (mb.length >= 32) {
          mkdirSync(this.baseDir, { recursive: true, mode: 0o700 })
          this.secretKey = mb.subarray(0, 32)
          writeFileSync(keyPath, this.secretKey, { mode: 0o600 })
          return
        }
      } catch {}
    }
    mkdirSync(this.baseDir, { recursive: true, mode: 0o700 })
    this.secretKey = randomBytes(32)
    writeFileSync(keyPath, this.secretKey, { mode: 0o600 })
  }

  /** Compute deterministic `{{KIND_xxxxxxxx}}` or shape-preserving key. */
  placeholderFor(kind: string, raw: string, keepShape = false, recordInVault = true): string {
    if (keepShape && (kind === 'API_KEY' || kind === 'SECRET' || kind === 'TOKEN')) {
      const shaped = this.shapeOf(kind, raw)
      if (shaped) {
        if (recordInVault) this.storeMapping(shaped, raw, kind)
        return shaped
      }
    }
    const digest = createHmac('sha256', this.secretKey).update(`${kind}\0${raw}`).digest()
    const tag = toBase32Lower8(digest)
    const ph = `{{${kind}_${tag}}}`
    if (recordInVault) this.storeMapping(ph, raw, kind)
    return ph
  }

  /** Shape-preserving key generator (`sk-proj-...` -> `sk-proj-...` with HMAC-derived chars). */
  private shapeOf(kind: string, raw: string): string | null {
    if (raw.length < 12 || raw.includes('\n') || raw.includes(' ')) return null
    let headLen = 0
    for (const h of KNOWN_KEY_HEADS) {
      if (raw.startsWith(h)) {
        headLen = h.length
        break
      }
    }
    if (headLen === 0) {
      const m = /^[A-Za-z0-9]{2,6}[_-]/.exec(raw)
      if (m) headLen = m[0].length
      else headLen = Math.min(4, Math.floor(raw.length / 4))
    }
    const stream = Buffer.concat([
      createHmac('sha256', this.secretKey).update(`shape:0:${kind}\0${raw}`).digest(),
      createHmac('sha256', this.secretKey).update(`shape:1:${kind}\0${raw}`).digest(),
      createHmac('sha256', this.secretKey).update(`shape:2:${kind}\0${raw}`).digest(),
    ])
    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const lower = 'abcdefghijklmnopqrstuvwxyz'
    const digits = '0123456789'
    let out = raw.slice(0, headLen)
    let si = 0
    for (let i = headLen; i < raw.length; i++) {
      const ch = raw[i]
      const byte = stream[si++ % stream.length]
      if (ch >= 'A' && ch <= 'Z') out += upper[byte % 26]
      else if (ch >= 'a' && ch <= 'z') out += lower[byte % 26]
      else if (ch >= '0' && ch <= '9') out += digits[byte % 10]
      else out += ch
    }
    return out === raw ? null : out
  }

  private storeMapping(ph: string, raw: string, kind: string): void {
    if (this.byPlaceholder.size >= MAX_VAULT_ENTRIES && !this.byPlaceholder.has(ph)) {
      const oldest = this.byPlaceholder.keys().next().value
      if (oldest) this.byPlaceholder.delete(oldest)
    }
    this.byPlaceholder.set(ph, raw)
    if (raw.length >= 12) {
      this.knownValues.set(raw, { kind, ph })
    }
  }

  /** Extract 1-4 character visible prefix hint (matching Magpie's `redact.Hint`). */
  hintOf(raw: string): string {
    const runes = [...raw]
    if (runes.length === 0) return ''
    if (runes.length <= 4) return runes[0]
    for (const h of KNOWN_KEY_HEADS) {
      if (raw.startsWith(h) && h.length <= 8) return h.slice(0, 4)
    }
    return runes.slice(0, Math.min(4, Math.max(1, Math.floor(runes.length / 4)))).join('')
  }

  getValue(ph: string): string | null {
    return this.byPlaceholder.get(ph) ?? null
  }

  getValues(ps: string[]): Record<string, string> {
    const out: Record<string, string> = {}
    for (const p of ps) {
      const v = this.byPlaceholder.get(p)
      if (v !== undefined) out[p] = v
    }
    return out
  }

  saveSentBody(key: string, body: string): void {
    if (this.sentBodies.size >= MAX_SENT_BODIES && !this.sentBodies.has(key)) {
      const oldest = this.sentBodies.keys().next().value
      if (oldest) this.sentBodies.delete(oldest)
    }
    this.sentBodies.set(key, body)
  }

  getSentBody(key: string): string | null {
    return this.sentBodies.get(key) ?? null
  }

  /** Mask a single text string according to active settings and collect hits. */
  maskText(
    text: string,
    settings: PrivacyShieldSettings,
    hits: Map<string, MaskedValueItem & { raw?: string }>,
    snips?: Record<string, string>,
    recordInVault = true,
  ): string {
    if (!text) return text
    const allowSet = new Set((settings.redactAllow ?? []).map((x) => x.trim().toLowerCase()).filter(Boolean))
    const isAllowed = (raw: string): boolean => allowSet.has(raw.trim().toLowerCase())
    const actionFor = (kind: string): MaskAction => settings.redactActions?.[kind] ?? 'mask'

    const recordHit = (
      raw: string,
      kind: string,
      by: MaskSourceBy,
      fullStr: string,
      matchIndex: number,
    ): string => {
      if (!raw || isAllowed(raw) || /^\{\{[A-Z][A-Z0-9_]*_[a-z2-7]{8}\}\}$/.test(raw)) return raw
      const act = actionFor(kind)
      const ph = this.placeholderFor(kind, raw, settings.redactShape, recordInVault && act === 'mask')
      const existing = hits.get(ph)
      if (existing) {
        existing.n += 1
      } else {
        hits.set(ph, {
          p: ph,
          k: kind,
          b: by,
          ...(act !== 'mask' ? { a: act } : {}),
          h: this.hintOf(raw),
          l: [...raw].length,
          n: 1,
          raw,
        })
      }
      if (snips && !snips[ph]) {
        const start = Math.max(0, matchIndex - 48)
        const end = Math.min(fullStr.length, matchIndex + raw.length + 48)
        const prefix = start > 0 ? '…' : ''
        const suffix = end < fullStr.length ? '…' : ''
        snips[ph] = prefix + fullStr.slice(start, matchIndex) + (act === 'warn' ? raw : ph) + fullStr.slice(matchIndex + raw.length, end) + suffix
      }
      return act === 'mask' ? ph : raw
    }

    let out = text

    // 1. User-defined custom words (TERM)
    if (settings.redactWords?.length) {
      const sortedWords = [...settings.redactWords].map((w) => w.trim()).filter((w) => w.length >= 2).sort((a, b) => b.length - a.length)
      for (const word of sortedWords) {
        const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        const re = new RegExp(escaped, settings.redactWordsAnyCase ? 'gi' : 'g')
        out = out.replace(re, (m, offset) => recordHit(m, 'TERM', 'word', out, offset))
      }
    }

    // 2. User-defined custom prefix / regex rules
    if (settings.redact && settings.redactRules?.length) {
      for (const r of settings.redactRules) {
        const kind = normalizeRuleKind(r.kind)
        try {
          const re = r.prefix
            ? new RegExp(r.prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[A-Za-z0-9_\\-./+=]{4,}', 'g')
            : r.regex
              ? new RegExp(r.regex, 'g')
              : null
          if (!re) continue
          out = out.replace(re, (m, offset) => recordHit(m, kind, 'yours', out, offset))
        } catch {}
      }
    }

    // 3. Built-in Secret & Personal rules
    for (const rule of BUILTIN_RULES) {
      if (rule.category === 'secret' && !settings.redact) continue
      if (rule.category === 'personal') {
        if (!settings.redactPersonal) continue
        if (rule.personalSubKind && settings.redactKinds?.[rule.personalSubKind] === false) continue
      }
      if (rule.triggers && !rule.triggers.some((t) => out.includes(t))) continue

      const re = new RegExp(rule.re.source, rule.re.flags)
      out = out.replace(re, (...args) => {
        const fullMatch = args[0] as string
        const offset = args[args.length - 2] as number
        const wholeStr = args[args.length - 1] as string
        if (rule.group !== undefined) {
          const captured = args[rule.group] as string | undefined
          if (!captured) return fullMatch
          const capOffsetInMatch = fullMatch.lastIndexOf(captured)
          const absOffset = offset + (capOffsetInMatch >= 0 ? capOffsetInMatch : 0)
          if (rule.validate && !rule.validate(captured, wholeStr, absOffset)) return fullMatch
          const rep = recordHit(captured, rule.kind, 'rule', wholeStr, absOffset)
          if (rep === captured) return fullMatch
          return fullMatch.slice(0, capOffsetInMatch) + rep + fullMatch.slice(capOffsetInMatch + captured.length)
        }
        if (rule.validate && !rule.validate(fullMatch, wholeStr, offset)) return fullMatch
        return recordHit(fullMatch, rule.kind, 'rule', wholeStr, offset)
      })
    }

    // 4. Previously seen high-entropy secrets (`known`)
    if (settings.redact && this.knownValues.size > 0) {
      for (const [raw, info] of this.knownValues) {
        if (out.includes(raw)) {
          const idx = out.indexOf(raw)
          out = out.split(raw).join(recordHit(raw, info.kind, 'known', out, idx))
        }
      }
    }

    return out
  }

  /** Preview masking on sample text without persisting to vault or disk. */
  preview(text: string, settings: PrivacyShieldSettings): PreviewResult {
    const startNs = process.hrtime.bigint()
    const hits = new Map<string, MaskedValueItem & { raw?: string }>()
    const maskedText = this.maskText(text, settings, hits, undefined, false)
    const tookUs = Number((process.hrtime.bigint() - startNs) / 1000n)
    const values: PreviewMatchItem[] = [...hits.values()].map((v) => ({
      p: v.p,
      k: v.k,
      b: v.b,
      a: v.a ?? 'mask',
      h: v.h,
      l: v.l,
      n: v.n,
      raw: v.raw ?? '',
    }))
    return { maskedText, values, tookUs }
  }

  /** Restore all known placeholders and shape-preserved keys in `text`. */
  restoreText(text: string, backCounts?: Record<string, number>): string {
    if (!text) return text
    let out = text
    if (out.includes('{{')) {
      out = out.replace(PLACEHOLDER_REGEX, (ph) => {
        const raw = this.byPlaceholder.get(ph)
        if (raw === undefined) return ph
        if (backCounts) backCounts[ph] = (backCounts[ph] ?? 0) + 1
        return raw
      })
    }
    // Also restore any shape-preserved keys if present
    for (const [ph, raw] of this.byPlaceholder) {
      if (!ph.startsWith('{{') && out.includes(ph)) {
        const parts = out.split(ph)
        if (parts.length > 1) {
          if (backCounts) backCounts[ph] = (backCounts[ph] ?? 0) + (parts.length - 1)
          out = parts.join(raw)
        }
      }
    }
    return out
  }

  /** Split a streaming chunk into safe prefix and a partial `{{...` tail buffer. */
  splitPartialTail(text: string): { safe: string; tail: string } {
    const lastOpen = text.lastIndexOf('{{')
    if (lastOpen === -1) {
      if (text.endsWith('{')) {
        return { safe: text.slice(0, -1), tail: '{' }
      }
      return { safe: text, tail: '' }
    }
    const suffix = text.slice(lastOpen)
    // If the suffix has no closing '}}', or only a partial '}' at the end
    if (!suffix.includes('}}') && suffix.length <= 40) {
      return { safe: text.slice(0, lastOpen), tail: suffix }
    }
    return { safe: text, tail: '' }
  }
}
