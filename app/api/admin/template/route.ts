export const runtime = 'edge';

import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// FUNGSI GET: Untuk mengambil data template (saat dimuat di tabel)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const supabase = await createClient(); 

    // Nama tabel sudah disesuaikan dengan database Ustadz
    const namaTabel = 'TemplateLJK'; 

    if (id) {
      const { data, error } = await supabase.from(namaTabel).select('*').eq('id', id).single();
      if (error) throw error;
      return NextResponse.json(data, { status: 200 });
    } else {
      const { data, error } = await supabase.from(namaTabel).select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return NextResponse.json(data, { status: 200 });
    }
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// FUNGSI POST: Untuk menyimpan template baru
export async function POST(req: Request) {
  try {
    const supabase = await createClient(); 
    const body = await req.json();
    
    const namaTabel = 'TemplateLJK'; 

    const { data, error } = await supabase.from(namaTabel).insert([body]).select();

    if (error) throw error;

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error: any) {
    console.error("Error Simpan Template:", error.message);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// FUNGSI PUT: Untuk mengedit template lama
export async function PUT(req: Request) {
  try {
    const supabase = await createClient(); 
    const body = await req.json();
    const { id, ...updateData } = body;
    
    const namaTabel = 'TemplateLJK'; 

    const { data, error } = await supabase.from(namaTabel).update(updateData).eq('id', id).select();

    if (error) throw error;

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// FUNGSI DELETE: Untuk menghapus template
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const supabase = await createClient(); 

    const namaTabel = 'TemplateLJK'; 

    const { error } = await supabase.from(namaTabel).delete().eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}