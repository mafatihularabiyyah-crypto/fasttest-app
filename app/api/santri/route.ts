import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";

// Memastikan data selalu segar dan tidak nyangkut di cache Next.js
export const dynamic = "force-dynamic";

// ==========================================
// 1. GET: MENGAMBIL DATA SANTRI
// ==========================================
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Cari tahu guru ini mengajar di sekolah mana
    const { data: guru } = await supabase.from("Guru").select("sekolah_id").eq("email", user.email).single();

    if (!guru || !guru.sekolah_id) {
      return NextResponse.json([], { status: 200 }); 
    }

    // Ambil santri sesuai sekolah guru tersebut
    const { data: santri, error } = await supabase
      .from("Santri")
      .select("*")
      .eq("sekolah_id", guru.sekolah_id)
      .order("nama", { ascending: true }); 

    if (error) throw error;
    return NextResponse.json(santri || [], { status: 200 });

  } catch (error) {
    console.error("GET Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// ==========================================
// 2. POST: MENAMBAH SANTRI BARU
// ==========================================
export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: guru } = await supabase.from("Guru").select("sekolah_id").eq("email", user.email).single();
    if (!guru) return NextResponse.json({ error: "Guru tidak ditemukan" }, { status: 404 });

    const body = await req.json();

    // Masukkan data ke Supabase
    const { data, error } = await supabase
      .from("Santri")
      .insert([{
        sekolah_id: guru.sekolah_id,
        nis: body.nis,
        nama: body.nama,
        gender: body.gender,
        kelas: body.kelas,
        status: body.status
      }])
      .select();

    if (error) throw error;
    return NextResponse.json({ message: "Berhasil ditambah", data }, { status: 201 });

  } catch (error) {
    console.error("POST Error:", error);
    return NextResponse.json({ error: "Gagal menyimpan data" }, { status: 500 });
  }
}

// ==========================================
// 3. PUT: MENGEDIT DATA SANTRI
// ==========================================
export async function PUT(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();

    // Update data di Supabase berdasarkan ID santri
    const { data, error } = await supabase
      .from("Santri")
      .update({
        nis: body.nis,
        nama: body.nama,
        gender: body.gender,
        kelas: body.kelas,
        status: body.status
      })
      .eq("id", body.id)
      .select();

    if (error) throw error;
    return NextResponse.json({ message: "Berhasil diupdate", data }, { status: 200 });

  } catch (error) {
    console.error("PUT Error:", error);
    return NextResponse.json({ error: "Gagal mengupdate data" }, { status: 500 });
  }
}

// ==========================================
// 4. DELETE: MENGHAPUS DATA SANTRI
// ==========================================
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Tangkap ID dari URL (misal: /api/santri?id=123)
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID tidak diberikan" }, { status: 400 });

    const { error } = await supabase.from("Santri").delete().eq("id", id);

    if (error) throw error;
    return NextResponse.json({ message: "Berhasil dihapus" }, { status: 200 });

  } catch (error) {
    console.error("DELETE Error:", error);
    return NextResponse.json({ error: "Gagal menghapus data" }, { status: 500 });
  }
}