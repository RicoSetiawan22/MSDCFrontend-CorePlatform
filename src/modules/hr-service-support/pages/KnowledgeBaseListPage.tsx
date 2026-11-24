import { PageHeader } from "@shared/components/PageHeader";
import { useState } from "react";
import { Search, Plus, Eye, FileEdit, CheckCircle2, Archive } from "lucide-react";
import { useKbArticles, useKbSearch } from "../api/useKnowledgeBase";
import { EmptyState } from "@shared/components/EmptyState";
import { LoadingState } from "@shared/components/LoadingState";
import { formatDate } from "@shared/lib/format";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { kbApi } from "../api/kbApi";
import { useKbCategories } from "../api/useKnowledgeBase";
import { CreateKbArticleModal } from "../components/CreateKbArticleModal";
import type { KbArticle, KbCategory } from "../types/kb";


export function KnowledgeBaseListPage() {
  const [tab, setTab] = useState<"browse" | "search">("browse");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [selectedArticle, setSelectedArticle] = useState<KbArticle | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Build params with filter
  const listParams = { status: statusFilter || undefined, page: 1, per_page: 100 };
  const { data: articles, isLoading } = useKbArticles(listParams);
  const { data: categories } = useKbCategories();
  const { data: searchResults, isLoading: searching } = useKbSearch(search);

  const qc = useQueryClient();

  // Ditaruh di level atas component, sejajar dengan hook lain (useState/useQuery/dll)
const publishMutation = useMutation({
  mutationFn: (article: KbArticle) => kbApi.publish(article.id),
  onSuccess: () => { qc.invalidateQueries({ queryKey: ["kbArticles"] }); setSelectedArticle(null); },
  onError: (e: Error) => alert("Gagal: " + e.message),
});

const archiveMutation = useMutation({
  mutationFn: (article: KbArticle) => kbApi.archive(article.id),
  onSuccess: () => { qc.invalidateQueries({ queryKey: ["kbArticles"] }); setSelectedArticle(null); },
  onError: (e: Error) => alert("Gagal: " + e.message),
});

// Handler biasa, tetap boleh di dalam component (bukan hook, jadi aman)
function publish(article: KbArticle) {
  if (!confirm(`Publikasikan artikel "${article.title}"?`)) return;
  publishMutation.mutate(article);
}

function archive(article: KbArticle) {
  if (!confirm(`Arsipkan artikel "${article.title}"?`)) return;
  archiveMutation.mutate(article);
}
  const displayArticles = tab === "browse" ? (articles?.data ?? []) : (searchResults ?? []);
  const filteredArticles = tab === "browse" && statusFilter
    ? displayArticles.filter((a) => a.status === statusFilter)
    : displayArticles;

  const allArticles = articles?.data ?? [];
  const now = new Date();
  const createdThisMonth = allArticles.filter(a => {
    const d = new Date(a.created_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const publishedCount = allArticles.filter(a => a.status === "published").length;
  const draftCount = allArticles.filter(a => a.status === "draft").length;
  const archivedCount = allArticles.filter(a => a.status === "archived").length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16">
      <PageHeader
        title="Knowledge Base"
        subtitle="Pusat artikel panduan, dokumentasi teknis, dan solusi insiden operasional."
      >
        <button
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#0A2140] hover:bg-[#07162c] rounded-xl transition-all shadow-sm"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus size={15} /> Artikel Baru
        </button>
      </PageHeader>

      <div className="px-7 py-5 flex flex-col gap-6">
        {/* Modern KB Hero Search Banner */}
        <div className="bg-gradient-to-r from-[#0A2140] via-[#102d54] to-[#1e3a5f] rounded-2xl p-6 sm:p-8 text-white shadow-sm flex flex-col items-center justify-center text-center gap-3">
          <span className="text-xs font-semibold tracking-wider uppercase text-amber-300">Pusat Pengetahuan &amp; Solusi</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Ada yang bisa kami bantu?</h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
            Cari solusi penanganan insiden, panduan SOP teknis Data Center, dan dokumentasi prosedur modul HR.
          </p>
          <div className="w-full max-w-lg mt-2 relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="w-full pl-11 pr-24 py-3 text-sm bg-white text-slate-900 rounded-xl shadow-md border-0 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-all placeholder:text-slate-400"
              placeholder="Cari artikel, kata kunci, solusi insiden..."
              value={search}
              onChange={e => { setSearch(e.target.value); setTab("search"); }}
            />
            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-[#f4ae3e] hover:bg-[#f7a41f] text-white text-xs font-semibold rounded-lg transition-all"
              onClick={() => setTab("search")}
            >
              Cari
            </button>
          </div>
        </div>

        {/* KPI Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Bulan Ini</span>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-blue-50 text-blue-600">
                <FileEdit size={16} />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-slate-900 tracking-tight">{createdThisMonth}</span>
              <p className="text-xs text-slate-500 mt-1">Artikel baru ditambahkan</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Published</span>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-emerald-50 text-emerald-600">
                <CheckCircle2 size={16} />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-slate-900 tracking-tight">{publishedCount}</span>
              <p className="text-xs text-emerald-600 font-medium mt-1">Dapat diakses seluruh pengguna</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Draft</span>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-amber-50 text-amber-600">
                <FileEdit size={16} />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-slate-900 tracking-tight">{draftCount}</span>
              <p className="text-xs text-amber-600 font-medium mt-1">Menunggu review konten</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Archived</span>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-slate-100 text-slate-600">
                <Archive size={16} />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-slate-900 tracking-tight">{archivedCount}</span>
              <p className="text-xs text-slate-500 mt-1">Arsip dokumentasi lampau</p>
            </div>
          </div>
        </div>

        {/* Main Content Table Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-white">
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
              {(["browse", "search"] as const).map(t => (
                <button
                  key={t}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    tab === t ? "bg-white text-[#0A2140] shadow-sm" : "text-slate-600 hover:text-slate-900"
                  }`}
                  onClick={() => setTab(t)}
                >
                  {t === "browse" ? "Katalog Artikel" : "Hasil Pencarian"}
                </button>
              ))}
            </div>

            {tab === "browse" && (
              <select
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:bg-white focus:outline-none focus:border-[#0A2140]"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
              >
                <option value="">Semua Status Konten</option>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            )}
          </div>

          {/* Loading */}
          {tab === "browse" && isLoading && <LoadingState />}
          {tab === "search" && searching && <LoadingState />}

          {/* Empty states */}
          {tab === "browse" && !isLoading && filteredArticles.length === 0 && (
            <div className="p-8">
              <EmptyState title="Belum Ada Artikel" subtitle="Buat artikel baru untuk melengkapi Knowledge Base." />
            </div>
          )}

          {tab === "search" && !searching && search.length > 0 && searchResults?.length === 0 && (
            <div className="p-8">
              <EmptyState title="Tidak Ditemukan" subtitle={`Tidak ada artikel yang cocok dengan kata kunci "${search}".`} />
            </div>
          )}

          {/* Article Table */}
          {filteredArticles.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80">
                    <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Judul Artikel</th>
                    <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Kategori</th>
                    <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Dilihat</th>
                    <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Waktu Buat</th>
                    <th className="px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredArticles.map(article => {
                    const category = categories?.find(c => c.id === article.category_id);
                    const statusMeta: Record<string, { bg: string; text: string; dot: string; label: string }> = {
                      published: { bg: "bg-emerald-50 border-emerald-200/60", text: "text-emerald-700", dot: "bg-emerald-500", label: "Published" },
                      draft: { bg: "bg-amber-50 border-amber-200/60", text: "text-amber-700", dot: "bg-amber-500", label: "Draft" },
                      archived: { bg: "bg-slate-100 border-slate-200", text: "text-slate-600", dot: "bg-slate-400", label: "Archived" },
                    };
                    const sm = statusMeta[article.status] ?? statusMeta.draft;

                    return (
                      <tr key={article.id} className="hover:bg-slate-50/60 transition-colors border-b border-slate-100">
                        <td className="px-5 py-3.5">
                          <button
                            onClick={() => { setSelectedArticle(article); setIsEditing(false); }}
                            className="text-left font-semibold text-sm text-slate-900 hover:text-[#0A2140] transition-colors block"
                          >
                            {article.title}
                          </button>
                          {article.content && (
                            <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{article.content.replace(/<[^>]*>/g, '').slice(0, 100)}</p>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-xs">
                          {category ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium border border-blue-200/60">
                              {category.category_name}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Umum</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${sm.bg} ${sm.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${sm.dot}`} />
                            {sm.label}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 font-mono text-xs text-slate-600">
                          <span className="inline-flex items-center gap-1">
                            <Eye size={12} className="text-slate-400" />
                            {article.view_count ?? 0}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 font-mono text-xs text-slate-600">
                          {formatDate(article.created_at)}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                              onClick={() => { setSelectedArticle(article); setIsEditing(false); }}
                            >
                              Detail
                            </button>
                            {article.status === "draft" && (
                              <button
                                className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/60 rounded-lg transition-colors"
                                onClick={() => publish(article)}
                              >
                                Publish
                              </button>
                            )}
                            {article.status === "published" && (
                              <button
                                className="px-2.5 py-1 text-xs font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
                                onClick={() => archive(article)}
                              >
                                Arsip
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      {selectedArticle !== null && (
        <ArticleDrawer
          article={selectedArticle}
          categories={categories ?? []}
          isEditing={isEditing}
          onClose={() => { setSelectedArticle(null); setIsEditing(false); }}
        />
      )}

      {showCreateModal && <CreateKbArticleModal onClose={() => setShowCreateModal(false)} />}
    </div>
  );
}

function ArticleDrawer({ article, categories, isEditing, onClose }: {
  article: KbArticle;
  categories: KbCategory[];
  isEditing: boolean;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [title, setTitle] = useState(article.title);
  const [content, setContent] = useState(article.content);
  const [categoryId, setCategoryId] = useState<number | undefined>(article.category_id ?? undefined);
  const [tags, setTags] = useState<string>((article.tags ?? []).join(", "));

  const saveMutation = useMutation({
    mutationFn: () => kbApi.updateArticle(article.id, {
      title, content, category_id: categoryId,
      tags: tags ? tags.split(",").map(t => t.trim()).filter(Boolean) : [],
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["kbArticles"] }); onClose(); },
    onError: (e: Error) => alert("Gagal: " + e.message),
  });

  return (
    <div style={{
      position: "fixed", top: 0, right: 0, bottom: 0, width: 500,
      background: "var(--surface)", borderLeft: "1px solid var(--border)",
      boxShadow: "-4px 0 20px rgba(0,0,0,0.3)", zIndex: 100,
      display: "flex", flexDirection: "column",
    }}>
      <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: "1rem" }}>{isEditing ? "Edit Artikel" : "Detail Artikel"}</div>
        </div>
        <button className="btn btn-secondary" onClick={onClose} style={{ padding: "0.3rem 0.6rem" }}>✕</button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
        {isEditing ? (
          <>
            <div>
              <label style={{ fontSize: "0.8rem", fontWeight: 600, display: "block", marginBottom: 4 }}>Judul</label>
              <input className="input" value={title} onChange={e => setTitle(e.target.value)} style={{ width: "100%" }} />
            </div>
            <div>
              <label style={{ fontSize: "0.8rem", fontWeight: 600, display: "block", marginBottom: 4 }}>Kategori</label>
              <select className="input" value={categoryId ?? ""} onChange={e => setCategoryId(e.target.value ? parseInt(e.target.value) : undefined)} style={{ width: "100%" }}>
                <option value="">— Tanpa Kategori —</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.category_name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: "0.8rem", fontWeight: 600, display: "block", marginBottom: 4 }}>Tags (pisah koma)</label>
              <input className="input" value={tags} onChange={e => setTags(e.target.value)} style={{ width: "100%" }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: "0.8rem", fontWeight: 600, display: "block", marginBottom: 4 }}>Konten</label>
              <textarea className="input" value={content} onChange={e => setContent(e.target.value)}
                style={{ width: "100%", minHeight: 300, resize: "vertical", fontFamily: "monospace", fontSize: "0.85rem" }} />
            </div>
          </>
        ) : (
          <>
            <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>{article.title}</div>
            <div style={{ fontSize: "0.8rem", color: "var(--grey)" }}>
              {article.view_count} views · Published {article.published_at ? formatDate(article.published_at) : "—"}
            </div>
            <div style={{ padding: "1rem", background: "var(--bg-subtle)", borderRadius: 8, fontSize: "0.9rem", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
              {article.content}
            </div>
          </>
        )}
      </div>

      {isEditing && (
        <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid var(--border)", display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button className="btn btn-secondary" onClick={onClose}>Batal</button>
          <button className="btn btn-primary" disabled={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
            {saveMutation.isPending ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      )}
    </div>
  );
}
