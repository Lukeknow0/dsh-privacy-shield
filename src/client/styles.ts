/**
 * Injected styles for Privacy Shield (隐私护盾) Settings Section & Badge.
 * Adheres to DSH semantic tokens (--dsw-alias-*) with fallback light/dark values.
 */

export const SHIELD_STYLES_CSS = `
.dsh-shield-root {
  display: flex;
  flex-direction: column;
  gap: 16px;
  font-family: var(--dsw-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif);
  color: var(--dsw-alias-label-primary, #1f2329);
  max-width: 1040px;
  padding-bottom: 40px;
}

.dsh-shield-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.dsh-shield-title {
  font-size: 18px;
  font-weight: 650;
  letter-spacing: -0.02em;
  color: var(--dsw-alias-label-primary, #1f2329);
}

.dsh-shield-sub {
  margin-top: 4px;
  font-size: 13px;
  color: var(--dsw-alias-label-tertiary, #8f959e);
  line-height: 1.4;
}

.dsh-shield-tabs {
  display: flex;
  align-items: flex-end;
  gap: 20px;
  border-bottom: 0.5px solid var(--dsw-alias-border-l2, #e5e6eb);
  margin-top: 2px;
}

.dsh-shield-tab {
  position: relative;
  border: 0;
  padding: 8px 2px 10px;
  background: transparent;
  color: var(--dsw-alias-label-tertiary, #8f959e);
  font-size: 13.5px;
  cursor: pointer;
  font-weight: 500;
  transition: color 0.15s ease;
}

.dsh-shield-tab:hover,
.dsh-shield-tab[data-active="true"] {
  color: var(--dsw-alias-label-primary, #1f2329);
}

.dsh-shield-tab[data-active="true"]::after {
  position: absolute;
  right: 0;
  bottom: -1px;
  left: 0;
  height: 2px;
  border-radius: 2px 2px 0 0;
  background: var(--dsw-alias-brand-primary, #4176e6);
  content: '';
}

/* Card: 仅留在本机的内容 */
.dsh-shield-card {
  position: relative;
  padding: 20px 24px 18px;
  border-radius: 14px;
  border: 1px solid var(--dsw-alias-border-l2, #e5e6eb);
  background: var(--dsw-alias-bg-layer-1, #fff);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
}

.dsh-shield-card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.dsh-shield-card-title h3 {
  margin: 0;
  font-size: 14.5px;
  font-weight: 600;
  color: var(--dsw-alias-label-primary, #1f2329);
}

.dsh-shield-card-title p {
  margin: 4px 0 0;
  font-size: 12.5px;
  color: var(--dsw-alias-label-tertiary, #8f959e);
}

.dsh-shield-band {
  display: grid;
  grid-template-columns: minmax(0, 260px) minmax(0, 1fr);
  gap: 36px;
  align-items: center;
  margin-top: 16px;
}

.dsh-shield-big-num {
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif;
  font-size: 52px;
  font-weight: 200;
  line-height: 0.95;
  letter-spacing: -0.04em;
  color: var(--dsw-alias-label-primary, #1f2329);
  font-variant-numeric: tabular-nums;
}

.dsh-shield-unit {
  margin-top: 6px;
  font-size: 12.5px;
  color: var(--dsw-alias-label-secondary, #61666b);
}

.dsh-shield-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 14px;
  margin-top: 10px;
  font-size: 12px;
  color: var(--dsw-alias-label-tertiary, #8f959e);
}

.dsh-shield-stats b {
  margin-right: 4px;
  font-weight: 600;
  color: var(--dsw-alias-label-primary, #1f2329);
  font-variant-numeric: tabular-nums;
}

.dsh-shield-days {
  position: relative;
  height: 42px;
  margin-top: 12px;
  display: flex;
  flex-direction: column;
}

.dsh-shield-bars {
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: flex-end;
  gap: 4px;
}

.dsh-shield-day-bar {
  flex: 1 1 0;
  height: 100%;
  display: flex;
  align-items: flex-end;
  position: relative;
  cursor: pointer;
}

.dsh-shield-day-bar-fill {
  width: 100%;
  border-radius: 2px;
  background: rgba(65, 118, 230, 0.25);
  transition: background 0.15s, height 0.3s ease;
}

.dsh-shield-day-bar:hover .dsh-shield-day-bar-fill {
  background: rgba(65, 118, 230, 0.5);
}

.dsh-shield-day-bar.today .dsh-shield-day-bar-fill {
  background: var(--dsw-alias-brand-primary, #4176e6);
}

.dsh-shield-axis {
  display: flex;
  justify-content: space-between;
  margin-top: 4px;
  font-size: 11px;
  color: var(--dsw-alias-label-tertiary, #8f959e);
  font-variant-numeric: tabular-nums;
}

/* SVG Flow Diagram */
.dsh-shield-flow {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.dsh-shield-flow-grid {
  display: grid;
  grid-template-columns: minmax(0, 140px) minmax(80px, 1fr) minmax(0, 140px);
  gap: 12px;
  align-items: center;
}

.dsh-shield-flow-node {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 8px;
  background: var(--dsw-alias-bg-layer-2, #f4f5f7);
  font-size: 12px;
  min-width: 0;
  border: 0.5px solid transparent;
}

.dsh-shield-flow-node.active {
  border-color: var(--dsw-alias-brand-primary, #4176e6);
  background: rgba(65, 118, 230, 0.08);
}

.dsh-shield-flow-node .dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--dsw-alias-brand-primary, #4176e6);
  flex: none;
}

.dsh-shield-flow-node .name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dsh-shield-flow-node .count {
  color: var(--dsw-alias-label-tertiary, #8f959e);
  font-variant-numeric: tabular-nums;
  font-size: 11px;
}

.dsh-shield-flow-center {
  position: relative;
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dsh-shield-flow-hub {
  position: absolute;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--dsw-alias-bg-layer-1, #fff);
  border: 1px solid var(--dsw-alias-brand-primary, #4176e6);
  box-shadow: 0 0 8px rgba(65, 118, 230, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--dsw-alias-brand-primary, #4176e6);
  z-index: 2;
}

/* Toolbar & Facets */
.dsh-shield-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 14px;
}

.dsh-shield-seg {
  display: inline-flex;
  padding: 2px;
  border-radius: 8px;
  background: var(--dsw-alias-bg-layer-2, #f4f5f7);
  border: 0.5px solid var(--dsw-alias-border-l1, rgba(0,0,0,0.04));
}

.dsh-shield-seg-btn {
  padding: 4px 12px;
  border-radius: 6px;
  border: 0;
  background: transparent;
  font-size: 12px;
  color: var(--dsw-alias-label-secondary, #61666b);
  cursor: pointer;
  font-weight: 500;
  transition: all 0.15s ease;
}

.dsh-shield-seg-btn[data-active="true"] {
  background: var(--dsw-alias-bg-layer-1, #fff);
  color: var(--dsw-alias-label-primary, #1f2329);
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}

.dsh-shield-facets {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 10px;
}

.dsh-shield-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 24px;
  padding: 0 10px;
  border-radius: 99px;
  border: 1px solid var(--dsw-alias-border-l2, #e5e6eb);
  background: var(--dsw-alias-bg-layer-1, #fff);
  font-size: 12px;
  color: var(--dsw-alias-label-secondary, #61666b);
  cursor: pointer;
  transition: all 0.15s ease;
}

.dsh-shield-pill:hover {
  background: var(--dsw-alias-bg-layer-2, #f4f5f7);
}

.dsh-shield-pill[data-active="true"] {
  border-color: transparent;
  background: rgba(65, 118, 230, 0.1);
  color: var(--dsw-alias-brand-primary, #4176e6);
  font-weight: 500;
}

/* Records List */
.dsh-shield-list {
  display: flex;
  flex-direction: column;
  border-radius: 12px;
  border: 1px solid var(--dsw-alias-border-l2, #e5e6eb);
  background: var(--dsw-alias-bg-layer-1, #fff);
  overflow: hidden;
  margin-top: 8px;
}

.dsh-shield-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-bottom: 0.5px solid var(--dsw-alias-border-l2, #e5e6eb);
  font-size: 12.5px;
  cursor: pointer;
  transition: background 0.15s ease;
}

.dsh-shield-row:last-child {
  border-bottom: 0;
}

.dsh-shield-row:hover {
  background: var(--dsw-alias-bg-layer-2, #f4f5f7);
}

.dsh-shield-row-time {
  color: var(--dsw-alias-label-tertiary, #8f959e);
  font-variant-numeric: tabular-nums;
  flex: none;
  width: 44px;
}

.dsh-shield-row-route {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
  flex: none;
  min-width: 170px;
}

.dsh-shield-row-model {
  color: var(--dsw-alias-label-tertiary, #8f959e);
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dsh-shield-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 20px;
  padding: 0 8px;
  border-radius: 6px;
  font-size: 11px;
  background: rgba(65, 118, 230, 0.08);
  color: var(--dsw-alias-brand-primary, #4176e6);
  border: 0.5px solid rgba(65, 118, 230, 0.2);
}

.dsh-shield-tag.blocked {
  background: rgba(239, 68, 68, 0.08);
  color: var(--dsw-alias-state-error-primary, #ec1313);
  border-color: rgba(239, 68, 68, 0.2);
}

.dsh-shield-row-num {
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  flex: none;
  min-width: 28px;
  text-align: right;
}

/* Detail Drawer (Side by Side) */
.dsh-shield-detail {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.dsh-shield-steps {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 8px;
  padding: 14px 18px;
  border-radius: 12px;
  background: var(--dsw-alias-bg-layer-2, #f4f5f7);
  border: 1px solid var(--dsw-alias-border-l2, #e5e6eb);
}

.dsh-shield-step-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.dsh-shield-step-item .step-num {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--dsw-alias-brand-primary, #4176e6);
  color: #fff;
  font-size: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  margin-bottom: 4px;
}

.dsh-shield-step-item .step-title {
  font-size: 12px;
  font-weight: 600;
}

.dsh-shield-step-item .step-desc {
  font-size: 11px;
  color: var(--dsw-alias-label-tertiary, #8f959e);
  line-height: 1.3;
}

.dsh-shield-diff-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.dsh-shield-diff-col {
  display: flex;
  flex-direction: column;
  border-radius: 10px;
  border: 1px solid var(--dsw-alias-border-l2, #e5e6eb);
  background: var(--dsw-alias-bg-layer-1, #fff);
  overflow: hidden;
}

.dsh-shield-diff-col-head {
  padding: 8px 12px;
  background: var(--dsw-alias-bg-layer-2, #f4f5f7);
  border-bottom: 0.5px solid var(--dsw-alias-border-l2, #e5e6eb);
  font-size: 12px;
  font-weight: 600;
  color: var(--dsw-alias-label-secondary, #61666b);
}

.dsh-shield-diff-body {
  padding: 12px;
  font-family: var(--dsw-font-code, "SF Mono", Menlo, monospace);
  font-size: 12px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 480px;
  overflow-y: auto;
}

mark.dsh-shield-mark-orig {
  background: rgba(245, 158, 11, 0.15);
  color: #b45309;
  border-radius: 3px;
  padding: 1px 4px;
  border: 0.5px solid rgba(245, 158, 11, 0.3);
}

mark.dsh-shield-mark-ph {
  background: rgba(65, 118, 230, 0.15);
  color: var(--dsw-alias-brand-primary, #4176e6);
  border-radius: 3px;
  padding: 1px 4px;
  border: 0.5px solid rgba(65, 118, 230, 0.3);
}
`

export function installShieldStyles(): () => void {
  const ID = 'dsh-privacy-shield-styles'
  if (document.getElementById(ID)) return () => {}
  const style = document.createElement('style')
  style.id = ID
  style.textContent = SHIELD_STYLES_CSS
  document.head.appendChild(style)
  return () => {
    style.remove()
  }
}
