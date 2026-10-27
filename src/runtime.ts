/**
 * Shared singleton runtime for `dsh-privacy-shield` so both the main `llm/stream`
 * entry (`src/index.ts`) and the management RPC entry (`src/web/plugin.ts`)
 * share the exact same in-memory `PrivacyVault` and `PrivacyLedger`.
 */

import { PrivacyLedger } from './engine/ledger.ts'
import { PrivacyVault } from './engine/vault.ts'

export interface PrivacyShieldRuntime {
  vault: PrivacyVault
  ledger: PrivacyLedger
}

let sharedRuntime: PrivacyShieldRuntime | undefined

export function getPrivacyShieldRuntime(): PrivacyShieldRuntime {
  if (!sharedRuntime) {
    sharedRuntime = {
      vault: new PrivacyVault(),
      ledger: new PrivacyLedger(),
    }
  }
  return sharedRuntime
}

export function _resetPrivacyShieldRuntimeForTest(baseDir?: string, magpieDir?: string): PrivacyShieldRuntime {
  sharedRuntime = {
    vault: new PrivacyVault(baseDir),
    ledger: new PrivacyLedger(baseDir, magpieDir),
  }
  return sharedRuntime
}
