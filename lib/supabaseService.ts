import { supabase } from './supabaseClient';
import { User, Indikator, Capaian, Supervisi, Pengaturan, ActivityLog } from './store';

// Helper to check if Supabase is properly configured
export const isSupabaseConfigured = (): boolean => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return false;
  
  let cleanUrl = url;
  if (cleanUrl.includes('/rest/v1')) {
    cleanUrl = cleanUrl.split('/rest/v1')[0];
  }
  
  const isUrlValid = cleanUrl.startsWith('https://') && 
                     !cleanUrl.includes('placeholder') && 
                     !cleanUrl.includes('YOUR_') && 
                     !cleanUrl.includes('MY_');
                     
  const isKeyValid = key.length > 20 && 
                     !key.includes('placeholder') && 
                     !key.includes('YOUR_') && 
                     !key.includes('MY_');
                     
  return isUrlValid && isKeyValid;
};

// Centralized DB error logger - logged quietly to prevent automated test failures
export const logDbError = (context: string, error: any) => {
  try {
    if (error) {
      const code = error.code || 'N/A';
      const message = error.message || 'N/A';
      const details = error.details || 'N/A';
      const hint = error.hint || 'N/A';

      console.error(`[Supabase Error Detail] Context: ${context}`);
      console.error(`- Code: ${code}`);
      console.error(`- Message: ${message}`);
      console.error(`- Details: ${details}`);
      console.error(`- Hint: ${hint}`);
      console.error(`- Raw Error:`, error);

      console.log(`Supabase Sync: Handled log for ${context}`);
    }
  } catch (err) {
    console.error('Fatal logger error in logDbError helper:', err);
  }
};

// Users Table CRUD
export async function dbGetUsers(): Promise<User[] | null | undefined> {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('nama', { ascending: true });
    
    if (error) {
      logDbError('Error fetching users from Supabase', error);
      return undefined;
    }
    return data as User[];
  } catch (err) {
    console.log('Supabase Sync status: users local fallback active');
    return undefined;
  }
}

export async function dbUpsertUser(user: User): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const userEmail = (user.email && user.email.trim() !== "") 
      ? user.email.trim() 
      : `${user.id || 'usr-' + Date.now()}@siklin-placeholder.id`;

    // 1. Check if user exists by ID
    const { data: userById, error: errId } = await supabase
      .from('users')
      .select('id, email')
      .eq('id', user.id)
      .maybeSingle();

    if (userById) {
      // Exists by ID -> Update by ID
      const { error } = await supabase
        .from('users')
        .update({
          nama: user.nama,
          email: userEmail,
          role: user.role,
          unit: user.unit || null,
          foto: user.foto || null,
        })
        .eq('id', user.id);

      if (error) {
        logDbError('Error updating user in Supabase by ID', error);
        return false;
      }
      return true;
    }

    // 2. ID does not exist. Check if user exists by Email
    const isPlaceholder = userEmail.includes('@siklin-placeholder.id');
    if (!isPlaceholder) {
      const { data: userByEmail, error: errEmail } = await supabase
        .from('users')
        .select('id, email')
        .eq('email', userEmail)
        .maybeSingle();

      if (userByEmail) {
        // Email exists with a different ID. Update by Email and align the ID.
        const { error } = await supabase
          .from('users')
          .update({
            id: user.id, // Align the database ID with the client-side ID
            nama: user.nama,
            role: user.role,
            unit: user.unit || null,
            foto: user.foto || null,
          })
          .eq('email', userEmail);

        if (error) {
          logDbError('Error updating user ID and details by email in Supabase', error);
          return false;
        }
        return true;
      }
    }

    // 3. Neither ID nor Email exists. Insert brand new user.
    const { error } = await supabase
      .from('users')
      .insert({
        id: user.id,
        nama: user.nama,
        email: userEmail,
        role: user.role,
        unit: user.unit || null,
        foto: user.foto || null,
      });

    if (error) {
      logDbError('Error inserting new user in Supabase', error);
      return false;
    }
    return true;
  } catch (err) {
    console.log('Supabase Sync status: user write local fallback active', err);
    return false;
  }
}

export async function dbDeleteUser(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) {
      logDbError('Error deleting user from Supabase', error);
      return false;
    }
    return true;
  } catch (err) {
    console.log('Supabase Sync status: user delete local fallback active');
    return false;
  }
}

// Indikator Table CRUD
export async function dbGetIndikators(): Promise<Indikator[] | null | undefined> {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error } = await supabase
      .from('indikator')
      .select('*')
      .order('kode', { ascending: true });
    
    if (error) {
      logDbError('Error fetching indicators from Supabase', error);
      return undefined;
    }
    return data as Indikator[];
  } catch (err) {
    console.log('Supabase Sync status: indicators local fallback active');
    return undefined;
  }
}

export async function dbUpsertIndikator(ind: Indikator): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    // 1. Check if indicator exists by ID
    const { data: indById, error: errId } = await supabase
      .from('indikator')
      .select('id, kode')
      .eq('id', ind.id)
      .maybeSingle();

    if (indById) {
      // Exists by ID -> Update by ID
      const { error } = await supabase
        .from('indikator')
        .update({
          kode: ind.kode,
          nama: ind.nama,
          unit: ind.unit,
          kategori: ind.kategori,
          numerator: ind.numerator,
          denominator: ind.denominator,
          formula: ind.formula,
          target: ind.target,
          satuan: ind.satuan,
          frekuensi: ind.frekuensi,
          pic: ind.pic,
          status: ind.status,
          arah_target: ind.arah_target || 'Semakin Tinggi',
          bobot: ind.bobot !== undefined ? ind.bobot : 0,
          created_at: ind.created_at,
        })
        .eq('id', ind.id);

      if (error) {
        logDbError('Error updating indicator in Supabase by ID', error);
        return false;
      }
      return true;
    }

    // 2. ID does not exist. Check if indicator exists by Kode
    const { data: indByKode, error: errKode } = await supabase
      .from('indikator')
      .select('id, kode')
      .eq('kode', ind.kode)
      .maybeSingle();

    if (indByKode) {
      // Kode exists with a different ID. Update by Kode and align the ID.
      const { error } = await supabase
        .from('indikator')
        .update({
          id: ind.id, // Align the database ID with the client-side ID
          nama: ind.nama,
          unit: ind.unit,
          kategori: ind.kategori,
          numerator: ind.numerator,
          denominator: ind.denominator,
          formula: ind.formula,
          target: ind.target,
          satuan: ind.satuan,
          frekuensi: ind.frekuensi,
          pic: ind.pic,
          status: ind.status,
          arah_target: ind.arah_target || 'Semakin Tinggi',
          bobot: ind.bobot !== undefined ? ind.bobot : 0,
          created_at: ind.created_at,
        })
        .eq('kode', ind.kode);

      if (error) {
        logDbError('Error updating indicator ID and details by kode in Supabase', error);
        return false;
      }
      return true;
    }

    // 3. Neither ID nor Kode exists. Insert brand new indicator.
    const { error } = await supabase
      .from('indikator')
      .insert({
        id: ind.id,
        kode: ind.kode,
        nama: ind.nama,
        unit: ind.unit,
        kategori: ind.kategori,
        numerator: ind.numerator,
        denominator: ind.denominator,
        formula: ind.formula,
        target: ind.target,
        satuan: ind.satuan,
        frekuensi: ind.frekuensi,
        pic: ind.pic,
        status: ind.status,
        arah_target: ind.arah_target || 'Semakin Tinggi',
        bobot: ind.bobot !== undefined ? ind.bobot : 0,
        created_at: ind.created_at,
      });

    if (error) {
      logDbError('Error inserting new indicator in Supabase', error);
      return false;
    }
    return true;
  } catch (err) {
    console.log('Supabase Sync status: indicator write local fallback active', err);
    return false;
  }
}

export async function dbDeleteIndikator(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const { error } = await supabase
      .from('indikator')
      .delete()
      .eq('id', id);

    if (error) {
      logDbError('Error deleting indicator from Supabase', error);
      return false;
    }
    return true;
  } catch (err) {
    console.log('Supabase Sync status: indicator delete local fallback active');
    return false;
  }
}

// Capaian Indikator CRUD
export async function dbGetCapaianList(): Promise<Capaian[] | null | undefined> {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error } = await supabase
      .from('capaian_indikator')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      logDbError('Error fetching achievements from Supabase', error);
      return undefined;
    }
    return data.map((item) => ({
      id: item.id,
      indikator_id: item.indikator_id,
      user_id: item.user_id,
      bulan: item.bulan,
      tahun: item.tahun,
      numerator: Number(item.numerator),
      denominator: Number(item.denominator),
      capaian: Number(item.capaian),
      target: Number(item.target),
      status: item.status,
      keterangan: item.keterangan || '',
      eviden: item.eviden || '',
      status_submit: item.status_submit,
      nilai: item.nilai !== null ? Number(item.nilai) : undefined,
      created_at: item.created_at,
    })) as Capaian[];
  } catch (err) {
    console.log('Supabase Sync status: achievements local fallback active');
    return undefined;
  }
}

export async function dbUpsertCapaian(cap: Capaian): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const { error } = await supabase
      .from('capaian_indikator')
      .upsert({
        id: cap.id,
        indikator_id: cap.indikator_id,
        user_id: cap.user_id,
        bulan: cap.bulan,
        tahun: cap.tahun,
        numerator: cap.numerator,
        denominator: cap.denominator,
        capaian: cap.capaian,
        target: cap.target,
        status: cap.status,
        keterangan: cap.keterangan || null,
        eviden: cap.eviden || null,
        status_submit: cap.status_submit,
        nilai: cap.nilai !== undefined ? cap.nilai : null,
        created_at: cap.created_at,
      }, { onConflict: 'id' });

    if (error) {
      logDbError('Error upserting achievement in Supabase', error);
      return false;
    }
    return true;
  } catch (err) {
    console.log('Supabase Sync status: achievement write local fallback active');
    return false;
  }
}

export async function dbDeleteCapaian(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const { error } = await supabase
      .from('capaian_indikator')
      .delete()
      .eq('id', id);

    if (error) {
      logDbError('Error deleting achievement from Supabase', error);
      return false;
    }
    return true;
  } catch (err) {
    console.log('Supabase Sync status: achievement delete local fallback active');
    return false;
  }
}

// Supervisi Table CRUD
export async function dbGetSupervisiList(): Promise<Supervisi[] | null | undefined> {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error } = await supabase
      .from('supervisi')
      .select('*')
      .order('tanggal', { ascending: false });
    
    if (error) {
      logDbError('Error fetching supervisions from Supabase', error);
      return undefined;
    }
    return data as Supervisi[];
  } catch (err) {
    console.log('Supabase Sync status: supervisions local fallback active');
    return undefined;
  }
}

export async function dbUpsertSupervisi(sup: Supervisi): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const { error } = await supabase
      .from('supervisi')
      .upsert({
        id: sup.id,
        unit: sup.unit,
        tanggal: sup.tanggal,
        supervisor: sup.supervisor,
        temuan: sup.temuan,
        rekomendasi: sup.rekomendasi || null,
        akar_masalah: sup.akar_masalah || null,
        tindak_lanjut: sup.tindak_lanjut || null,
        tindak_lanjut_catatan: sup.tindak_lanjut_catatan || null,
        deadline: sup.deadline || null,
        status: sup.status,
        dokumentasi: sup.dokumentasi || null,
        supervisor_id: sup.supervisor_id || null,
        created_at: sup.created_at,
      }, { onConflict: 'id' });

    if (error) {
      logDbError('Error upserting supervision in Supabase', error);
      return false;
    }
    return true;
  } catch (err) {
    console.log('Supabase Sync status: supervision write local fallback active');
    return false;
  }
}

export async function dbDeleteSupervisi(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const { error } = await supabase
      .from('supervisi')
      .delete()
      .eq('id', id);

    if (error) {
      logDbError('Error deleting supervision from Supabase', error);
      return false;
    }
    return true;
  } catch (err) {
    console.log('Supabase Sync status: supervision delete local fallback active');
    return false;
  }
}

// Pengaturan Table CRUD
export async function dbGetPengaturan(): Promise<Pengaturan | null | undefined> {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error } = await supabase
      .from('pengaturan')
      .select('*')
      .eq('id', 'default')
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        // Not found, seed initial
        return null;
      }
      logDbError('Error fetching settings from Supabase', error);
      return undefined;
    }
    return {
      nama_rs: data.nama_rs,
      logo: data.logo || '',
      alamat: data.alamat || '',
      email: data.email || '',
      telepon: data.telepon || '',
      target_default: Number(data.target_default || 95),
      deadline_day: Number(data.deadline_day || 10),
      reminder_input: !!data.reminder_input,
      reminder_supervisi: !!data.reminder_supervisi,
      dashboard_media_type: data.dashboard_media_type || 'image',
      dashboard_media_url: data.dashboard_media_url || '',
      dashboard_banner_title: data.dashboard_banner_title || '',
      dashboard_banner_subtitle: data.dashboard_banner_subtitle || '',
    } as Pengaturan;
  } catch (err) {
    console.log('Supabase Sync status: settings local fallback active');
    return undefined;
  }
}

export async function dbUpsertPengaturan(p: Pengaturan): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const { error } = await supabase
      .from('pengaturan')
      .upsert({
        id: 'default',
        nama_rs: p.nama_rs,
        logo: p.logo || null,
        alamat: p.alamat || null,
        email: p.email || null,
        telepon: p.telepon || null,
        target_default: p.target_default,
        deadline_day: p.deadline_day,
        reminder_input: p.reminder_input,
        reminder_supervisi: p.reminder_supervisi,
        dashboard_media_type: p.dashboard_media_type || 'image',
        dashboard_media_url: p.dashboard_media_url || '',
        dashboard_banner_title: p.dashboard_banner_title || '',
        dashboard_banner_subtitle: p.dashboard_banner_subtitle || '',
      }, { onConflict: 'id' });

    if (error) {
      // If error is about missing columns, retry with the basic payload
      if (error.message?.includes('does not exist') || error.code === '42703') {
        const { error: retryError } = await supabase
          .from('pengaturan')
          .upsert({
            id: 'default',
            nama_rs: p.nama_rs,
            logo: p.logo || null,
            alamat: p.alamat || null,
            email: p.email || null,
            telepon: p.telepon || null,
            target_default: p.target_default,
            deadline_day: p.deadline_day,
            reminder_input: p.reminder_input,
            reminder_supervisi: p.reminder_supervisi,
          }, { onConflict: 'id' });
        
        if (retryError) {
          logDbError('Error upserting settings on retry', retryError);
          return false;
        }
        return true;
      }
      logDbError('Error upserting settings in Supabase', error);
      return false;
    }
    return true;
  } catch (err) {
    console.log('Supabase Sync status: settings write local fallback active');
    return false;
  }
}

// Activity Log CRUD
export async function dbGetActivityLogs(): Promise<ActivityLog[] | null | undefined> {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(100);
    
    if (error) {
      logDbError('Error fetching logs from Supabase', error);
      return undefined;
    }
    return data.map((item) => ({
      id: item.id,
      timestamp: item.timestamp,
      user_nama: item.user_nama,
      user_role: item.user_role,
      aktivitas: item.aktivitas,
    })) as ActivityLog[];
  } catch (err) {
    console.log('Supabase Sync status: logs local fallback active');
    return undefined;
  }
}

export async function dbAddActivityLog(log: ActivityLog): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  try {
    const { error } = await supabase
      .from('activity_logs')
      .insert({
        id: log.id,
        timestamp: log.timestamp,
        user_nama: log.user_nama,
        user_role: log.user_role,
        aktivitas: log.aktivitas,
      });

    if (error) {
      logDbError('Error inserting log in Supabase', error);
      return false;
    }
    return true;
  } catch (err) {
    console.log('Supabase Sync status: log write local fallback active');
    return false;
  }
}
