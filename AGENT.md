Read [PROJECT.md](./PROJECT.md) before acting in this repository.

### Unified Agent Skills Versioning
If you need to create or modify skills (like `create-scene`), do NOT edit the target files in `.agents/skills/`, `.claude/skills/`, or `.codex/skills/` directly.

Instead:
1. Edit the source templates inside the `skills/` directory (e.g., [skills/create-scene/skill.md](file:///Users/fausto/Software/ScienceClick2/skills/create-scene/skill.md) or its config).
2. Run the sync script to regenerate the model-specific versions:
   ```bash
   ./scripts/sync-skills.py
   ```
