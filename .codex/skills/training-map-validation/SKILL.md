---
name: training-map-validation
description: Use when creating, changing, or reviewing Doodle Shooter training arena map code, target layouts, practice structures, or traversal geometry.
---

# Training Map Validation

## Overview

Validate the Doodle Shooter training arena before claiming it is ready. This is a training-map-specific skill, not a generic map validation framework.

## When to Use

Use after adding or modifying `src/levels/training.js`, training target layouts, training structures, target orientation, grapple practice routes, or traversal geometry in the training arena. Also use when a user reports visual or playability problems in the training arena.

Do not use for other fixed maps, unrelated UI, weapon balance, networking, or non-map gameplay logic unless the change affects the training arena. Create a separate generic map validation skill later if broad map validation is needed.

## Workflow

1. Identify changed training map files and the affected training rules.
2. Run existing training map tests first.
3. Run the training map validator:

```bash
python3 .codex/skills/training-map-validation/scripts/validate_doodleshooter_training_map.py .
```

4. Treat reported findings as blockers unless there is a documented intentional exception.
5. For new recurring training map issues, add or update project tests so the same regression is caught inside the repository.
6. If visual confirmation is possible, load the training arena in-game after automated checks; if not, explicitly report that visual verification is pending.

## Training Arena Rules

The training arena should satisfy these invariants:

- training targets must be declared in `L.trainingTargets`;
- circular targets should be explicitly double-sided and not embedded in walls/backdrops;
- moving targets should be ground-level unless the design explicitly calls for aerial targets;
- decorative floating spheres or high platforms above the target lane should be removed unless they serve traversal;
- buildings used for training should have clear entry and exit openings on relevant floors;
- building interiors may use divider walls, but divider walls need clear door openings;
- elevated grapple practice platforms must have ground-connected supports and a stair or structural connection;
- grapple rings should belong to a readable training route instead of appearing as stray floating props;
- training houses should include multiple dummy targets, not a single isolated target;
- target death/respawn behavior should be visible and unambiguous.

## Common Mistakes

- Checking only syntax while missing visually obvious issues like floating props.
- Marking a target as `doubleSided` in data but not verifying the rendered geometry has front and back target faces.
- Adding stairs to a building without adding a corresponding door at the arrival floor.
- Reusing arena traversal props in a training range where they look like accidental floating geometry.
- Adding an elevated platform without supports or stairs and treating it as acceptable because grapple can reach it.
