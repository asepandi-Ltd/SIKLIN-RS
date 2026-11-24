const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const envFile = fs.readFileSync('.env.local', 'utf8');
let url = '', key = '';
envFile.split('\n').forEach(line => {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) url = line.split('=')[1].trim().replace(/^["']|["']$/g, '');
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) key = line.split('=')[1].trim().replace(/^["']|["']$/g, '');
});

const supabase = createClient(url, key);

async function testUpsert() {
  const testTable = {
    id: 'prog-test-1',
    report_id: 'rep-2026',
    unit_id: 'laboratorium',
    table_title: 'Tabel Uji Program Laboratorium',
    columns_definition: [
      { id: 'col-1', label: 'No', type: 'number', width: 60, required: true },
      { id: 'col-2', label: 'Nama Kegiatan', type: 'text', width: 200, required: true }
    ],
    rows_data: [
      { id: 'row-1', col_values: { 'col-1': 1, 'col-2': 'Pemeriksaan Darah Rutin' } }
    ],
    sort_order: 1
  };

  const { data, error, status } = await supabase.from('annual_unit_program_tables').upsert(testTable);
  console.log('Status:', status);
  if (error) {
    console.error('Error inserting program table:', error);
  } else {
    console.log('Success! Program table upserted cleanly.');
    // clean up
    await supabase.from('annual_unit_program_tables').delete().eq('id', 'prog-test-1');
  }
}

testUpsert();
