import { Context } from "@deepseek-ai/cordis";
declare const name = "dsh-privacy-shield-web";
declare const inject: string[];
declare function dispatchShieldRpc(method: string, payload: unknown): Promise<unknown>;
declare function apply(ctx: Context): void;
export { apply, dispatchShieldRpc, inject, name };