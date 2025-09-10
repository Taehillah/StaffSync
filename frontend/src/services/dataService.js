// Adjust these names to match your mockData.js file exactly.
import { mockMembers, mockMusterings, mockUnits, mockBases } from "../data/mockData";

export async function fetchPersonnel() {
  // simulate latency
  await new Promise(r => setTimeout(r, 150));

  // Defensive guards so it won't crash if any list is missing
  const mList = Array.isArray(mockMusterings) ? mockMusterings : [];
  const uList = Array.isArray(mockUnits) ? mockUnits : [];
  const bList = Array.isArray(mockBases) ? mockBases : [];
  const members = Array.isArray(mockMembers) ? mockMembers : [];

  // Support both id and snake_case ids found in mock data
  const mustById = Object.fromEntries(mList.map(m => [m.id ?? m.mustering_id ?? m.code, m]));
  const mustByCode = Object.fromEntries(mList.map(m => [m.code ?? m.id, m]));
  const unitById = Object.fromEntries(uList.map(u => [u.id ?? u.unit_id, u]));
  const baseById = Object.fromEntries(bList.map(b => [b.id ?? b.base_id, b]));

  return members.map(m => {
    const unitId = m.unitId ?? m.unit_id;
    const unit = unitById[unitId];
    const baseId = m.baseId ?? m.base_id ?? unit?.base_id;
    const base = baseById[baseId];
    const mCode = m.musteringCode ?? m.mustering_code;
    const mustName = (m.musteringName)
      || (m.musteringId && mustById[m.musteringId]?.name)
      || (mCode && mustByCode[mCode]?.name)
      || "—";

    return {
      ...m,
      musteringCode: mCode,
      musteringName: mustName,
      unitName: unit?.name ?? m.unitName ?? "—",
      baseName: base?.name ?? m.baseName ?? "—",
      readinessStatus: m.readinessStatus ?? m.readiness ?? "Ready",
    };
  });
}

export function exportPersonnelToCSV(rows, filename = "personnel.csv") {
  const headers = [
    "force_number","rank","surname","first_name","mustering","unit","base","readiness"
  ];
  const lines = rows.map(p => [
    p.force_number, p.rank, p.surname, p.first_name,
    p.musteringName, p.unitName, p.baseName, p.readinessStatus
  ].map(v => `"${String(v ?? "").replaceAll('"','""')}"`).join(","));
  const csv = [headers.join(","), ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
