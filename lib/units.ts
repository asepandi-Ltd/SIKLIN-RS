export interface MasterUnit {
  id: string;
  name: string;
  kategori: 'Penunjang Medis' | 'Penunjang Non Medis';
  codePrefix: string;
  order: number;
}

export const ACTIVE_MASTER_UNITS: MasterUnit[] = [
  { id: 'laboratorium', name: 'Laboratorium', kategori: 'Penunjang Medis', codePrefix: 'LAB', order: 1 },
  { id: 'radiologi', name: 'Radiologi', kategori: 'Penunjang Medis', codePrefix: 'RAD', order: 2 },
  { id: 'farmasi', name: 'Farmasi', kategori: 'Penunjang Medis', codePrefix: 'FAR', order: 3 },
  { id: 'gizi', name: 'Gizi', kategori: 'Penunjang Medis', codePrefix: 'GIZ', order: 4 },
  { id: 'rekam-medis', name: 'Rekam Medis', kategori: 'Penunjang Non Medis', codePrefix: 'RM', order: 5 },
  { id: 'itrs', name: 'IT Rumah Sakit / ITRS', kategori: 'Penunjang Non Medis', codePrefix: 'IT', order: 6 },
  { id: 'ipsrs', name: 'IPSRS', kategori: 'Penunjang Non Medis', codePrefix: 'IPS', order: 7 },
  { id: 'cssd-laundry', name: 'CSSD & Laundry', kategori: 'Penunjang Non Medis', codePrefix: 'LAU', order: 8 },
  { id: 'humas-pemasaran', name: 'Humas dan Pemasaran', kategori: 'Penunjang Non Medis', codePrefix: 'HUM', order: 9 },
  { id: 'kesling', name: 'Kesehatan Lingkungan', kategori: 'Penunjang Non Medis', codePrefix: 'SAN', order: 10 },
  { id: 'mutu', name: 'Mutu', kategori: 'Penunjang Medis', codePrefix: 'MUT', order: 11 },
];

export const ACTIVE_UNIT_NAMES = ACTIVE_MASTER_UNITS.map(u => u.name);

/**
 * Normalizes any unit string to its canonical MasterUnit or returns null if not active
 */
export function normalizeUnit(unitNameOrId?: string | null): MasterUnit | null {
  if (!unitNameOrId) return null;
  const raw = unitNameOrId.trim().toLowerCase();

  // Direct id match
  const byId = ACTIVE_MASTER_UNITS.find(u => u.id === raw);
  if (byId) return byId;

  // Direct name match
  const byName = ACTIVE_MASTER_UNITS.find(u => u.name.toLowerCase() === raw);
  if (byName) return byName;

  // Fuzzy / common alias normalization
  if (raw.includes('humas')) return ACTIVE_MASTER_UNITS.find(u => u.id === 'humas-pemasaran')!;
  if (raw.includes('cssd') || raw.includes('laundry')) return ACTIVE_MASTER_UNITS.find(u => u.id === 'cssd-laundry')!;
  if (raw.includes('itrs') || raw.includes('rumah sakit / itrs') || raw === 'it') return ACTIVE_MASTER_UNITS.find(u => u.id === 'itrs')!;
  if (raw.includes('ipsrs') || raw === 'ips') return ACTIVE_MASTER_UNITS.find(u => u.id === 'ipsrs')!;
  if (raw.includes('lingkungan') || raw.includes('kesling') || raw.includes('sanitasi')) return ACTIVE_MASTER_UNITS.find(u => u.id === 'kesling')!;
  if (raw.includes('rekam') || raw.includes('medis') && !raw.includes('penunjang')) return ACTIVE_MASTER_UNITS.find(u => u.id === 'rekam-medis')!;
  if (raw.includes('lab')) return ACTIVE_MASTER_UNITS.find(u => u.id === 'laboratorium')!;
  if (raw.includes('rad')) return ACTIVE_MASTER_UNITS.find(u => u.id === 'radiologi')!;
  if (raw.includes('far')) return ACTIVE_MASTER_UNITS.find(u => u.id === 'farmasi')!;
  if (raw.includes('gizi')) return ACTIVE_MASTER_UNITS.find(u => u.id === 'gizi')!;
  if (raw === 'mutu') return ACTIVE_MASTER_UNITS.find(u => u.id === 'mutu')!;

  return null;
}

/**
 * Check if a unit is an active unit
 */
export function isActiveUnit(unitNameOrId?: string | null): boolean {
  return normalizeUnit(unitNameOrId) !== null;
}

/**
 * Get canonical unit name
 */
export function getCanonicalUnitName(unitNameOrId?: string | null): string {
  const norm = normalizeUnit(unitNameOrId);
  return norm ? norm.name : (unitNameOrId || '');
}

/**
 * Get canonical unit id
 */
export function getCanonicalUnitId(unitNameOrId?: string | null): string {
  const norm = normalizeUnit(unitNameOrId);
  return norm ? norm.id : (unitNameOrId?.toLowerCase().replace(/\s+/g, '-') || '');
}
