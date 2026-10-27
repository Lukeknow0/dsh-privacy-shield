import test, { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { PrivacyVault } from '../src/engine/vault.ts'
import { PrivacyLedger } from '../src/engine/ledger.ts'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

describe('Privacy Shield Engine', () => {
  it('masks OpenAI sk- keys and restores them correctly', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'shield-test-'))
    try {
      const vault = new PrivacyVault(tmp)
      const ledger = new PrivacyLedger(tmp)
      const settings = ledger.getSettings()

      const raw = 'Please deploy with key sk-proj-1234567890abcdef1234567890abcdef and token eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.doNotLeakThis'
      const hits = new Map()
      const snips = {}
      const masked = vault.maskText(raw, settings, hits, snips, true)

      assert.ok(!masked.includes('sk-proj-'), 'should not contain raw sk-proj-')
      assert.ok(!masked.includes('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'), 'should not contain raw JWT')
      assert.ok(masked.includes('{{API_KEY_'), 'should contain {{API_KEY_')
      assert.ok(masked.includes('{{TOKEN_'), 'should contain {{TOKEN_')

      const restored = vault.restoreText(masked)
      assert.equal(restored, raw, 'restored text should match raw text exactly')
    } finally {
      rmSync(tmp, { recursive: true, force: true })
    }
  })

  it('handles cross-chunk streaming partial tail buffer', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'shield-test-'))
    try {
      const vault = new PrivacyVault(tmp)
      const split1 = vault.splitPartialTail('This is safe {{API_KEY_abc')
      assert.equal(split1.safe, 'This is safe ')
      assert.equal(split1.tail, '{{API_KEY_abc')

      const split2 = vault.splitPartialTail('Regular text without braces')
      assert.equal(split2.safe, 'Regular text without braces')
      assert.equal(split2.tail, '')
    } finally {
      rmSync(tmp, { recursive: true, force: true })
    }
  })

  it('verifies deterministic placeholder across multiple calls with same key', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'shield-test-'))
    try {
      const vault1 = new PrivacyVault(tmp)
      const ph1 = vault1.placeholderFor('API_KEY', 'sk-test-secret-12345')

      const vault2 = new PrivacyVault(tmp)
      const ph2 = vault2.placeholderFor('API_KEY', 'sk-test-secret-12345')

      assert.equal(ph1, ph2, 'same raw value with same key should produce identical placeholder')
    } finally {
      rmSync(tmp, { recursive: true, force: true })
    }
  })

  it('masks multi-country phone numbers (CN, US, UK, international) and ID cards', () => {
    const tmp = mkdtempSync(join(tmpdir(), 'shield-test-'))
    try {
      const vault = new PrivacyVault(tmp)
      const ledger = new PrivacyLedger(tmp)
      const settings = ledger.updateSettings({ redactPersonal: true })

      const text = [
        'Call CN mobile: +86 13812345678 or 13987654321',
        'Call US phone: +1 (415) 555-2671 or (212) 555-0199',
        'Call UK phone: +44 7911 123456',
        'ID card: A123456789', // Taiwan ID (valid checksum)
        'HK ID: K123456(1)', // HK ID
      ].join('\n')

      const hits = new Map()
      const masked = vault.maskText(text, settings, hits, {}, true)

      assert.ok(masked.includes('{{PHONE_'), 'should mask phone numbers')
      assert.ok(masked.includes('{{ID_CARD_'), 'should mask ID cards')
      assert.ok(!masked.includes('13812345678'), 'raw CN phone should be masked')
      assert.ok(!masked.includes('415) 555-2671'), 'raw US phone should be masked')
      assert.ok(!masked.includes('+44 7911 123456'), 'raw UK phone should be masked')

      const restored = vault.restoreText(masked)
      assert.equal(restored, text, 'restored text should match original multi-country text')
    } finally {
      rmSync(tmp, { recursive: true, force: true })
    }
  })
})
