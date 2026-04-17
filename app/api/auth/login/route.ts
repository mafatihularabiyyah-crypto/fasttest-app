import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    // 1. Tangkap data yang dikirim dari halaman form
    const body = await req.json();
    const { email, password } = body;

    // 2. Cari data Guru di database berdasarkan email
    const guru = await prisma.guru.findUnique({
      where: { email: email }
    });

    // 3. Jika email tidak ada di database
    if (!guru) {
      return NextResponse.json(
        { error: "Email tidak terdaftar. Silakan cek kembali." }, 
        { status: 404 }
      );
    }

    // 4. Jika password salah (Catatan: Ini pencocokan teks biasa. Nanti bisa diupgrade pakai bcrypt)
    if (guru.password !== password) {
      return NextResponse.json(
        { error: "Password salah." }, 
        { status: 401 }
      );
    }

    // 5. Jika lolos semua, berikan tiket masuk!
    return NextResponse.json(
      { message: "Login sukses!", user: { id: guru.id, nama: guru.nama, email: guru.email } }, 
      { status: 200 }
    );

  } catch (error) {
    return NextResponse.json(
      { error: "Terjadi kesalahan pada server." }, 
      { status: 500 }
    );
  }
}