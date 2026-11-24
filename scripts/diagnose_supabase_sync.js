const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const envFile = fs.readFileSync('.env.local', 'utf8');
let url = '', key = '';
envFile.split('\n').forEach(line => {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) url = line.split('=')[1].trim().replace(/^["']|["']$/g, '');
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) key = line.split('=')[1].trim().replace(/^["']|["']$/g, '');
});

const supabase = createClient(url, key);

async function checkAllTables() {
  console.log('=== PEMERIKSAAN INTEGRASI & SINKRONISASI SUPABASE ===\n');
  const tables = [
    { name: 'annual_reports', desc: 'Master Laporan Tahunan' },
    { name: 'annual_section_profile', desc: 'Gambaran Umum Seksi' },
    { name: 'annual_unit_profiles', desc: '1. Profil Unit' },
    { name: 'annual_unit_staffing', desc: '2. SDM Unit & Pembagian Tugas' },
    { name: 'annual_unit_authorities', desc: '2b. Wewenang Staf Unit' },
    { name: 'annual_unit_program_tables', desc: '3. Program & Kegiatan (Tabel Dinamis)' },
    { name: 'capaian_indikator', desc: '4. Capaian Kinerja KPI Unit' },
    { name: 'annual_unit_obstacles', desc: '5. Hambatan & Masalah Unit' },
    { name: 'annual_unit_plans', desc: '6. Rencana Kerja Unit' },
    { name: 'annual_section_plans', desc: 'Rencana Kerja Seksi' },
    { name: 'annual_report_snapshots', desc: 'Snapshot / Data Final Laporan' }
  ];

  for (const t of tables) {
    try {
      const { data, error } = await supabase.from(t.name).select('*');
      if (error) {
        console.log(`❌ [${t.name}] (${t.desc}): ERROR - ${error.message} (Code: ${error.code})`);
      } else {
        const count = data ? data.length : 0;
        let units = 'N/A';
        if (data && data.length > 0) {
          if ('unit_id' in data[0]) {
            units = [...new Set(data.map(d => d.unit_id))].join(', ');
          } else if ('unit' in data[0]) {
            units = [...new Set(data.map(d => d.unit))].join(', ');
          }
        }
        console.log(`✅ [${t.name}] (${t.desc}):`);
        console.log(`   - Jumlah Baris: ${count}`);
        if (units !== 'N/A') {
          console.log(`   - Unit yang Terdata: [${units}]`);
        }
      }
    } catch (err) {
      console.log(`❌ [${t.name}] Exception: ${err.message}`);
    }
  }
}

checkAllTables();
