// 1. Tambahkan 3 baris pelindung ini di paling atas
export const runtime = 'edge';
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(req: Request) {
  try {
    // ✅ BENAR: Pindahkan ke DALAM fungsi GET. 
    // Ini hanya akan dieksekusi saat aplikasi sudah berjalan (runtime), bukan saat Build.
    const supabase = await createClient(); 
    
    const { data, error } = await supabase.from('Guru').select('*');
    if (error) throw error;

    return NextResponse.json(data, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    // ✅ BENAR: Panggil lagi di DALAM fungsi POST
    const supabase = await createClient(); 
    
    // ... sisa kode POST Ustadz ...
    
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}    