import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    // Mengambil nama-nama kelas yang unik dari tabel Santri yang statusnya Aktif
    const classes = await prisma.santri.findMany({
      select: { kelas: true },
      distinct: ['kelas'],
      where: { status: 'Aktif' },
      orderBy: { kelas: 'asc' }
    });
    
    // Mengubah format array object menjadi array string biasa: ["X IPA 1", "XI IPS 2"]
    return NextResponse.json(classes.map((c: any) => c.kelas));
  } catch (error) {
    console.error("Gagal mengambil kelas:", error);
    return NextResponse.json({ error: "Gagal memuat kelas" }, { status: 500 });
  }
}