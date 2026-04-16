import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// 1. MENGAMBIL SEMUA DATA SANTRI (READ)
export async function GET() {
  try {
    const santri = await prisma.santri.findMany({
      orderBy: { kelas: 'asc' } // Urutkan berdasarkan kelas
    });
    return NextResponse.json(santri);
  } catch (error) {
    return NextResponse.json({ error: "Gagal mengambil data" }, { status: 500 });
  }
}

// 2. MENAMBAH DATA SANTRI BARU (CREATE)
export async function POST(req: Request) {
  try {
    const body = await req.json();

    // --- MULAI PERBAIKAN: Cari atau Buat Sekolah Default ---
    let sekolah = await prisma.sekolah.findFirst();
    if (!sekolah) {
      sekolah = await prisma.sekolah.create({
        data: { nama: "Sekolah Default TarbiyahTech" }
      });
    }
    // --- AKHIR PERBAIKAN ---

    const newSantri = await prisma.santri.create({
      data: {
        sekolahId: sekolah.id, // <--- INI KUNCI AGAR LOLOS RAZIA PRISMA
        nis: body.nis,
        nama: body.nama,
        gender: body.gender,
        kelas: body.kelas,
        status: body.status,
      }
    });
    return NextResponse.json({ message: "Berhasil ditambah", data: newSantri }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Gagal menambah data" }, { status: 500 });
  }
}

// 3. MENGUBAH DATA SANTRI (UPDATE)
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const updatedSantri = await prisma.santri.update({
      where: { id: body.id },
      data: {
        nis: body.nis,
        nama: body.nama,
        gender: body.gender,
        kelas: body.kelas,
        status: body.status,
      }
    });
    return NextResponse.json({ message: "Berhasil diubah", data: updatedSantri });
  } catch (error) {
    return NextResponse.json({ error: "Gagal mengubah data" }, { status: 500 });
  }
}

// 4. MENGHAPUS DATA SANTRI (DELETE)
export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    
    if (!id) return NextResponse.json({ error: "ID tidak ditemukan" }, { status: 400 });

    await prisma.santri.delete({
      where: { id: id }
    });
    return NextResponse.json({ message: "Berhasil dihapus" });
  } catch (error) {
    return NextResponse.json({ error: "Gagal menghapus data" }, { status: 500 });
  }
}