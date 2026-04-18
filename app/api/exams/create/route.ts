import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export const runtime = 'edge';
export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    
    // 1. Ambil sesi user yang sedang login (Lebih aman dari sekadar mengirim 'teacherName')
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, className, duration, token, examType, questions } = body;

    // 2. Validasi Token Ujian
    const { data: existingExam } = await supabase
      .from("Ujian")
      .select("id")
      .eq("token", token)
      .single();

    if (existingExam) {
      return NextResponse.json({ message: "Token sudah digunakan! Buat token baru." }, { status: 400 });
    }

    // 3. Ambil profil Guru pengampu dari tabel
    const { data: guru } = await supabase
      .from("Guru")
      .select("id, sekolah_id")
      .eq("email", user.email)
      .single();

    if (!guru) {
      return NextResponse.json({ message: "Profil Guru tidak ditemukan di database." }, { status: 404 });
    }

    // ==============================================================
    // KUNCI SINKRONISASI: Tarik semua santri dari kelas yang dipilih
    // ==============================================================
    const { data: daftarSantri } = await supabase
      .from("Santri")
      .select("id")
      .eq("kelas", className)
      .eq("status", "Aktif");

    // 4. SIMPAN UJIAN DULU
    const { data: newExam, error: examError } = await supabase
      .from("Ujian")
      .insert({
        sekolah_id: guru.sekolah_id,
        guru_id: guru.id,
        nama_ujian: title,
        kelas: className,
        tipe: "UAS", 
        metode: examType,
        durasi: duration,
        token: token
      })
      .select()
      .single();

    if (examError || !newExam) throw examError;

    // 5. SIMPAN SEMUA SOAL (Menggunakan ID Ujian yang baru dibuat)
    const soalPayload = questions.map((q: any, index: number) => ({
      ujian_id: newExam.id,
      nomor: index + 1,
      tipe_soal: q.type,
      teks_soal: q.text
    }));

    const { data: insertedSoal, error: soalError } = await supabase
      .from("Soal")
      .insert(soalPayload)
      .select();

    if (soalError || !insertedSoal) throw soalError;

    // 6. SIMPAN SEMUA OPSI JAWABAN (Mencocokkan dengan ID Soal)
    const opsiPayload: any[] = [];
    
    questions.forEach((q: any, qIndex: number) => {
      // Cari ID soal yang di-generate database berdasarkan nomor soalnya
      const matchedSoal = insertedSoal.find((s: any) => s.nomor === qIndex + 1);

      if (matchedSoal) {
        q.options.forEach((opt: any, optIndex: number) => {
          let optionLabel = "";
          if (q.type === "bs") optionLabel = optIndex === 0 ? "B" : "S";
          else if (q.type === "angka14") optionLabel = (optIndex + 1).toString();
          else optionLabel = String.fromCharCode(65 + optIndex);

          opsiPayload.push({
            soal_id: matchedSoal.id,
            label: optionLabel,
            teks_opsi: opt.text,
            is_correct: opt.isCorrect,
            points: opt.points
          });
        });
      }
    });

    // Eksekusi simpan Opsi (jika ada)
    if (opsiPayload.length > 0) {
      const { error: opsiError } = await supabase.from("Opsi").insert(opsiPayload);
      if (opsiError) throw opsiError;
    }

    // ==============================================================
    // BUATKAN DAFTAR HADIR (LEMBAR NILAI KOSONG) UNTUK SEMUA SANTRI
    // ==============================================================
    if (daftarSantri && daftarSantri.length > 0) {
      const hasilPayload = daftarSantri.map((santri: any) => ({
        ujian_id: newExam.id,
        santri_id: santri.id,
        benar: 0,
        salah: 0,
        kosong: questions.length, // Otomatis menganggap semua soal kosong di awal
        nilai_murni: 0,
        answers_json: "[]" // Belum ada jawaban yang masuk
      }));
      
      const { error: hasilError } = await supabase.from("HasilUjian").insert(hasilPayload);
      if (hasilError) throw hasilError;
    }

    // 8. Berhasil!
    return NextResponse.json(
      { 
        message: `Ujian berhasil disimpan dan disinkronkan dengan ${daftarSantri?.length || 0} santri dari kelas ${className}!`, 
        examId: newExam.id 
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("Gagal menyimpan ujian:", error);
    return NextResponse.json({ message: "Terjadi kesalahan internal server." }, { status: 500 });
  }
}