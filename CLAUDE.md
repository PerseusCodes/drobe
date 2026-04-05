# Drobe — Digital Wardrobe App

## Project overview

Drobe is a wardrobe app that helps users manage clothing inventory, get outfit recommendations, and maintain a clean, visually consistent wardrobe experience.

## Target audience

1. People wanting better clothing inventory management
2. People who need help putting together outfits and packing

## Core problems solved

1. Know what clothes you have at all times
2. Dress and pack for all occasions, reduce overthinking
3. Declutter by knowing when things were last used

## Key design principles

- Zara-style aesthetic: calming, clean, easy on the eyes
- Selective fonts and colors — nothing loud
- Carousel "racks" for browsing by category
- Background removal with consistent calming replacement background
- Care label scanning that works with blurry photos
- Offline-first with sync

## Architecture constraints

- Mobile-first: iOS + Android
- Offline-first with sync
- Image pipeline: background removal, Zara-style replacement, color grading correction
- Care label photo scanning must work with slightly blurry images
- All architectural decisions must be justified with trade-offs

## Agent workflow

- Use subagents in `.claude/agents/` for specialized work
- Cost router evaluates task complexity before spawning expensive agents
- UX errors escalate to Marko via Telegram (OpenClaw)
- Standby agents (marketing, business-finance) activate only on explicit request
- Max 3 agents active on any single task

## Model tiers

| Tier | Model | Use for |
|---|---|---|
| Strong | claude-opus-4-6 | Architecture, security review, hard synthesis |
| Medium | claude-sonnet-4-6 | Code gen, UI, ML planning, product decisions |
| Cheap | claude-haiku-4-5 | Docs, deployment scripts, QA checks, formatting |

## Current phase

Phase 1 — Architecture & Planning

## Approval gates

After each phase, Marko reviews and approves before moving to the next. Do not auto-advance phases.
