import { t as getPrivacyShieldRuntime } from "../runtime-_E-S3hO2.mjs";
// src/web/plugin.ts
const name = "dsh-privacy-shield-web";
const inject = ["llm"];
function reply(rpcId, result) {
	const normalized = typeof result === "object" && result !== null && result.ok === false && typeof result.error === "object" ? {
		...result,
		error: {
			details: {},
			...result.error
		}
	} : result;
	return Response.json({
		type: "server-response",
		rpcId,
		result: normalized
	});
}
async function dispatchShieldRpc(method, payload) {
	const { vault, ledger } = getPrivacyShieldRuntime();
	const p = payload && typeof payload === "object" ? payload : {};
	switch (method) {
		case "shield.summary": {
			const days = p.days === 30 ? 30 : 7;
			return {
				summary: ledger.getSummary(days),
				settings: ledger.getSettings()
			};
		}
		case "shield.records": {
			const req = p;
			return ledger.queryRecords({
				limit: typeof req.limit === "number" ? req.limit : 40,
				before: typeof req.before === "string" && req.before ? req.before : void 0,
				kind: typeof req.kind === "string" && req.kind ? req.kind : void 0,
				by: typeof req.by === "string" && req.by ? req.by : void 0,
				blocked: !!req.blocked,
				agent: typeof req.agent === "string" && req.agent ? req.agent : void 0,
				provider: typeof req.provider === "string" && req.provider ? req.provider : void 0
			});
		}
		case "shield.record": {
			const key = String(p.key || "");
			const record = ledger.getRecord(key);
			const sentBody = vault.getSentBody(key);
			const ps = (record?.values ?? []).map((v) => v.p);
			return {
				record,
				sentBody,
				values: vault.getValues(ps)
			};
		}
		case "shield.value": {
			const ph = String(p.p || "");
			return { value: vault.getValue(ph) };
		}
		case "shield.values": {
			const ps = Array.isArray(p.ps) ? p.ps.map(String) : [];
			return { values: vault.getValues(ps) };
		}
		case "shield.clear":
			ledger.clearOwnRecords();
			return { ok: true };
		case "shield.settings.get": return { settings: ledger.getSettings() };
		case "shield.settings.set": {
			const patch = p.patch && typeof p.patch === "object" ? p.patch : {};
			return { settings: ledger.updateSettings(patch) };
		}
		case "shield.preview": {
			const text = typeof p.text === "string" ? p.text : "";
			return vault.preview(text, ledger.getSettings());
		}
		default: throw new Error(`Unknown privacy-shield RPC method: ${method}`);
	}
}
function apply(ctx) {
	ctx.inject(["connection"], (connectionCtx) => {
		const connection = connectionCtx.get("connection");
		if (!connection || typeof connection.fetch?.register !== "function") return;
		connectionCtx.effect(() => connection.fetch.register({
			path: "/api/privacy-shield",
			methods: ["POST"],
			requestBody: "buffered",
			async fetch(request) {
				if (request.method !== "POST") return new Response("method not allowed", { status: 405 });
				let message;
				try {
					message = await request.json();
				} catch {
					return new Response("body is not JSON", { status: 400 });
				}
				const rpcId = typeof message.rpcId === "string" ? message.rpcId : "invalid-request";
				const call = message.payload;
				if (message.type !== "client-request" || typeof message.rpcId !== "string" || typeof call?.method !== "string") return reply(rpcId, {
					ok: false,
					error: {
						code: "privacy-shield/bad-request",
						message: "Invalid privacy-shield request."
					}
				});
				try {
					return reply(rpcId, {
						ok: true,
						value: await dispatchShieldRpc(call.method, call.payload)
					});
				} catch (error) {
					return reply(rpcId, {
						ok: false,
						error: {
							code: "privacy-shield/handler-failed",
							message: error instanceof Error ? error.message : String(error)
						}
					});
				}
			}
		}), "dsh-privacy-shield: /api/privacy-shield RPC");
	});
}
export { apply, dispatchShieldRpc, inject, name };
