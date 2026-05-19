Execute this requirement immediately without asking questions.

## REQUIREMENT

# Rank Progression Preview with Per-Level Scaling

## Metadata
- **Category**: functionality
- **Effort**: High (3/3)
- **Impact**: Unknown (7/3)
- **Scan Type**: feature_scout
- **Generated**: 3/21/2026, 6:50:30 PM

## Description
Add a rank progression table that computes and displays the effective stats for each ability at every rank (1 through MaxRank). For each rank, show cumulative BonusDamage, CooldownReduction, ManaCostReduction, and BonusMultiplier derived from FAbilityRankBonus. Include a sparkline chart showing the scaling curve and highlight diminishing returns or power spikes. Allow inline editing of PerRankBonus values with immediate preview. Inspired by Diablo IV skill rank tooltips and PoE gem level tables.

## Reasoning
The FAbilityRankBonus struct defines per-rank scaling but designers currently have no way to see the cumulative effect across all ranks without manual calculation. Every successful ARPG (Diablo, PoE, Last Epoch) provides rank-by-rank tooltips showing exactly what changes. This is a small effort feature that dramatically improves ability tuning confidence and catches exponential scaling bugs early.


## Recommended Skills

Use Claude Code skills as appropriate for implementation guidance. Check `.claude/skills/` directory for available skills.

## Notes

This requirement was generated from an AI-evaluated project idea. No specific goal is associated with this idea.

## DURING IMPLEMENTATION

- Use `get_memory` MCP tool when you encounter unfamiliar code or need context about patterns/files
- Use `report_progress` MCP tool at each major phase (analyzing, planning, implementing, testing, validating)
- Use `get_related_tasks` MCP tool before modifying shared files to check for parallel task conflicts

## AFTER IMPLEMENTATION

1. Log your implementation using the `log_implementation` MCP tool with:
   - requirementName: the requirement filename (without .md)
   - title: 2-6 word summary
   - overview: 1-2 paragraphs describing what was done
   - category: one of feature/bugfix/refactor/performance/security/infrastructure/ui/docs/test
   - patternsApplied: comma-separated patterns used (e.g. "repository pattern, debounce, memoization")

2. Verify: `npx tsc --noEmit` (fix any type errors)

Begin implementation now.