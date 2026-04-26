export const runtime = 'edge';

import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const body = await req.json();

    // 1. SIMPAN DATA KE TABEL UJIAN (Menyesuaikan PERSIS dengan nama kolom di screenshot)
    const { data: ujianData, error: ujianError } = await supabase
      .from('Ujian')
      .insert([{
        nama_ujian: body.title,       // Di tabel namanya 'nama_ujian'
        kelas: body.className,        // Di tabel namanya 'kelas'
        tipe: body.examType,          // Di tabel namanya 'tipe'
        token: body.token,            // Di tabel namanya 'token'
        durasi: body.duration || 90,  // Di tabel namanya 'durasi'
        metode: 'LJK',                // Terlihat di tabel ada kolom 'metode'
        
        struktur_kanvas_json: body.struktur_kanvas_json 
        
        // Catatan: guru_id dan sekolah_id dibiarkan kosong agar diisi otomatis oleh database
      }])
      .select()
      .single();

    if (ujianError) {
      console.error("Error Simpan Tabel Ujian:", ujianError);
      throw ujianError;
    }

    const ujianId = ujianData.id;

    // 2. SIMPAN SOAL DAN OPSI JAWABAN
    if (body.questions && Array.isArray(body.questions)) {
      for (let i = 0; i < body.questions.length; i++) {
        const q = body.questions[i];
        
        // Simpan Soal
        const { data: soalData, error: soalError } = await supabase
          .from('Soal')
          .insert([{
            ujian_id: ujianId,
            pertanyaan: q.text || `Soal LJK No. ${i + 1}`,
            tipe: q.type || 'pg'
          }])
          .select()
          .single();

        // Simpan Opsi (A, B, C, D) jika soal berhasil masuk
        if (!soalError && soalData && q.options) {
          const opsiPayload = q.options.map((opt: any) => ({
            soal_id: soalData.id,
            label: opt.text,
            is_correct: opt.isCorrect,
            poin: opt.points || 1
          }));

          await supabase.from('Opsi').insert(opsiPayload);
        }
      }
    }

    return NextResponse.json({ success: true, message: "Ujian berhasil dibuat!" }, { status: 200 });

  } catch (error: any) {
    console.error("🔥 ERROR CREATE EXAM:", error.message);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}