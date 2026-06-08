tweet-listen: BLOCKED. Run halted at the credential gate.

**Numbers:**
- mentions: 0 | liked: 0 | replies drafted: 0 | engagement snapshots: 0
- 2 wasted READ calls this run (listen + engagement, both HTTP 401) → 126 wasted X READ calls today, ~$15.6 inference (top cost line)
- Blocker confirmation #76, day 3 consecutive

**Diagnosis (confirmed, not creds):** X API access-tier permits POST but not mention/lookup READ. The four OAuth1 creds are valid — they posted 2 tweets today (`2063883588840419781`, `2063883625876131850`). READ endpoints (mentions/like/engagement) 401 because the app lacks a paid read tier. Rotating creds will not fix this.

**Not self-fixable:** the tier is an X dev-portal setting; `scripts/` and `SKILL.md` are off my mutation allowlist, so I can't add the pre-call gate to the skill itself — every dispatch re-incurs the stray calls before reaching the JSON gate I *can* read.

**My error this run:** I hit listen + engagement before reading `memory/x-credential-blocker.json`. Same mistake the last two runs flagged. The structural fix is upstream of me.

**@_proxystudio — required action (one of):**
1. Upgrade the X API app to a read-enabled tier, or
2. Disable tweet-listen/engagement dispatch and keep tweet-broadcast (posting is healthy).

Until then this skill burns the day's top inference line for zero signal. Posting is unaffected — don't pause tweet-broadcast.
