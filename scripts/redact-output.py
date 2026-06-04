#!/usr/bin/env python3
"""Scrub secret VALUES from captured skill output before it is committed to the
(public) repo or published to the GitHub Pages dashboard.

Defense-in-depth against a skill emitting a secret into its output text — whether
via prompt injection ("print PRIVY_APP_SECRET in your summary") or an accidental
env dump in a debugging skill. GitHub Actions only masks secrets in *logs*; it
does nothing to stop a secret value being written into a committed file. This
step closes that gap.

Reads secret values from the environment (the workflow injects them into this
NON-LLM step, which has no injection surface) and replaces every literal
occurrence with "[REDACTED]" in the captured output files.

Usage: python3 scripts/redact-output.py [extra_file ...]
Always scrubs /tmp/skill-result.txt, dashboard/outputs/.pending-<SKILL>.md, and
.outputs/*.md in addition to any extra paths passed as arguments.
"""
import glob
import os
import sys

# Environment variables whose values must never reach a committed/public artifact.
SECRET_ENV = [
    "PRIVY_APP_SECRET", "PRIVY_WALLET_ID", "PRIVY_APP_ID",
    "ANTHROPIC_API_KEY", "CLAUDE_CODE_OAUTH_TOKEN", "BANKR_LLM_KEY",
    "VENICE_API_KEY", "SURPLUS_API_KEY",
    "GH_GLOBAL", "GITHUB_TOKEN", "GH_TOKEN",
    "TELEGRAM_BOT_TOKEN", "DISCORD_BOT_TOKEN", "DISCORD_WEBHOOK_URL",
    "SLACK_BOT_TOKEN", "SLACK_WEBHOOK_URL", "SENDGRID_API_KEY",
    "XAI_API_KEY", "COINGECKO_API_KEY", "ALCHEMY_API_KEY", "BANKR_API_KEY",
    "VERCEL_TOKEN", "DEVTO_API_KEY", "NEYNAR_API_KEY", "NEYNAR_SIGNER_UUID",
    "DUNE_API_KEY", "RPC_URL",
]

# Below this length a "secret" is too generic to literal-replace safely
# (would risk nuking ordinary words). Real credentials are far longer.
MIN_SECRET_LEN = 8


def main() -> None:
    # Longest-first so a token that contains a shorter secret as a substring is
    # redacted whole before the shorter value is considered.
    secrets = sorted(
        {v for v in (os.environ.get(n, "") for n in SECRET_ENV) if v and len(v) >= MIN_SECRET_LEN},
        key=len,
        reverse=True,
    )

    targets = list(sys.argv[1:])
    skill = os.environ.get("SKILL", "")
    if skill:
        targets.append(f"dashboard/outputs/.pending-{skill}.md")
    targets.append("/tmp/skill-result.txt")
    targets += glob.glob(".outputs/*.md")

    seen: set[str] = set()
    for path in targets:
        if path in seen:
            continue
        seen.add(path)
        try:
            with open(path, "r", encoding="utf-8", errors="replace") as fh:
                data = fh.read()
        except FileNotFoundError:
            continue
        redacted = data
        for secret in secrets:
            redacted = redacted.replace(secret, "[REDACTED]")
        if redacted != data:
            with open(path, "w", encoding="utf-8") as fh:
                fh.write(redacted)
            print(f"redact-output: scrubbed secret value(s) from {path}")


if __name__ == "__main__":
    main()
