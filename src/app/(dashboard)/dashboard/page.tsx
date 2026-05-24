import { createServerSupabaseClient } from "@/lib/supabase/server";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const supabase = createServerSupabaseClient();

  const [
    { count: siswaCount },
    { count: guruCount },
    { count: kelasCount },
    { count: mapelCount },
    { count: raportLengkap },
  ] = await Promise.all([
    supabase.from("siswa").select("*", { count: "exact", head: true }),
    supabase.from("guru").select("*", { count: "exact", head: true }),
    supabase.from("kelas").select("*", { count: "exact", head: true }),
    supabase.from("mata_pelajaran").select("*", { count: "exact", head: true }),
    supabase.from("deskripsi_rapor").select("*", { count: "exact", head: true }).not("deskripsi_text", "is", null),
  ]);

  // Get total siswa for raport belum lengkap calculation
  const raportBelum = (siswaCount || 0) - (raportLengkap || 0);

  // Get rata-rata nilai per kelas
  const { data: kelasData } = await supabase.from("kelas").select("id, nama_rombel");
  const nilaiPerKelas: { nama: string; rataRata: number }[] = [];

  if (kelasData) {
    for (const kelas of kelasData.slice(0, 6)) {
      const { data: nilaiData } = await supabase
        .from("nilai")
        .select("nilai_akhir")
        .eq("kelas_id", kelas.id)
        .not("nilai_akhir", "is", null);

      if (nilaiData && nilaiData.length > 0) {
        const avg = Math.round(
          nilaiData.reduce((sum, n) => sum + (n.nilai_akhir || 0), 0) / nilaiData.length
        );
        nilaiPerKelas.push({ nama: kelas.nama_rombel, rataRata: avg });
      }
    }
  }

  return (
    <DashboardClient
      siswaCount={siswaCount ?? 0}
      guruCount={guruCount ?? 0}
      kelasCount={kelasCount ?? 0}
      mapelCount={mapelCount ?? 0}
      raportLengkap={raportLengkap ?? 0}
      raportBelum={raportBelum > 0 ? raportBelum : 0}
      nilaiPerKelas={nilaiPerKelas}
    />
  );
}
