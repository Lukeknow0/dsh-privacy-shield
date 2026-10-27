/**
 * Privacy Shield client entry:
 * - Registers the `privacy-shield` Settings Section under DSH Settings
 * - Registers the `conversation.session.header.actions` real-time shield badge
 * - Mounts styles, bilingual dictionary, and the Connection RPC client
 */

import { useState } from 'react'
import type { ReactNode } from 'react'
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import { h } from './element.ts'
import { en, zh, type ShieldLocaleKey } from './locales.ts'
import { installShieldStyles } from './styles.ts'
import { ShieldDashboard } from './dashboard.ts'
import { ShieldRules } from './rules.ts'
import type { ShieldRpcClient, ShieldRpcMethod, ShieldRpcReq, ShieldRpcRes } from '../rpc-contract.ts'

const NS = 'privacy-shield'

interface ConnectionLike {
  rpc: {
    call: (channel: string, endpoint: string, payload: unknown, signal?: AbortSignal) => Promise<unknown>
  }
}

function createShieldRpc(connection: ConnectionLike): ShieldRpcClient {
  return {
    async call<M extends ShieldRpcMethod>(method: M, payload: ShieldRpcReq<M>, signal?: AbortSignal): Promise<ShieldRpcRes<M>> {
      const raw = (await connection.rpc.call('/api', 'privacy-shield', { method, payload }, signal)) as
        | { ok?: boolean; value?: unknown; error?: { message?: string } }
        | undefined
      if (raw?.ok === true) return raw.value as ShieldRpcRes<M>
      if (raw?.ok === false) throw new Error(raw.error?.message ?? `${method} failed`)
      throw new Error(`${method}: malformed RPC response`)
    },
  }
}

function ShieldSettingsRoot({ rpc, t, lang }: { rpc: ShieldRpcClient; t: (k: ShieldLocaleKey) => string; lang?: string }): ReactNode {
  const [tab, setTab] = useState<'overview' | 'rules'>('overview')

  return h('div', { className: 'dsh-shield-root' },
    h('div', { className: 'dsh-shield-head' },
      h('div', null,
        h('div', { className: 'dsh-shield-title' }, t('title')),
        h('div', { className: 'dsh-shield-sub' }, t('subtitle')),
      ),
    ),
    h('div', { className: 'dsh-shield-tabs' },
      h('button', {
        className: 'dsh-shield-tab',
        'data-active': tab === 'overview',
        onClick: () => setTab('overview'),
      }, t('tabOverview')),
      h('button', {
        className: 'dsh-shield-tab',
        'data-active': tab === 'rules',
        onClick: () => setTab('rules'),
      }, t('tabRules')),
    ),
    tab === 'overview'
      ? h(ShieldDashboard, { rpc, t, lang })
      : h(ShieldRules, { rpc, t }),
  )
}

function ShieldHeaderBadge({ rpc, t }: { rpc: ShieldRpcClient; t: (k: ShieldLocaleKey) => string }): ReactNode {
  const [count, setCount] = useState<number | null>(null)

  useState(() => {
    void rpc.call('shield.summary', { days: 7 }).then((res) => {
      setCount(res.summary.n)
    }).catch(() => {})
  })

  if (count === null || count === 0) return null

  return h('button', {
    type: 'button',
    title: `${t('title')}: 已隐匿 ${count.toLocaleString()} 处敏感信息`,
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '5px',
      padding: '2px 8px',
      borderRadius: '99px',
      border: '1px solid rgba(65, 118, 230, 0.3)',
      background: 'rgba(65, 118, 230, 0.08)',
      color: 'var(--dsw-alias-brand-primary, #4176e6)',
      fontSize: '11px',
      fontWeight: 600,
      cursor: 'pointer',
      lineHeight: '16px',
    },
    onClick: () => {
      // Direct navigation to settings.section -> privacy-shield
      const navItem = document.querySelector('[data-section-id="privacy-shield"]') as HTMLElement | null
      if (navItem) navItem.click()
    },
  },
    h('span', null, '🛡️'),
    h('span', null, count > 999 ? `${(count / 1000).toFixed(1)}k` : String(count)),
  )
}

export const inject = ['slots', 'locale', 'connection']

export function apply(ctx: ClientContext): void {
  ctx.effect(() => installShieldStyles(), 'dsh-privacy-shield: styles')
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'dsh-privacy-shield: dictionaries')

  const connection = ctx.get('connection') as ConnectionLike | undefined
  if (!connection) return

  const rpc = createShieldRpc(connection)
  const t = (k: ShieldLocaleKey) => ctx.locale.bind(NS)(k)
  const lang = ctx.locale.getLocale?.().active

  // 1. Register Header Actions Slot (🛡️ Realtime Badge)
  ctx.effect(() => {
    return ctx.slots.inject('conversation.session.header.actions', () =>
      ctx.slots.register({
        name: 'conversation.session.header.actions',
        id: 'privacy-shield-badge',
        order: 9,
        label: () => t('title'),
      }, () => h(ShieldHeaderBadge, { rpc, t })),
    )
  }, 'dsh-privacy-shield: header badge')

  // 2. Register Settings Section Slot
  ctx.effect(() => {
    return ctx.slots.inject('settings.section', () =>
      ctx.slots.register({
        name: 'settings.section',
        id: 'privacy-shield',
        order: 25,
        locale: NS,
        label: () => t('title'),
      }, () => h(ShieldSettingsRoot, { rpc, t, lang })),
    )
  }, 'dsh-privacy-shield: settings section')
}
