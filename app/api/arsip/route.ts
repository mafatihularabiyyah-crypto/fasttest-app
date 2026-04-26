export const runtime = 'edge';
export const dynamic = 'force-dynamic'; 

import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const ujianId = searchParams.get('ujianId');
    const supabase = await createClient();

    if (ujianId) {
      const { data: ujianData, error: errUjian } = await supabase.from('Ujian').select('*').eq('id', ujianId).single();
      if (errUjian) throw errUjian;
      
      const { data: soalData } = await supabase.from('Soal').select('*').eq('ujian_id', ujianId).order('id', { ascending: true }); 

      let soalWithOpsi = soalData || [];
      if (soalData && soalData.length > 0) {
        const soalIds = soalData.map((s: any) => s.id);
        const { data: opsiData } = await supabase.from('Opsi').select('*').in('soal_id', soalIds);
        if (opsiData) {
          soalWithOpsi = soalData.map((s: any) => ({
            ...s,
            opsi: opsiData.filter((o: any) => o.soal_id === s.id).sort((a: any, b: any) => a.label.localeCompare(b.label))
          }));
        }
      }

      const { data: hasilData } = await supabase.from('HasilUjian').select('*').eq('ujian_id', ujianId);

      let hasilWithSantri = hasilData || [];
      if (hasilData && hasilData.length > 0) {
        const { data: santriData } = await supabase.from('Santri').select('id, nama, nis, kelas');
        if (santriData) {
          const santriMap: any = {};
          santriData.forEach((s: any) => { santriMap[String(s.id).trim().toLowerCase()] = s; });
          hasilWithSantri = hasilData.map((h: any) => {
            const queryId = h.santri_id ? String(h.santri_id).trim().toLowerCase() : "";
            const dataKetemu = santriMap[queryId];
            return {
              ...h,
              santri: dataKetemu || { nama: `⚠️ ID Tdk Cocok: ${String(h.santri_id).substring(0, 8)}...`, nis: "-", kelas: "-" } 
            };
          });
        }
      }

      const formattedData = {
        ...ujianData,
        namaUjian: ujianData.nama_ujian || ujianData.title || "Ujian",
        soal: soalWithOpsi, 
        hasilUjian: hasilWithSantri 
      };

      return NextResponse.json(formattedData, { status: 200 });

    } else {
      const { data, error } = await supabase.from('Ujian').select('*').order('created_at', { ascending: false });
      if (error) throw error;

      const formattedFolders = data.map((d: any) => ({
        id: d.id,
        namaUjian: d.nama_ujian || d.title || 'Ujian Tanpa Nama',
        kelas: d.kelas || '-',
        tanggal: d.created_at || new Date().toISOString(),
        tipe: d.tipe || 'UH',
        token: d.token || 'OFF',
        linkSoal: d.linkSoal || d.link_soal || null, 
        pengajar: d.pengajar || "Ustadz/Ustadzah", 
        _count: { hasilUjian: 0 } 
      }));

      return NextResponse.json(formattedFolders, { status: 200 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
    try {
        const supabase = await createClient();
        const body = await req.json();
        const { id, tanggal, rawTanggal, namaUjian, ...updateData } = body;
        
        // 1. Update Data Folder Ujian
        const { error } = await supabase.from('Ujian').update(updateData).eq('id', id);
        if (error) throw new Error(error.message);

        // 2. FITUR BARU: AUTO-SYNC SISWA JIKA KELAS DIUBAH (TAMBAH & HAPUS)
        if (updateData.kelas !== undefined) {
          const kelasArray = updateData.kelas.split(',').map((k: string) => k.trim()).filter(Boolean);
          
          // Tarik ID semua Santri yang kelasnya sesuai dengan pilihan terbaru
          const { data: santriList } = await supabase.from('Santri').select('id').in('kelas', kelasArray);
          const validSantriIds = santriList?.map(s => String(s.id)) || [];
          
          // Cek siapa saja yang sudah ada di tabel HasilUjian folder ini sekarang
          const { data: existingHasil } = await supabase.from('HasilUjian').select('id, santri_id').eq('ujian_id', id);
          
          if (existingHasil) {
            // A. HAPUS SISWA LAMA: Cari ID siswa yang kelasnya sudah di-uncheck
            const idsToDelete = existingHasil
              .filter(e => !validSantriIds.includes(String(e.santri_id)))
              .map(e => e.id);
              
            if (idsToDelete.length > 0) {
              await supabase.from('HasilUjian').delete().in('id', idsToDelete);
            }

            // B. TAMBAH SISWA BARU: Cari santri yang baru di-check tapi belum ada di arsip
            const existingSantriIds = existingHasil.map(e => String(e.santri_id));
            const newSantri = santriList?.filter(s => !existingSantriIds.includes(String(s.id))) || [];

            if (newSantri.length > 0) {
              // Tarik jumlah soal untuk set jumlah array kosong
              const { count: totalSoal } = await supabase.from('Soal').select('*', { count: 'exact', head: true }).eq('ujian_id', id);
              const jumlahSoal = totalSoal || 0;
              const blankAnswers = Array(jumlahSoal).fill("-");

              const hasilPayload = newSantri.map((s: any) => ({
                ujian_id: id,
                santri_id: s.id,
                benar: 0,
                salah: 0,
                kosong: jumlahSoal,
                nilai_murni: 0,
                answers_json: JSON.stringify(blankAnswers)
              }));

              await supabase.from('HasilUjian').insert(hasilPayload);
            }
          }
        }

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (e:any) { 
        console.error("🔥 Error PUT Folder:", e.message);
        return NextResponse.json({ message: e.message }, { status: 500 }); 
    }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const supabase = await createClient(); 
    const { error } = await supabase.from('Ujian').delete().eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) { return NextResponse.json({ message: error.message }, { status: 500 }); }
}

export async function PATCH(req: Request) {
  try {
    const supabase = await createClient();
    const body = await req.json();
    const { ujianId, kunciBaru } = body;

    for (const item of kunciBaru) {
      const { error: err1 } = await supabase.from('Opsi').update({ is_correct: false }).eq('soal_id', item.soalId);
      if (err1) throw new Error(`Gagal reset kunci: ${err1.message}`);

      const { error: err2 } = await supabase.from('Opsi').update({ is_correct: true }).eq('soal_id', item.soalId).eq('label', item.labelBenar);
      if (err2) throw new Error(`Gagal set kunci baru: ${err2.message}`);
    }

    const { data: hasilSiswa } = await supabase.from('HasilUjian').select('*').eq('ujian_id', ujianId);
    const daftarKunciMurni = kunciBaru.map((k: any) => k.labelBenar);

    if (hasilSiswa && hasilSiswa.length > 0) {
      for (const siswa of hasilSiswa) {
        let jawabanArray: string[] = [];
        try {
          const rawJawaban = siswa.answersJson || siswa.answers_json;
          if (rawJawaban) {
            const parsed = typeof rawJawaban === 'string' ? JSON.parse(rawJawaban) : rawJawaban;
            if (Array.isArray(parsed)) jawabanArray = parsed;
            else if (parsed && parsed.answers && Array.isArray(parsed.answers)) jawabanArray = parsed.answers;
          }
        } catch (e) {}

        let benar = 0, salah = 0, kosong = 0;
        daftarKunciMurni.forEach((kunciBenar: string, idx: number) => {
          const jawabSiswa = jawabanArray[idx];
          if (!jawabSiswa || jawabSiswa === '-' || jawabSiswa === '') kosong++;
          else if (jawabSiswa === kunciBenar) benar++;
          else salah++;
        });

        const totalSoal = daftarKunciMurni.length;
        const nilaiBaru = totalSoal > 0 ? Math.round((benar / totalSoal) * 100) : 0;

        const { error: errUpdate } = await supabase.from('HasilUjian').update({ 
          benar: benar, salah: salah, kosong: kosong, nilai_murni: nilaiBaru 
        }).eq('id', siswa.id);

        if (errUpdate) throw new Error(`Gagal update nilai siswa: ${errUpdate.message}`);
      }
    }
    
    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error: any) { 
    console.error("🔥 Error PATCH Kunci:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 }); 
  }
}