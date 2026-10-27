/**
 * Privacy Shield Dashboard Component (极简原生风复刻版).
 * Renders the top overview card (big counter, 7/30d bars, SVG flow lines),
 * filter toolbar, requests / values list, and single-request diff drawer.
 */

import { useCallback, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { ShieldIcon, h } from './element.ts'
import { BY_LABELS_ZH, KIND_LABELS_ZH, type ShieldLocaleKey } from './locales.ts'
import type {
  DaySummaryItem,
  MaskRecord,
  MaskSummary,
  PrivacyShieldSettings,
  RankedValueSummary,
  ShieldRpcClient,
} from '../rpc-contract.ts'

interface DashboardProps {
  rpc: ShieldRpcClient
  t: (k: ShieldLocaleKey) => string
  lang?: string
}

export function ShieldDashboard({ rpc, t }: DashboardProps): ReactNode {
  const [days, setDays] = useState<7 | 30>(7)
  const [summary, setSummary] = useState<MaskSummary | null>(null)
  const [settings, setSettings] = useState<PrivacyShieldSettings | null>(null)
  const [mode, setMode] = useState<'req' | 'val'>('req')
  const [facet, setFacet] = useState<string>('')
  const [records, setRecords] = useState<MaskRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [activeRecordKey, setActiveRecordKey] = useState<string | null>(null)
  const [detailRecord, setDetailRecord] = useState<MaskRecord | null>(null)
  const [detailSent, setDetailSent] = useState<string | null>(null)
  const [detailValues, setDetailValues] = useState<Record<string, string>>({})

  const fetchSummary = useCallback(() => {
    void rpc.call('shield.summary', { days }).then((res) => {
      setSummary(res.summary)
      setSettings(res.settings)
    }).catch(() => {})
  }, [rpc, days])

  const fetchRecords = useCallback(() => {
    setLoading(true)
    void rpc.call('shield.records', { limit: 50, by: facet || undefined }).then((res) => {
      setRecords(res.records)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [rpc, facet])

  useEffect(() => {
    fetchSummary()
    fetchRecords()
    const timer = setInterval(() => {
      fetchSummary()
      fetchRecords()
    }, 15_000)
    return () => clearInterval(timer)
  }, [fetchSummary, fetchRecords])

  const openDetail = (key: string) => {
    setActiveRecordKey(key)
    void rpc.call('shield.record', { key }).then((res) => {
      setDetailRecord(res.record)
      setDetailSent(res.sentBody)
      setDetailValues(res.values)
    }).catch(() => {})
  }

  // --- 1. Detail Drawer View ---
  if (activeRecordKey && detailRecord) {
    const origParts: ReactNode[] = []
    const vendParts: ReactNode[] = []
    const rawBody = detailSent || JSON.stringify(detailRecord.snips || {}, null, 2)
    const phRegex = /\{\{[A-Z][A-Z0-9_]*_[a-z2-7]{8}\}\}/g

    let lastIdx = 0
    let match: RegExpExecArray | null
    while ((match = phRegex.exec(rawBody)) !== null) {
      const ph = match[0]
      const raw = detailValues[ph] || ph
      const textBefore = rawBody.slice(lastIdx, match.index)
      origParts.push(textBefore)
      vendParts.push(textBefore)

      origParts.push(h('mark', { className: 'dsh-shield-mark-orig', title: ph }, raw))
      vendParts.push(h('mark', { className: 'dsh-shield-mark-ph', title: raw }, ph))
      lastIdx = match.index + ph.length
    }
    origParts.push(rawBody.slice(lastIdx))
    vendParts.push(rawBody.slice(lastIdx))

    return h('div', { className: 'dsh-shield-detail' },
      h('div', { style: { display: 'flex', alignItems: 'center', gap: '8px' } },
        h('button', {
          className: 'dsh-shield-seg-btn',
          style: { cursor: 'pointer', padding: '4px 10px' },
          onClick: () => setActiveRecordKey(null),
        }, `← ${t('backToShield')}`),
        h('span', { style: { fontSize: '13px', color: 'var(--dsw-alias-label-tertiary, #8f959e)' } },
          `${detailRecord.t.slice(0, 10)} ${detailRecord.t.slice(11, 19)} · ${detailRecord.provider} (${detailRecord.model})`),
      ),
      h('div', { className: 'dsh-shield-steps' },
        h('div', { className: 'dsh-shield-step-item' },
          h('span', { className: 'step-num' }, '1'),
          h('span', { className: 'step-title' }, t('step1')),
          h('span', { className: 'step-desc' }, detailRecord.agent || 'dsh'),
        ),
        h('div', { className: 'dsh-shield-step-item' },
          h('span', { className: 'step-num' }, '2'),
          h('span', { className: 'step-title' }, t('step2')),
          h('span', { className: 'step-desc' }, `${detailRecord.values.length} 项敏感值 (${detailRecord.took ? `${(detailRecord.took / 1000).toFixed(1)}ms` : '<1ms'})`),
        ),
        h('div', { className: 'dsh-shield-step-item' },
          h('span', { className: 'step-num' }, '3'),
          h('span', { className: 'step-title' }, t('step3')),
          h('span', { className: 'step-desc' }, `${detailRecord.n} 处换为替身`),
        ),
        h('div', { className: 'dsh-shield-step-item' },
          h('span', { className: 'step-num', style: detailRecord.blocked ? { background: '#ef4444' } : undefined }, '4'),
          h('span', { className: 'step-title' }, detailRecord.blocked ? t('step4Blocked') : t('step4')),
          h('span', { className: 'step-desc' }, detailRecord.blocked ? '触发阻断规则未离机' : detailRecord.provider),
        ),
        h('div', { className: 'dsh-shield-step-item' },
          h('span', { className: 'step-num' }, '5'),
          h('span', { className: 'step-title' }, t('step5')),
          h('span', { className: 'step-desc' }, detailRecord.blocked ? '未发送' : `${Object.keys(detailRecord.back || {}).length} 处流式还原`),
        ),
      ),
      h('div', { className: 'dsh-shield-diff-grid' },
        h('div', { className: 'dsh-shield-diff-col' },
          h('div', { className: 'dsh-shield-diff-col-head' }, `${t('viewOrig')} (本机内存)`),
          h('div', { className: 'dsh-shield-diff-body' }, ...origParts),
        ),
        h('div', { className: 'dsh-shield-diff-col' },
          h('div', { className: 'dsh-shield-diff-col-head' }, `${t('viewVendor')} (模型视角)`),
          h('div', { className: 'dsh-shield-diff-body' }, ...vendParts),
        ),
      ),
    )
  }

  // --- 2. Top Card Metrics & Bar Chart ---
  const maxDayN = Math.max(1, ...(summary?.days?.map((d: DaySummaryItem) => d.n) ?? [1]))

  const renderTopCard = () => {
    return h('div', { className: 'dsh-shield-card' },
      h('div', { className: 'dsh-shield-card-head' },
        h('div', { className: 'dsh-shield-card-title' },
          h('h3', null, t('cardTitle')),
          h('p', null, settings?.redact ? t('cardSubOn') : t('cardSubOff')),
        ),
        h('div', { className: 'dsh-shield-seg' },
          h('button', {
            className: 'dsh-shield-seg-btn',
            'data-active': days === 7,
            onClick: () => setDays(7),
          }, t('days7')),
          h('button', {
            className: 'dsh-shield-seg-btn',
            'data-active': days === 30,
            onClick: () => setDays(30),
          }, t('days30')),
        ),
      ),
      h('div', { className: 'dsh-shield-band' },
        h('div', null,
          h('div', { className: 'dsh-shield-big-num' }, (summary?.n ?? 0).toLocaleString()),
          h('div', { className: 'dsh-shield-unit' }, t('unitMasked')),
          h('div', { className: 'dsh-shield-stats' },
            h('span', null, h('b', null, String(summary?.distinct ?? 0)), t('statDistinct')),
            h('span', null, h('b', null, String(summary?.requests ?? 0)), t('statRequests')),
            (summary?.blocked ?? 0) > 0
              ? h('span', { style: { color: '#ef4444' } }, h('b', null, String(summary?.blocked ?? 0)), t('statBlocked'))
              : null,
          ),
          h('div', { className: 'dsh-shield-days' },
            h('div', { className: 'dsh-shield-bars' },
              ...(summary?.days ?? []).map((d: DaySummaryItem, idx: number, arr: DaySummaryItem[]) =>
                h('div', {
                  key: d.day,
                  className: `dsh-shield-day-bar ${idx === arr.length - 1 ? 'today' : ''}`,
                  title: `${d.day} · ${d.n} 处已隐匿 · ${d.requests} 请求`,
                },
                  h('div', {
                    className: 'dsh-shield-day-bar-fill',
                    style: { height: `${Math.max(6, Math.round((d.n / maxDayN) * 100))}%` },
                  }),
                ),
              ),
            ),
            h('div', { className: 'dsh-shield-axis' },
              h('span', null, summary?.days?.[0]?.day.slice(5) || ''),
              h('span', null, t('today')),
            ),
          ),
        ),
        // Simple Flow Visualization
        h('div', { className: 'dsh-shield-flow' },
          h('div', { className: 'dsh-shield-flow-grid' },
            h('div', { style: { display: 'flex', flexDirection: 'column', gap: '6px' } },
              h('div', { className: 'dsh-shield-flow-node' },
                h('span', { className: 'dot' }),
                h('span', { className: 'name' }, 'DeepSeek Harness'),
                h('span', { className: 'count' }, String(summary?.n ?? 0)),
              ),
            ),
            h('div', { className: 'dsh-shield-flow-center' },
              h('svg', {
                viewBox: '0 0 100 40',
                style: { width: '100%', height: '100%', stroke: '#4176e6', strokeWidth: '0.8', fill: 'none' },
              },
                h('path', { d: 'M 0 20 C 35 20, 35 20, 50 20 C 65 20, 65 20, 100 20', strokeDasharray: '2,2' }),
              ),
              h('div', { className: 'dsh-shield-flow-hub' }, h(ShieldIcon, { size: 15 })),
            ),
            h('div', { style: { display: 'flex', flexDirection: 'column', gap: '6px' } },
              ...(summary?.providers?.slice(0, 3) ?? [{ name: 'Cloud Models', n: summary?.n ?? 0 }]).map((p) =>
                h('div', { key: p.name, className: 'dsh-shield-flow-node' },
                  h('span', { className: 'dot', style: { background: '#10b981' } }),
                  h('span', { className: 'name' }, p.name),
                  h('span', { className: 'count' }, String(p.n)),
                ),
              ),
            ),
          ),
          h('div', { style: { textAlign: 'center', fontSize: '11px', color: 'var(--dsw-alias-label-tertiary, #8f959e)', marginTop: '8px' } },
            t('flowCaption'),
          ),
        ),
      ),
    )
  }

  return h('div', { className: 'dsh-shield-root' },
    renderTopCard(),
    // Toolbar & Filter Pills
    h('div', { className: 'dsh-shield-toolbar' },
      h('div', { className: 'dsh-shield-seg' },
        h('button', {
          className: 'dsh-shield-seg-btn',
          'data-active': mode === 'req',
          onClick: () => setMode('req'),
        }, t('byRequest')),
        h('button', {
          className: 'dsh-shield-seg-btn',
          'data-active': mode === 'val',
          onClick: () => setMode('val'),
        }, t('byValue')),
      ),
      h('div', { style: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--dsw-alias-label-tertiary, #8f959e)' } },
        h('span', { style: { width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' } }),
        t('live'),
      ),
    ),
    h('div', { className: 'dsh-shield-facets' },
      h('button', {
        className: 'dsh-shield-pill',
        'data-active': facet === '',
        onClick: () => setFacet(''),
      }, t('facetAll'), h('b', null, ` ${(summary?.n ?? 0).toLocaleString()}`)),
      h('button', {
        className: 'dsh-shield-pill',
        'data-active': facet === 'rule',
        onClick: () => setFacet(facet === 'rule' ? '' : 'rule'),
      }, t('facetSecret'), h('b', null, ` ${(summary?.by?.rule ?? 0).toLocaleString()}`)),
    ),
    // Records List / Values List
    mode === 'req'
      ? h('div', { className: 'dsh-shield-list' },
          records.length === 0
            ? h('div', { style: { padding: '24px', textAlign: 'center', color: '#8f959e', fontSize: '13px' } },
                loading ? '加载中…' : t('emptyList'),
              )
            : records.map((r) =>
                h('div', {
                  key: r.key,
                  className: 'dsh-shield-row',
                  onClick: () => openDetail(r.key),
                },
                  h('span', { className: 'dsh-shield-row-time' }, r.t.slice(11, 16)),
                  h('span', { className: 'dsh-shield-row-route' },
                    h('span', null, 'DSH'),
                    h('span', { style: { color: '#8f959e' } }, '→'),
                    h('span', null, r.provider || 'Cloud'),
                  ),
                  h('span', { className: 'dsh-shield-row-model' }, r.model || ''),
                  h('span', { className: `dsh-shield-tag ${r.blocked ? 'blocked' : ''}` },
                    r.blocked ? t('facetBlocked') : `● 机密 ×${r.values.length}`,
                  ),
                  h('span', { className: 'dsh-shield-row-num' }, String(r.n)),
                  h('span', { style: { color: '#8f959e' } }, '›'),
                ),
              ),
        )
      : h('div', { className: 'dsh-shield-list' },
          (summary?.values ?? []).map((v: RankedValueSummary, i: number) =>
            h('div', { key: v.p, className: 'dsh-shield-row' },
              h('span', { style: { width: '20px', color: '#8f959e', fontVariantNumeric: 'tabular-nums' } }, String(i + 1).padStart(2, '0')),
              h('span', { style: { fontFamily: 'monospace', width: '140px' } }, `${v.head}••••••`),
              h('span', { className: 'dsh-shield-tag' }, KIND_LABELS_ZH[v.kind] || v.kind),
              h('span', { style: { color: '#8f959e', flex: 1, fontSize: '11px' } }, BY_LABELS_ZH[v.by] || v.by),
              h('span', { className: 'dsh-shield-row-num' }, String(v.n)),
            ),
          ),
        ),
    h('div', { style: { display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: '#8f959e', marginTop: '6px' } },
      h('span', null, t('footerNote')),
      h('button', {
        style: { border: 0, background: 'none', color: '#8f959e', cursor: 'pointer', textDecoration: 'underline' },
        onClick: () => {
          if (confirm('确认清空本机的隐匿审计记录吗？')) {
            void rpc.call('shield.clear', {}).then(() => {
              fetchSummary()
              fetchRecords()
            })
          }
        },
      }, t('clearRecords')),
    ),
  )
}
