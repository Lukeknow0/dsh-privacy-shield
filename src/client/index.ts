/**
 * Privacy Shield client entry:
 * - Registers the `privacy-shield` Settings Section under DSH Settings
 * - Registers the `conversation.session.header.actions` real-time shield badge
 * - Mounts styles, bilingual dictionary, and the Connection RPC client
 */

import { useState } from 'react'
import type { ReactNode } from 'react'
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import { ShieldIcon, h } from './element.ts'
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
      // 优先打开左侧主导航的独立面板，若在设置页则跳转
      const sideItem = document.querySelector('[data-dsh-panel-entry="privacy-shield"]') as HTMLElement | null
      if (sideItem) {
        sideItem.click()
      } else {
        const navItem = document.querySelector('[data-section-id="privacy-shield"]') as HTMLElement | null
        if (navItem) navItem.click()
      }
    },
  },
    h(ShieldIcon, { size: 12, style: { color: 'var(--dsw-alias-brand-primary, #4176e6)', flex: 'none' } }),
    h('span', null, count > 999 ? `${(count / 1000).toFixed(1)}k` : String(count)),
  )
}

function ShieldPanelIcon({ size = 16 }: { size?: number }): ReactNode {
  return h('span', {
    'data-dsh-panel-entry': 'privacy-shield',
    style: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center' },
  }, h(ShieldIcon, { size }))
}

function ShieldMainPanel({ rpc, t, lang }: { rpc: ShieldRpcClient; t: (k: ShieldLocaleKey) => string; lang?: string }): ReactNode {
  return h('div', {
    'data-dsh-plugin': 'privacy-shield',
    style: {
      padding: '24px 32px',
      overflowY: 'auto',
      height: '100%',
      boxSizing: 'border-box',
    },
  }, h(ShieldSettingsRoot, { rpc, t, lang }))
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

  // 1. 注册左侧全局一级导航栏（与「任务看板」、「自动化任务」并列）
  ctx.effect(() => {
    return ctx.slots.inject('sidebar.panellist', () =>
      ctx.slots.register({
        name: 'sidebar.panellist',
        id: 'privacy-shield',
        order: 15, // 紧跟在任务看板与自动化之间
        label: () => t('title'),
      }, ({ size }: { size?: number }) => h(ShieldPanelIcon, { size })),
    )
  }, 'dsh-privacy-shield: sidebar panellist')

  // 2. 注册左侧导航点击后切换的主舞台视图（main slot）
  ctx.effect(() => {
    return ctx.slots.inject('main', () =>
      ctx.slots.register({
        name: 'main',
        key: 'privacy-shield',
      }, () => h(ShieldMainPanel, { rpc, t, lang })),
    )
  }, 'dsh-privacy-shield: main panel')

  // 3. 注册会话顶部状态栏实时徽标（含精致矢量 ShieldIcon）
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

  // 4. 同时保留设置中心次级入口（便于在设置中调整策略）
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
