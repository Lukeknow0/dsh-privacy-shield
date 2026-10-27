/**
 * dsh-privacy-shield web entry:
 * Registers the BrowserAuth-protected `/api/privacy-shield` RPC endpoint over
 * `ctx.connection.fetch.register` lazily via `ctx.inject(['connection'])`.
 */

import type { Context } from '@deepseek-ai/cordis'
import type {
  PrivacyShieldSettings,
  ShieldRpcMethod,
  ShieldRpcReq,
} from '../rpc-contract.ts'
import { getPrivacyShieldRuntime } from '../runtime.ts'

export const name = 'dsh-privacy-shield-web'
export const inject = ['llm']

function reply(rpcId: string, result: unknown): Response {
  const isErr =
    typeof result === 'object' &&
    result !== null &&
    (result as { ok?: unknown }).ok === false &&
    typeof (result as { error?: unknown }).error === 'object'
  const normalized = isErr
    ? {
        ...(result as Record<string, unknown>),
        error: { details: {}, ...((result as { error: Record<string, unknown> }).error) },
      }
    : result
  return Response.json({ type: 'server-response', rpcId, result: normalized })
}

export async function dispatchShieldRpc(method: string, payload: unknown): Promise<unknown> {
  const { vault, ledger } = getPrivacyShieldRuntime()
  const p = (payload && typeof payload === 'object' ? payload : {}) as Record<string, unknown>

  switch (method as ShieldRpcMethod) {
    case 'shield.summary': {
      const days = p.days === 30 ? 30 : 7
      return {
        summary: ledger.getSummary(days),
        settings: ledger.getSettings(),
      }
    }
    case 'shield.records': {
      const req = p as ShieldRpcReq<'shield.records'>
      return ledger.queryRecords({
        limit: typeof req.limit === 'number' ? req.limit : 40,
        before: typeof req.before === 'string' && req.before ? req.before : undefined,
        kind: typeof req.kind === 'string' && req.kind ? req.kind : undefined,
        by: typeof req.by === 'string' && req.by ? req.by : undefined,
        blocked: !!req.blocked,
        agent: typeof req.agent === 'string' && req.agent ? req.agent : undefined,
        provider: typeof req.provider === 'string' && req.provider ? req.provider : undefined,
      })
    }
    case 'shield.record': {
      const key = String(p.key || '')
      const record = ledger.getRecord(key)
      const sentBody = vault.getSentBody(key)
      const ps = (record?.values ?? []).map((v) => v.p)
      const values = vault.getValues(ps)
      return { record, sentBody, values }
    }
    case 'shield.value': {
      const ph = String(p.p || '')
      return { value: vault.getValue(ph) }
    }
    case 'shield.values': {
      const ps = Array.isArray(p.ps) ? p.ps.map(String) : []
      return { values: vault.getValues(ps) }
    }
    case 'shield.clear': {
      ledger.clearOwnRecords()
      return { ok: true }
    }
    case 'shield.settings.get': {
      return { settings: ledger.getSettings() }
    }
    case 'shield.settings.set': {
      const patch = (p.patch && typeof p.patch === 'object' ? p.patch : {}) as Partial<PrivacyShieldSettings>
      return { settings: ledger.updateSettings(patch) }
    }
    case 'shield.preview': {
      const text = typeof p.text === 'string' ? p.text : ''
      return vault.preview(text, ledger.getSettings())
    }
    default:
      throw new Error(`Unknown privacy-shield RPC method: ${method}`)
  }
}

export function apply(ctx: Context): void {
  ctx.inject(['connection'], (connectionCtx) => {
    const connection = connectionCtx.get('connection') as
      | {
          fetch?: {
            register(route: {
              path: string
              methods: string[]
              requestBody: 'buffered' | 'streaming'
              fetch: (request: Request) => Promise<Response>
            }): () => void
          }
        }
      | undefined
    if (!connection || typeof connection.fetch?.register !== 'function') {
      return
    }
    connectionCtx.effect(
      () =>
        connection.fetch!.register({
          path: '/api/privacy-shield',
          methods: ['POST'],
          requestBody: 'buffered',
          async fetch(request: Request): Promise<Response> {
            if (request.method !== 'POST') return new Response('method not allowed', { status: 405 })
            let message: Record<string, unknown>
            try {
              message = (await request.json()) as Record<string, unknown>
            } catch {
              return new Response('body is not JSON', { status: 400 })
            }
            const rpcId = typeof message.rpcId === 'string' ? message.rpcId : 'invalid-request'
            const call = message.payload as { method?: unknown; payload?: unknown } | undefined
            if (
              message.type !== 'client-request' ||
              typeof message.rpcId !== 'string' ||
              typeof call?.method !== 'string'
            ) {
              return reply(rpcId, {
                ok: false,
                error: { code: 'privacy-shield/bad-request', message: 'Invalid privacy-shield request.' },
              })
            }
            try {
              const value = await dispatchShieldRpc(call.method, call.payload)
              return reply(rpcId, { ok: true, value })
            } catch (error) {
              const text = error instanceof Error ? error.message : String(error)
              return reply(rpcId, {
                ok: false,
                error: { code: 'privacy-shield/handler-failed', message: text },
              })
            }
          },
        }),
      'dsh-privacy-shield: /api/privacy-shield RPC',
    )
  })
}
