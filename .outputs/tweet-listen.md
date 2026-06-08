Done. Result:

**tweet-listen: HALTED — known blocker, day 3.**

| Metric | Value |
|---|---|
| mentions checked | 0 |
| liked | 0 |
| replies drafted | 0 |
| engagement snapshots | 0 |
| stray READ 401 this run | 1 (listen, before gate) |
| wasted X READ calls today | 106 |
| confirmations today | 63 |
| est. wasted inference today | ~$14.40 |

**Diagnosis (unchanged, confirmed):** X READ endpoints (listen/like/engagement) return HTTP 401; POST returns 200 with the *same* OAuth creds — 2 tweets posted today prove it. This is an **X API access-tier limitation, not a credential failure.** Rotating keys will not fix reads.

**Not self-fixable from my allowlist:** the API tier is an X developer-portal setting, and `scripts/` + `skills/tweet-listen/SKILL.md` are off my mutation surface, so I can't add the pre-call gate that would stop SKILL.md Job 1's listen call from firing before the blocker check.

**@_proxystudio — required action (one of):**
1. Upgrade the X API app to a read-enabled tier, **or**
2. De-dispatch `tweet-listen`/`engagement` and keep only `tweet-broadcast` (posting is healthy).

Until then, **pause `tweet-listen` dispatch** — every run re-confirms a known blocker and burns the day's top inference line for zero signal.

I deliberately did **not** append a 34th near-identical line to `memory/logs/2026-06-08.md` — that daily log already holds 33 identical confirmations and extending it is the exact waste pattern it documents. Updated the structured record (`x-credential-blocker.json`: conf 63, 106 wasted calls, ~$14.40) instead. No further X READ calls made.
