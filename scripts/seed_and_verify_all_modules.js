const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const envFile = fs.readFileSync('.env.local', 'utf8');
let url = '', key = '';
envFile.split('\n').forEach(line => {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) url = line.split('=')[1].trim().replace(/^["']|["']$/g, '');
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) key = line.split('=')[1].trim().replace(/^["']|["']$/g, '');
});

const supabase = createClient(url, key);

async function inspectDetail() {
  console.log('=== RINCIAN DATA PER MODUL DI SUPABASE ===\n');

  // 1. Profil Unit
  const { data: profs, error: profsErr } = await supabase.from('annual_unit_profiles').select('*');
  console.log('1. PROFIL UNIT (annual_unit_profiles): Total ' + (profs ? profs.length : 0));
  if (profsErr) console.error('   Error:', profsErr.message);
  if (profs && profs.length > 0) {
    console.log('   Unit IDs:', profs.map(p => p.unit_id));
    console.log('   Sample row:', profs[0]);
  }

  // 2. SDM Unit
  const { data: stf, error: stfErr } = await supabase.from('annual_unit_staffing').select('*');
  console.log('\n2. SDM & TUGAS STAF (annual_unit_staffing): Total ' + (stf ? stf.length : 0));
  if (stfErr) console.error('   Error:', stfErr.message);
  if (stf && stf.length > 0) {
    const stfByUnit = {};
    stf.forEach(s => { stfByUnit[s.unit_id] = (stfByUnit[s.unit_id] || 0) + 1; });
    console.log('   Jumlah staf per unit:', stfByUnit);
  }

  // 3. Program & Kegiatan
  const { data: prog, error: progErr } = await supabase.from('annual_unit_program_tables').select('*');
  console.log('\n3. PROGRAM & KEGIATAN (annual_unit_program_tables): Total ' + (prog ? prog.length : 0));
  if (progErr) console.error('   Error:', progErr.message);

  // 4. Capaian KPI
  const { data: kpi, error: kpiErr } = await supabase.from('capaian_indikator').select('indikator_id, bulan, capaian, status');
  console.log('\n4. CAPAIAN KPI (capaian_indikator): Total ' + (kpi ? kpi.length : 0));
  if (kpiErr) console.error('   Error:', kpiErr.message);

  // 5. Hambatan Unit
  const { data: obs, error: obsErr } = await supabase.from('annual_unit_obstacles').select('*');
  console.log('\n5. HAMBATAN UNIT (annual_unit_obstacles): Total ' + (obs ? obs.length : 0));
  if (obsErr) console.error('   Error:', obsErr.message);
  if (obs && obs.length > 0) {
    const obsByUnit = {};
    obs.forEach(o => { obsByUnit[o.unit_id] = (obsByUnit[o.unit_id] || 0) + 1; });
    console.log('   Jumlah hambatan per unit:', obsByUnit);
  }

  // 6. Rencana Kerja Unit
  const { data: pln } = await supabase.from('annual_unit_plans').select('unit_id, action_plan, volume, satuan, harga_satuan');
  console.log('\n6. RENCANA KERJA UNIT (annual_unit_plans): Total ' + (pln ? pln.length : 0));
  if (pln && pln.length > 0) {
    const plnByUnit = {};
    pln.forEach(p => { plnByUnit[p.unit_id] = (plnByUnit[p.unit_id] || 0) + 1; });
    console.log('   Jumlah rencana per unit:', plnByUnit);
  }
}

inspectDetail();
