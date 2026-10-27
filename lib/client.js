window.__ModuleLoader__.load({
	id: "dsh-privacy-shield",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		// src/client/element.ts
		function h(tag, props, ...children) {
			return (0, react.createElement)(tag, props ?? null, ...children);
		}
		/**
		* 高级矢量护盾图标（用于左侧导航栏、面板标题及状态徽章）
		* 16x16 矢量网格，双层细线几何美学，不使用粗糙 emoji
		*/
		function ShieldIcon({ size = 16, className, style }) {
			return h("svg", {
				viewBox: "0 0 16 16",
				width: size,
				height: size,
				fill: "none",
				stroke: "currentColor",
				strokeWidth: "1.25",
				strokeLinecap: "round",
				strokeLinejoin: "round",
				className,
				style,
				"aria-hidden": "true"
			}, h("path", { d: "M8 1.5 L13.5 3.5 V7.8 C13.5 11.2 10.8 13.8 8 14.8 C5.2 13.8 2.5 11.2 2.5 7.8 V3.5 Z" }), h("path", {
				d: "M6.2 8 L7.4 9.2 L9.8 6.8",
				strokeWidth: "1.3"
			}));
		}
		// src/client/locales.ts
		/**
		* Minimalist Native Style (方向一：极简原生风) Bilingual Dictionary for Privacy Shield (隐私护盾).
		*/
		const zh = {
			title: "隐私护盾",
			subtitle: "发往云端前自动替身，收到回复后无缝归位",
			cardTitle: "仅留在本机的内容",
			cardSubOn: "每个请求离开这台电脑前在本机隐匿，回复里再换回原样",
			cardSubOff: "隐私护盾已关闭：请求按原样发往云端模型",
			turnOn: "开启隐私护盾",
			days7: "7 天",
			days30: "30 天",
			unitMasked: "处已隐匿",
			statDistinct: "不同的值",
			statRequests: "请求",
			statBlocked: "已拦截",
			flowCaption: "隐私护盾在这台电脑上完成隐匿与归位",
			byRequest: "按请求",
			byValue: "按值",
			live: "实时",
			allProviders: "所有提供方",
			facetAll: "全部",
			facetSecret: "机密",
			facetRule: "规则",
			facetPersonal: "个人数据",
			facetBlocked: "已拦截",
			today: "今天",
			yesterday: "昨天",
			emptyList: "暂无隐匿记录",
			emptyFiltered: "没有符合当前筛选条件的记录",
			footerNote: "仅在本机保留 30 天结构摘要，从不落盘敏感明文",
			clearRecords: "清空记录…",
			loadMore: "加载更多",
			tabOverview: "本机隐私",
			tabRules: "保护策略与测试",
			backToShield: "隐私护盾",
			step1: "已接收",
			step2: "识别敏感值",
			step3: "替身替换",
			step4: "发往云端",
			step4Blocked: "已拦截",
			step5: "回复归位",
			reqContentTitle: "请求内容对比",
			reqContentHint: "仅展示隐私护盾修改过的段落",
			viewOrig: "本机原貌",
			viewVendor: "云端所见",
			viewBoth: "双栏对比",
			howTitle: "替身明细",
			foundBy: "识别方式",
			inAnswer: "回复中归位",
			notInMemory: "进程重启后明文已释放（明文仅驻留内存，从不落盘）",
			settingSecrets: "隐匿机密凭据",
			settingSecretsSub: "API 密钥、私钥、Token 与密码在发往云端前换为替身，并在回复中自动归位",
			settingShape: "保持密钥形态",
			settingShapeSub: "发送同格式伪造密钥（如 sk-… 保持为 sk-…）而非 {{占位符}}，避免干扰模型行为",
			settingPersonal: "隐匿个人与环境数据",
			settingPersonalSub: "邮箱、手机号、身份证号、银行卡号、本机路径用户名与内网 IP",
			settingBadge: "会话顶部显示隐私护盾徽标",
			settingBadgeSub: "在聊天窗口右上角实时展示已隐匿数量，点击直达详情",
			settingHistory: "合并展示历史安全日志",
			settingHistorySub: "自动扫描并读取本机历史加密审计账本，生成长期安全趋势图",
			settingWords: "自定义隐匿词表",
			settingWordsSub: "不希望云端看到的专有代号、客户名或主机名（逗号分隔）",
			tryTitle: "实时沙盒测试",
			trySub: "粘贴任意文本测试当前隐匿效果，仅在内存计算，不留存任何记录",
			tryPlaceholder: "例如：使用密钥 sk-proj-abc1234567890defghijklmnop 部署并发送邮件至 ops@company.com"
		};
		const en = {
			title: "Privacy Shield",
			subtitle: "Replaced with stand-ins before leaving this Mac, restored in every reply",
			cardTitle: "Kept on this computer",
			cardSubOn: "Masked on this computer before each request leaves it, and put back in each answer",
			cardSubOff: "Privacy Shield is off: requests go to cloud vendors as written",
			turnOn: "Turn on Privacy Shield",
			days7: "7 days",
			days30: "30 days",
			unitMasked: "places masked",
			statDistinct: "Different values",
			statRequests: "Requests",
			statBlocked: "Held back",
			flowCaption: "Privacy Shield masked these on this computer",
			byRequest: "By request",
			byValue: "By value",
			live: "Live",
			allProviders: "All providers",
			facetAll: "All",
			facetSecret: "Secrets",
			facetRule: "Rules",
			facetPersonal: "Personal data",
			facetBlocked: "Held back",
			today: "Today",
			yesterday: "Yesterday",
			emptyList: "Nothing masked yet",
			emptyFiltered: "Nothing masked matches these filters",
			footerNote: "Kept on this computer for 30 days, without the values themselves",
			clearRecords: "Clear records…",
			loadMore: "Load more",
			tabOverview: "Local Privacy",
			tabRules: "Rules & Sandbox",
			backToShield: "Privacy Shield",
			step1: "Received",
			step2: "Found values",
			step3: "Replaced places",
			step4: "Sent",
			step4Blocked: "Held back",
			step5: "Put back",
			reqContentTitle: "Request content",
			reqContentHint: "Only the parts Privacy Shield changed",
			viewOrig: "Original here",
			viewVendor: "What vendor saw",
			viewBoth: "Side by side",
			howTitle: "How it was masked",
			foundBy: "Found by",
			inAnswer: "In the answer",
			notInMemory: "Not in memory: process restarted since. Raw values are never written to disk",
			settingSecrets: "Mask secrets",
			settingSecretsSub: "API keys, private keys, tokens and passwords go to vendors as stand-ins and come back as they were",
			settingShape: "Keep a key's form",
			settingShapeSub: "A key goes as a made-up one of the same form (sk-… stays sk-…) instead of a placeholder",
			settingPersonal: "Mask personal & host data",
			settingPersonalSub: "Emails, phone numbers, ID cards, bank cards, local paths and IP addresses",
			settingBadge: "Show Privacy Shield badge in chat header",
			settingBadgeSub: "Display real-time masked count in the session toolbar",
			settingHistory: "Include historical audit logs",
			settingHistorySub: "Automatically scan and display historical audit logs for long-term trends",
			settingWords: "Custom masked words",
			settingWordsSub: "Your own words, codenames or hosts to keep from vendors, separated by commas",
			tryTitle: "Try it live",
			trySub: "Paste text an agent might send: masked here as a request would be, and kept nowhere",
			tryPlaceholder: "Deploy with key sk-proj-abc1234567890defghijklmnop and mail ops@company.com"
		};
		const KIND_LABELS_ZH = {
			API_KEY: "API 密钥",
			PRIVATE_KEY: "私钥",
			TOKEN: "令牌",
			PASSWORD: "密码",
			SECRET: "机密",
			EMAIL: "邮箱",
			PHONE: "手机号",
			ID_CARD: "身份证号",
			BANK_CARD: "银行卡",
			PERSON: "姓名",
			ADDRESS: "地址",
			ACCOUNT: "账号",
			SSN: "社保号",
			PASSPORT: "护照号",
			IBAN: "IBAN",
			BIRTHDAY: "生日",
			MAC: "MAC 地址",
			SERIAL: "序列号",
			USERNAME: "用户名",
			HOSTNAME: "主机名",
			IP: "IP 地址",
			BUCKET: "存储桶",
			TERM: "自定义词"
		};
		const BY_LABELS_ZH = {
			rule: "规则",
			yours: "自定义规则",
			word: "自定义词",
			model: "本地模型",
			known: "上下文记忆"
		};
		// src/client/styles.ts
		/**
		* Injected styles for Privacy Shield (隐私护盾) Settings Section & Badge.
		* Adheres to DSH semantic tokens (--dsw-alias-*) with fallback light/dark values.
		*/
		const SHIELD_STYLES_CSS = `
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
`;
		function installShieldStyles() {
			const ID = "dsh-privacy-shield-styles";
			if (document.getElementById(ID)) return () => {};
			const style = document.createElement("style");
			style.id = ID;
			style.textContent = SHIELD_STYLES_CSS;
			document.head.appendChild(style);
			return () => {
				style.remove();
			};
		}
		// src/client/dashboard.ts
		/**
		* Privacy Shield Dashboard Component (极简原生风复刻版).
		* Renders the top overview card (big counter, 7/30d bars, SVG flow lines),
		* filter toolbar, requests / values list, and single-request diff drawer.
		*/
		function ShieldDashboard({ rpc, t }) {
			const [days, setDays] = (0, react.useState)(7);
			const [summary, setSummary] = (0, react.useState)(null);
			const [settings, setSettings] = (0, react.useState)(null);
			const [mode, setMode] = (0, react.useState)("req");
			const [facet, setFacet] = (0, react.useState)("");
			const [records, setRecords] = (0, react.useState)([]);
			const [loading, setLoading] = (0, react.useState)(false);
			const [activeRecordKey, setActiveRecordKey] = (0, react.useState)(null);
			const [detailRecord, setDetailRecord] = (0, react.useState)(null);
			const [detailSent, setDetailSent] = (0, react.useState)(null);
			const [detailValues, setDetailValues] = (0, react.useState)({});
			const fetchSummary = (0, react.useCallback)(() => {
				rpc.call("shield.summary", { days }).then((res) => {
					setSummary(res.summary);
					setSettings(res.settings);
				}).catch(() => {});
			}, [rpc, days]);
			const fetchRecords = (0, react.useCallback)(() => {
				setLoading(true);
				rpc.call("shield.records", {
					limit: 50,
					by: facet || void 0
				}).then((res) => {
					setRecords(res.records);
				}).catch(() => {}).finally(() => setLoading(false));
			}, [rpc, facet]);
			(0, react.useEffect)(() => {
				fetchSummary();
				fetchRecords();
				const timer = setInterval(() => {
					fetchSummary();
					fetchRecords();
				}, 15e3);
				return () => clearInterval(timer);
			}, [fetchSummary, fetchRecords]);
			const openDetail = (key) => {
				setActiveRecordKey(key);
				rpc.call("shield.record", { key }).then((res) => {
					setDetailRecord(res.record);
					setDetailSent(res.sentBody);
					setDetailValues(res.values);
				}).catch(() => {});
			};
			if (activeRecordKey && detailRecord) {
				const origParts = [];
				const vendParts = [];
				const rawBody = detailSent || JSON.stringify(detailRecord.snips || {}, null, 2);
				const phRegex = /\{\{[A-Z][A-Z0-9_]*_[a-z2-7]{8}\}\}/g;
				let lastIdx = 0;
				let match;
				while ((match = phRegex.exec(rawBody)) !== null) {
					const ph = match[0];
					const raw = detailValues[ph] || ph;
					const textBefore = rawBody.slice(lastIdx, match.index);
					origParts.push(textBefore);
					vendParts.push(textBefore);
					origParts.push(h("mark", {
						className: "dsh-shield-mark-orig",
						title: ph
					}, raw));
					vendParts.push(h("mark", {
						className: "dsh-shield-mark-ph",
						title: raw
					}, ph));
					lastIdx = match.index + ph.length;
				}
				origParts.push(rawBody.slice(lastIdx));
				vendParts.push(rawBody.slice(lastIdx));
				return h("div", { className: "dsh-shield-detail" }, h("div", { style: {
					display: "flex",
					alignItems: "center",
					gap: "8px"
				} }, h("button", {
					className: "dsh-shield-seg-btn",
					style: {
						cursor: "pointer",
						padding: "4px 10px"
					},
					onClick: () => setActiveRecordKey(null)
				}, `← ${t("backToShield")}`), h("span", { style: {
					fontSize: "13px",
					color: "var(--dsw-alias-label-tertiary, #8f959e)"
				} }, `${detailRecord.t.slice(0, 10)} ${detailRecord.t.slice(11, 19)} · ${detailRecord.provider} (${detailRecord.model})`)), h("div", { className: "dsh-shield-steps" }, h("div", { className: "dsh-shield-step-item" }, h("span", { className: "step-num" }, "1"), h("span", { className: "step-title" }, t("step1")), h("span", { className: "step-desc" }, detailRecord.agent || "dsh")), h("div", { className: "dsh-shield-step-item" }, h("span", { className: "step-num" }, "2"), h("span", { className: "step-title" }, t("step2")), h("span", { className: "step-desc" }, `${detailRecord.values.length} 项敏感值 (${detailRecord.took ? `${(detailRecord.took / 1e3).toFixed(1)}ms` : "<1ms"})`)), h("div", { className: "dsh-shield-step-item" }, h("span", { className: "step-num" }, "3"), h("span", { className: "step-title" }, t("step3")), h("span", { className: "step-desc" }, `${detailRecord.n} 处换为替身`)), h("div", { className: "dsh-shield-step-item" }, h("span", {
					className: "step-num",
					style: detailRecord.blocked ? { background: "#ef4444" } : void 0
				}, "4"), h("span", { className: "step-title" }, detailRecord.blocked ? t("step4Blocked") : t("step4")), h("span", { className: "step-desc" }, detailRecord.blocked ? "触发阻断规则未离机" : detailRecord.provider)), h("div", { className: "dsh-shield-step-item" }, h("span", { className: "step-num" }, "5"), h("span", { className: "step-title" }, t("step5")), h("span", { className: "step-desc" }, detailRecord.blocked ? "未发送" : `${Object.keys(detailRecord.back || {}).length} 处流式还原`))), h("div", { className: "dsh-shield-diff-grid" }, h("div", { className: "dsh-shield-diff-col" }, h("div", { className: "dsh-shield-diff-col-head" }, `${t("viewOrig")} (本机内存)`), h("div", { className: "dsh-shield-diff-body" }, ...origParts)), h("div", { className: "dsh-shield-diff-col" }, h("div", { className: "dsh-shield-diff-col-head" }, `${t("viewVendor")} (模型视角)`), h("div", { className: "dsh-shield-diff-body" }, ...vendParts))));
			}
			const maxDayN = Math.max(1, ...summary?.days?.map((d) => d.n) ?? [1]);
			const renderTopCard = () => {
				return h("div", { className: "dsh-shield-card" }, h("div", { className: "dsh-shield-card-head" }, h("div", { className: "dsh-shield-card-title" }, h("h3", null, t("cardTitle")), h("p", null, settings?.redact ? t("cardSubOn") : t("cardSubOff"))), h("div", { className: "dsh-shield-seg" }, h("button", {
					className: "dsh-shield-seg-btn",
					"data-active": days === 7,
					onClick: () => setDays(7)
				}, t("days7")), h("button", {
					className: "dsh-shield-seg-btn",
					"data-active": days === 30,
					onClick: () => setDays(30)
				}, t("days30")))), h("div", { className: "dsh-shield-band" }, h("div", null, h("div", { className: "dsh-shield-big-num" }, (summary?.n ?? 0).toLocaleString()), h("div", { className: "dsh-shield-unit" }, t("unitMasked")), h("div", { className: "dsh-shield-stats" }, h("span", null, h("b", null, String(summary?.distinct ?? 0)), t("statDistinct")), h("span", null, h("b", null, String(summary?.requests ?? 0)), t("statRequests")), (summary?.blocked ?? 0) > 0 ? h("span", { style: { color: "#ef4444" } }, h("b", null, String(summary?.blocked ?? 0)), t("statBlocked")) : null), h("div", { className: "dsh-shield-days" }, h("div", { className: "dsh-shield-bars" }, ...(summary?.days ?? []).map((d, idx, arr) => h("div", {
					key: d.day,
					className: `dsh-shield-day-bar ${idx === arr.length - 1 ? "today" : ""}`,
					title: `${d.day} · ${d.n} 处已隐匿 · ${d.requests} 请求`
				}, h("div", {
					className: "dsh-shield-day-bar-fill",
					style: { height: `${Math.max(6, Math.round(d.n / maxDayN * 100))}%` }
				})))), h("div", { className: "dsh-shield-axis" }, h("span", null, summary?.days?.[0]?.day.slice(5) || ""), h("span", null, t("today"))))), h("div", { className: "dsh-shield-flow" }, h("div", { className: "dsh-shield-flow-grid" }, h("div", { style: {
					display: "flex",
					flexDirection: "column",
					gap: "6px"
				} }, h("div", { className: "dsh-shield-flow-node" }, h("span", { className: "dot" }), h("span", { className: "name" }, "DeepSeek Harness"), h("span", { className: "count" }, String(summary?.n ?? 0)))), h("div", { className: "dsh-shield-flow-center" }, h("svg", {
					viewBox: "0 0 100 40",
					style: {
						width: "100%",
						height: "100%",
						stroke: "#4176e6",
						strokeWidth: "0.8",
						fill: "none"
					}
				}, h("path", {
					d: "M 0 20 C 35 20, 35 20, 50 20 C 65 20, 65 20, 100 20",
					strokeDasharray: "2,2"
				})), h("div", { className: "dsh-shield-flow-hub" }, h(ShieldIcon, { size: 15 }))), h("div", { style: {
					display: "flex",
					flexDirection: "column",
					gap: "6px"
				} }, ...(summary?.providers?.slice(0, 3) ?? [{
					name: "Cloud Models",
					n: summary?.n ?? 0
				}]).map((p) => h("div", {
					key: p.name,
					className: "dsh-shield-flow-node"
				}, h("span", {
					className: "dot",
					style: { background: "#10b981" }
				}), h("span", { className: "name" }, p.name), h("span", { className: "count" }, String(p.n)))))), h("div", { style: {
					textAlign: "center",
					fontSize: "11px",
					color: "var(--dsw-alias-label-tertiary, #8f959e)",
					marginTop: "8px"
				} }, t("flowCaption")))));
			};
			return h("div", { className: "dsh-shield-root" }, renderTopCard(), h("div", { className: "dsh-shield-toolbar" }, h("div", { className: "dsh-shield-seg" }, h("button", {
				className: "dsh-shield-seg-btn",
				"data-active": mode === "req",
				onClick: () => setMode("req")
			}, t("byRequest")), h("button", {
				className: "dsh-shield-seg-btn",
				"data-active": mode === "val",
				onClick: () => setMode("val")
			}, t("byValue"))), h("div", { style: {
				display: "flex",
				alignItems: "center",
				gap: "6px",
				fontSize: "12px",
				color: "var(--dsw-alias-label-tertiary, #8f959e)"
			} }, h("span", { style: {
				width: "6px",
				height: "6px",
				borderRadius: "50%",
				background: "#10b981"
			} }), t("live"))), h("div", { className: "dsh-shield-facets" }, h("button", {
				className: "dsh-shield-pill",
				"data-active": facet === "",
				onClick: () => setFacet("")
			}, t("facetAll"), h("b", null, ` ${(summary?.n ?? 0).toLocaleString()}`)), h("button", {
				className: "dsh-shield-pill",
				"data-active": facet === "rule",
				onClick: () => setFacet(facet === "rule" ? "" : "rule")
			}, t("facetSecret"), h("b", null, ` ${(summary?.by?.rule ?? 0).toLocaleString()}`))), mode === "req" ? h("div", { className: "dsh-shield-list" }, records.length === 0 ? h("div", { style: {
				padding: "24px",
				textAlign: "center",
				color: "#8f959e",
				fontSize: "13px"
			} }, loading ? "加载中…" : t("emptyList")) : records.map((r) => h("div", {
				key: r.key,
				className: "dsh-shield-row",
				onClick: () => openDetail(r.key)
			}, h("span", { className: "dsh-shield-row-time" }, r.t.slice(11, 16)), h("span", { className: "dsh-shield-row-route" }, h("span", null, "DSH"), h("span", { style: { color: "#8f959e" } }, "→"), h("span", null, r.provider || "Cloud")), h("span", { className: "dsh-shield-row-model" }, r.model || ""), h("span", { className: `dsh-shield-tag ${r.blocked ? "blocked" : ""}` }, r.blocked ? t("facetBlocked") : `● 机密 ×${r.values.length}`), h("span", { className: "dsh-shield-row-num" }, String(r.n)), h("span", { style: { color: "#8f959e" } }, "›")))) : h("div", { className: "dsh-shield-list" }, (summary?.values ?? []).map((v, i) => h("div", {
				key: v.p,
				className: "dsh-shield-row"
			}, h("span", { style: {
				width: "20px",
				color: "#8f959e",
				fontVariantNumeric: "tabular-nums"
			} }, String(i + 1).padStart(2, "0")), h("span", { style: {
				fontFamily: "monospace",
				width: "140px"
			} }, `${v.head}••••••`), h("span", { className: "dsh-shield-tag" }, KIND_LABELS_ZH[v.kind] || v.kind), h("span", { style: {
				color: "#8f959e",
				flex: 1,
				fontSize: "11px"
			} }, BY_LABELS_ZH[v.by] || v.by), h("span", { className: "dsh-shield-row-num" }, String(v.n))))), h("div", { style: {
				display: "flex",
				justifyContent: "space-between",
				fontSize: "11.5px",
				color: "#8f959e",
				marginTop: "6px"
			} }, h("span", null, t("footerNote")), h("button", {
				style: {
					border: 0,
					background: "none",
					color: "#8f959e",
					cursor: "pointer",
					textDecoration: "underline"
				},
				onClick: () => {
					if (confirm("确认清空本机的隐匿审计记录吗？")) rpc.call("shield.clear", {}).then(() => {
						fetchSummary();
						fetchRecords();
					});
				}
			}, t("clearRecords"))));
		}
		// src/client/rules.ts
		/**
		* Privacy Shield Rules & Live Sandbox Settings Component.
		* Allows toggling secrets/personal data, shape-preserving fake keys, custom words,
		* and testing real-time masking interactively (Try it).
		*/
		function ShieldRules({ rpc, t }) {
			const [settings, setSettings] = (0, react.useState)(null);
			const [testInput, setTestInput] = (0, react.useState)("");
			const [testResult, setTestResult] = (0, react.useState)(null);
			const [wordsInput, setWordsInput] = (0, react.useState)("");
			const loadSettings = () => {
				rpc.call("shield.settings.get", {}).then((res) => {
					setSettings(res.settings);
					setWordsInput((res.settings.redactWords || []).join(", "));
				}).catch(() => {});
			};
			(0, react.useState)(() => {
				loadSettings();
			});
			const update = (patch) => {
				rpc.call("shield.settings.set", { patch }).then((res) => {
					setSettings(res.settings);
				}).catch(() => {});
			};
			const runTest = (val) => {
				setTestInput(val);
				if (!val.trim()) {
					setTestResult(null);
					return;
				}
				rpc.call("shield.preview", { text: val }).then((res) => {
					setTestResult(res);
				}).catch(() => {});
			};
			const row = (title, desc, control) => {
				return h("div", { style: {
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					padding: "14px 18px",
					borderBottom: "0.5px solid var(--dsw-alias-border-l2, #e5e6eb)",
					background: "var(--dsw-alias-bg-layer-1, #fff)"
				} }, h("div", { style: {
					display: "flex",
					flexDirection: "column",
					gap: "3px",
					maxWidth: "80%"
				} }, h("span", { style: {
					fontSize: "13.5px",
					fontWeight: 600
				} }, title), h("span", { style: {
					fontSize: "12px",
					color: "var(--dsw-alias-label-tertiary, #8f959e)",
					lineHeight: 1.4
				} }, desc)), control);
			};
			const switchToggle = (checked, onChange) => {
				return h("button", {
					type: "button",
					role: "switch",
					"aria-checked": checked,
					onClick: () => onChange(!checked),
					style: {
						width: "36px",
						height: "20px",
						borderRadius: "99px",
						border: 0,
						background: checked ? "var(--dsw-alias-brand-primary, #4176e6)" : "rgba(0,0,0,0.18)",
						position: "relative",
						cursor: "pointer",
						transition: "background 0.2s",
						padding: 0
					}
				}, h("span", { style: {
					position: "absolute",
					top: "2px",
					left: checked ? "18px" : "2px",
					width: "16px",
					height: "16px",
					borderRadius: "50%",
					background: "#fff",
					boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
					transition: "left 0.2s"
				} }));
			};
			return h("div", { style: {
				display: "flex",
				flexDirection: "column",
				gap: "16px"
			} }, h("div", { style: {
				borderRadius: "12px",
				border: "1px solid var(--dsw-alias-border-l2, #e5e6eb)",
				overflow: "hidden"
			} }, row(t("settingSecrets"), t("settingSecretsSub"), switchToggle(!!settings?.redact, (val) => update({ redact: val }))), settings?.redact ? row(t("settingShape"), t("settingShapeSub"), switchToggle(!!settings?.redactShape, (val) => update({ redactShape: val }))) : null, row(t("settingPersonal"), t("settingPersonalSub"), switchToggle(!!settings?.redactPersonal, (val) => update({ redactPersonal: val }))), row(t("settingBadge"), t("settingBadgeSub"), switchToggle(!!settings?.conversationBadge, (val) => update({ conversationBadge: val }))), row(t("settingHistory"), t("settingHistorySub"), switchToggle(!!settings?.importLegacyHistory, (val) => update({ importLegacyHistory: val }))), row(t("settingWords"), t("settingWordsSub"), h("input", {
				type: "text",
				value: wordsInput,
				placeholder: "例如：code_name, internal-host",
				onChange: (e) => setWordsInput(e.target.value),
				onBlur: () => {
					const arr = wordsInput.split(/[,，\n]/).map((w) => w.trim()).filter(Boolean);
					update({ redactWords: arr });
				},
				style: {
					width: "240px",
					padding: "5px 8px",
					fontSize: "12px",
					borderRadius: "6px",
					border: "1px solid var(--dsw-alias-border-l2, #e5e6eb)",
					background: "var(--dsw-alias-bg-layer-2, #f4f5f7)",
					outline: "none"
				}
			}))), h("div", { style: {
				borderRadius: "12px",
				border: "1px solid var(--dsw-alias-border-l2, #e5e6eb)",
				padding: "16px",
				background: "var(--dsw-alias-bg-layer-1, #fff)"
			} }, h("h3", { style: {
				margin: "0 0 4px",
				fontSize: "14.5px",
				fontWeight: 600
			} }, t("tryTitle")), h("p", { style: {
				margin: "0 0 12px",
				fontSize: "12px",
				color: "#8f959e"
			} }, t("trySub")), h("textarea", {
				rows: 3,
				value: testInput,
				placeholder: t("tryPlaceholder"),
				onChange: (e) => runTest(e.target.value),
				style: {
					width: "100%",
					padding: "8px 10px",
					fontSize: "12.5px",
					borderRadius: "8px",
					border: "1px solid var(--dsw-alias-border-l2, #e5e6eb)",
					background: "var(--dsw-alias-bg-layer-2, #f4f5f7)",
					fontFamily: "monospace",
					outline: "none",
					boxSizing: "border-box"
				}
			}), testResult ? h("div", { style: {
				marginTop: "10px",
				padding: "10px 12px",
				borderRadius: "8px",
				background: "rgba(65, 118, 230, 0.05)",
				border: "1px dashed rgba(65, 118, 230, 0.3)",
				fontFamily: "monospace",
				fontSize: "12px",
				lineHeight: 1.5,
				whiteSpace: "pre-wrap",
				wordBreak: "break-all"
			} }, h("div", { style: {
				color: "#4176e6",
				fontWeight: 600,
				marginBottom: "4px",
				fontSize: "11px"
			} }, `云端将看到的替身效果 (${(testResult.tookUs / 1e3).toFixed(2)}ms)：`), testResult.maskedText) : null));
		}
		// src/client/index.ts
		/**
		* Privacy Shield client entry:
		* - Registers the `privacy-shield` Settings Section under DSH Settings
		* - Registers the `conversation.session.header.actions` real-time shield badge
		* - Mounts styles, bilingual dictionary, and the Connection RPC client
		*/
		const NS = "privacy-shield";
		function createShieldRpc(connection) {
			return { async call(method, payload, signal) {
				const raw = await connection.rpc.call("/api", "privacy-shield", {
					method,
					payload
				}, signal);
				if (raw?.ok === true) return raw.value;
				if (raw?.ok === false) throw new Error(raw.error?.message ?? `${method} failed`);
				throw new Error(`${method}: malformed RPC response`);
			} };
		}
		function ShieldSettingsRoot({ rpc, t, lang }) {
			const [tab, setTab] = (0, react.useState)("overview");
			return h("div", { className: "dsh-shield-root" }, h("div", { className: "dsh-shield-head" }, h("div", null, h("div", { className: "dsh-shield-title" }, t("title")), h("div", { className: "dsh-shield-sub" }, t("subtitle")))), h("div", { className: "dsh-shield-tabs" }, h("button", {
				className: "dsh-shield-tab",
				"data-active": tab === "overview",
				onClick: () => setTab("overview")
			}, t("tabOverview")), h("button", {
				className: "dsh-shield-tab",
				"data-active": tab === "rules",
				onClick: () => setTab("rules")
			}, t("tabRules"))), tab === "overview" ? h(ShieldDashboard, {
				rpc,
				t,
				lang
			}) : h(ShieldRules, {
				rpc,
				t
			}));
		}
		function ShieldHeaderBadge({ rpc, t }) {
			const [count, setCount] = (0, react.useState)(null);
			(0, react.useState)(() => {
				rpc.call("shield.summary", { days: 7 }).then((res) => {
					setCount(res.summary.n);
				}).catch(() => {});
			});
			if (count === null || count === 0) return null;
			return h("button", {
				type: "button",
				title: `${t("title")}: 已隐匿 ${count.toLocaleString()} 处敏感信息`,
				style: {
					display: "inline-flex",
					alignItems: "center",
					gap: "5px",
					padding: "2px 8px",
					borderRadius: "99px",
					border: "1px solid rgba(65, 118, 230, 0.3)",
					background: "rgba(65, 118, 230, 0.08)",
					color: "var(--dsw-alias-brand-primary, #4176e6)",
					fontSize: "11px",
					fontWeight: 600,
					cursor: "pointer",
					lineHeight: "16px"
				},
				onClick: () => {
					const sideItem = document.querySelector("[data-dsh-panel-entry=\"privacy-shield\"]");
					if (sideItem) sideItem.click();
					else {
						const navItem = document.querySelector("[data-section-id=\"privacy-shield\"]");
						if (navItem) navItem.click();
					}
				}
			}, h(ShieldIcon, {
				size: 12,
				style: {
					color: "var(--dsw-alias-brand-primary, #4176e6)",
					flex: "none"
				}
			}), h("span", null, count > 999 ? `${(count / 1e3).toFixed(1)}k` : String(count)));
		}
		function ShieldPanelIcon({ size = 16 }) {
			return h("span", {
				"data-dsh-panel-entry": "privacy-shield",
				style: {
					display: "inline-flex",
					alignItems: "center",
					justifyContent: "center"
				}
			}, h(ShieldIcon, { size }));
		}
		function ShieldMainPanel({ rpc, t, lang }) {
			return h("div", {
				"data-dsh-plugin": "privacy-shield",
				style: {
					padding: "24px 32px",
					overflowY: "auto",
					height: "100%",
					boxSizing: "border-box"
				}
			}, h(ShieldSettingsRoot, {
				rpc,
				t,
				lang
			}));
		}
		const inject = [
			"slots",
			"locale",
			"connection"
		];
		function apply(ctx) {
			ctx.effect(() => installShieldStyles(), "dsh-privacy-shield: styles");
			ctx.effect(() => ctx.locale.register(NS, {
				zh,
				en
			}), "dsh-privacy-shield: dictionaries");
			const connection = ctx.get("connection");
			if (!connection) return;
			const rpc = createShieldRpc(connection);
			const t = (k) => ctx.locale.bind(NS)(k);
			const lang = ctx.locale.getLocale?.().active;
			ctx.effect(() => {
				return ctx.slots.inject("sidebar.panellist", () => ctx.slots.register({
					name: "sidebar.panellist",
					id: "privacy-shield",
					order: 15,
					label: () => t("title")
				}, ({ size }) => h(ShieldPanelIcon, { size })));
			}, "dsh-privacy-shield: sidebar panellist");
			ctx.effect(() => {
				return ctx.slots.inject("main", () => ctx.slots.register({
					name: "main",
					key: "privacy-shield"
				}, () => h(ShieldMainPanel, {
					rpc,
					t,
					lang
				})));
			}, "dsh-privacy-shield: main panel");
			ctx.effect(() => {
				return ctx.slots.inject("conversation.session.header.actions", () => ctx.slots.register({
					name: "conversation.session.header.actions",
					id: "privacy-shield-badge",
					order: 9,
					label: () => t("title")
				}, () => h(ShieldHeaderBadge, {
					rpc,
					t
				})));
			}, "dsh-privacy-shield: header badge");
			ctx.effect(() => {
				return ctx.slots.inject("settings.section", () => ctx.slots.register({
					name: "settings.section",
					id: "privacy-shield",
					order: 25,
					locale: NS,
					label: () => t("title")
				}, () => h(ShieldSettingsRoot, {
					rpc,
					t,
					lang
				})));
			}, "dsh-privacy-shield: settings section");
		}
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});
