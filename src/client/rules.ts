/**
 * Privacy Shield Rules & Live Sandbox Settings Component.
 * Allows toggling secrets/personal data, shape-preserving fake keys, custom words,
 * and testing real-time masking interactively (Try it).
 */

import { useState } from 'react'
import type { ReactNode } from 'react'
import { h } from './element.ts'
import type { ShieldLocaleKey } from './locales.ts'
import type { PrivacyShieldSettings, ShieldRpcClient } from '../rpc-contract.ts'

interface RulesProps {
  rpc: ShieldRpcClient
  t: (k: ShieldLocaleKey) => string
}

export function ShieldRules({ rpc, t }: RulesProps): ReactNode {
  const [settings, setSettings] = useState<PrivacyShieldSettings | null>(null)
  const [testInput, setTestInput] = useState('')
  const [testResult, setTestResult] = useState<{ maskedText: string; tookUs: number } | null>(null)
  const [wordsInput, setWordsInput] = useState('')

  const loadSettings = () => {
    void rpc.call('shield.settings.get', {}).then((res) => {
      setSettings(res.settings)
      setWordsInput((res.settings.redactWords || []).join(', '))
    }).catch(() => {})
  }

  useState(() => {
    loadSettings()
  })

  const update = (patch: Partial<PrivacyShieldSettings>) => {
    void rpc.call('shield.settings.set', { patch }).then((res) => {
      setSettings(res.settings)
    }).catch(() => {})
  }

  const runTest = (val: string) => {
    setTestInput(val)
    if (!val.trim()) {
      setTestResult(null)
      return
    }
    void rpc.call('shield.preview', { text: val }).then((res) => {
      setTestResult(res)
    }).catch(() => {})
  }

  const row = (title: string, desc: string, control: ReactNode) => {
    return h('div', {
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 18px',
        borderBottom: '0.5px solid var(--dsw-alias-border-l2, #e5e6eb)',
        background: 'var(--dsw-alias-bg-layer-1, #fff)',
      },
    },
      h('div', { style: { display: 'flex', flexDirection: 'column', gap: '3px', maxWidth: '80%' } },
        h('span', { style: { fontSize: '13.5px', fontWeight: 600 } }, title),
        h('span', { style: { fontSize: '12px', color: 'var(--dsw-alias-label-tertiary, #8f959e)', lineHeight: 1.4 } }, desc),
      ),
      control,
    )
  }

  const switchToggle = (checked: boolean, onChange: (val: boolean) => void) => {
    return h('button', {
      type: 'button',
      role: 'switch',
      'aria-checked': checked,
      onClick: () => onChange(!checked),
      style: {
        width: '36px',
        height: '20px',
        borderRadius: '99px',
        border: 0,
        background: checked ? 'var(--dsw-alias-brand-primary, #4176e6)' : 'rgba(0,0,0,0.18)',
        position: 'relative',
        cursor: 'pointer',
        transition: 'background 0.2s',
        padding: 0,
      },
    },
      h('span', {
        style: {
          position: 'absolute',
          top: '2px',
          left: checked ? '18px' : '2px',
          width: '16px',
          height: '16px',
          borderRadius: '50%',
          background: '#fff',
          boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
          transition: 'left 0.2s',
        },
      }),
    )
  }

  return h('div', { style: { display: 'flex', flexDirection: 'column', gap: '16px' } },
    // Settings Group
    h('div', { style: { borderRadius: '12px', border: '1px solid var(--dsw-alias-border-l2, #e5e6eb)', overflow: 'hidden' } },
      row(
        t('settingSecrets'),
        t('settingSecretsSub'),
        switchToggle(!!settings?.redact, (val) => update({ redact: val })),
      ),
      settings?.redact ? row(
        t('settingShape'),
        t('settingShapeSub'),
        switchToggle(!!settings?.redactShape, (val) => update({ redactShape: val })),
      ) : null,
      row(
        t('settingPersonal'),
        t('settingPersonalSub'),
        switchToggle(!!settings?.redactPersonal, (val) => update({ redactPersonal: val })),
      ),
      row(
        t('settingBadge'),
        t('settingBadgeSub'),
        switchToggle(!!settings?.conversationBadge, (val) => update({ conversationBadge: val })),
      ),
      row(
        t('settingHistory'),
        t('settingHistorySub'),
        switchToggle(!!settings?.importLegacyHistory, (val) => update({ importLegacyHistory: val })),
      ),
      row(
        t('settingWords'),
        t('settingWordsSub'),
        h('input', {
          type: 'text',
          value: wordsInput,
          placeholder: '例如：code_name, internal-host',
          onChange: (e: any) => setWordsInput(e.target.value),
          onBlur: () => {
            const arr = wordsInput.split(/[,，\n]/).map((w) => w.trim()).filter(Boolean)
            update({ redactWords: arr })
          },
          style: {
            width: '240px',
            padding: '5px 8px',
            fontSize: '12px',
            borderRadius: '6px',
            border: '1px solid var(--dsw-alias-border-l2, #e5e6eb)',
            background: 'var(--dsw-alias-bg-layer-2, #f4f5f7)',
            outline: 'none',
          },
        }),
      ),
    ),
    // Live Sandbox
    h('div', { style: { borderRadius: '12px', border: '1px solid var(--dsw-alias-border-l2, #e5e6eb)', padding: '16px', background: 'var(--dsw-alias-bg-layer-1, #fff)' } },
      h('h3', { style: { margin: '0 0 4px', fontSize: '14.5px', fontWeight: 600 } }, t('tryTitle')),
      h('p', { style: { margin: '0 0 12px', fontSize: '12px', color: '#8f959e' } }, t('trySub')),
      h('textarea', {
        rows: 3,
        value: testInput,
        placeholder: t('tryPlaceholder'),
        onChange: (e: any) => runTest(e.target.value),
        style: {
          width: '100%',
          padding: '8px 10px',
          fontSize: '12.5px',
          borderRadius: '8px',
          border: '1px solid var(--dsw-alias-border-l2, #e5e6eb)',
          background: 'var(--dsw-alias-bg-layer-2, #f4f5f7)',
          fontFamily: 'monospace',
          outline: 'none',
          boxSizing: 'border-box',
        },
      }),
      testResult ? h('div', {
        style: {
          marginTop: '10px',
          padding: '10px 12px',
          borderRadius: '8px',
          background: 'rgba(65, 118, 230, 0.05)',
          border: '1px dashed rgba(65, 118, 230, 0.3)',
          fontFamily: 'monospace',
          fontSize: '12px',
          lineHeight: 1.5,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all',
        },
      },
        h('div', { style: { color: '#4176e6', fontWeight: 600, marginBottom: '4px', fontSize: '11px' } },
          `云端将看到的替身效果 (${(testResult.tookUs / 1000).toFixed(2)}ms)：`,
        ),
        testResult.maskedText,
      ) : null,
    ),
  )
}
