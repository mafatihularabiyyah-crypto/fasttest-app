export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

// ... sisa kode import dan GET/POST Ustadz di bawahnya ...

import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export const runtime = 'edge';

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    const ujianId = searchParams.get('ujianId');

    // =================================================================
    // SKENARIO 1: JIKA MEMINTA DETAIL 1 UJIAN (Saat Folder Diklik)
    // =================================================================
    if (ujianId) {
      // Tarik Ujian beserta relasi Soal, Opsi, dan HasilUjian (Nilai Santri)
      const { data: ujian, error } = await supabase
        .from('Ujian')
        .select(`
          *,
          soal:Soal (
            id, nomor, tipe_soal, teks_soal,
            opsi:Opsi ( id, label, teks_opsi, is_correct, points )
          ),
          hasilUjian:HasilUjian (
            id, santri_id, benar, salah, kosong, nilai_murni, answers_json,
            santri:Santri ( id, nis, nama )
          )
        `)
        .eq('id', ujianId)
        .single();

      if (error) throw error;
      
      // Format datanya agar cocok dengan yang diminta kodingan Frontend (page.tsx)
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
            santri: h.santri // Data nama & nis santri
        }))
      };
      
      return NextResponse.json(formattedData, { status: 200 });
    }

    // =================================================================
    // SKENARIO 2: JIKA MEMINTA DAFTAR SEMUA UJIAN (Halaman Utama Arsip)
    // =================================================================
    const { data: listUjian, error: listError } = await supabase
      .from('Ujian')
      .select(`
        id, nama_ujian, kelas, tipe, created_at, guru_id,
        hasilUjian:HasilUjian ( id )
      `)
      .order('created_at', { ascending: false });

    if (listError) throw listError;

    // Ubah format data dari Database (Snake Case) ke Frontend (Camel Case)
    const formattedList = listUjian.map((u: any) => ({
      id: u.id,
      namaUjian: u.nama_ujian,
      kelas: u.kelas,
      tanggal: u.created_at,
      tipe: u.tipe,
      guru: { nama: "Ustadz/Ustadzah" }, // Placeholder nama guru
      _count: {
         // Hitung ada berapa santri di dalam folder ujian ini
         hasilUjian: u.hasilUjian ? u.hasilUjian.length : 0
      }
    }));

    return NextResponse.json(formattedList, { status: 200 });

  } catch (error: any) {
    console.error("API Arsip Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
// Tambahkan 2 fungsi ini di bagian PALING BAWAH file app/api/arsip/route.ts Anda

// ==========================================
// FUNGSI UNTUK MENGHAPUS FOLDER UJIAN
// ==========================================
export async function DELETE(req: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) return NextResponse.json({ error: "ID Ujian tidak ditemukan" }, { status: 400 });
    
    // Ini otomatis menghapus Ujian beserta Soal, Opsi, dan Hasilnya berkat aturan ON DELETE CASCADE
    const { error } = await supabase.from('Ujian').delete().eq('id', id);
    if (error) throw error;
    
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ==========================================
// FUNGSI UNTUK MENGUBAH DATA FOLDER UJIAN
// ==========================================
export async function PUT(req: Request) {
  try {
    const supabase = await createClient();
    const body = await req.json();
    const { id, namaUjian, kelas, tipe, tanggal } = body;
    
    // Siapkan data yang akan di-update
    const updatePayload: any = {};
    if (namaUjian) updatePayload.nama_ujian = namaUjian;
    if (kelas) updatePayload.kelas = kelas;
    if (tipe) updatePayload.tipe = tipe;
    
    // Ubah format tanggal (jika diubah) kembali ke format database
    if (tanggal) {
       updatePayload.created_at = new Date(tanggal).toISOString();
    }
    
    const { error } = await supabase.from('Ujian').update(updatePayload).eq('id', id);
    if (error) throw error;
    
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ==========================================
// FUNGSI UNTUK MENGUBAH KUNCI JAWABAN & KOREKSI ULANG OTOMATIS
// ==========================================
export async function PATCH(req: Request) {
  try {
    const supabase = await createClient();
    const body = await req.json();
    
    // Kita menerima data tambahan: ID Ujian dan Susunan Kunci yang Baru
    const { ujianId, kunciBaru, orderedKunci } = body; 

    // 1. UPDATE KUNCI JAWABAN DI TABEL OPSI
    for (const item of kunciBaru) {
      await supabase.from('Opsi').update({ is_correct: false }).eq('soal_id', item.soalId);
      await supabase.from('Opsi').update({ is_correct: true }).eq('soal_id', item.soalId).eq('label', item.labelBenar);
    }

    // 2. PROSES KOREKSI ULANG (REGRADING) SELURUH SISWA
    if (ujianId && orderedKunci && orderedKunci.length > 0) {
      // Tarik semua data lembar jawaban siswa pada ujian ini
      const { data: hasilSiswa, error: fetchError } = await supabase
        .from('HasilUjian')
        .select('id, answers_json')
        .eq('ujian_id', ujianId);

      if (!fetchError && hasilSiswa) {
        const totalSoal = orderedKunci.length;

        // Looping untuk mengoreksi ulang lembar jawaban setiap siswa satu per satu
        for (const siswa of hasilSiswa) {
          let answers: string[] = [];
          
          // Pastikan format JSON terbaca dengan benar
          if (typeof siswa.answers_json === 'string') {
            try { answers = JSON.parse(siswa.answers_json); } catch(e) {}
          } else if (Array.isArray(siswa.answers_json)) {
            answers = siswa.answers_json;
          }

          // Jika siswa belum mengerjakan/belum di-scan, lewati (jangan dinolkan)
          if (answers.length === 0) continue;

          let benar = 0;
          let salah = 0;
          let kosong = 0;

          // Cocokkan jawaban siswa dengan kunci yang baru
          for (let i = 0; i < totalSoal; i++) {
            const jawab = answers[i] || "-";
            const kunci = orderedKunci[i];

            if (jawab === "-" || jawab === "" || jawab === " ") {
              kosong++;
            } else if (jawab === kunci) {
              benar++;
            } else {
              salah++;
            }
          }

          // Hitung nilai murni skala 100
          const nilaiMurni = totalSoal > 0 ? Math.round((benar / totalSoal) * 100) : 0;

          // Simpan nilai baru ke database
          await supabase
            .from('HasilUjian')
            .update({ benar, salah, kosong, nilai_murni: nilaiMurni })
            .eq('id', siswa.id);
        }
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}