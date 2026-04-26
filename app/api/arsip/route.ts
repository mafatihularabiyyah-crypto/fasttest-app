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
      const { data: ujianData, error: errUjian } = await supabase
        .from('Ujian')
        .select('*')
        .eq('id', ujianId)
        .single();

      if (errUjian) throw errUjian;
      
      const { data: soalData } = await supabase.from('Soal').select('*').eq('ujian_id', ujianId);
      const { data: hasilData } = await supabase.from('HasilUjian').select('*').eq('ujian_id', ujianId);

      let hasilWithSantri = hasilData || [];
      if (hasilData && hasilData.length > 0) {
        
        // Tarik SEMUA data santri sekaligus agar tidak ada yang terlewat
        const { data: santriData } = await supabase.from('Santri').select('id, nama, nis, kelas');

        if (santriData) {
          // Buat kamus (dictionary) yang kebal spasi dan huruf besar/kecil
          const santriMap: any = {};
          santriData.forEach((s: any) => { 
            const cleanId = String(s.id).trim().toLowerCase();
            santriMap[cleanId] = s; 
          });

          hasilWithSantri = hasilData.map((h: any) => {
            const queryId = h.santri_id ? String(h.santri_id).trim().toLowerCase() : "";
            const dataKetemu = santriMap[queryId];
            
            return {
              ...h,
              santri: dataKetemu || { 
                nama: `⚠️ ID Tdk Cocok: ${String(h.santri_id).substring(0, 8)}...`, 
                nis: "-", 
                kelas: "-" 
              } 
            };
          });
        }
      }

      const formattedData = {
        ...ujianData,
        namaUjian: ujianData.nama_ujian || ujianData.title || "Ujian",
        soal: soalData || [],
        hasilUjian: hasilWithSantri 
      };

      return NextResponse.json(formattedData, { status: 200 });

    } else {
      const { data, error } = await supabase
        .from('Ujian')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedFolders = data.map((d: any) => ({
        id: d.id,
        namaUjian: d.title || d.nama || d.nama_ujian || 'Ujian Tanpa Nama',
        kelas: d.kelas || d.className || '-',
        tanggal: d.created_at || d.tanggal || new Date().toISOString(),
        tipe: d.examType || d.tipe || 'UH',
        token: d.token || d.kode || 'OFF',
        linkSoal: d.linkSoal || null,
        guru: { nama: "Ustadz/Ustadzah" }, 
        _count: { hasilUjian: 0 } 
      }));

      return NextResponse.json(formattedFolders, { status: 200 });
    }
  } catch (error: any) {
    console.error("🔥 Error API Arsip Guru:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Untuk Update Folder
export async function PUT(req: Request) {
    try {
        const supabase = await createClient();
        const body = await req.json();
        const { id, ...updateData } = body;
        const { error } = await supabase.from('Ujian').update(updateData).eq('id', id);
        if (error) throw error;
        return NextResponse.json({ success: true }, { status: 200 });
    } catch (e:any) {
        return NextResponse.json({ message: e.message }, { status: 500 });
    }
}

// Untuk Hapus Folder
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const supabase = await createClient(); 
    const { error } = await supabase.from('Ujian').delete().eq('id', id);
    if (error) throw error;
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// Untuk Koreksi
export async function PATCH(req: Request) {
  try {
    const supabase = await createClient();
    const body = await req.json();
    const { ujianId, kunciBaru } = body;

    for (const item of kunciBaru) {
      await supabase.from('Opsi').update({ is_correct: false, is_benar: false }).eq('soal_id', item.soalId);
      await supabase.from('Opsi').update({ is_correct: true, is_benar: true })
        .eq('soal_id', item.soalId).eq('label', item.labelBenar);
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

        await supabase.from('HasilUjian').update({
            benar: benar, salah: salah, kosong: kosong, nilaiMurni: nilaiBaru, nilai_murni: nilaiBaru
        }).eq('id', siswa.id);
      }
    }
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}