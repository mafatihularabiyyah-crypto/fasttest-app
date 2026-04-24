export const runtime = 'edge';
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: Request) {
  try {
    // 1. Tangkap data yang dikirim dari halaman form
    const body = await req.json();
    const { email, password } = body;

    const supabase = await createClient();

    // 2. Serahkan urusan keamanan dan verifikasi ke Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    // 3. Jika email tidak terdaftar atau password salah
    if (authError) {
      // Supabase otomatis membedakan error (Invalid login credentials)
      return NextResponse.json(
        { error: "Email tidak terdaftar atau password salah." }, 
        { status: 401 }
      );
    }

    // 4. Ambil nama Guru dari database manual kita
    const { data: guru } = await supabase
      .from("Guru")
      .select("id, nama, email")
      .eq("email", email)
      .single();

    if (!guru) {
       // Opsional: Anda bisa menggagalkan login jika data di tabel Guru kosong
       // await supabase.auth.signOut();
       // return NextResponse.json({ error: "Guru belum terdaftar oleh Admin." }, { status: 404 });
    }

    // 5. Tiket masuk diberikan + Session otomatis tersimpan di Cookies browser!
    return NextResponse.json(
      { 
        message: "Login sukses!", 
        user: guru || { email: authData.user?.email } 
      }, 
      { status: 200 }
    );

  } catch (error) {
    console.error("Login API Error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server." }, 
      { status: 500 }
    );
  }
}