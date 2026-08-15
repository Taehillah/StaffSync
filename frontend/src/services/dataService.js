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

  const today = new Date();
  const addDays = (days) => {
    const d = new Date(today);
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  };
  const getAvailability = (member) => {
    const status = String(member.readinessStatus ?? member.readiness ?? "Ready").toLowerCase();
    if (member.availabilityStatus || member.availableFrom || member.unavailableUntil) {
      return {
        availabilityStatus: member.availabilityStatus,
        availableFrom: member.availableFrom,
        unavailableUntil: member.unavailableUntil,
        unavailableReason: member.unavailableReason,
        maxDeploymentDays: member.maxDeploymentDays,
      };
    }
    if (member.is_deployable && status === "ready") {
      return {
        availabilityStatus: "Available",
        availableFrom: today.toISOString().slice(0, 10),
        unavailableUntil: null,
        unavailableReason: "",
        maxDeploymentDays: 30 + ((member.member_id || 0) % 4) * 15,
      };
    }
    const days = status === "pending" ? 10 + ((member.member_id || 0) % 3) * 7 : 30 + ((member.member_id || 0) % 4) * 14;
    return {
      availabilityStatus: "Unavailable",
      availableFrom: addDays(days),
      unavailableUntil: addDays(days),
      unavailableReason: status === "pending" ? "Pending readiness clearance" : "Not combat ready",
      maxDeploymentDays: 0,
    };
  };
  const getCompetencies = (member) => {
    const raw = [
      member.post_description,
      member.mustering_code,
      member.musteringCode,
      member.competency,
      ...(Array.isArray(member.competencies) ? member.competencies : []),
    ];
    return raw
      .flatMap((value) => String(value || "").split(","))
      .map((value) => value.trim())
      .filter(Boolean);
  };

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

    const availability = getAvailability(m);
    const competencies = getCompetencies(m);

    return {
      ...m,
      musteringCode: mCode,
      musteringName: mustName,
      unitName: unit?.name ?? m.unitName ?? "—",
      baseName: base?.name ?? m.baseName ?? "—",
      readinessStatus: m.readinessStatus ?? m.readiness ?? "Ready",
      competencies,
      ...availability,
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
