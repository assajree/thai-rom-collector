# AI Workflow — Spec-driven development

Each feature or chart is developed through three documents kept under `docs/{feature-name}/`:

```
docs/{feature-name}/
├── requirements.md   ← what to build (user stories + acceptance criteria)
├── design.md         ← how to build it (architecture, data contracts, correctness properties)
└── tasks.md          ← step-by-step implementation plan with checkbox status
```

> **Living-spec rule:** the spec document(s) are the source of truth and must stay in sync with the code.
> Whenever the spec changes mid-work — at any phase — go back and update the affected document(s) in the
> same change. Code and spec must never drift apart.

---

## Pick a track first — Fast path vs Full path

Not every feature needs all three documents. Choose the track before starting:

| Track | When | Documents |
|-------|------|-----------|
| **Fast path** | The view / DTO / service already exists and you are mostly binding a new chart or making a small change (the "quick wins" in `docs/dashboard-charts.md`). | **One file** — `docs/{feature}/spec.md` with a short *Requirements* section and a short *Design* section at the top, then the task checklist below. Skip the separate `requirements.md` / `design.md`. Start from the template at `docs/_templates/spec.md`. |
| **Full path** | A new reporting view is needed, the logic is non-trivial, or there is a drill-down. | All three — `requirements.md` → `design.md` → `tasks.md`, as described below. |

When unsure, start Fast and promote to Full only if the design grows. The SQL file convention and the Living-spec rule apply to **both** tracks.

---

## Phase 1 — Requirements (feature brief → requirements.md)

Read the feature brief (from the user or the mockup) then create `requirements.md` containing:
- **Overview** — one paragraph describing the feature and its purpose
- **User Stories** — numbered list (`1.`, `2.`, …) in *As a … I want … So that …* form
- **Acceptance Criteria** — one sub-list per user story, each item uniquely numbered (`1.1`, `1.2`, …) and testable

**Trigger:** "Read AGENTS.md, then execute Phase 1 — create `docs/{feature}/requirements.md`"

---

## Phase 2 — Design (requirements.md → design.md)

Read `requirements.md` then create `design.md` containing:
- **Overview** — one paragraph summarising the feature
- **Architecture** — data flow diagram (mermaid), component breakdown
- **Components and Interfaces** — DTOs, service methods, UI components with signatures
- **Data Models** — tables / fields involved, join chain
- **Correctness Properties** — the key invariants the numbers must satisfy (reference requirement IDs). Keep it practical — for most charts this is "the displayed totals/series match `rep.vw_rep_*`". Reserve formal/property-based phrasing for genuinely tricky logic.
- **Error Handling** — table of scenarios (e.g. no rows, null/invalid params, WCF fault / service unreachable, empty chart) and the expected UI behavior for each
- **Verification** — a **manual verification checklist** is the primary acceptance gate (this project loads data synchronously on the UI thread and has no chart test harness): e.g. load the view → compare on-screen totals against the SQL view → exercise the drill-down → check empty/error states. Add automated tests only when a relevant test project already exists.

**Trigger:** "Read AGENTS.md and `docs/{feature}/requirements.md`, then execute Phase 2 — create `docs/{feature}/design.md`"

---

## Phase 3 — Tasks (design.md → tasks.md)

Read `design.md` then create `tasks.md` containing:
- Numbered tasks with sub-tasks, each referencing requirement IDs (`_Requirements: X.Y_`)
- Checkbox `[ ]` per task — mark `[x]` immediately after completing it
- Checkpoint tasks at logical milestones (e.g. after backend, after frontend)
- **Task Dependency Graph** (JSON waves) — *optional*, only when work will be split across multiple parallel agents. For single-developer, one-chart-at-a-time work, skip it and just order the tasks top-to-bottom.

**Include manual validation / verification tasks** when they are part of the work — they should live in `tasks.md` as checklist items. Keep `design.md` focused on the design itself.

```markdown
- [ ] 1. Task group title
  - [ ] 1.1 Sub-task description
    - Implementation detail
    - _Requirements: 1.1, 2.3_
```

**Trigger:** "Read AGENTS.md and `docs/{feature}/design.md`, then execute Phase 3 — create `docs/{feature}/tasks.md`"

---

## Phase 4 — Implementation (tasks.md)

Execute tasks in order (top-to-bottom, or in wave order if a dependency graph was defined):
1. Read the task description and referenced requirements/design sections
2. Implement the task
3. Mark the task `[x]` in `tasks.md` immediately after completion
4. Do not skip tasks; stop and ask if a task is ambiguous
5. At checkpoint tasks, verify all previous tasks pass before continuing
6. **SQL persistence rule** — whenever you write or modify a **deployable object** (view / proc / function), save its DDL to `sql/views/{object}.sql` or `sql/procs/{object}.sql` immediately (one file per object, `CREATE OR ALTER`). Do not leave view/proc DDL only inside a C# string. Service-layer query strings stay in the C# service only — do not mirror them to `sql/`. See the SQL file convention below.
7. **Spec-sync rule** — if the spec changes during implementation (a DTO field, service signature, data contract, requirement, or correctness property differs from what `requirements.md` / `design.md` / `tasks.md` say), go back and update those documents in the same change so they match the real implementation. The spec docs must always reflect what was actually built — never let code and spec drift apart.

**Trigger:** "Read AGENTS.md and `docs/{feature}/tasks.md`, then execute Phase 4 — implement all tasks"

---

## SQL file convention

**Only deployable database objects (views, procs, functions) are persisted as `.sql` files** in the `sql/` folder.
Service-layer query strings (the SQL embedded in `DashboardDataSvc.cs`) live in the **C# code only** — do **not** copy them into a `.sql` file. They have a single source of truth in the service, and a duplicate file just drifts out of sync.

```
sql/
├── 00_schema_reference.md            ← verified schema reference (do not edit without confirmation)
├── views/
│   └── rep.vw_rep_{name}.sql         ← one file per view, named after the view
└── procs/
    └── {schema}.{proc_name}.sql      ← one file per stored proc / function
```

### Deployable objects (views, procs, functions) — one file per object

- File name **matches the object name** (schema-qualified), e.g. `sql/views/rep.vw_rep_rm_consumption.sql`.
- One object per file — a view is a real DB artifact with a stable identity and is often reused across features, so it must not be buried inside a feature file.
- Use **`CREATE OR ALTER VIEW`** (SQL Server 2016 SP1+) so the file is idempotent and can be re-run to deploy — no separate `DROP` needed.
- Put a header at the top of the file (created-for feature / short description / last-updated date):

  ```sql
  -- ============================================================
  -- rep.vw_rep_{name} | {short description}
  -- feature: {feature-name} | updated: {date YYYY-MM-DD}
  -- ============================================================
  ```

- **Update the same file in place** when the object changes, and bump the header date. The file must always reflect the **latest, deployed version** of the object.
- Persist the object file **immediately** after writing/altering the view or proc — do not leave view/proc DDL only inside a C# string or a chat message.

### Service-layer queries — code only

- The query strings inside service methods (`Query<T>` / `ExecuteStoreQuery<T>`) are NOT mirrored to `sql/`.
- The view they read from IS persisted (see above), so the durable SQL still lives in `sql/`; only the thin, parameter-applying SELECT wrappers stay in C#.

### Reference

- Reference the view/proc file path(s) in `design.md` (Data Models section) or `spec.md` so future agents know where to find the SQL.

---

## When spec files already exist

Spec files often already exist when a feature is extended (e.g. adding a drill-down to an implemented chart card).

**Default: create a new file with a descriptive suffix** — it is cheaper (no Read of the old file needed, only Write the new content) and keeps the original as an untouched reference for what was built.

```
requirements-drilldown.md   ← new work
requirements.md             ← original, implemented, leave untouched
```

Use the same suffix consistently across all three files for the same scope:
`requirements-drilldown.md` / `design-drilldown.md` / `tasks-drilldown.md`.

### When to Edit the existing file instead

Only edit in place when the change is **small** (a few lines) — use the `Edit` tool, not a full rewrite:

| Case | Action |
|------|--------|
| Fixing a typo or wrong value in an existing spec | Edit in place |
| Marking a task `[x]` as done | Edit in place |
| Adding a new section that is larger than ~20 lines | New file with suffix |
| Adding a whole new feature scope (drill-down, new level, new chart) | New file with suffix |

### tasks.md follows the same suffix as design.md

Always use the same suffix as the paired `design-<scope>.md`:

```
design-drilldown.md  →  tasks-drilldown.md
```

Do not append to an existing `tasks.md` — create a new file.

### Summary rule

> **Default: new file with suffix** (cheaper, clearer).
> **Edit in place only for small changes** (typo, checkbox, a few lines).
> When in doubt, new file wins.

---

## Reference examples

| File | Feature |
|------|---------|
| `docs/chart-06-rm-consumption/requirements.md` | Chart 06: RM Consumption vs Standard — requirements |
| `docs/chart-06-rm-consumption/design.md` | Chart 06: RM Consumption vs Standard — design |
| `docs/chart-06-rm-consumption/tasks.md` | Chart 06: RM Consumption vs Standard — tasks |
