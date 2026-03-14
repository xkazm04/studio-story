---
phase: 07
slug: story-data-and-authoring
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-14
---

# Phase 07 -- Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.x |
| **Config file** | vitest.config.ts (workspace with @dzin/core + host-app projects) |
| **Quick run command** | `npx vitest run --project @dzin/core` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --project @dzin/core`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 07-01-01 | 01 | 1 | STORY-01 | type-check | `npx tsc --noEmit` | n/a | pending |
| 07-01-02 | 01 | 1 | STORY-01,02,03 | type-check | `npx tsc --noEmit` | n/a | pending |
| 07-01-03 | 01 | 1 | STORY-03 | type-check | `npx tsc --noEmit` | n/a | pending |
| 07-02-01 | 02 | 2 | STORY-03 | type-check | `npx tsc --noEmit` | n/a | pending |
| 07-02-02 | 02 | 2 | STORY-03 | type-check | `npx tsc --noEmit` | n/a | pending |
| 07-03-01 | 03 | 2 | STORY-04 | type-check | `npx tsc --noEmit` | n/a | pending |
| 07-03-02 | 03 | 2 | STORY-04 | type-check | `npx tsc --noEmit` | n/a | pending |
| 07-04-01 | 04 | 3 | STORY-01,02,03,04 | type-check | `npx tsc --noEmit` | n/a | pending |
| 07-04-02 | 04 | 3 | STORY-01,02,03,04 | type-check | `npx tsc --noEmit` | n/a | pending |

*Status: pending / green / red / flaky*

**Note:** Behavioral unit tests are deferred to `/gsd:verify-work`. This phase's tasks are primarily wiring (MCP tools, panel registration, TipTap extensions, LLM prompt updates) where type-checking is the meaningful automated gate. Integration tests for LLM composition behavior require a live Claude CLI session and are covered in the Manual-Only section below.

---

## Wave 0 Requirements

- [x] Test infrastructure exists from prior phases -- no new framework install needed
- [ ] Type-checking via `npx tsc --noEmit` covers all task verification

*Existing infrastructure covers all phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| LLM composes panels contextually when user describes story | STORY-01 | Requires live Claude CLI + LLM reasoning | Chat "I want to write a mystery set in 1920s Paris", verify panels compose |
| Relationship map renders faction clusters visually | STORY-03 | Visual layout verification | Create 3+ characters in 2 factions, open map, verify cluster grouping |
| Screenplay formatting in scene editor | STORY-04 | Visual formatting verification | Type INT. CASTLE - NIGHT, verify scene heading formatting |
| "Show me the castle scene with Elena" composes correct panels | STORY-01+04 | Requires live LLM + entity matching | Chat the query, verify SceneEditor + CharacterDetail compose |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify commands
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
