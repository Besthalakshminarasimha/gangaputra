export type ScoreWater = { pond_id: string; recorded_at: string; ph: number | null; dissolved_oxygen: number | null; ammonia?: number | null; temperature?: number | null };
export type ScoreLog = { pond_id: string | null; log_date: string; feed_quantity: number | null; mortality_count: number | null };
export type ScoreHealth = { created_at: string };
export type ScorePond = { id: string; pond_name: string; species: string | null; stocking_date?: string | null; area_acres?: number | null };

export type ScoreFactor = { key: string; label: string; points: number; max: number; reasons: string[] };

const DAY = 86400000;
const daysAgo = (iso: string) => (Date.now() - new Date(iso).getTime()) / DAY;

/** Computes a 0–100 Farm Score only from recorded data. Missing data scores zero, never assumed good. */
export function computeFarmScore(ponds: ScorePond[], water: ScoreWater[], logs: ScoreLog[], health: ScoreHealth[]) {
  const factors: ScoreFactor[] = [];

  // Pond records (20)
  {
    const reasons: string[] = [];
    let pts = 0;
    if (ponds.length === 0) reasons.push("No ponds recorded yet.");
    else {
      pts += 10;
      reasons.push(`${ponds.length} pond(s) recorded.`);
      const complete = ponds.filter((p) => p.species && p.stocking_date).length;
      pts += Math.round((complete / ponds.length) * 10);
      if (complete < ponds.length) reasons.push(`${ponds.length - complete} pond(s) missing species or stocking date.`);
      else reasons.push("All ponds have species and stocking date.");
    }
    factors.push({ key: "ponds", label: "Pond records", points: pts, max: 20, reasons });
  }

  // Water quality (30)
  {
    const reasons: string[] = [];
    const recent = water.filter((w) => daysAgo(w.recorded_at) <= 7);
    let pts = 0;
    if (recent.length === 0) reasons.push("No water reading in the last 7 days.");
    else {
      const pondsCovered = new Set(recent.map((w) => w.pond_id)).size;
      const coverage = ponds.length ? Math.min(1, pondsCovered / ponds.length) : 1;
      pts += Math.round(coverage * 10);
      reasons.push(`${pondsCovered} of ${ponds.length || pondsCovered} pond(s) tested this week.`);
      const ok = recent.filter((w) => {
        const phOk = w.ph == null || (w.ph >= 7.5 && w.ph <= 8.5);
        const doOk = w.dissolved_oxygen == null || w.dissolved_oxygen >= 4;
        const nh3Ok = w.ammonia == null || w.ammonia <= 0.1;
        return phOk && doOk && nh3Ok;
      }).length;
      pts += Math.round((ok / recent.length) * 20);
      const bad = recent.length - ok;
      if (bad > 0) reasons.push(`${bad} reading(s) outside safe range (pH 7.5–8.5, DO ≥ 4 mg/L, ammonia ≤ 0.1).`);
      else reasons.push("All recent readings are within safe range.");
    }
    factors.push({ key: "water", label: "Water quality", points: pts, max: 30, reasons });
  }

  // Feed logging (25)
  {
    const reasons: string[] = [];
    const recentDays = new Set(logs.filter((l) => daysAgo(l.log_date) <= 7 && l.feed_quantity != null).map((l) => l.log_date)).size;
    const pts = Math.round((Math.min(recentDays, 7) / 7) * 25);
    reasons.push(recentDays === 0 ? "No feed logged in the last 7 days." : `Feed logged on ${recentDays} of the last 7 days.`);
    factors.push({ key: "feed", label: "Feed records", points: pts, max: 25, reasons });
  }

  // Health (25)
  {
    const reasons: string[] = [];
    const recentLogs = logs.filter((l) => daysAgo(l.log_date) <= 7);
    let pts = 0;
    if (recentLogs.length === 0) reasons.push("No daily logs this week, so mortality is unknown.");
    else {
      const mortality = recentLogs.reduce((s, l) => s + (l.mortality_count ?? 0), 0);
      if (mortality === 0) { pts += 15; reasons.push("No mortality recorded this week."); }
      else if (mortality <= 20) { pts += 10; reasons.push(`${mortality} mortality recorded this week — watch closely.`); }
      else { pts += 3; reasons.push(`${mortality} mortality recorded this week — high, consult a doctor.`); }
      const recentHealth = health.filter((h) => daysAgo(h.created_at) <= 14).length;
      if (recentHealth > 0) { pts += 10; reasons.push(`${recentHealth} health check(s) in the last 14 days.`); }
      else reasons.push("No disease screening in the last 14 days.");
    }
    factors.push({ key: "health", label: "Health", points: pts, max: 25, reasons });
  }

  const total = factors.reduce((s, f) => s + f.points, 0);
  const grade = total >= 80 ? "Excellent" : total >= 60 ? "Good" : total >= 40 ? "Needs attention" : "Low";
  return { total, grade, factors };
}
