/**
 * Shared RPC contract between the Privacy Shield (隐私护盾) host engine and the
 * browser Settings / Badge UI.
 */

export type MaskSourceBy = 'rule' | 'yours' | 'word' | 'model' | 'known'
export type MaskAction = 'mask' | 'warn' | 'block'

export interface CustomMaskRule {
  kind: string
  prefix?: string
  regex?: string
}

export interface PrivacyShieldSettings {
  /** Whether secret masking (API_KEY, PRIVATE_KEY, TOKEN, PASSWORD, SECRET) is enabled. */
  redact: boolean
  /** Keep a key's form (e.g. sk-proj-... stays sk-proj-...) instead of {{KIND_tag}}. */
  redactShape: boolean
  /** Whether personal & infrastructure data masking (EMAIL, PHONE, ID_CARD, IP, etc.) is enabled. */
  redactPersonal: boolean
  /** Fine-grained toggles for personal data sub-categories. */
  redactKinds: Record<string, boolean>
  /** User-defined custom words to mask as TERM. */
  redactWords: string[]
  /** Match custom words case-insensitively. */
  redactWordsAnyCase: boolean
  /** User-defined prefix or regex rules. */
  redactRules: CustomMaskRule[]
  /** Per-kind action override: 'mask' (default), 'warn', or 'block'. */
  redactActions: Record<string, MaskAction>
  /** Allow-list of literal values that are never masked. */
  redactAllow: string[]
  /** Whether to show the real-time Privacy Shield badge in the conversation header. */
  conversationBadge: boolean
  /** Whether to sync and merge historical masking archives. */
  importLegacyHistory: boolean
}

export interface MaskedValueItem {
  /** Placeholder or shape-preserved stand-in (e.g. "{{SECRET_oqsxkpdh}}"). */
  p: string
  /** Entity kind (e.g. "SECRET", "API_KEY", "EMAIL"). */
  k: string
  /** How it was found. */
  b: MaskSourceBy
  /** Action taken if not 'mask'. */
  a?: MaskAction
  /** Short visible prefix hint (1-4 chars). */
  h: string
  /** Original rune length. */
  l: number
  /** Occurrences in this request. */
  n: number
}

export interface MaskRecord {
  /** Unique monotonic key (nanosecond timestamp string or number). */
  key: string
  /** ISO-8601 timestamp. */
  t: string
  /** Route sequence number if available. */
  route?: number
  /** Request category ('chat', 'search', etc.). */
  what: string
  /** Source agent id (e.g. 'dsh'). */
  agent: string
  /** Session id if available. */
  session?: string
  /** Target provider id (e.g. 'codex', 'workbuddy-ai', 'deepseek'). */
  provider: string
  /** Target model id. */
  model: string
  /** Total places masked in this request. */
  n: number
  /** True if the request was held back by a 'block' rule. */
  blocked?: boolean
  /** Distinct values found in this request. */
  values: MaskedValueItem[]
  /** Count of times each placeholder was restored in the model's response. */
  back?: Record<string, number>
  /** Masked text snippets around each placeholder. */
  snips?: Record<string, string>
  /** Masking duration in microseconds (µs). */
  took?: number
}

export interface DaySummaryItem {
  /** YYYY-MM-DD */
  day: string
  /** Total places masked on this day. */
  n: number
  /** Total requests with masking on this day. */
  requests: number
}

export interface NamedCount {
  name: string
  n: number
}

export interface RankedValueSummary {
  p: string
  kind: string
  by: MaskSourceBy
  head: string
  len: number
  n: number
  requests: number
  last: string
}

export interface MaskSummary {
  days: DaySummaryItem[]
  kinds: NamedCount[]
  agents: NamedCount[]
  providers: NamedCount[]
  values: RankedValueSummary[]
  by: Record<string, number>
  /** Total places masked across the window. */
  n: number
  /** Distinct placeholders/values across the window. */
  distinct: number
  /** Total requests with masked values across the window. */
  requests: number
  /** Total requests held back across the window. */
  blocked: number
}

export interface PreviewMatchItem {
  p: string
  k: string
  b: MaskSourceBy
  a: MaskAction
  h: string
  l: number
  n: number
  raw: string
}

export interface PreviewResult {
  maskedText: string
  values: PreviewMatchItem[]
  tookUs: number
}

export interface ShieldRpcMap {
  'shield.summary': {
    req: { days?: 7 | 30 }
    res: { summary: MaskSummary; settings: PrivacyShieldSettings }
  }
  'shield.records': {
    req: {
      limit?: number
      before?: string
      kind?: string
      by?: string
      blocked?: boolean
      agent?: string
      provider?: string
    }
    res: { records: MaskRecord[]; more: boolean }
  }
  'shield.record': {
    req: { key: string }
    res: {
      record: MaskRecord | null
      sentBody: string | null
      values: Record<string, string>
    }
  }
  'shield.value': {
    req: { p: string }
    res: { value: string | null }
  }
  'shield.values': {
    req: { ps: string[] }
    res: { values: Record<string, string> }
  }
  'shield.clear': {
    req: Record<string, never>
    res: { ok: true }
  }
  'shield.settings.get': {
    req: Record<string, never>
    res: { settings: PrivacyShieldSettings }
  }
  'shield.settings.set': {
    req: { patch: Partial<PrivacyShieldSettings> }
    res: { settings: PrivacyShieldSettings }
  }
  'shield.preview': {
    req: { text: string }
    res: PreviewResult
  }
}

export type ShieldRpcMethod = keyof ShieldRpcMap
export type ShieldRpcReq<M extends ShieldRpcMethod> = ShieldRpcMap[M]['req']
export type ShieldRpcRes<M extends ShieldRpcMethod> = ShieldRpcMap[M]['res']

export interface ShieldRpcClient {
  call<M extends ShieldRpcMethod>(method: M, payload: ShieldRpcReq<M>): Promise<ShieldRpcRes<M>>
}
