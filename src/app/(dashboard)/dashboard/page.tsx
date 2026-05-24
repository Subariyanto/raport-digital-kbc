import DashboardClient from "./DashboardClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // Demo mode: return dummy data if no Supabase configured
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl || supabaseUrl === "https://placeholder.supabase.co") {
    return (
      <DashboardClient
        siswaCount={10}
        guruCount={5}
        kelasCount={1}
        mapelCount={3}
        raportLengkap={7}
        raportBelum={3}
        nilaiPerKelas={[
          { nama: "IV-A", rataRata: 82 },
        ]}
      />
    );
  }

  const { createServerSupabaseClient } = await import("@/lib/supabase/server");
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

  const raportBelum = (siswaCount || 0) - (raportLengkap || 0);

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
