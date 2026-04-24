export const runtime = 'edge';
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// FUNGSI LOKAL: Kebal dari error "supabaseKey is required" saat proses Build Cloudflare
function getSupabase() {
  const cookieStore = cookies();
  
  // String 'https://xyz.supabase.co' dan 'dummy-key' WAJIB ADA agar tidak crash saat kompilasi!
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xyz.supabase.co';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'xyz-dummy-key';

  return createServerClient(url, key, {
    cookies: {
      get(name: string) { return cookieStore.get(name)?.value; },
      set(name: string, value: string, options: any) {},
      remove(name: string, options: any) {},
    }
  });
}

// ==========================================
// FUNGSI GET (MENAMPILKAN DATA)
// ==========================================
export async function GET(req: Request) {
  try {
    const supabase = getSupabase();
    const { searchParams } = new URL(req.url);
    const ujianId = searchParams.get('ujianId');

    if (ujianId) {
      const { data: ujian, error } = await supabase
        .from('Ujian')
        .select(`
          *,
          soal:Soal ( id, nomor, tipe_soal, teks_soal, opsi:Opsi ( id, label, teks_opsi, is_correct, points ) ),
          hasilUjian:HasilUjian ( id, santri_id, benar, salah, kosong, nilai_murni, answers_json, santri:Santri ( id, nis, nama, kelas ) )
        `)
        .eq('id', ujianId)
        .single();

      if (error) throw error;
      
      const formattedData = {
        id: ujian.id,
        namaUjian: ujian.nama_ujian,
        kelas: ujian.kelas,
        tipe: ujian.tipe,
        soal: ujian.soal,
        hasilUjian: ujian.hasilUjian.map((h: any) => ({
            id: h.id,
            santriId: h.santri_id,
            benar: h.benar,
            salah: h.salah,
            kosong: h.kosong,
            nilaiMurni: h.nilai_murni,
            answersJson: h.answers_json,
            santri: h.santri
        }))
      };
      return NextResponse.json(formattedData, { status: 200 });
    }

    const { data: listUjian, error: listError } = await supabase
      .from('Ujian')
      .select(`id, nama_ujian, kelas, tipe, created_at, guru_id, token, kode, hasilUjian:HasilUjian ( id )`)
      .order('created_at', { ascending: false });

    if (listError) throw listError;

    const formattedList = listUjian.map((u: any) => ({
      id: u.id,
      namaUjian: u.nama_ujian,
      kelas: u.kelas,
      tanggal: u.created_at,
      tipe: u.tipe,
      guru: { nama: "Ustadz/Ustadzah" },
      _count: { hasilUjian: u.hasilUjian ? u.hasilUjian.length : 0 },
      token: u.token || u.kode || "CBT-OFF"
    }));

    return NextResponse.json(formattedList, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ==========================================
// FUNGSI DELETE (MENGHAPUS FOLDER UJIAN)
// ==========================================
export async function DELETE(req: Request) {
  try {
    const supabase = getSupabase();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) return NextResponse.json({ error: "ID Ujian tidak ditemukan" }, { status: 400 });
    
    const { error } = await supabase.from('Ujian').delete().eq('id', id);
    if (error) throw error;
    
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ==========================================
// FUNGSI PUT (MENGEDIT DATA FOLDER)
// ==========================================
export async function PUT(req: Request) {
  try {
    const supabase = getSupabase();
    const body = await req.json();
    const { id, namaUjian, kelas, tipe, tanggal } = body;
    
    const updatePayload: any = {};
    if (namaUjian) updatePayload.nama_ujian = namaUjian;
    if (kelas) updatePayload.kelas = kelas;
    if (tipe) updatePayload.tipe = tipe;
    if (tanggal) updatePayload.created_at = new Date(tanggal).toISOString();
    
    const { error } = await supabase.from('Ujian').update(updatePayload).eq('id', id);
    if (error) throw error;
    
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ==========================================
// FUNGSI PATCH (SIMPAN KUNCI & KOREKSI ULANG)
// ==========================================
export async function PATCH(req: Request) {
  try {
    const supabase = getSupabase();
    const body = await req.json();
    const { ujianId, kunciBaru, orderedKunci } = body; 

    for (const item of kunciBaru) {
      await supabase.from('Opsi').update({ is_correct: false }).eq('soal_id', item.soalId);
      await supabase.from('Opsi').update({ is_correct: true }).eq('soal_id', item.soalId).eq('label', item.labelBenar);
    }

    if (ujianId && orderedKunci && orderedKunci.length > 0) {
      const { data: hasilSiswa, error: fetchError } = await supabase
        .from('HasilUjian')
        .select('id, answers_json')
        .eq('ujian_id', ujianId);

      if (!fetchError && hasilSiswa) {
        const totalSoal = orderedKunci.length;

        for (const siswa of hasilSiswa) {
          let answers: string[] = [];
          if (typeof siswa.answers_json === 'string') {
            try { answers = JSON.parse(siswa.answers_json); } catch(e) {}
          } else if (Array.isArray(siswa.answers_json)) {
            answers = siswa.answers_json;
          }

          if (answers.length === 0) continue;

          let benar = 0; let salah = 0; let kosong = 0;
          for (let i = 0; i < totalSoal; i++) {
            const jawab = answers[i] || "-";
            const kunci = orderedKunci[i];

            if (jawab === "-" || jawab === "" || jawab === " ") kosong++;
            else if (jawab === kunci) benar++;
            else salah++;
          }

          const nilaiMurni = totalSoal > 0 ? Math.round((benar / totalSoal) * 100) : 0;
          await supabase.from('HasilUjian').update({ benar, salah, kosong, nilai_murni: nilaiMurni }).eq('id', siswa.id);
        }
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}