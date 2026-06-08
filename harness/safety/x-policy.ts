// X (Twitter) command policy — HARD RULES, not configurable at runtime.
//
// X is an observation and broadcast channel only. It is never a command channel
// for financial operations. These constants are the authoritative source; the
// same rules are mirrored in api/webhook/x.ts and skills/tweet-listen/SKILL.md.

// Skills the X webhook is permitted to dispatch. Any skill not in this set must
// never be dispatched as a result of an X event, regardless of message content.
export const X_DISPATCH_ALLOWLIST: ReadonlySet<string> = new Set(['tweet-listen']);

// Operations that are permanently forbidden from being triggered by any X event,
// from any account, including the operator account @_proxystudio.
export const X_FORBIDDEN_OPERATIONS = Object.freeze([
  'fund_transfer',
  'wallet_sign',
  'on_chain_transaction',
  'lp_rebalance',
  'lp_close',
  'lp_open',
  'token_swap',
  'claim_fees',
] as const);

export type XForbiddenOperation = (typeof X_FORBIDDEN_OPERATIONS)[number];

// Returns true only if the requested skill is on the X dispatch allowlist.
export function isXDispatchAllowed(skill: string): boolean {
  return X_DISPATCH_ALLOWLIST.has(skill);
}

// Throws if the requested skill is not on the X dispatch allowlist.
export function assertXDispatchAllowed(skill: string): void {
  if (!isXDispatchAllowed(skill)) {
    throw new Error(
      `X dispatch blocked: skill "${skill}" is not in X_DISPATCH_ALLOWLIST. ` +
        'X events may only trigger tweet-listen. Fund transfers and on-chain ' +
        'operations are permanently excluded from X command paths.',
    );
  }
}
