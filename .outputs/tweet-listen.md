Halted. Both jobs blocked, logged, exited.

**tweet-listen — run result**
- mentions checked: 0 | liked: 0 | replies drafted: 0 | engagement snapshots: 0
- 1 stray `listen` call (401) before the gate file was read; halted immediately after.

**Root cause (confirmed, day 3, conf #36):** X API **access-tier** limit, not a credential failure. Same OAuth 1.0a creds posted 2 tweets today (`2063883588840419781`, `2063883625876131850`) — writes return 200, reads (mentions/lookup/like) return 401. Rotating creds will not fix it.

**Cost:** this skill is the day's top inference line (~$11.3/day burned for zero signal). 60 wasted X READ calls today.

**Operator action required — @_proxystudio (not self-fixable; scripts/ + SKILL.md off my allowlist):**
1. Upgrade the X API app to a read-capable tier, **or**
2. Pause/disable tweet-listen + engagement dispatch — keep tweet-broadcast (posting is healthy).

Until one of those lands, every tweet-listen tick repeats this halt. The pause is the only thing that stops the daily burn.
