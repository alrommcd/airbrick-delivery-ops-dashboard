import React, { useEffect, useMemo, useRef, useState } from "react";
import roleGateBg from "./assets/role-gate-bg.png";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

/* ============================================================
   MOCK DATA — all hardcoded, no backend
   ============================================================ */

const BASELINE_LOW_DAYS = 42; // 6 weeks
const BASELINE_HIGH_DAYS = 70; // 10 weeks
const BASELINE_MID_DAYS = (BASELINE_LOW_DAYS + BASELINE_HIGH_DAYS) / 2; // 56

const CITY_COLORS = {
  Bengaluru: "#1baf7a",
  "Delhi NCR": "#e87ba4",
  Mumbai: "#4a3aa7",
  Pune: "#eb6834",
};

const CITIES = [
  {
    name: "Bengaluru",
    avgDelayDays: 4,
    topCause: "Vendor material delays",
    projectsDelivered: 9,
  },
  {
    name: "Delhi NCR",
    avgDelayDays: 11,
    topCause: "Approval bottlenecks",
    projectsDelivered: 7,
  },
  {
    name: "Mumbai",
    avgDelayDays: 6,
    topCause: "Vendor onboarding delays",
    projectsDelivered: 6,
  },
  {
    name: "Pune",
    avgDelayDays: 2,
    topCause: "Minor design change requests",
    projectsDelivered: 5,
  },
];

const MONTHS = ["Mar", "Apr", "May", "Jun", "Jul"];

const TREND_DATA = {
  Bengaluru: [11.4, 10.2, 9.1, 8.0, 7.1], // improving
  "Delhi NCR": [16.8, 17.5, 18.3, 19.0, 19.6], // worsening
  Mumbai: [13.5, 12.6, 11.9, 11.2, 10.7], // mild improvement
  Pune: [4.3, 4.0, 3.9, 3.7, 3.6], // flat, healthy
};

const CAUSE_HISTORY = {
  Bengaluru: [
    { month: "May", cause: "Vendor material delays" },
    { month: "Jun", cause: "Vendor material delays" },
    { month: "Jul", cause: "Vendor material delays" },
  ],
  "Delhi NCR": [
    { month: "May", cause: "Approval bottlenecks" },
    { month: "Jun", cause: "Approval bottlenecks" },
    { month: "Jul", cause: "Approval bottlenecks" },
  ],
  Mumbai: [
    { month: "May", cause: "Vendor onboarding delays" },
    { month: "Jun", cause: "Design change requests" },
    { month: "Jul", cause: "Vendor onboarding delays" },
  ],
  Pune: [
    { month: "May", cause: "Minor design change requests" },
    { month: "Jun", cause: "Sourcing delay" },
    { month: "Jul", cause: "Logistics delay" },
  ],
};

const CAUSE_CATEGORIES = [
  { value: "Sourcing", color: "#475569" },
  { value: "Logistics", color: "#6366F1" },
  { value: "Approvals", color: "#7C3AED" },
  { value: "Design Change", color: "#DB2777" },
  { value: "Onboarding", color: "#0891B2" },
];

const ESCALATIONS = [
  { id: 1, severity: "Hot", city: "Bengaluru", cause: "Sourcing", description: "Steel framing vendor missed delivery window by 9 days", slaMet: false },
  { id: 2, severity: "Warm", city: "Bengaluru", cause: "Onboarding", description: "New HVAC subcontractor onboarding paperwork delayed", slaMet: true },
  { id: 3, severity: "Cool", city: "Bengaluru", cause: "Design Change", description: "Client requested minor lighting layout tweak", slaMet: true },
  { id: 4, severity: "Hot", city: "Delhi NCR", cause: "Approvals", description: "Fire NOC approval stuck at municipal authority for 3 weeks", slaMet: false },
  { id: 5, severity: "Hot", city: "Delhi NCR", cause: "Approvals", description: "Structural sign-off pending from empanelled architect", slaMet: false },
  { id: 6, severity: "Warm", city: "Delhi NCR", cause: "Logistics", description: "Glass partition shipment held at state border checkpost", slaMet: true },
  { id: 7, severity: "Warm", city: "Delhi NCR", cause: "Sourcing", description: "Modular furniture vendor quoting 2-week lead time increase", slaMet: false },
  { id: 8, severity: "Hot", city: "Mumbai", cause: "Onboarding", description: "Electrical contractor failed compliance verification, re-onboarding in progress", slaMet: false },
  { id: 9, severity: "Warm", city: "Mumbai", cause: "Sourcing", description: "AC ducting material delayed at Mumbai port customs", slaMet: true },
  { id: 10, severity: "Cool", city: "Mumbai", cause: "Logistics", description: "Furniture delivery rescheduled by 2 days due to traffic restrictions", slaMet: true },
  { id: 11, severity: "Cool", city: "Pune", cause: "Design Change", description: "Reception desk finish changed from laminate to veneer", slaMet: true },
  { id: 12, severity: "Warm", city: "Pune", cause: "Sourcing", description: "Ceiling tile vendor short-supplied 15% of order", slaMet: true },
  { id: 13, severity: "Cool", city: "Pune", cause: "Approvals", description: "Local fire department walkthrough rescheduled", slaMet: true },
  { id: 14, severity: "Hot", city: "Delhi NCR", cause: "Design Change", description: "Client-side design freeze slipped again, third change order this month", slaMet: false },
];

const PROJECTS = [
  { city: "Bengaluru", name: "Whitefield Tech Park - Tower B Fit-out", progress: 75, status: "On Track" },
  { city: "Bengaluru", name: "Koramangala Corporate Suite", progress: 50, status: "On Track" },
  { city: "Bengaluru", name: "Outer Ring Road Campus Phase 2", progress: 25, status: "At Risk" },
  { city: "Delhi NCR", name: "Gurugram Cyber Hub Office", progress: 25, status: "Delayed" },
  { city: "Delhi NCR", name: "Noida Sector 62 IT Park", progress: 50, status: "At Risk" },
  { city: "Delhi NCR", name: "Aerocity Business Suite", progress: 75, status: "On Track" },
  { city: "Mumbai", name: "BKC Financial Tower Fit-out", progress: 50, status: "At Risk" },
  { city: "Mumbai", name: "Powai Tech Campus", progress: 75, status: "On Track" },
  { city: "Mumbai", name: "Andheri East Corporate Park", progress: 25, status: "On Track" },
  { city: "Pune", name: "Hinjewadi Phase 1 IT Office", progress: 90, status: "On Track" },
  { city: "Pune", name: "Kharadi Business Bay", progress: 75, status: "On Track" },
  { city: "Pune", name: "Viman Nagar Corporate Suite", progress: 50, status: "On Track" },
];

const WEEKLY_REPORTS = {
  Bengaluru:
    "Delay trend continues to improve, down from 11.4% to 7.1% over the past 5 months. Vendor material delays remain the primary blocker; procurement has escalated to two backup steel suppliers. 3 active projects, 1 flagged at-risk on Outer Ring Road Campus.",
  "Delhi NCR":
    "Delay % has worsened for the third straight month, now at 19.6% against the 6-10 week baseline. Approval bottlenecks at the municipal level remain unresolved across two Hot escalations. Recommend executive escalation to unblock Fire NOC clearance.",
  Mumbai:
    "Delay holding around 10-11%, driven by vendor onboarding friction on electrical compliance. One Hot escalation open on contractor re-verification. Two of three active projects remain on track.",
  Pune:
    "Best-performing city this quarter at 3.6% delay, all projects on track or ahead. Only minor design-change requests logged, no open Hot escalations.",
};

const SEVERITY_COLORS = { Hot: "#DC2626", Warm: "#D97706", Cool: "#64748B" };
const SEVERITY_ORDER = { Hot: 0, Warm: 1, Cool: 2 };

/* ============================================================
   DERIVED HELPERS
   ============================================================ */

function delayPercent(city) {
  return (city.avgDelayDays / BASELINE_MID_DAYS) * 100;
}

function severityForDelay(pct) {
  if (pct >= 15) return "Hot";
  if (pct >= 8) return "Warm";
  return "Cool";
}

function patternFlag(cityName) {
  const history = CAUSE_HISTORY[cityName] || [];
  const counts = {};
  history.forEach((h) => (counts[h.cause] = (counts[h.cause] || 0) + 1));
  let flaggedCause = null;
  let maxCount = 0;
  Object.entries(counts).forEach(([cause, count]) => {
    if (count >= 2 && count > maxCount) {
      flaggedCause = cause;
      maxCount = count;
    }
  });
  return { flagged: !!flaggedCause, cause: flaggedCause, count: maxCount };
}

function downloadCSV(rows, headers, filename) {
  const csv = [headers.join(",")]
    .concat(
      rows.map((r) =>
        headers
          .map((h) => `"${String(r[h] ?? "").replace(/"/g, '""')}"`)
          .join(",")
      )
    )
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/* ============================================================
   SMALL UI ATOMS
   ============================================================ */

function Dot({ color, size = 8 }) {
  return (
    <span
      style={{
        display: "inline-block",
        width: size,
        height: size,
        borderRadius: "50%",
        background: color,
        flexShrink: 0,
      }}
    />
  );
}

function StatusTag({ severity }) {
  const color = SEVERITY_COLORS[severity];
  return (
    <span className="status-tag" style={{ color, borderColor: color + "40", background: color + "14" }}>
      <Dot color={color} size={7} />
      {severity}
    </span>
  );
}

function DelayBar({ pct, maxPct = 25 }) {
  const severity = severityForDelay(pct);
  const color = SEVERITY_COLORS[severity];
  const width = Math.min(100, (pct / maxPct) * 100);
  return (
    <div className="delay-bar-wrap">
      <div className="delay-bar-track">
        <div className="delay-bar-fill" style={{ width: `${width}%`, background: color }} />
      </div>
      <span className="delay-bar-label" style={{ color }}>
        {pct.toFixed(1)}%
      </span>
    </div>
  );
}

function ProgressBar({ pct }) {
  return (
    <div className="progress-bar-wrap">
      <div className="progress-bar-track">
        <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="progress-bar-label">{pct}%</span>
    </div>
  );
}

function ProjectStatusTag({ status }) {
  const map = { "On Track": "#0ca30c", "At Risk": "#D97706", Delayed: "#DC2626" };
  const color = map[status] || "#64748B";
  return (
    <span className="status-tag" style={{ color, borderColor: color + "40", background: color + "14" }}>
      <Dot color={color} size={7} />
      {status}
    </span>
  );
}

/* ============================================================
   FILTER BAR
   ============================================================ */

function useClickOutside(ref, onOutside) {
  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) onOutside();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [ref, onOutside]);
}

function FilterDropdown({ id, label, dot, options, selected, onChange, openId, setOpenId, single }) {
  const ref = useRef(null);
  const isOpen = openId === id;
  useClickOutside(ref, () => {
    if (isOpen) setOpenId(null);
  });

  const isActive = single ? selected !== "all" : selected.length > 0;
  const summary = single
    ? options.find((o) => o.value === selected)?.label ?? "All"
    : selected.length === 0
    ? "All"
    : selected.length === 1
    ? selected[0]
    : `${selected.length} selected`;

  function toggleValue(value) {
    if (single) {
      onChange(value);
      setOpenId(null);
      return;
    }
    if (selected.includes(value)) onChange(selected.filter((v) => v !== value));
    else onChange([...selected, value]);
  }

  return (
    <div className="filter-dd" ref={ref}>
      <button
        className={`pill ${isActive ? "pill-active" : ""}`}
        onClick={() => setOpenId(isOpen ? null : id)}
        type="button"
      >
        {dot && <Dot color={dot} size={7} />}
        <span className="pill-label">{label}:</span>
        <span className="pill-value">{summary}</span>
        <span className="pill-caret">▾</span>
      </button>
      {isOpen && (
        <div className="filter-dd-menu">
          {options.map((opt) => {
            const checked = single ? selected === opt.value : selected.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                className={`filter-dd-item ${checked ? "checked" : ""}`}
                onClick={() => toggleValue(opt.value)}
              >
                <span className="filter-dd-check">{checked ? "✓" : ""}</span>
                {opt.color && <Dot color={opt.color} size={7} />}
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function FilterBar({ filters, setFilters, rowCount, rowLabel, onExport, showCityFilter = true }) {
  const [openId, setOpenId] = useState(null);

  const cityOptions = CITIES.map((c) => ({ value: c.name, label: c.name, color: CITY_COLORS[c.name] }));
  const causeOptions = CAUSE_CATEGORIES.map((c) => ({ value: c.value, label: c.value, color: c.color }));
  const severityOptions = ["Hot", "Warm", "Cool"].map((s) => ({ value: s, label: s, color: SEVERITY_COLORS[s] }));
  const dateOptions = [
    { value: "4m", label: "Last 4 months" },
    { value: "5m", label: "Last 5 months" },
  ];

  const hasActiveFilters =
    (showCityFilter && filters.cities.length > 0) || filters.causes.length > 0 || filters.severities.length > 0;

  function clearAll() {
    setFilters((f) => ({ ...f, cities: [], causes: [], severities: [] }));
  }

  return (
    <div className="filter-bar">
      <div className="filter-bar-left">
        {showCityFilter && (
          <FilterDropdown
            id="city"
            label="City"
            options={cityOptions}
            selected={filters.cities}
            onChange={(v) => setFilters((f) => ({ ...f, cities: v }))}
            openId={openId}
            setOpenId={setOpenId}
          />
        )}
        <FilterDropdown
          id="cause"
          label="Cause"
          options={causeOptions}
          selected={filters.causes}
          onChange={(v) => setFilters((f) => ({ ...f, causes: v }))}
          openId={openId}
          setOpenId={setOpenId}
        />
        <FilterDropdown
          id="severity"
          label="Severity"
          options={severityOptions}
          selected={filters.severities}
          onChange={(v) => setFilters((f) => ({ ...f, severities: v }))}
          openId={openId}
          setOpenId={setOpenId}
        />
        <FilterDropdown
          id="date"
          label="Trend range"
          dot="#14504A"
          single
          options={dateOptions}
          selected={filters.dateRange}
          onChange={(v) => setFilters((f) => ({ ...f, dateRange: v }))}
          openId={openId}
          setOpenId={setOpenId}
        />
        <button
          type="button"
          className={`pill pill-outline ${!hasActiveFilters ? "pill-disabled" : ""}`}
          onClick={clearAll}
          disabled={!hasActiveFilters}
        >
          Clear filters
        </button>
      </div>
      <div className="filter-bar-right">
        <span className="row-count">{rowCount} {rowLabel}</span>
        <button type="button" className="btn-primary" onClick={onExport}>
          Export CSV
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   KPI CARD ROW
   ============================================================ */

function KpiCard({ value, label, subtext, big }) {
  return (
    <div className="kpi-card">
      <div className={`kpi-value ${big ? "kpi-value-big" : ""}`}>{value}</div>
      <div className="kpi-label">{label}</div>
      {subtext && <div className="kpi-subtext">{subtext}</div>}
    </div>
  );
}

/* ============================================================
   CROSS-CITY TABLE (Founder)
   ============================================================ */

function CrossCityTable({ cities, onSelectCity }) {
  const [sortKey, setSortKey] = useState("delay");
  const [sortDir, setSortDir] = useState("desc");

  function sortBy(key) {
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  const sorted = useMemo(() => {
    const rows = [...cities];
    rows.sort((a, b) => {
      let av, bv;
      if (sortKey === "delay") {
        av = delayPercent(a);
        bv = delayPercent(b);
      } else if (sortKey === "projects") {
        av = a.projectsDelivered;
        bv = b.projectsDelivered;
      } else {
        av = a.name;
        bv = b.name;
      }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return rows;
  }, [cities, sortKey, sortDir]);

  function caret(key) {
    if (sortKey !== key) return "";
    return sortDir === "asc" ? " ▲" : " ▼";
  }

  return (
    <div className="card">
      <div className="card-header">Cross-city delay overview</div>
      <table className="data-table">
        <thead>
          <tr>
            <th onClick={() => sortBy("name")} className="sortable">City{caret("name")}</th>
            <th onClick={() => sortBy("delay")} className="sortable">% delay vs plan{caret("delay")}</th>
            <th>Top cause</th>
            <th onClick={() => sortBy("projects")} className="sortable">Projects delivered{caret("projects")}</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((c) => (
            <tr key={c.name} className="table-row-clickable" onClick={() => onSelectCity(c.name)}>
              <td>
                <span className="city-name-cell">
                  <Dot color={CITY_COLORS[c.name]} />
                  {c.name}
                </span>
              </td>
              <td style={{ minWidth: 170 }}>
                <DelayBar pct={delayPercent(c)} />
              </td>
              <td className="muted-cell">{c.topCause}</td>
              <td>{c.projectsDelivered}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {sorted.length === 0 && <div className="empty-state">No cities match the current filters.</div>}
    </div>
  );
}

/* ============================================================
   TREND CHART
   ============================================================ */

function TrendChart({ cityNames, dateRange }) {
  const [hidden, setHidden] = useState({});
  const monthCount = dateRange === "4m" ? 4 : 5;
  const months = MONTHS.slice(MONTHS.length - monthCount);

  const data = months.map((m, idx) => {
    const row = { month: m };
    cityNames.forEach((c) => {
      const series = TREND_DATA[c];
      row[c] = series[series.length - monthCount + idx];
    });
    return row;
  });

  function handleLegendClick(entry) {
    setHidden((h) => ({ ...h, [entry.value]: !h[entry.value] }));
  }

  return (
    <div className="card">
      <div className="card-header">Delay % trend over time</div>
      <div className="chart-hint">Click a legend item to hide/show a city</div>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="#E5E7EB" />
          <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#6B7280" }} axisLine={{ stroke: "#C3C2B7" }} tickLine={false} />
          <YAxis
            tick={{ fontSize: 12, fill: "#6B7280" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `${v}%`}
            width={40}
          />
          <Tooltip
            formatter={(value, name) => [`${value.toFixed(1)}%`, name]}
            contentStyle={{ borderRadius: 8, border: "1px solid #E5E7EB", fontSize: 13 }}
          />
          <Legend onClick={handleLegendClick} wrapperStyle={{ fontSize: 13, cursor: "pointer" }} />
          {cityNames.map((c) => (
            <Line
              key={c}
              type="monotone"
              dataKey={c}
              stroke={CITY_COLORS[c]}
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
              hide={!!hidden[c]}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ============================================================
   PATTERN FLAG PANEL
   ============================================================ */

function PatternFlagPanel({ cityNames }) {
  const flagged = cityNames.map((c) => ({ city: c, ...patternFlag(c) })).filter((f) => f.flagged);
  return (
    <div className="card">
      <div className="card-header">Recurring cause patterns (2+ months)</div>
      {flagged.length === 0 && <div className="empty-state">No recurring patterns in the selected cities.</div>}
      <div className="pattern-list">
        {flagged.map((f) => (
          <div key={f.city} className="pattern-item">
            <Dot color={CITY_COLORS[f.city]} />
            <div>
              <div className="pattern-city">{f.city}</div>
              <div className="pattern-cause">
                "{f.cause}" repeated {f.count} of the last 3 months
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   ESCALATION SUMMARY (Founder) + ESCALATION LIST (Ops)
   ============================================================ */

function EscalationSummary({ escalations }) {
  const counts = { Hot: 0, Warm: 0, Cool: 0 };
  let met = 0;
  escalations.forEach((e) => {
    counts[e.severity]++;
    if (e.slaMet) met++;
  });
  const pctResolved = escalations.length ? Math.round((met / escalations.length) * 100) : 0;
  const unresolvedHot = escalations.filter((e) => e.severity === "Hot" && !e.slaMet).length;

  return (
    <div className="card">
      <div className="card-header">Escalation summary</div>
      <div className="escalation-summary-row">
        <div className="escalation-count-tile">
          <div className="escalation-count-num" style={{ color: SEVERITY_COLORS.Hot }}>
            {unresolvedHot}
          </div>
          <span className="status-tag" style={{ color: SEVERITY_COLORS.Hot, borderColor: SEVERITY_COLORS.Hot + "40", background: SEVERITY_COLORS.Hot + "14" }}>
            <Dot color={SEVERITY_COLORS.Hot} size={7} />
            Unresolved Hot
          </span>
        </div>
        {["Warm", "Cool"].map((s) => (
          <div key={s} className="escalation-count-tile">
            <div className="escalation-count-num" style={{ color: SEVERITY_COLORS[s] }}>
              {counts[s]}
            </div>
            <StatusTag severity={s} />
          </div>
        ))}
        <div className="escalation-count-tile">
          <div className="escalation-count-num" style={{ color: "#14504A" }}>{pctResolved}%</div>
          <span className="muted-cell">Resolved within SLA</span>
        </div>
      </div>
    </div>
  );
}

function EscalationList({ escalations, title = "Live escalations" }) {
  const [showCool, setShowCool] = useState(false);
  const hot = escalations.filter((e) => e.severity === "Hot");
  const warm = escalations.filter((e) => e.severity === "Warm");
  const cool = escalations.filter((e) => e.severity === "Cool");

  function Item({ e }) {
    const color = SEVERITY_COLORS[e.severity];
    return (
      <div className="escalation-item" style={{ borderLeftColor: color }}>
        <div className="escalation-item-top">
          <StatusTag severity={e.severity} />
          <span className="muted-cell">{e.city}</span>
          <span className="cause-chip">{e.cause}</span>
        </div>
        <div className="escalation-desc">{e.description}</div>
        <div className="escalation-sla" style={{ color: e.slaMet ? "#0ca30c" : "#DC2626" }}>
          {e.slaMet ? "Resolved within SLA" : "SLA breached, unresolved"}
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">{title}</div>
      {hot.map((e) => (
        <Item key={e.id} e={e} />
      ))}
      {warm.map((e) => (
        <Item key={e.id} e={e} />
      ))}
      {cool.length > 0 && (
        <button type="button" className="cool-toggle" onClick={() => setShowCool((v) => !v)}>
          {showCool ? "Hide" : "Show"} {cool.length} Cool item{cool.length !== 1 ? "s" : ""} ▾
        </button>
      )}
      {showCool && cool.map((e) => <Item key={e.id} e={e} />)}
      {escalations.length === 0 && <div className="empty-state">No escalations match the current filters.</div>}
    </div>
  );
}

/* ============================================================
   PROJECT CHECKPOINT TRACKER + WEEKLY REPORT (Ops)
   ============================================================ */

function ProjectCheckpointTracker({ city }) {
  const projects = PROJECTS.filter((p) => p.city === city);
  return (
    <div className="card">
      <div className="card-header">Active project checkpoints</div>
      <table className="data-table">
        <thead>
          <tr>
            <th>Project</th>
            <th>Progress</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((p) => (
            <tr key={p.name}>
              <td>{p.name}</td>
              <td style={{ minWidth: 160 }}>
                <ProgressBar pct={p.progress} />
              </td>
              <td>
                <ProjectStatusTag status={p.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function WeeklyReportCard({ city }) {
  return (
    <div className="card">
      <div className="card-header">Weekly report summary</div>
      <p className="report-text">{WEEKLY_REPORTS[city]}</p>
    </div>
  );
}

/* ============================================================
   VIEWS
   ============================================================ */

function FounderView({ filteredCities, filteredEscalations, dateRange, onSelectCity }) {
  const totalActiveProjects = PROJECTS.length;
  const avgDelay =
    filteredCities.length > 0
      ? filteredCities.reduce((sum, c) => sum + delayPercent(c), 0) / filteredCities.length
      : 0;
  const cityNames = filteredCities.map((c) => c.name);
  const patternCount = cityNames.filter((c) => patternFlag(c).flagged).length;
  const unresolvedHot = filteredEscalations.filter((e) => e.severity === "Hot" && !e.slaMet).length;

  return (
    <>
      <div className="kpi-row">
        <KpiCard value={totalActiveProjects} label="Total active projects" subtext="across all cities" />
        <KpiCard
          value={`${avgDelay.toFixed(1)}%`}
          label="Avg company-wide delay"
          subtext="vs. 6-10 week baseline"
          big
        />
        <KpiCard value={patternCount} label="Cities with recurring pattern" subtext="same cause, 2+ months" />
        <KpiCard value={unresolvedHot} label="Unresolved Hot escalations" subtext="breaching SLA, current filters" />
      </div>
      <div className="grid-2">
        <CrossCityTable cities={filteredCities} onSelectCity={onSelectCity} />
        <PatternFlagPanel cityNames={cityNames} />
      </div>
      <TrendChart cityNames={cityNames.length ? cityNames : CITIES.map((c) => c.name)} dateRange={dateRange} />
      <EscalationSummary escalations={filteredEscalations} />
    </>
  );
}

function CityOpsView({ city, escalations, dateRange, onBack }) {
  const cityData = CITIES.find((c) => c.name === city);
  const pct = delayPercent(cityData);

  return (
    <>
      {onBack && (
        <button type="button" className="back-link" onClick={onBack}>
          ← Back to overview
        </button>
      )}
      <div className="kpi-row">
        <KpiCard value={`${pct.toFixed(1)}%`} label={`${city} delay vs plan`} subtext={`${cityData.avgDelayDays} days avg, 6-10wk baseline`} big />
        <KpiCard value={cityData.topCause} label="Top cause this quarter" />
        <KpiCard value={cityData.projectsDelivered} label="Projects delivered" subtext="this quarter" />
        <KpiCard
          value={escalations.filter((e) => e.severity === "Hot" && !e.slaMet).length}
          label="Unresolved Hot"
          subtext="in this city"
        />
      </div>
      <TrendChart cityNames={[city]} dateRange={dateRange} />
      <div className="grid-2">
        <EscalationList escalations={escalations} title={`${city} escalations`} />
        <div className="stack-col">
          <ProjectCheckpointTracker city={city} />
          <WeeklyReportCard city={city} />
        </div>
      </div>
    </>
  );
}

/* ============================================================
   HEADER + LANDING
   ============================================================ */

function Header({ role, setRole, unresolvedHot }) {
  return (
    <header className="app-header">
      <div className="app-header-left">
        <span className="logo-mark">AB</span>
        <span className="logo-word">AirBrick Infra</span>
      </div>
      <div className="app-header-right">
        <div className="role-toggle">
          <button
            type="button"
            className={role === "founder" ? "role-toggle-active" : ""}
            onClick={() => setRole("founder")}
          >
            Founder
          </button>
          <button
            type="button"
            className={role === "ops" ? "role-toggle-active" : ""}
            onClick={() => setRole("ops")}
          >
            City Ops Lead
          </button>
        </div>
        <div
          className="hot-badge"
          title="Total unresolved Hot escalations across all cities — always shown regardless of active filters or the current view. KPI cards and the escalation summary below show 'Unresolved Hot' scoped to your current filters/city instead."
        >
          <span className="hot-badge-num">{unresolvedHot}</span>
          <span className="hot-badge-label">Hot</span>
          <span className="hot-badge-sub">all cities</span>
        </div>
      </div>
    </header>
  );
}

function RoleGate({ onPick }) {
  return (
    <div className="role-gate">
      <div className="role-gate-inner">
        <span className="logo-mark logo-mark-lg">AB</span>
        <h1>AirBrick Infra</h1>
        <p className="role-gate-sub">Who's viewing this dashboard?</p>
        <div className="role-gate-buttons">
          <button type="button" className="role-gate-btn" onClick={() => onPick("founder")}>
            <span className="role-gate-btn-title">Founder</span>
            <span className="role-gate-btn-sub">Cross-city view, patterns, KPIs</span>
          </button>
          <button type="button" className="role-gate-btn" onClick={() => onPick("ops")}>
            <span className="role-gate-btn-title">City Ops Lead</span>
            <span className="role-gate-btn-sub">Single-city checkpoints and escalations</span>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   ROOT
   ============================================================ */

export default function AirbrickDashboard() {
  const [role, setRole] = useState(null);
  const [founderDrilldown, setFounderDrilldown] = useState(null);
  const [opsCity, setOpsCity] = useState("Bengaluru");
  const [opsCityMenuOpen, setOpsCityMenuOpen] = useState(false);
  const [filters, setFilters] = useState({ cities: [], causes: [], severities: [], dateRange: "5m" });

  const allHotUnresolved = ESCALATIONS.filter((e) => e.severity === "Hot" && !e.slaMet).length;

  const filteredCities = useMemo(
    () => CITIES.filter((c) => filters.cities.length === 0 || filters.cities.includes(c.name)),
    [filters.cities]
  );

  const filteredEscalations = useMemo(
    () =>
      ESCALATIONS.filter((e) => {
        if (filters.cities.length > 0 && !filters.cities.includes(e.city)) return false;
        if (filters.causes.length > 0 && !filters.causes.includes(e.cause)) return false;
        if (filters.severities.length > 0 && !filters.severities.includes(e.severity)) return false;
        return true;
      }),
    [filters]
  );

  if (!role)
    return (
      <>
        <style>{CSS}</style>
        <RoleGate onPick={setRole} />
      </>
    );

  const isFounderOverview = role === "founder" && !founderDrilldown;
  const activeCity = role === "founder" ? founderDrilldown : opsCity;
  // Single-city views are scoped by activeCity, not the (hidden) City multi-select filter,
  // so a stale cross-city filter can't silently zero out a city's own escalation list.
  const opsEscalations = activeCity
    ? ESCALATIONS.filter((e) => {
        if (e.city !== activeCity) return false;
        if (filters.causes.length > 0 && !filters.causes.includes(e.cause)) return false;
        if (filters.severities.length > 0 && !filters.severities.includes(e.severity)) return false;
        return true;
      })
    : filteredEscalations;

  const rowCount = isFounderOverview ? filteredCities.length : opsEscalations.length;
  const rowLabel = isFounderOverview ? (filteredCities.length === 1 ? "city" : "cities") : "escalations";

  function handleExport() {
    if (isFounderOverview) {
      downloadCSV(
        filteredCities.map((c) => ({
          City: c.name,
          "% Delay vs Plan": delayPercent(c).toFixed(1),
          "Top Cause": c.topCause,
          "Projects Delivered": c.projectsDelivered,
        })),
        ["City", "% Delay vs Plan", "Top Cause", "Projects Delivered"],
        "airbrick_cross_city_delay.csv"
      );
    } else {
      downloadCSV(
        opsEscalations.map((e) => ({
          Severity: e.severity,
          City: e.city,
          Cause: e.cause,
          Description: e.description,
          "SLA Met": e.slaMet ? "Yes" : "No",
        })),
        ["Severity", "City", "Cause", "Description", "SLA Met"],
        "airbrick_escalations.csv"
      );
    }
  }

  return (
    <div className="app-root">
      <style>{CSS}</style>
      <Header role={role} setRole={(r) => { setRole(r); setFounderDrilldown(null); }} unresolvedHot={allHotUnresolved} />
      <main className="app-main">
        {role === "ops" && (
          <div className="city-select-row">
            <FilterDropdown
              id="ops-city"
              label="City"
              single
              options={CITIES.map((c) => ({ value: c.name, label: c.name, color: CITY_COLORS[c.name] }))}
              selected={opsCity}
              onChange={setOpsCity}
              openId={opsCityMenuOpen ? "ops-city" : null}
              setOpenId={(id) => setOpsCityMenuOpen(id === "ops-city")}
            />
          </div>
        )}
        <FilterBar
          filters={filters}
          setFilters={setFilters}
          rowCount={rowCount}
          rowLabel={rowLabel}
          onExport={handleExport}
          showCityFilter={isFounderOverview}
        />
        {isFounderOverview ? (
          <FounderView
            filteredCities={filteredCities}
            filteredEscalations={filteredEscalations}
            dateRange={filters.dateRange}
            onSelectCity={(name) => setFounderDrilldown(name)}
          />
        ) : (
          <CityOpsView
            city={activeCity}
            escalations={opsEscalations}
            dateRange={filters.dateRange}
            onBack={role === "founder" ? () => setFounderDrilldown(null) : null}
          />
        )}
      </main>
    </div>
  );
}

/* ============================================================
   STYLES
   ============================================================ */

const CSS = `
  :root {
    --brand: #14504A;
    --brand-2: #1B5E56;
    --accent-blue: #2563EB;
    --bg: #FAFAFA;
    --card-bg: #FFFFFF;
    --border: #E5E7EB;
    --text: #1F2937;
    --text-muted: #6B7280;
    color-scheme: light;
  }
  * { box-sizing: border-box; }
  .app-root {
    font-family: -apple-system, "Segoe UI", system-ui, sans-serif;
    background: var(--bg);
    color: var(--text);
    min-height: 100vh;
  }
  .app-header {
    background: var(--brand);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 24px;
    position: sticky;
    top: 0;
    z-index: 20;
  }
  .app-header-left { display: flex; align-items: center; gap: 10px; }
  .logo-mark {
    background: rgba(255,255,255,0.15);
    width: 32px; height: 32px;
    border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    font-weight: 700; font-size: 13px;
  }
  .logo-mark-lg { width: 56px; height: 56px; font-size: 20px; border-radius: 14px; background: var(--brand); color: #fff; }
  .logo-word { font-weight: 600; letter-spacing: -0.01em; font-size: 15px; }
  .app-header-right { display: flex; align-items: center; gap: 16px; }
  .role-toggle {
    display: flex;
    background: rgba(255,255,255,0.12);
    border-radius: 999px;
    padding: 3px;
  }
  .role-toggle button {
    background: transparent;
    border: none;
    color: rgba(255,255,255,0.75);
    padding: 6px 14px;
    border-radius: 999px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
  }
  .role-toggle-active { background: #fff !important; color: var(--brand) !important; }
  .hot-badge {
    background: var(--accent-blue);
    color: #fff;
    border-radius: 10px;
    padding: 5px 12px;
    display: flex;
    flex-direction: column;
    align-items: center;
    line-height: 1.1;
    min-width: 48px;
  }
  .hot-badge-num { font-weight: 700; font-size: 16px; }
  .hot-badge-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.04em; opacity: 0.9; }
  .hot-badge-sub { font-size: 8px; text-transform: uppercase; letter-spacing: 0.03em; opacity: 0.75; margin-top: 1px; }
  .app-main { max-width: 1240px; margin: 0 auto; padding: 20px 24px 48px; }

  .role-gate {
    min-height: 100vh;
    display: flex; align-items: center; justify-content: center;
    background: var(--bg) url(${roleGateBg}) center center / cover no-repeat;
    font-family: -apple-system, "Segoe UI", system-ui, sans-serif;
    padding: 24px;
  }
  .role-gate-inner { text-align: center; max-width: 460px; }
  .role-gate-inner h1 { color: var(--text); font-size: 24px; margin: 16px 0 4px; letter-spacing: -0.01em; }
  .role-gate-sub { color: var(--text-muted); margin-bottom: 28px; font-size: 15px; }
  .role-gate-buttons { display: flex; gap: 16px; flex-wrap: wrap; justify-content: center; }
  .role-gate-btn {
    border: 1.5px solid var(--brand);
    background: #fff;
    color: var(--brand);
    border-radius: 12px;
    padding: 20px 28px;
    min-width: 190px;
    cursor: pointer;
    display: flex; flex-direction: column; gap: 4px;
    transition: background 0.15s, color 0.15s;
  }
  .role-gate-btn:hover { background: var(--brand); color: #fff; }
  .role-gate-btn-title { font-weight: 700; font-size: 16px; }
  .role-gate-btn-sub { font-size: 12.5px; opacity: 0.85; }

  .filter-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
    margin-bottom: 18px;
  }
  .filter-bar-left { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
  .filter-bar-right { display: flex; align-items: center; gap: 14px; }
  .row-count { font-size: 13px; color: var(--text-muted); }
  .city-select-row { margin-bottom: 12px; }

  .filter-dd { position: relative; }
  .pill {
    display: inline-flex; align-items: center; gap: 6px;
    background: #fff;
    border: 1px solid var(--border);
    border-radius: 999px;
    padding: 7px 14px;
    font-size: 13px;
    color: var(--text);
    cursor: pointer;
  }
  .pill-active { border-color: var(--brand); color: var(--brand); background: #EDF5F3; }
  .pill-outline { background: transparent; color: var(--text-muted); border-style: dashed; }
  .pill-disabled { opacity: 0.5; cursor: not-allowed; }
  .pill-label { color: var(--text-muted); font-weight: 500; }
  .pill-value { font-weight: 600; }
  .pill-caret { font-size: 10px; color: var(--text-muted); }

  .filter-dd-menu {
    position: absolute;
    top: calc(100% + 6px);
    left: 0;
    background: #fff;
    border: 1px solid var(--border);
    border-radius: 10px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.08);
    min-width: 220px;
    z-index: 30;
    padding: 6px;
  }
  .filter-dd-item {
    display: flex; align-items: center; gap: 8px;
    width: 100%;
    text-align: left;
    background: transparent;
    border: none;
    padding: 8px 10px;
    border-radius: 6px;
    font-size: 13.5px;
    cursor: pointer;
    color: var(--text);
  }
  .filter-dd-item:hover { background: #F3F4F6; }
  .filter-dd-item.checked { font-weight: 600; }
  .filter-dd-check { width: 14px; color: var(--brand); font-size: 12px; }

  .btn-primary {
    background: var(--brand);
    color: #fff;
    border: none;
    border-radius: 8px;
    padding: 9px 16px;
    font-size: 13.5px;
    font-weight: 600;
    cursor: pointer;
  }
  .btn-primary:hover { background: var(--brand-2); }

  .kpi-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
    gap: 14px;
    margin-bottom: 18px;
  }
  .kpi-card {
    background: var(--card-bg);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 18px 20px;
  }
  .kpi-value { font-size: 24px; font-weight: 700; color: var(--text); letter-spacing: -0.01em; }
  .kpi-value-big { font-size: 30px; color: var(--brand); }
  .kpi-label { font-size: 13px; color: var(--text); margin-top: 4px; font-weight: 500; }
  .kpi-subtext { font-size: 12px; color: var(--text-muted); margin-top: 2px; }

  .grid-2 {
    display: grid;
    grid-template-columns: 1.4fr 1fr;
    gap: 16px;
    margin-bottom: 16px;
    align-items: start;
  }
  @media (max-width: 900px) {
    .grid-2 { grid-template-columns: 1fr; }
  }
  .stack-col { display: flex; flex-direction: column; gap: 16px; }

  .card {
    background: var(--card-bg);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 18px 20px;
    margin-bottom: 16px;
  }
  .card-header {
    font-size: 14px;
    font-weight: 700;
    color: var(--brand);
    margin-bottom: 14px;
    letter-spacing: -0.005em;
  }
  .chart-hint { font-size: 11.5px; color: var(--text-muted); margin: -10px 0 8px; }

  .data-table { width: 100%; border-collapse: collapse; }
  .data-table th {
    text-align: left;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    color: var(--text-muted);
    font-weight: 600;
    padding: 8px 12px;
    border-bottom: 1px solid var(--border);
  }
  .data-table th.sortable { cursor: pointer; user-select: none; }
  .data-table td {
    padding: 14px 12px;
    border-bottom: 1px solid var(--border);
    font-size: 13.5px;
  }
  .data-table tr:last-child td { border-bottom: none; }
  .table-row-clickable { cursor: pointer; }
  .table-row-clickable:hover { background: #FAFBFB; }
  .city-name-cell { display: flex; align-items: center; gap: 8px; font-weight: 600; }
  .muted-cell { color: var(--text-muted); }

  .delay-bar-wrap { display: flex; align-items: center; gap: 8px; }
  .delay-bar-track { flex: 1; height: 6px; background: #EEF0EF; border-radius: 4px; overflow: hidden; min-width: 70px; }
  .delay-bar-fill { height: 100%; border-radius: 4px; }
  .delay-bar-label { font-size: 13px; font-weight: 700; width: 42px; text-align: right; font-variant-numeric: tabular-nums; }

  .progress-bar-wrap { display: flex; align-items: center; gap: 8px; }
  .progress-bar-track { flex: 1; height: 6px; background: #EEF0EF; border-radius: 4px; overflow: hidden; min-width: 70px; }
  .progress-bar-fill { height: 100%; border-radius: 4px; background: var(--brand); }
  .progress-bar-label { font-size: 13px; font-weight: 600; width: 36px; text-align: right; color: var(--text-muted); font-variant-numeric: tabular-nums; }

  .status-tag {
    display: inline-flex; align-items: center; gap: 5px;
    border: 1px solid;
    border-radius: 999px;
    padding: 3px 9px;
    font-size: 12px;
    font-weight: 600;
  }

  .empty-state { color: var(--text-muted); font-size: 13px; padding: 12px 0; }

  .pattern-list { display: flex; flex-direction: column; gap: 12px; }
  .pattern-item { display: flex; gap: 10px; align-items: flex-start; padding-top: 2px; }
  .pattern-city { font-weight: 600; font-size: 13.5px; }
  .pattern-cause { font-size: 12.5px; color: var(--text-muted); margin-top: 2px; }

  .escalation-summary-row { display: flex; gap: 24px; flex-wrap: wrap; }
  .escalation-count-tile { display: flex; flex-direction: column; gap: 6px; min-width: 90px; }
  .escalation-count-num { font-size: 22px; font-weight: 700; }

  .escalation-item {
    border-left: 3px solid;
    background: #FAFBFB;
    border-radius: 6px;
    padding: 10px 12px;
    margin-bottom: 8px;
  }
  .escalation-item-top { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; flex-wrap: wrap; }
  .cause-chip { font-size: 11.5px; color: var(--text-muted); background: #EEF0EF; padding: 2px 8px; border-radius: 999px; }
  .escalation-desc { font-size: 13.5px; color: var(--text); margin-bottom: 4px; }
  .escalation-sla { font-size: 11.5px; font-weight: 600; }
  .cool-toggle {
    background: transparent; border: none; color: var(--text-muted);
    font-size: 12.5px; cursor: pointer; padding: 6px 0; text-align: left;
  }

  .report-text { font-size: 13.5px; color: var(--text); line-height: 1.6; margin: 0; }

  .back-link {
    background: transparent; border: none; color: var(--brand);
    font-weight: 600; font-size: 13.5px; cursor: pointer;
    padding: 0 0 12px; display: inline-block;
  }
`;
