# Spec — Chart NN: {Chart name}  *(Fast path)*

> **Fast path** — use this single file when the view / DTO / service already exists and you are mostly
> binding a new chart or making a small change. If a new reporting view or non-trivial logic is needed,
> stop and switch to the Full path (`requirements.md` → `design.md` → `tasks.md`). See `rules/ai-workflow.md`.
>
> Mockup: `mockup/erp_dashboard.html` (card #NN){, drill-down: `mockup/{name}_drilldown.html`}.
> Read `AGENTS.md` and `docs/dashboard-charts.md` first; read `sql/00_schema_reference.md` before writing SQL.

---

## 1. Requirements (short)

**Purpose:** {one sentence — what question the chart answers and for whom.}

**Scope:** {what this change covers; note anything explicitly out of scope.}

**Acceptance criteria:**
- [ ] {Card #NN renders … with correct values/coloring.}
- [ ] {Filters / drill-down behave as in the mockup.}
- [ ] All numbers come from the SQL view + service — no business logic in code-behind.

---

## 2. Design (short)

**Reuse first — what already exists:**

| Need | Existing artifact | Reuse / extend? |
|------|-------------------|-----------------|
| View | `rep.vw_rep_{...}` | reuse |
| DTO  | `Dashboard{...}Dto` in `DashboardDtos.cs` | reuse / add field `{...}` |
| Service method | `IDashboardDataSvc.Get{...}(...)` | reuse / add `{...}` |
| Converter / palette | `{...}Converter` | reuse |

**Data contract** (only the *new or changed* pieces — column aliases must match DTO properties, PascalCase):

```
Dashboard{...}Dto
  string  {Prop}
  decimal {Prop}
  ...

// service signature (T-SQL via Query<T>, always SqlParameter):
List<Dashboard{...}Dto> Get{...}(... params)
```

**SQL location** (per the SQL persistence rule — persist immediately):
- View / proc DDL → one file per object: `sql/views/rep.vw_rep_{name}.sql` (use `CREATE OR ALTER VIEW`).
- Service-layer query strings stay in `DashboardDataSvc.cs` only — do **not** copy them to a `.sql` file.

**Correctness:** {the one invariant that matters, e.g. "displayed totals match `rep.vw_rep_{...}`".}

**Error / empty handling:** {no rows → empty chart message; WCF fault → `OnError(ex)`, `Proxy.Release(svc)` in `finally`, never throw to UI.}

---

## 3. Tasks

- [ ] 1. SQL — verify / extend the view; save DDL to `sql/views/rep.vw_rep_{name}.sql` (`CREATE OR ALTER VIEW`). Service query strings live in C# only.
- [ ] 2. DTO — add/extend `Dashboard{...}Dto` (aliases match SELECT).
- [ ] 3. Service — add/extend method in `IDashboardDataSvc` + `DashboardDataSvc` (`SqlParameter`, no string concat).
- [ ] 4. XAML — bind the Telerik chart (`RadCartesianChart` / `RadPieChart` / `RadGridView`); colors via converter only.
- [ ] 5. Code-behind — wire load (sync, `Mouse.OverrideCursor = Wait`); try/catch → `OnError`, release proxy in `finally`.
- [ ] 6. {Drill-down — follow the `ProdPlanDrillDownWindow` pattern, if any.}

---

## 4. Verification checklist (manual — primary acceptance gate)

> This project loads data synchronously on the UI thread and has no chart test harness, so manual
> verification is the acceptance gate. Run the app and confirm:

- [ ] Chart loads and renders the expected series.
- [ ] On-screen totals/series match the SQL view (`rep.vw_rep_{...}` / the new query) for the same params.
- [ ] Filters re-query and update chart + table + KPIs.
- [ ] {Drill-down opens to the right level; breadcrumb works.}
- [ ] Empty-data and service-error states behave gracefully (no crash, no thrown exception to UI).

---

> **Living-spec rule:** if anything here changes during implementation (a DTO field, service signature,
> data contract, or acceptance criterion), update this file in the same change. Code and spec must never drift apart.
