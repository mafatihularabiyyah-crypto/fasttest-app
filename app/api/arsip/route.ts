export const runtime = 'edge';
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const ujianId = searchParams.get("ujianId");

  try {
    if (ujianId) {
      // 1. Jika ada ID yang dikirim, ambil detail komplit 1 ujian (Soal, Kunci, Nilai Santri)
      const detail = await prisma.ujian.findUnique({
        where: { id: ujianId },
        include: {
          guru: true,
          soal: {
            orderBy: { nomor: 'asc' },
            include: { opsi: true }
          },
          hasilUjian: {
            include: { santri: true }
          }
        }
      });
      return NextResponse.json(detail);
      
    } else {
      // 2. Jika tidak ada ID, ambil semua data Ujian untuk tampilan Folder Arsip
      const folders = await prisma.ujian.findMany({
        include: {
          guru: true,
          _count: { select: { hasilUjian: true } } // Hitung jumlah kertas/santri yang sudah terekam
        },
        orderBy: { tanggal: 'desc' }
      });
      return NextResponse.json(folders);
    }
  } catch (error) {
    console.error("API Arsip Error:", error);
    return NextResponse.json({ error: "Gagal memuat data dari server." }, { status: 500 });
  }
}