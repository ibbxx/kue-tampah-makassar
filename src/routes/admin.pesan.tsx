import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Mail, Phone, Trash2, Check } from "lucide-react";
import { supabase, type ContactMessage } from "@/lib/supabase";

export const Route = createFileRoute("/admin/pesan")({ component: MessagesAdmin });

function MessagesAdmin() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin", "messages"],
    queryFn: async () => (await supabase.from("contact_messages").select("*").order("created_at", { ascending: false })).data as ContactMessage[] ?? [],
  });

  const markRead = async (id: string) => {
    await supabase.from("contact_messages").update({ is_read: true }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin", "messages"] });
  };
  const remove = async (id: string) => {
    if (!confirm("Hapus pesan?")) return;
    await supabase.from("contact_messages").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin", "messages"] });
  };

  return (
    <div className="space-y-6">
      <div><h1 className="font-display text-3xl font-bold">Pesan Kontak</h1><p className="text-sm text-muted-foreground">Inbox dari form kontak pelanggan.</p></div>
      <div className="space-y-3">
        {(data ?? []).map((m) => (
          <div key={m.id} className={`rounded-2xl border p-5 ${m.is_read ? "border-border bg-card" : "border-primary/40 bg-primary/5"}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold">{m.name} {!m.is_read && <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">Baru</span>}</div>
                <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  {m.email && <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" />{m.email}</span>}
                  {m.phone && <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" />{m.phone}</span>}
                  <span>{new Date(m.created_at).toLocaleString("id-ID")}</span>
                </div>
              </div>
              <div className="flex gap-1">
                {!m.is_read && <button onClick={() => markRead(m.id)} className="rounded-md p-1.5 text-accent hover:bg-accent/10"><Check className="h-4 w-4" /></button>}
                <button onClick={() => remove(m.id)} className="rounded-md p-1.5 text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm text-foreground/85">{m.message}</p>
          </div>
        ))}
        {(!data || data.length === 0) && <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground">Belum ada pesan.</div>}
      </div>
    </div>
  );
}
