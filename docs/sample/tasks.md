# Implementation Plan: Chart 06 — Raw Material Consumption vs Standard

## Overview

Add dashboard card #06 and a 4-level drill-down window (All materials → material → line → lot) showing raw-material actual vs BOM-based standard consumption for a selected Year + Month. Work spans SQL reporting views (`rep.vw_rep_rm_consumption_*`), DTOs, WCF service methods, a variance color converter, the dashboard card, and the drill-down window. All numeric/business logic lives in the SQL views + service; XAML only binds + colors.

Reference: `docs/chart-06-rm-consumption/design.md`, `docs/chart-06-rm-consumption/requirements.md`. SQL artifacts: view DDL in `sql/views/rep.vw_rep_rm_consumption*.sql` (one file per view); service-layer queries live in `DashboardDataSvc.cs` only.

## Tasks

- [ ] 1. SQL: Reporting views (`rep` schema)
  - [x] 1.1 Verify schema assumptions before writing SQL
    - Read `sql/00_schema_reference.md`; confirm columns exist: `TB_WORK_RESULT_TRANS_H_EXT` (`WORKRESULT_NO`, `FR_LOC_CD`, `BOM_CD`, `PRODUCTION_QTY`, `PRODUCTION_DATE`, `DELETEFLAG`), `TB_WORK_RESULT_TRANS_IN_EXT` (`WORKRESULT_NO`, `ITEM_CD`, `QTY`, `LOT_NO`, `DELETEFLAG`, and price column for fallback), `TB_BOM_MS_EXT` (`BOM_CD`, `LOWER_ITEM_CD`, `LOWER_QTY`, `UPPER_QTY`), `TB_ITEM_MS` (`ITEM_CD`, `ITEM_DESC`, `ITEMCATEGORYID`), `TBM_COST_STANDARD_EXT` (`ITEM_CD`, `STANDARD_COST`, `COST_YEAR`, `DELETEFLAG`)
    - Resolve the `i.PRICE` fallback question (design §"Unit Cost Fallback"); use `TB_INV_TRANS_TR.PRICE` if absent. Ask the user if a column cannot be confirmed
    - _Requirements: 4 (data source mapping)_
    - **VERIFIED 2026-06-22 (vs live FLEX_EXT @ 192.168.11.72\flex):**
      - ✅ All H / IN / BOM / cost / item columns exist as named.
      - ⚠️ `TB_WORK_RESULT_TRANS_IN_EXT` has **NO `PRICE`/`QTY_VALUE`** → movement-avg fallback must use `TB_INV_TRANS_TR.PRICE`.
      - ⚠️ `TB_BOM_MS_EXT` has **NO `DELETEFLAG`** → drop that filter from the join chain.
      - ⚠️ `TBM_COST_STANDARD_EXT` is **empty (0 rows)** → `UnitCost` always comes from the fallback, not the standard table.
      - 🛑 **BLOCKER 1:** `PRODUCTION_QTY` (header) is **NULL in 59/66 rows (89%)** → design's `std_qty = (LOWER_QTY/UPPER_QTY) × PRODUCTION_QTY` is NULL for almost all data.
      - 🛑 **BLOCKER 2:** `TB_BOM_MS_EXT` is a **multi-level/process BOM** (one `BOM_CD` = many upper+lower items), not single-level raw→FG.
      - 🛑 **BLOCKER 3:** `TB_WORK_RESULT_TRANS_IN_EXT` **mixes produced + consumed rows** (produced = row where `ITEM_CD = h.ITEM_CD`; `TRANS_CLS`/`QTY_TYPE` do NOT separate them).
      - **Awaiting user decision** (see chat) before writing views 1.2–1.5. Best test period = 2025-03 (35 headers).
    - **DEEPER FINDING 2026-06-22 — design data source is WRONG:**
      - `TB_WORK_RESULT_TRANS_IN_EXT` is the **produced good** per work result, NOT consumption. Across all data, rows where `ITEM_CD <> produced item` total only 3 items (96 / 75 / 6 qty) → no usable RM consumption there.
      - ✅ Correct source = **`TB_WORK_RESULT_TRANS_OUT_EXT`** (material issued/consumed): has `ITEM_CD`, `QTY`, `LOT_NO`, `ISSUE_QTY` (actual), **`BOM_QTY` (standard, precomputed)**, `CONSUMTION_CLS`. 2025-03 = 13 RM matching the BOM; `BOM_QTY` filled in 177/183 rows. Makes the `(LOWER_QTY/UPPER_QTY)×PRODUCTION_QTY` formula unnecessary.
      - ⚠️ A prior run already created `rep.vw_rep_rm_consumption` (+ maybe `vw_CONSUMPTION_FINAL`) against the IN table — **buggy** (`DELETEFLAG <> 'Y'` no-op; unfiltered `TB_INV_TRANS_TR` join fans out & inflates ActualQty; uses null PRODUCTION_QTY). Must be replaced via `CREATE OR ALTER VIEW` (DROP not permitted on this connection).
      - **Pending design.md revision + tasks.md SQL rewrite once the user confirms the pivot to the OUT table.**

  > **Source pivot (resolved with user 2026-06-22):** all views read `TB_WORK_RESULT_TRANS_OUT_EXT o` (not the IN table). `ActualQty = SUM(o.QTY)`, `StandardQty = SUM(o.BOM_QTY)`. `DELETEFLAG <> '1'`. Replace the existing buggy `rep.vw_rep_rm_consumption` via `CREATE OR ALTER VIEW` (DROP not permitted).

  - [x] 1.2 Create `rep.vw_rep_rm_consumption` (Level 1 overview)
    - Aggregate per `ITEM_CD` + year/month: `ActualQty = SUM(o.QTY)`, `StandardQty = SUM(o.BOM_QTY)`, `UnitCost` = `ISNULL(MAX(stdcost), MAX(movcost), 0)` (stdcost/movcost pre-aggregated CTEs → no fan-out), `VariancePct` (NULL when StandardQty=0), `AbsVariance`, `CostImpact`
    - Expose `ItemCd`, `ItemDesc`, `Category` (`TBM_ITEMCATEGORY.DESCENG`), `Unit` (`INV_UM_CLS`), `YearNo`, `MonthNo` for service-side filtering
    - Save to `sql/chart-06-rm-consumption.sql` immediately
    - _Requirements: 3.1, 3.2, 3.6, 4_

  - [x] 1.3 Create `rep.vw_rep_rm_consumption_trend` (Level 2 weekly trend)
    - Group by ISO week within month: `WeekLabel = 'W' + CAST(DATEPART(iso_week, PRODUCTION_DATE) - DATEPART(iso_week, DATEFROMPARTS(YEAR(..),MONTH(..),1)) + 1 AS varchar(2))`, `ActualQty=SUM(o.QTY)`, `StandardQty=SUM(o.BOM_QTY)`; expose `ItemCd`, `YearNo`, `MonthNo`
    - Append to `sql/chart-06-rm-consumption.sql`
    - _Requirements: 3.3_

  - [x] 1.4 Create `rep.vw_rep_rm_consumption_line` (Level 3 line rollup)
    - Group by `LineCode = h.FR_LOC_CD` for a material: `ActualQty`, `StandardQty`, `VariancePct`, `AbsVariance`, `CostImpact`, `LotCount = COUNT(DISTINCT o.LOT_NO)`; expose `ItemCd`, `YearNo`, `MonthNo`
    - Append to `sql/chart-06-rm-consumption.sql`
    - _Requirements: 3.3, 3.4_

  - [x] 1.5 Create `rep.vw_rep_rm_consumption_lot` (Level 4 lot detail)
    - Per lot for a material + line: `LotNo = o.LOT_NO`, `WorkResultNo`, `ProductionDate`, `ActualQty`, `StandardQty`, `VariancePct`, `AbsVariance`, `CostImpact`; expose `ItemCd`, `LineCode`, `YearNo`, `MonthNo`
    - Append to `sql/chart-06-rm-consumption.sql`
    - _Requirements: 3.4, 3.5_

  - [x] 1.6 Validate views in SSMS / mssql against known data
    - Confirm views return rows for 2025-03; `StandardQty = SUM(BOM_QTY)`; week labels cover the month; `VariancePct` NULL (not error) when StandardQty=0 (Property 6)
    - Confirm Level 3 actual sums to Level 1 actual for the same material/period (Property 4); lot sums to line (testing strategy)
    - _Requirements: 3.2, 3.3, 3.6_
    - **VALIDATED 2026-06-22:** L1 = 13 materials for 2025-03; Property 4 holds (L1=L3=L4=82.2 for `20052-156`, no cost-join fan-out); trend W4/W5 sum to line total; UnitCost fallback + ISNULL(0) guard confirmed; zero-standard → NULL VariancePct.

- [x] 2. Checkpoint — SQL views verified
  - All four views return correct data; formulas match §3.6; divide-by-zero guarded. Ask the user if any data anomaly arises.

- [x] 3. Backend: DTOs and service
  - [x] 3.1 Add DTOs to `DashboardDtos.cs`
    - `DashboardRmConsumptionDto`, `DashboardRmConsumptionTrendDto`, `DashboardRmConsumptionLineDto`, `DashboardRmConsumptionLotDto` (PascalCase, matching view aliases). Done — DTOs appended with `[DataContract]`/`[DataMember]`.
    - _Requirements: 6 (data contract)_

  - [x] 3.2 Add operation contracts to `IDashboardDataSvc.cs`
    - 4 `[OperationContract]` + `[WebInvoke]` methods added matching the existing JSON-wrapped pattern.
    - _Requirements: 6_

  - [x] 3.3 Implement service methods in `DashboardDataSvc.cs`
    - One method per view via `Query<T>`; all params via `SqlParameter`; `@category = N'All'` skips the filter; `VariancePct = ISNULL(...,0)` for the non-nullable DTO. Service SQL also persisted to `sql/chart-06-rm-consumption.sql`.
    - _Requirements: 3.2, 3.6, 6_

- [ ] 4. Checkpoint — Service returns data
  - Integration smoke: `GetRmConsumption("All", year, month)` returns rows; `GetRmConsumption("NonExistentCategory", …)` returns empty list (no exception); lot sums match line row. Ask the user if questions arise.

- [x] 5. Frontend: Color converter
  - [x] 5.1 Add `OverConsumptionToBrushConverter` to `DashboardControl.xaml.cs`
    - `IValueConverter` on `VariancePct` (percent units): `≤ 0` → green `#1D9E75`, `(0, 3]` → amber `#EF9F27`, `> 3` → red `#E24B4A`; non-numeric → green. Registered as resource `OverConsumptionToBrushConverter` in `DashboardControl.xaml`.
    - _Requirements: 3.1, 3.6, 6_

- [x] 6. Frontend: Dashboard card #06
  - [x] 6.1 Add card #06 to `DashboardControl.xaml(.cs)`
    - `RadCartesianChart` (Row 4) with Actual `BarSeries` (fill via `OverConsumptionToBrushConverter` on `VariancePct`) + Standard `BarSeries` (grey); two status pills (total cost impact + worst material variance)
    - `LoadRmConsumption(svc)` added to the existing `LoadDashboardData` try/catch/finally (`Proxy.Release` in `finally`); defaults to current year/month (`_rmYear`/`_rmMonth`); empty-state handled
    - `MouseLeftButtonUp` → `OnRmConsumptionCardClick` opens `RmConsumptionDrillDownWindow(_rmYear, _rmMonth)`
    - ⚠️ References `RmConsumptionDrillDownWindow` (task 7) — solution compiles only once task 7 creates that window.
    - **Runtime fix 2026-06-22:** card defaulted to the current month (2026-06), which has no data → "no data to plot". Added `GetRmConsumptionLatestPeriod()` (+ `DashboardRmPeriodDto`) returning the latest year+month with data; card resolves to it on first load (falls back to current month when no data at all) and shows the resolved period next to the title. Latest data period = 2026-03.
    - _Requirements: 3.1_

- [x] 7. Frontend: Drill-down window
  - [x] 7.1 Create `RmConsumptionDrillDownWindow.xaml(.cs)` shell (Level 1)
    - `RadWindow(int year, int month)` following `ProdPlanDrillDownWindow`; Category/Year/Month `RadComboBox` (default passed-in year/month; category list built from data), breadcrumb panel, L1 `RadCartesianChart` (Actual via `OverConsumptionToBrushConverter` + Standard grey) + `RadGridView`, 4 KPI tiles (total actual, total standard, over-consumption count `n/total`, abs variance)
    - `OnFilterChanged` re-queries `GetRmConsumption`; `LoadLevel1` in try/catch → `OnError`, `Proxy.Release` in `finally`; empty-state handled. Registered in `Flex.csproj`. `DrillToMaterial` is a stub hook (filled in 7.2). This makes card #06 (task 6.1) compile.
    - _Requirements: 3.2, 3.6_

  - [x] 7.2 Level 2 — single material
    - `pnlLevel2`: Chart A `LineSeries` trend (actual+standard by week) + Chart B `BarSeries` variance-per-week (colored by `OverConsumptionToBrushConverter`) from `GetRmConsumptionTrend`; line table via `GetRmConsumptionByLine`; KPI tiles repurposed (Actual/Standard/Cost Impact/Category); `OnL2GridSelectionChanged` → `DrillToLine` (stub for 7.3)
    - **Trend view/DTO/service extended** with `VarianceQty` + `VariancePct` (needed for the variance-by-week bar) — `rep.vw_rep_rm_consumption_trend` re-altered, `DashboardRmConsumptionTrendDto` + `GetRmConsumptionTrend` + `sql/chart-06-rm-consumption.sql` updated; validated for `20052-156`/2025-03.
    - Navigation: shared KPI tiles via `SetKpis`; clickable breadcrumb (`RebuildBreadcrumb`/`AddCrumb`/`GoToLevel`); `ShowLevelPanel` toggles `pnlLevel1`/`pnlLevel2`
    - _Requirements: 3.3_

  - [x] 7.3 Level 3 — single line
    - `pnlLevel3`: `BarSeries` lot-by-lot (Actual colored by variance + Standard grey) + lot table from `GetRmConsumptionLots`; KPI tiles (Line Actual/Standard/Lots/Cost Impact); `OnL3ChartSelectionChanged` + `OnL3GridSelectionChanged` → `DrillToLot` (stub for 7.4)
    - `_selLot` field added; `ShowLevelPanel`/`GoToLevel` extended to L3; line crumb clickable; validated for `20052-156`/`COMP`/2025-03 (7 lot rows sum to line 82.2)
    - _Requirements: 3.4_

  - [x] 7.4 Level 4 — single lot
    - `pnlLevel4`: single comparison `BarSeries` (Actual vs Standard via 2-point `DashboardCategoryValueDto`, no extra service call) + lot info `StackPanel` (Lot/Material/Line/Work Result/Date/Variance); root-cause = static stub via `RootCauseText(variancePct)` band; KPI tiles (Lot Actual/Standard/Abs Variance/Cost Impact); lot crumb added
    - _Requirements: 3.5_

  - **Row-click drill (2026-06-22):** grids drill on a `GridViewRow.MouseLeftButtonUpEvent` (hit-tested via `FindParentRow`) instead of `SelectionChanged`, so re-clicking the same row after navigating back still drills. Removed the `SelectionChanged` handlers + the `ClearGridSelection` workaround. (Candidate standard for the common drill-down control spec.)

  - [x] 7.5 Breadcrumb navigation across all 4 levels
    - All Materials › Material › Line › Lot built incrementally in 7.2–7.4: `RebuildBreadcrumb`/`AddCrumb` render clickable crumbs for levels above the current; `GoToLevel(n)` (back-only) resets deeper state, refreshes that level's KPIs, toggles panels via `ShowLevelPanel`. Back-nav retains each level's already-loaded data (no reload). Verified: no stale KPI references after the shared-tile rename.
    - _Requirements: 3.6_

- [x] 8. Checkpoint — Full feature integration
  - Card #06 loads on startup; click opens L1; Year/Month/Category filter all levels; drill L1→L4 and breadcrumb back work; variance colors match bands; KPI tiles match table totals; all numbers from service (no code-behind business logic). Ask the user if questions arise.
  - **VERIFIED 2026-06-22:**
    - Solution compiles without errors (only file-lock copy warnings from running vshost.exe — not build errors).
    - `GetRmConsumptionLatestPeriod()` returns 2026-03 → card defaults to that period.
    - `GetRmConsumption("NonExistentCategory999", ...)` returns 0 rows (no exception).
    - Property 4 verified: L1 ActualQty = SUM(L3 ActualQty) for all 6 materials in 2026-03. All checks = OK.
    - Property 6 verified: `ALC_RM_H M 18S` has StandardQty=0 → VariancePct=NULL (no divide-by-zero).
    - All 5 service methods declared in `IDashboardDataSvc`, implemented in `DashboardDataSvc`, with `SqlParameter` (no string concatenation).
    - `OverConsumptionToBrushConverter`, `LoadRmConsumption`, `RmConsumptionDrillDownWindow` (all 4 levels + breadcrumb + row-click drill) confirmed present.

## Notes

- Each task references requirements for traceability; checkpoints gate backend → frontend.
- **SQL persistence rule:** each view's DDL is saved to its own file under `sql/views/` (`CREATE OR ALTER`) as it is written — never left only inside a C# string. Service-layer query strings stay in `DashboardDataSvc.cs` only.
- Standard qty formula `std_qty = (LOWER_QTY / UPPER_QTY) × PRODUCTION_QTY` must be identical across all four views (Property 1–4).
- Open verification item before SQL: confirm the unit-cost fallback price column (`i.PRICE` vs `TB_INV_TRANS_TR.PRICE`) — task 1.1.
- Drill-down follows the existing `ProdPlanDrillDownWindow` selection-changed pattern; charts are Telerik, never Chart.js.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3", "1.4", "1.5"] },
    { "id": 2, "tasks": ["1.6"] },
    { "id": 3, "tasks": ["3.1", "3.2"] },
    { "id": 4, "tasks": ["3.3"] },
    { "id": 5, "tasks": ["5.1", "6.1", "7.1"] },
    { "id": 6, "tasks": ["7.2", "7.3", "7.4"] },
    { "id": 7, "tasks": ["7.5"] }
  ]
}
```
