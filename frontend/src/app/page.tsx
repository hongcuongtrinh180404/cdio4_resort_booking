import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-5xl font-bold text-center">DTUVIVI Resort</h1>
      <p className="text-xl text-gray-600">Trải nghiệm kỳ nghỉ tuyệt vời</p>
      <Link
        href="/rooms"
        className="rounded-lg bg-blue-600 px-8 py-3 text-white font-semibold hover:bg-blue-700 transition"
      >
        Tìm phòng ngay
      </Link>
    </main>
  );
}
