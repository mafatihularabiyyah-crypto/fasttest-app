export const runtime = 'edge';

import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const body = await req.json();

    // 1. SIMPAN UJIAN
    const { data: ujianData, error: ujianError } = await supabase
      .from('Ujian')
      .insert([{
        nama_ujian: body.title,
        kelas: body.className,
        tipe: body.examType,
        token: body.token,
        durasi: body.duration || 90,
        metode: 'LJK',
        struktur_kanvas_json: body.struktur_kanvas_json 
      }])
      .select()
      .single();

    if (ujianError) throw new Error(`Gagal Simpan Ujian: ${ujianError.message}`);
    const ujianId = ujianData.id;

    // 2. SIMPAN SOAL DAN OPSI
    const questions = body.questions || [];
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const { data: soalData, error: soalError } = await supabase
        .from('Soal')
        .insert([{
          ujian_id: ujianId,
          nomor: i + 1,
          teks_soal: q.text || `Soal LJK No. ${i + 1}`,
          tipe_soal: q.type || 'pg'
        }])
        .select()
        .single();

      if (soalError) throw new Error(`Gagal Simpan Soal: ${soalError.message}`);

      if (soalData && q.options) {
        // PERBAIKAN: Kolom 'poin' DIHAPUS agar tidak bentrok dengan Supabase
        const opsiPayload = q.options.map((opt: any) => ({
          soal_id: soalData.id,
          label: opt.text,
          is_correct: opt.isCorrect 
        }));
        
        const { error: opsiError } = await supabase.from('Opsi').insert(opsiPayload);
        if (opsiError) throw new Error(`Gagal Simpan Opsi: ${opsiError.message}`);
      }
    }

    // 3. AUTO-ABSEN SISWA
    if (body.className) {
      const kelasArray = body.className.split(',').map((k: string) => k.trim());
      const { data: santriList, error: errSantri } = await supabase
        .from('Santri')
        .select('id')
        .in('kelas', kelasArray);

      if (errSantri) throw new Error(`Gagal Tarik Data Santri: ${errSantri.message}`);

      if (santriList && santriList.length > 0) {
        const blankAnswers = Array(questions.length).fill("-");
        const hasilPayload = santriList.map((s: any) => ({
          ujian_id: ujianId,
          santri_id: s.id,
          benar: 0,
          salah: 0,
          kosong: questions.length,
          nilai_murni: 0,
          answers_json: JSON.stringify(blankAnswers) 
        }));

        const { error: errHasil } = await supabase.from('HasilUjian').insert(hasilPayload);
        if (errHasil) throw new Error(`Gagal Simpan Absen: ${errHasil.message}`);
      }
    }

    return NextResponse.json({ success: true, message: "Berhasil dibuat!" }, { status: 200 });

  } catch (error: any) {
    console.error("🔥 Error Create Exam:", error.message);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}