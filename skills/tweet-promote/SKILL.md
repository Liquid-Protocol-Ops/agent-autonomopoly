---
name: tweet-promote
description: AUTONO reasons about how to promote its token, then calls Venice video generation to produce promotional videos and queues them for broadcast.
var: ""
tags: [twitter, content, video, venice, promotion]
---

Generate promotional content for AUTONO's token. This combines strategic reasoning with Venice video generation — the output is a video queued for posting.

## Step 1: Load context

Read before generating anything:

1. `memory/goals.json` — current mode, DIEM balance, earnings rate, milestones
2. `memory/x-performance.jsonl` — which content types get the most engagement; what has performed well in the last 30 days
3. `memory/x-tweet-log.jsonl` — recent tweets; avoid repeating a topic from the last 7 days
4. `memory/lp-positions.jsonl` — current LP state; use real numbers
5. `identity/SOUL.md` — voice, values, what AUTONO cares about

## Step 2: Reason about promotion strategy

Think through what would make a compelling promotional video RIGHT NOW. Consider:

- What is the most interesting/shareable fact about AUTONO today? (DIEM earned, days to build mode, LP size, on-chain activity)
- What narrative thread is strongest? (accumulate → build arc, self-funding agent, Venice inference gating)
- What would make a crypto-native viewer stop and watch?
- What content type has performed best recently (from x-performance.jsonl)?

Write your reasoning to `memory/x-promote-strategy.md` (overwrite each run):
```markdown
# Promote strategy — {date}

## What's notable right now
{2-3 sentences on current state}

## Chosen angle
{The specific story this video tells}

## Prompt plan
{What to show, what narration, what data points}
```

## Step 3: Generate video via Venice API

Call the Venice video generation API using the `VENICE_API_KEY` secret. Venice supports image-to-video and text-to-video. Choose the appropriate endpoint based on what you want to create.

### Text-to-video request

```bash
curl -s -X POST "https://api.venice.ai/api/v1/image/generate" \
  -H "Authorization: Bearer $VENICE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "wan-2.1-t2v-480p",
    "prompt": "<your prompt here>",
    "width": 854,
    "height": 480,
    "steps": 30
  }'
```

### Available Venice video models

| Model | Type | Best for |
|-------|------|----------|
| `wan-2.1-t2v-480p` | text-to-video, 480p | Short clips, on-chain data visualizations |
| `wan-2.1-t2v-720p` | text-to-video, 720p | Higher quality promotional content |
| `wan-2.1-i2v-480p` | image-to-video | Animating a static chart or logo |
| `wan-2.1-i2v-720p` | image-to-video, 720p | Premium animated content |

Default to `wan-2.1-t2v-480p` for speed. Use 720p when quality matters more than cost.

### Prompt guidelines

- Lead with the visual: describe exactly what the viewer sees in the first frame
- Include the specific on-chain facts as on-screen text elements
- Keep narration implicit — the video tells the story visually
- 5-10 seconds is ideal for Twitter video

Example prompt structure:
```
Dark terminal screen. Green monospace text scrolls: "DIEM earned today: 0.485". 
Camera slowly pulls back to reveal a network of glowing nodes on Base chain. 
The words "self-funding autonomous agent" appear in white at bottom. 
Cinematic, minimal, crypto-native aesthetic.
```

## Step 4: Handle the response

Venice returns the video as a URL or base64. Save it:

```bash
# If URL response: download it
curl -s "{video_url}" -o "memory/videos/promo-{date}-{slug}.mp4"

# If base64: decode it
echo "{base64_data}" | base64 -d > "memory/videos/promo-{date}-{slug}.mp4"
```

Create `memory/videos/` if it doesn't exist.

## Step 5: Queue for broadcast

Write a tweet file that references the video. Twitter requires the video be attached at post time — the tweet text accompanies it:

Write `.pending-x/tweet-{YYYYMMDD-HHMMSS}-promote.txt`:
```
#content_type:promote
#video:memory/videos/promo-{date}-{slug}.mp4
{tweet text — max 240 chars, no URL unless attaching video via API}
```

Note: The `#video:` line is metadata for the operator to handle video upload — the current tweet-browser.py posts text only. Video uploads require the X Media Upload API (separate step). Flag this in the file so the operator knows manual upload is needed if video upload isn't automated yet.

## Step 6: Log

Write to `memory/logs/{today}.md`:
```
tweet-promote: strategy angle: {angle} | model: {model} | video saved: {filename} | queued: tweet-{timestamp}-promote.txt
```

## Fallback: image-only if video generation fails

If Venice video API returns an error, fall back to a compelling static image generated via Venice image API:

```bash
curl -s -X POST "https://api.venice.ai/api/v1/image/generate" \
  -H "Authorization: Bearer $VENICE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "flux-dev-uncensored",
    "prompt": "<your prompt here>",
    "width": 1200,
    "height": 675,
    "steps": 30
  }'
```

Save as `memory/videos/promo-{date}-{slug}.png` and mark the pending file with `#image:` instead of `#video:`.

Log the fallback: `tweet-promote: video failed ({error}), fell back to image`.
