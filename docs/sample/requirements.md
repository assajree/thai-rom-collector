# Requirement — Chart 06: Raw Material Consumption vs Standard

> Status: **Ready for implementation.** All design decisions resolved — BOM-based standard, production line via `FR_LOC_CD`, unit cost via `TBM_COST_STANDARD_EXT`, period filter = Year + Month picker.
> Mockup: `mockup/erp_dashboard.html` (card #06) + `mockup/rm_consumption_drilldown.html` (full drill-down).
> Read `AGENTS.md` and `docs/dashboard-charts.md` first; read `sql/00_schema_reference.md` before writing SQL.

---

## 1. Purpose

Show how much raw material was **actually consumed** against the **standard (expected) usage**, so users can spot over-consumption, quantify its cost impact, and drill down to the responsible line and lot.

Primary users: production / cost control. Key question answered: *"Which materials are we burning more of than we should, on which line, and what does it cost us?"*

---

## 2. Scope

| In scope | Out of scope (for now) |
|----------|------------------------|
| Dashboard card (actual vs standard bars per material) | Real-time / live refresh |
| Drill-down window: 4 levels (materials → material → line → lot) | Editing standards from the UI |
| Variance %, absolute variance, cost impact | Forecasting future consumption |
| Category & period (weekly/monthly) filters | Root-cause auto-detection (mockup shows a static stub) |

---

## 3. Functional requirements

### 3.1 Dashboard card (#06 on the main page)
- Horizontal/vertical bar chart: per material, **Actual** vs **Standard**.
- Bar color by variance: **green** ≤ standard, **amber** +0–3% over, **red** > 3% over (matches `AttainmentToBrushConverter` direction but inverted meaning — over-consumption is bad; see §6).
- Two status pills (e.g. "+฿48.2K cost impact", "Rubber +3.1% over").
- Clicking the card opens the drill-down window.

### 3.2 Drill-down — Level 1: All materials (overview)
- KPI tiles: Total actual consumption, Standard (total), Over-consumption item count (`n / total`), Absolute variance (units).
- Filters: **Category** (Metal/Rubber/Chemical/Hardware/Plastic…/All), **Year** (dropdown, default = current year), **Month** (dropdown, default = current month).
- Bar chart: actual vs standard per material; color by variance; click a bar → Level 2.
- Table per material: Material, Category, Actual, Standard, Variance % (+abs), Unit cost, **Cost impact** (`abs(actual−std) × unit_cost`), Status badge. Row click → Level 2.

### 3.3 Drill-down — Level 2: Single material
- KPI tiles: Total actual (with unit), Standard, **Cost impact**, Supplier + category.
- Chart A — **Consumption trend** (line): actual vs standard by week (W1–W4) within the selected month.
- Chart B — **Variance by week** (bar): `actual − std` per week, red when over / green when under.
- Table per production line: Line, Actual, Standard, Variance %, Abs variance, Cost impact, lot count. Row click → Level 3.

### 3.4 Drill-down — Level 3: Single line
- KPI tiles: Line actual, Standard, Lots processed, Cost impact.
- Bar chart: lot-by-lot actual vs standard; color by variance; click → Level 4.
- Table per lot: Lot ID, Date, Actual, Standard, Variance, Abs diff, Cost impact, Status. Row click → Level 4.

### 3.5 Drill-down — Level 4: Single lot
- KPI tiles: Lot actual, Standard, Abs variance, Cost impact.
- Lot information panel: Lot ID, Material, Line, Date, Supplier, Status.
- Single comparison bar: Actual vs Standard.
- Root-cause section: in the mockup this is a **static stub** driven by variance band. Treat as placeholder text unless a real cause source is defined.

### 3.6 Cross-cutting
- Breadcrumb navigation across the 4 levels (All materials › Material › Line › Lot).
- Variance helpers: variance% = `(actual − std) / std × 100`; bands: `>3%` critical (red), `>0%` warning (amber), `≤0%` ok (green).
- Cost impact always = `abs(actual − std) × unit_cost`.

---

## 4. Data source mapping (FLEX_EXT)

| Need | Source (proposed) | Notes |
|------|-------------------|-------|
| **Actual consumption** (qty) by item + line + lot | `TB_WORK_RESULT_TRANS_IN_EXT` (`ITEM_CD`, `QTY`, `LOT_NO`) | Join to header via `WORKRESULT_NO`. This is the primary actual consumption source — replaces `rep.vw_rep_inventory_movement` for this chart. |
| **Production line** | `TB_WORK_RESULT_TRANS_H_EXT.FR_LOC_CD` | ✅ Confirmed — direct line field (e.g. `Press`, `Weld`, `Finishing`). Join header to detail via `WORKRESULT_NO`. |
| **Produced qty** (for standard calculation) | `TB_WORK_RESULT_TRANS_H_EXT.PRODUCTION_QTY` | Finished good qty produced per work result. Used to compute `std_qty = (LOWER_QTY / UPPER_QTY) × PRODUCTION_QTY`. |
| **BOM link** | `TB_WORK_RESULT_TRANS_H_EXT.BOM_CD` → `TB_BOM_MS_EXT.BOM_CD` | Direct BOM_CD on work result header — clean join to standard qty. |
| Item name / category | `TB_ITEM_MS` (`ITEM_DESC`, `ITEMCATEGORYID`) | Join for material name + category filter. |
| Lot | `TB_WORK_RESULT_TRANS_IN_EXT.LOT_NO` | Lot-level actual qty available directly. |
| Supplier | `TBM_VENDOR` via PO chain | Indirect; per material the "main supplier" is an approximation. |
| **Standard usage** | `TB_BOM_MS_EXT` (`LOWER_QTY / UPPER_QTY × PRODUCTION_QTY`) | ✅ Confirmed — 245 BOM rows. Formula: `std_qty = (LOWER_QTY / UPPER_QTY) × PRODUCTION_QTY`. `LOWER_ITEM_CD` = raw material, `UPPER_ITEM_CD` = finished good. |
| **Unit cost (standard)** | `TBM_COST_STANDARD_EXT` (`STANDARD_COST` per `ITEM_CD`, by `COST_YEAR`) | ✅ Table exists; currently empty — populate before go-live or fall back to movement `value/qty`. |

---

## 5. Open questions / decisions needed

1. ~~**Standard usage definition.**~~ ✅ **Resolved:** BOM-based via `TB_BOM_MS_EXT`. Formula: `std_qty = (LOWER_QTY / UPPER_QTY) × PRODUCTION_QTY`.

2. ~~**"Line" granularity.**~~ ✅ **Resolved:** Use `TB_WORK_RESULT_TRANS_H_EXT.FR_LOC_CD` — production line is stored directly on the work result header (e.g. `Press`, `Weld`, `Finishing`). Level 3 drill-down by line is fully supported.

3. ~~**Unit cost source.**~~ ✅ **Resolved:** Use `TBM_COST_STANDARD_EXT.STANDARD_COST` per `ITEM_CD` + `COST_YEAR` as primary. Fall back to movement `value/QTY` if standard cost table is empty.

4. ~~**Period semantics.**~~ ✅ **Resolved:** Filter = Year + Month picker (dropdowns). Default = current year + current month. Data scope = full calendar month (`YEAR = @year AND MONTH = @month`). Trend chart (Level 2) groups by ISO week within the selected month (W1–W4).

5. ~~**Root-cause section.**~~ Out of scope for v1.

> All decisions resolved. Ready for SQL/view implementation.

---

## 6. Proposed data contract

**Join chain for all levels:**
```sql
TB_WORK_RESULT_TRANS_H_EXT h         -- work result header (line, date, finished good, BOM)
  JOIN TB_WORK_RESULT_TRANS_IN_EXT i  -- actual RM consumed (item, qty, lot)
    ON h.WORKRESULT_NO = i.WORKRESULT_NO
  JOIN TB_BOM_MS_EXT b                -- standard qty per finished good
    ON h.BOM_CD = b.BOM_CD
   AND i.ITEM_CD = b.LOWER_ITEM_CD
  JOIN TB_ITEM_MS m ON i.ITEM_CD = m.ITEM_CD
  LEFT JOIN TBM_COST_STANDARD_EXT cs
    ON i.ITEM_CD = cs.ITEM_CD
   AND YEAR(h.PRODUCTION_DATE) = YEAR(cs.COST_YEAR)
```

New/extended DTOs in `DashboardDtos.cs`:

```
DashboardRmConsumptionDto       // overview row (Level 1)
  string  ItemCd
  string  ItemDesc
  string  Category
  string  Unit
  decimal ActualQty
  decimal StandardQty           // (LOWER_QTY / UPPER_QTY) × SUM(PRODUCTION_QTY)
  decimal VariancePct           // (actual - std) / std × 100
  decimal AbsVariance           // actual - std
  decimal UnitCost              // from TBM_COST_STANDARD_EXT or fallback
  decimal CostImpact            // abs(actual - std) × unit_cost

DashboardRmConsumptionTrendDto  // Level 2 trend (period, actual, std)
  string  Period                // e.g. "W1", "Jan"
  decimal ActualQty
  decimal StandardQty

DashboardRmConsumptionLineDto   // Level 3 line rollup
  string  LineCode              // FR_LOC_CD
  decimal ActualQty
  decimal StandardQty
  decimal VariancePct
  decimal CostImpact
  int     LotCount

DashboardRmConsumptionLotDto    // Level 4 lot detail
  string  LotNo
  string  WorkResultNo
  DateTime ProductionDate
  decimal ActualQty
  decimal StandardQty
  decimal VariancePct
  decimal CostImpact
```

New service methods in `IDashboardDataSvc` / `DashboardDataSvc` (T-SQL via `Query<T>`, `SqlParameter`):

```
List<DashboardRmConsumptionDto>      GetRmConsumption(string category, int year, int month)
List<DashboardRmConsumptionTrendDto> GetRmConsumptionTrend(string itemCd, int year, int month)
List<DashboardRmConsumptionLineDto>  GetRmConsumptionByLine(string itemCd, int year, int month)
List<DashboardRmConsumptionLotDto>   GetRmConsumptionLots(string itemCd, string lineCode, int year, int month)
```

---

## 7. UI / implementation notes

- WPF + Telerik (`RadCartesianChart` + `BarSeries`, `LineSeries`; tables via `RadGridView`); **not** Chart.js.
- Drill-down window follows the `ProdPlanDrillDownWindow` pattern (selection-changed handler opens the next level; KPI tiles refresh).
- Color palette matches the mockup: blue `#378ADD`, green `#1D9E75`, amber `#EF9F27`, red `#E24B4A`, grey `#D3D1C7`.
- A new variance-based color converter may be needed (over-consumption = bad), or invert/parameterize the existing `AttainmentToBrushConverter`.
- Follow loader rules: wrap in try/catch → `OnError(ex)`, `Proxy.Release(svc)` in `finally`, never throw to UI.

---

## 8. Acceptance criteria

- [ ] Card #06 renders actual vs standard per material with correct variance coloring.
- [ ] Clicking the card opens the drill-down at Level 1.
- [ ] Year + Month dropdowns filter all levels; default = current year/month.
- [ ] Category filter re-queries and updates chart + table + KPIs.
- [ ] Variance %, absolute variance, and cost impact match the §3.6 formulas.
- [ ] Drill navigation + breadcrumb work across all 4 levels.
- [ ] Level 2 trend chart groups by ISO week (W1–W4) within the selected month.
- [ ] Level 3 groups by `FR_LOC_CD` (production line).
- [ ] Level 4 shows lot-level detail from `TB_WORK_RESULT_TRANS_IN_EXT.LOT_NO`.
- [ ] All numbers come from service methods; no business logic in code-behind.
- [ ] Standard qty derived from `TB_BOM_MS_EXT` and consistent across all levels.
