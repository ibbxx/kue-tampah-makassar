import { createClient } from "@supabase/supabase-js";

export const config = {
  runtime: "edge",
};

export default async function handler(req: Request) {
  // Proteksi sederhana: hanya izinkan dari Vercel Cron
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return new Response(
      JSON.stringify({ error: "Supabase environment variables tidak ditemukan" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { data, error } = await supabase.rpc("ping_db");

    if (error) {
      console.error("Gagal ping Supabase:", error);
      return new Response(
        JSON.stringify({ status: "error", message: error.message }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    console.log("✅ Ping Supabase berhasil:", data);
    return new Response(JSON.stringify({ status: "ok", data }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error saat ping Supabase:", err);
    return new Response(
      JSON.stringify({ status: "error", message: String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
