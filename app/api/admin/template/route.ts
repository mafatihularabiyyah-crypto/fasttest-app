import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export const runtime = 'edge';
export const dynamic = "force-dynamic";

// MENGAMBIL DAFTAR TEMPLATE (GET)
export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Akses ditolak" }, { status: 401 });

    const { data: adminProfil } = await supabase.from("Guru").select("sekolah_id").eq("id", user.id).single();
    if (!adminProfil?.sekolah_id) return NextResponse.json([], { status: 200 });

    const { data, error } = await supabase
      .from('TemplateLJK')
      .select('*')
      .eq('sekolah_id', adminProfil.sekolah_id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json(data || [], { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// MENYIMPAN TEMPLATE BARU (POST)
export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const body = await req.json();
    const { nama_template, jumlah_soal, opsi, kolom } = body;

    const { data: { user } } = await supabase.auth.getUser();
    const { data: adminProfil } = await supabase.from("Guru").select("sekolah_id").eq("id", user!.id).single();

    const { error } = await supabase.from('TemplateLJK').insert({
      nama_template, jumlah_soal, opsi, kolom,
      sekolah_id: adminProfil?.sekolah_id 
    });

    if (error) throw error;
    return NextResponse.json({ success: true, message: "Template berhasil disimpan" }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// MENGHAPUS TEMPLATE (DELETE)
export async function DELETE(req: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    const { error } = await supabase.from('TemplateLJK').delete().eq('id', id);
    if (error) throw error;
    
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}