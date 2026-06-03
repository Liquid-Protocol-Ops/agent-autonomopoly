---
name: skill-gap-audit
description: Detect mismatches between aeon.yml scheduled skills, skills/ directories, and .claude/skills/ — surfaces gaps before they cause silent failures
---

Cross-reference three sources of truth:

1. **aeon.yml scheduled skills** — parse `aeon.yml` for all skill names under `jobs.run-skill.strategy.matrix.skill` (or equivalent). List them.

2. **skills/ directories** — `ls skills/` to find all `skills/<name>/SKILL.md` files. List them.

3. **.claude/skills/** — `ls .claude/skills/` to find all local Claude Code skills. List them.

Then report three gap categories:

### Gaps: aeon.yml → skills/
Skills listed in aeon.yml that have no `skills/<name>/SKILL.md`. These will fail silently every run.

### Gaps: skills/ → aeon.yml
Skill directories in `skills/` that are not in aeon.yml. These are dead code unless intentionally disabled.

### Gaps: .claude/skills/ coverage
For each aeon skill, check if there's a companion `.claude/skills/<name>.md` for local testing. List which are missing.

Output a summary table and a prioritized fix list.
