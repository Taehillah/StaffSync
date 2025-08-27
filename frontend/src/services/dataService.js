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

  const mustById = Object.fromEntries(mList.map(m => [m.id, m]));
  const unitById = Object.fromEntries(uList.map(u => [u.id, u]));
  const baseById = Object.fromEntries(bList.map(b => [b.id, b]));

  return members.map(m => ({
    ...m,
    musteringName: mustById[m.musteringId]?.name ?? m.musteringName ?? "—",
    unitName:      unitById[m.unitId]?.name      ?? m.unitName      ?? "—",
    baseName:      baseById[m.baseId]?.name      ?? m.baseName      ?? "—",
    readinessStatus: m.readinessStatus ?? "Ready",
  }));
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
