## AI Workflow -- Spec-driven development

> See `rules/ai-workflow.md` for the full 3-phase workflow (Design -> Tasks -> Implementation).

### AGENTS.md content-splitting rule

Split a section out of this file into its own `rules/*.md` file (referenced back with a plain backtick path, e.g. `` `rules/foo.md` `` — not an `@`-import, which auto-loads into every session's context and wastes tokens on unrelated tasks) when **both** of these hold:

- **Append-only / growing** — the section is a running log of learnings (e.g. gotchas discovered from live deploy errors) rather than a fixed, stable rule.
- **Not relevant to every task** — it only matters for a specific sub-area of work (e.g. HANA SQLScript syntax), not the project as a whole.

Keep a section inline in `AGENTS.md` when it's short and stable (a one-off convention or constraint that doesn't keep growing) and broadly relevant to most tasks in this repo — splitting those out just fragments the file without saving tokens.
