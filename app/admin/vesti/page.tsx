"use client";

import { useEffect, useState, type FormEvent } from "react";
import { CheckCircle2, Eye, EyeOff, Loader2, Newspaper, Pencil, Plus, Save, Trash2, XCircle } from "lucide-react";
import { AdminGuard } from "@/components/admin/admin-guard";
import { AdminNavigation } from "@/components/admin/admin-navigation";
import { Button } from "@/components/ui/button";
import { NewsRichText } from "@/components/news-rich-text";
import { formatNewsDate, type NewsItem } from "@/components/news-card";

type EditableNews = NewsItem & { published: boolean };

const emptyForm = { title: "", image_urls: [] as string[], description: "", content: "", published: true };

export default function AdminNewsPage() {
  const [news, setNews] = useState<EditableNews[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/news?admin=1&limit=100", { cache: "no-store" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Greška pri učitavanju vesti");
      setNews(data.news || []);
    } catch (loadError) {
      setError(true);
      setMessage(loadError instanceof Error ? loadError.message : "Greška pri učitavanju vesti");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setImageFiles([]);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(false);
    setMessage("");
    try {
      let imageUrls = form.image_urls;
      if (imageFiles.length > 0) {
        imageUrls = await Promise.all(imageFiles.map(async (imageFile) => {
          const uploadData = new FormData();
          uploadData.append("file", imageFile);
          const uploadResponse = await fetch("/api/news/upload", { method: "POST", body: uploadData });
          const uploadResult = await uploadResponse.json().catch(() => ({}));
          if (!uploadResponse.ok) throw new Error(uploadResult.error || "Slika nije sačuvana");
          return uploadResult.url as string;
        }));
      }
      const response = await fetch("/api/news", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingId ? { id: editingId, ...form, image_urls: imageUrls } : { ...form, image_urls: imageUrls }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Čuvanje vesti nije uspelo");
      await load();
      setMessage(editingId ? "Vest je izmenjena." : "Vest je uspešno kreirana.");
      resetForm();
    } catch (submitError) {
      setError(true);
      setMessage(submitError instanceof Error ? submitError.message : "Čuvanje vesti nije uspelo");
    } finally {
      setSaving(false);
    }
  };

  const edit = (item: EditableNews) => {
    setEditingId(item.id);
    setForm({ title: item.title, image_urls: item.image_urls?.length ? item.image_urls : item.image_url ? [item.image_url] : [], description: item.description, content: item.content, published: item.published });
    setImageFiles([]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const remove = async (id: number) => {
    if (!window.confirm("Da li sigurno želiš da obrišeš ovu vest?")) return;
    setBusyId(id);
    setError(false);
    setMessage("");
    try {
      const response = await fetch("/api/news", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Brisanje nije uspelo");
      await load();
      if (editingId === id) resetForm();
      setMessage("Vest je obrisana.");
    } catch (removeError) {
      setError(true);
      setMessage(removeError instanceof Error ? removeError.message : "Brisanje nije uspelo");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AdminGuard>
      <main className="min-h-screen bg-background px-3 pb-20 pt-20 sm:px-6 sm:pt-24">
        <AdminNavigation />
        <div className="mx-auto max-w-6xl">
          <header className="mb-8 sm:mb-10">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary sm:px-4 sm:py-2 sm:text-sm">
              <Newspaper className="h-4 w-4" /> Admin · vesti
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Vesti i obaveštenja</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">Kreiraj vest koja će se pojaviti na početnoj strani i na stranici svih vesti. Linkove nalepi direktno u opis ili tekst, a oni će postati klikabilni.</p>
          </header>

          {message && (
            <div className={`mb-6 flex items-start gap-3 rounded-xl border p-4 text-sm ${error ? "border-red-500/30 bg-red-500/10 text-red-200" : "border-green-500/30 bg-green-500/10 text-green-200"}`} role="status">
              {error ? <XCircle className="mt-0.5 h-5 w-5 shrink-0" /> : <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />}
              <span>{message}</span>
            </div>
          )}

          <form onSubmit={submit} className="rounded-2xl border border-primary/25 bg-card/50 p-4 shadow-xl shadow-black/10 sm:p-6">
            <h2 className="flex items-center gap-2 text-xl font-semibold text-foreground">{editingId ? <Pencil className="h-5 w-5 text-primary" /> : <Plus className="h-5 w-5 text-primary" />} {editingId ? "Izmeni vest" : "Nova vest"}</h2>
            <div className="mt-5 grid gap-4">
              <label className="grid gap-2 text-sm font-medium text-foreground">Naslov
                <input required maxLength={180} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Naslov vesti" className="h-11 rounded-lg border border-primary/25 bg-background px-3 text-foreground outline-none focus:ring-2 focus:ring-primary" />
              </label>
              <label className="grid gap-2 text-sm font-medium text-foreground">Slike
                <input type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => setImageFiles(Array.from(event.target.files || []))} className="rounded-lg border border-primary/25 bg-background px-3 py-2 text-sm text-foreground file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-primary-foreground" />
                <span className="text-xs font-normal text-muted-foreground">Možeš izabrati više slika. JPG, PNG, WebP ili GIF, svaka najviše 8 MB.</span>
                {form.image_urls.length > 0 && imageFiles.length === 0 && <div className="grid gap-3 sm:grid-cols-2">{form.image_urls.map((url, index) => <img key={`${url}-${index}`} src={url} alt={`Trenutna slika ${index + 1}`} className="mt-2 max-h-56 w-full rounded-xl object-contain" />)}</div>}
                {imageFiles.length > 0 && <p className="text-xs font-normal text-primary">Izabrano novih slika: {imageFiles.length}</p>}
              </label>
              <label className="grid gap-2 text-sm font-medium text-foreground">Kratak opis
                <textarea maxLength={400} rows={2} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Kratak tekst koji se vidi na početnoj strani" className="resize-y rounded-lg border border-primary/25 bg-background px-3 py-2 text-foreground outline-none focus:ring-2 focus:ring-primary" />
              </label>
              <label className="grid gap-2 text-sm font-medium text-foreground">Tekst vesti
                <textarea required maxLength={30000} rows={9} value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} placeholder={'Napiši vest ovde...\n\nLink možeš nalepiti ovako: https://gard018.com'} className="resize-y rounded-lg border border-primary/25 bg-background px-3 py-2 text-foreground outline-none focus:ring-2 focus:ring-primary" />
              </label>
              <label className="flex items-center gap-3 text-sm text-foreground">
                <input type="checkbox" checked={form.published} onChange={(event) => setForm({ ...form, published: event.target.checked })} className="h-4 w-4 accent-primary" /> Objavi odmah na sajtu
              </label>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button type="submit" disabled={saving} className="bg-primary text-primary-foreground hover:bg-primary/90"><Save className="mr-2 h-4 w-4" />{saving ? "Čuvanje..." : editingId ? "Sačuvaj izmene" : "Objavi vest"}</Button>
              {editingId && <Button type="button" variant="outline" onClick={resetForm}>Otkaži izmenu</Button>}
            </div>
          </form>

          <section className="mt-10">
            <h2 className="mb-4 text-2xl font-semibold text-foreground">Sve vesti</h2>
            {loading ? (
              <div className="flex items-center gap-2 rounded-xl border border-primary/20 bg-card/40 p-6 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /> Učitavanje...</div>
            ) : news.length === 0 ? (
              <div className="rounded-xl border border-dashed border-primary/30 bg-card/40 p-8 text-sm text-muted-foreground">Još nema kreiranih vesti.</div>
            ) : (
              <div className="space-y-4">
                {news.map((item) => (
                  <article key={item.id} className="rounded-xl border border-primary/20 bg-card/40 p-4 sm:p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2"><h3 className="text-xl font-semibold text-foreground">{item.title}</h3><span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${item.published ? "bg-green-500/15 text-green-300" : "bg-yellow-500/15 text-yellow-300"}`}>{item.published ? <><Eye className="h-3.5 w-3.5" /> Objavljena</> : <><EyeOff className="h-3.5 w-3.5" /> Nacrt</>}</span></div>
                        <p className="mt-1 text-xs text-muted-foreground">{formatNewsDate(item.created_at)}</p>
                         {(item.image_urls?.length ? item.image_urls : item.image_url ? [item.image_url] : []).length > 0 && <div className="mt-3 flex flex-wrap gap-2">{(item.image_urls?.length ? item.image_urls : item.image_url ? [item.image_url] : []).map((url, index) => <img key={`${url}-${index}`} src={url} alt="" className="h-24 w-40 rounded-lg object-contain" />)}</div>}
                         {item.description && <p className="mt-3 text-sm text-muted-foreground"><NewsRichText text={item.description} /></p>}
                      </div>
                      <div className="flex shrink-0 gap-2"><Button type="button" variant="outline" onClick={() => edit(item)}><Pencil className="mr-2 h-4 w-4" /> Izmeni</Button><Button type="button" variant="outline" disabled={busyId === item.id} onClick={() => remove(item.id)} className="border-red-500/40 text-red-300 hover:bg-red-500/10"><Trash2 className="mr-2 h-4 w-4" /> Obriši</Button></div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </AdminGuard>
  );
}
