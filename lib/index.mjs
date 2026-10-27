import { t as getPrivacyShieldRuntime } from "./runtime-_E-S3hO2.mjs";
import { LlmError, freezeMessage } from "@deepseek-ai/dsh-llm";
// src/index.ts
const name = "dsh-privacy-shield";
const inject = ["llm"];
let monotonicCounter = 0;
function nextRecordKey() {
	monotonicCounter = (monotonicCounter + 1) % 1e6;
	return String(BigInt(Date.now()) * 1000000n + BigInt(monotonicCounter));
}
function apply(ctx) {
	const { vault, ledger } = getPrivacyShieldRuntime();
	const dispose = ctx.on("llm/stream", (options, next) => {
		const settings = ledger.getSettings();
		if (!(settings.redact || settings.redactPersonal || (settings.redactWords?.length ?? 0) > 0)) return next();
		const startNs = process.hrtime.bigint();
		const hits = /* @__PURE__ */ new Map();
		const snips = {};
		let mutated = false;
		const maskedMessages = options.messages.map((msg) => {
			let msgChanged = false;
			const newContent = msg.content.map((block) => {
				if (block.type === "text" && typeof block.text === "string") {
					const masked = vault.maskText(block.text, settings, hits, snips, true);
					if (masked !== block.text) {
						msgChanged = true;
						return {
							...block,
							text: masked
						};
					}
				}
				return block;
			});
			if (!msgChanged) return msg;
			mutated = true;
			return freezeMessage({
				...msg,
				content: newContent
			});
		});
		const tookUs = Number((process.hrtime.bigint() - startNs) / 1000n);
		if (hits.size === 0) return next();
		const cleanValues = [...hits.values()].map(({ raw: _raw, ...rest }) => rest);
		const blockedKinds = cleanValues.filter((v) => v.a === "block").map((v) => v.k);
		const totalMaskedPlaces = cleanValues.filter((v) => (v.a ?? "mask") === "mask").reduce((acc, v) => acc + v.n, 0);
		const recKey = nextRecordKey();
		try {
			vault.saveSentBody(recKey, JSON.stringify(maskedMessages.map((m) => ({
				role: m.role,
				content: m.content
			}))));
		} catch {}
		if (blockedKinds.length > 0) {
			const blockedRecord = {
				key: recKey,
				t: (/* @__PURE__ */ new Date()).toISOString(),
				what: "chat",
				agent: "dsh",
				provider: options.provider,
				model: options.model,
				n: totalMaskedPlaces,
				blocked: true,
				values: cleanValues,
				snips,
				took: tookUs
			};
			ledger.appendRecord(blockedRecord);
			return (async function* () {
				yield {
					type: "finish",
					reason: {
						kind: "error",
						failure: new LlmError(`隐私护盾已拦截此请求：检测到设定为阻止出境的敏感内容 (${[...new Set(blockedKinds)].join(", ")})`, "PRIVACY_SHIELD_BLOCKED").failure
					}
				};
			})();
		}
		const effectiveOptions = mutated ? {
			...options,
			messages: maskedMessages
		} : options;
		const upstream = Reflect.apply(next, ctx.llm, [effectiveOptions]);
		const backCounts = {};
		const tails = /* @__PURE__ */ new Map();
		return (async function* () {
			try {
				for await (const chunk of upstream) {
					if (chunk.type === "text-delta" || chunk.type === "reasoning-delta" || chunk.type === "tool-call-delta") {
						const combined = (tails.get(chunk.index) ?? "") + chunk.delta;
						const { safe, tail } = vault.splitPartialTail(combined);
						tails.set(chunk.index, tail);
						if (safe.length > 0) yield {
							...chunk,
							delta: vault.restoreText(safe, backCounts)
						};
						continue;
					}
					if (chunk.type === "block-end") {
						const leftover = tails.get(chunk.index) ?? "";
						tails.delete(chunk.index);
						if (leftover.length > 0) {
							const restoredLeftover = vault.restoreText(leftover, backCounts);
							if (chunk.block.type === "text") yield {
								type: "text-delta",
								index: chunk.index,
								delta: restoredLeftover
							};
							else if (chunk.block.type === "reasoning") yield {
								type: "reasoning-delta",
								index: chunk.index,
								delta: restoredLeftover
							};
							else if (chunk.block.type === "tool-call") yield {
								type: "tool-call-delta",
								index: chunk.index,
								delta: restoredLeftover
							};
						}
						if (chunk.block.type === "text" || chunk.block.type === "reasoning") {
							yield {
								...chunk,
								block: {
									...chunk.block,
									text: vault.restoreText(chunk.block.text)
								}
							};
							continue;
						}
						if (chunk.block.type === "tool-call" && chunk.block.input && typeof chunk.block.input === "object") try {
							const restoredJson = vault.restoreText(JSON.stringify(chunk.block.input), backCounts);
							yield {
								...chunk,
								block: {
									...chunk.block,
									input: JSON.parse(restoredJson)
								}
							};
							continue;
						} catch {}
					}
					yield chunk;
				}
			} finally {
				const record = {
					key: recKey,
					t: (/* @__PURE__ */ new Date()).toISOString(),
					what: "chat",
					agent: "dsh",
					provider: options.provider,
					model: options.model,
					n: totalMaskedPlaces,
					values: cleanValues,
					...Object.keys(backCounts).length > 0 ? { back: backCounts } : {},
					...Object.keys(snips).length > 0 ? { snips } : {},
					took: tookUs
				};
				ledger.appendRecord(record);
			}
		})();
	}, { global: true });
	ctx.effect(() => () => {
		dispose();
	});
}
export { apply, inject, name };
