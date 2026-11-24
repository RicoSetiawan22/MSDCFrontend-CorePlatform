import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Modal } from "@shared/components/Modal";
import { Button } from "@shared/components/Button";
import { extractErrorMessage } from "@shared/types/api";
import { kbApi } from "../api/kbApi";
import { useKbCategories } from "../api/useKnowledgeBase";
import type { KbArticle } from "../types/kb";

interface CreateKbArticleModalProps {
  initialTitle?: string;
  initialContent?: string;
  initialTags?: string[];
  onClose: () => void;
  onCreated?: (article: KbArticle) => void;
}

/** Form buat artikel KB baru - dipakai baik dari tombol "Artikel Baru" di
 * halaman Knowledge Base sendiri (kosong) MAUPUN dari tombol "Buat Artikel
 * dari Incident/Tiket Ini" di halaman Incident/Support Ticket (initialTitle/
 * initialContent sudah di-prefill dari data incident/tiket yang resolved -
 * staf TETAP harus review & submit manual, bukan auto-publish). Artikel
 * selalu masuk sebagai 'draft' (lihat KnowledgeBaseService::createArticle()),
 * jadi tidak langsung tampil ke customer sebelum di-publish manual. */
export function CreateKbArticleModal({ initialTitle = "", initialContent = "", initialTags = [], onClose, onCreated }: CreateKbArticleModalProps) {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
  const [tags, setTags] = useState(initialTags.join(", "));
  const [error, setError] = useState<string | null>(null);

  const { data: categories } = useKbCategories();
  const qc = useQueryClient();

  const createMutation = useMutation({
    mutationFn: () => kbApi.createArticle({
      title: title.trim(),
      content: content.trim(),
      category_id: categoryId,
      tags: tags ? tags.split(",").map(t => t.trim()).filter(Boolean) : undefined,
    }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["kbArticles"] });
      onCreated?.(res.data.data);
      onClose();
    },
    onError: (e: Error) => setError(extractErrorMessage(e)),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) { setError("Judul dan konten wajib diisi."); return; }
    setError(null);
    createMutation.mutate();
  }

  return (
    <Modal title="Artikel Knowledge Base Baru" onClose={onClose} maxWidth={600}>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <div>
          <label className="input-label">Judul *</label>
          <input className="input" value={title} onChange={e => setTitle(e.target.value)} style={{ width: "100%" }} placeholder="Judul artikel" />
        </div>
        <div>
          <label className="input-label">Kategori</label>
          <select className="input" value={categoryId ?? ""} onChange={e => setCategoryId(e.target.value ? parseInt(e.target.value) : undefined)} style={{ width: "100%" }}>
            <option value="">— Tanpa Kategori —</option>
            {(categories ?? []).map(c => <option key={c.id} value={c.id}>{c.category_name}</option>)}
          </select>
        </div>
        <div>
          <label className="input-label">Tags (pisah koma)</label>
          <input className="input" value={tags} onChange={e => setTags(e.target.value)} style={{ width: "100%" }} placeholder="mis. jaringan, colocation" />
        </div>
        <div>
          <label className="input-label">Konten *</label>
          <textarea className="input" value={content} onChange={e => setContent(e.target.value)}
            style={{ width: "100%", minHeight: 260, resize: "vertical", fontFamily: "monospace", fontSize: "0.85rem" }} />
        </div>
        {(initialTitle || initialContent) && (
          <div style={{ fontSize: "0.72rem", color: "var(--grey)" }}>
            Judul & konten sudah diisi otomatis dari data ini - cek dan sunting dulu sebelum disimpan. Artikel tersimpan sebagai draft, belum tampil ke siapa pun sampai di-publish manual dari halaman Knowledge Base.
          </div>
        )}
        {error && <div className="input-error">{error}</div>}
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Batal</button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? "Menyimpan..." : "Simpan sebagai Draft"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
