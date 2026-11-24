import { PageHeader } from "@shared/components/PageHeader";
import { useMemo, useRef, useState } from "react";
import { 
  Image as ImageIcon, Upload, Trash2, FolderPlus, FolderX, 
  Pencil, HardDrive, Search, FileImage, 
  Settings, Cloud, FileDigit, ZoomIn, Loader2, FolderTree, Folder
} from "lucide-react";
import { useAuth } from "@shared/lib/auth-context";
import { LoadingState } from "@shared/components/LoadingState";
import { EmptyState } from "@shared/components/EmptyState";
import { Button } from "@shared/components/Button";
import { Modal } from "@shared/components/Modal";
import { Pagination } from "@shared/components/Pagination";
import { extractErrorMessage } from "@shared/types/api";
import type { FileRecord, FileFolder, FileStorageConfig } from "@shared/types/file";
import { useFileThumbnail, useFilePreview } from "../api/useFilePreview";
import {
  useFileList, useDeleteFile, useUploadImage,
  useFolderList, useCreateFolder, useUpdateFolder, useDeleteFolder,
  useStorageConfigs, useCreateStorageConfig, useUpdateStorageConfig, useDeleteStorageConfig,
} from "../api/useFileManagement";

function formatBytes(bytes: number | null | undefined): string {
  if (!bytes) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function flattenFolders(folders: FileFolder[], depth = 0): { id: number; name: string; depth: number }[] {
  let result: { id: number; name: string; depth: number }[] = [];
  for (const f of folders) {
    result.push({ id: f.id, name: f.name, depth });
    if (f.children && f.children.length > 0) {
      result = result.concat(flattenFolders(f.children, depth + 1));
    }
  }
  return result;
}

export function ImageManagementPage() {
  const { hasPermission } = useAuth();
  const canView = hasPermission("file.view");
  const canManage = hasPermission("file.manage");
  const [tab, setTab] = useState<"data" | "settings">("data");

  if (!canView) {
    return (
      <main className="p-8 max-w-7xl w-full mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <EmptyState title="Akses Ditolak" subtitle="Anda tidak punya izin (file.view) untuk membuka halaman ini." />
        </div>
      </main>
    );
  }

  return (
    <main className="w-full bg-slate-50 min-h-screen">
      <PageHeader
        title="Manajemen Gambar & File"
        subtitle="Kelola seluruh aset media terpusat — galeri foto, kategori direktori, serta konfigurasi engine penyimpanan fisik."
      />
      <div className="px-7 py-5 space-y-6">

      {/* ===== TABS ===== */}
      <div className="bg-white rounded-2xl p-1.5 shadow-sm border border-slate-200 flex items-center gap-2 w-fit">
        <button 
          onClick={() => setTab("data")} 
          className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all ${tab === "data" ? "bg-amber-50/90 text-amber-600 shadow-sm border border-amber-100" : "text-slate-600 hover:bg-slate-100/70"}`}
        >
          <ImageIcon size={16} />
          <span>Galeri Gambar</span>
        </button>
        <button 
          onClick={() => setTab("settings")} 
          className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl transition-all ${tab === "settings" ? "bg-amber-50/90 text-amber-600 shadow-sm border border-amber-100" : "text-slate-600 hover:bg-slate-100/70"}`}
        >
          <Settings size={16} />
          <span>Pengaturan Sistem</span>
        </button>
      </div>

      {/* ===== TAB CONTENT ===== */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 md:p-6">
        {tab === "data" && <ImageDataSection canManage={canManage} />}
        {tab === "settings" && <ImageSettingsSection canManage={canManage} />}
      </div>
      </div>
    </main>
  );
}

// ============================================================
// TAB 1 - Data Gambar (Galeri)
// ============================================================
function ImageDataSection({ canManage }: { canManage: boolean }) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [folderId, setFolderId] = useState<number | undefined>(undefined);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileRecord | null>(null);

  const { data: folders } = useFolderList({ root_only: 1 });
  const { data, isLoading, error } = useFileList({ type: "image", page, per_page: 24, search: search || undefined, folder_id: folderId });
  const deleteMutation = useDeleteFile();

  const flatFolders = useMemo(() => flattenFolders(folders ?? []), [folders]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  async function handleDelete(file: FileRecord) {
    if (!window.confirm(`Hapus permanen gambar "${file.original_name}"? Tindakan ini tidak bisa dibatalkan.`)) return;
    try {
      await deleteMutation.mutateAsync(file.id);
    } catch (err) {
      window.alert(extractErrorMessage(err));
    }
  }

  return (
    <div className="space-y-6">
      
      {/* Galeri Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/60 p-4 rounded-xl border border-slate-200">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Cari nama file..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-amber-500 focus:border-amber-500 shadow-sm"
            />
          </div>
          <select 
            value={folderId ?? ""} 
            onChange={(e) => { setFolderId(e.target.value ? Number(e.target.value) : undefined); setPage(1); }} 
            className="w-full sm:w-auto bg-white border border-slate-300 text-slate-700 text-xs rounded-lg px-3 py-2 focus:ring-amber-500 focus:border-amber-500 shadow-sm"
          >
            <option value="">📁 Semua Folder</option>
            {flatFolders.map(f => (
              <option key={f.id} value={f.id}>{"—".repeat(f.depth)} {f.name}</option>
            ))}
          </select>
          <Button type="submit" variant="secondary" className="px-4 py-2 text-xs">Filter</Button>
        </form>

        {canManage && (
          <Button onClick={() => setUploadOpen(true)} className="inline-flex items-center gap-1.5 px-4 py-2 shrink-0 shadow-md">
            <Upload size={14} /> Upload Gambar
          </Button>
        )}
      </div>

      {error ? (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg text-sm border border-red-200">{extractErrorMessage(error)}</div>
      ) : isLoading ? (
        <LoadingState />
      ) : (data?.data.length ?? 0) === 0 ? (
        <div className="py-12 border-2 border-dashed border-slate-200 rounded-2xl">
          <EmptyState title="Tidak Ada Gambar" subtitle="Belum ada gambar yang diunggah atau cocok dengan filter Anda." />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {data!.data.map(file => (
            <ImageCard key={file.id} file={file} canManage={canManage} onView={() => setPreviewFile(file)} onDelete={() => handleDelete(file)} />
          ))}
        </div>
      )}

      {data && data.last_page > 1 && (
        <div className="pt-4 border-t border-slate-100 flex justify-center">
          <Pagination currentPage={data.current_page} lastPage={data.last_page} total={data.total} onPageChange={setPage} />
        </div>
      )}

      {uploadOpen && <UploadImageModal folders={flatFolders} onClose={() => setUploadOpen(false)} />}
      {previewFile && <ImagePreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />}
    </div>
  );
}

// Komponen Card Satuan
function ImageCard({ file, canManage, onView, onDelete }: { file: FileRecord; canManage: boolean; onView: () => void; onDelete: () => void }) {
  const { url } = useFileThumbnail(file.id);

  return (
    <div className="group relative bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-amber-300 hover:shadow-md transition-all flex flex-col h-full">
      <div 
        className="aspect-square bg-slate-100 w-full relative overflow-hidden flex items-center justify-center cursor-pointer group-hover:opacity-90"
        onClick={onView}
      >
        {url ? (
          <img src={url} alt={file.original_name} className="w-full h-full object-cover" />
        ) : (
          <FileImage size={24} className="text-slate-300" />
        )}
        
        {/* Hover Overlay Icon */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 bg-white/90 p-1.5 rounded-full text-slate-800 shadow-sm transition-opacity transform scale-90 group-hover:scale-100">
            <ZoomIn size={16} />
          </div>
        </div>
      </div>
      
      <div className="p-2.5 flex-1 flex flex-col justify-between">
        <div className="truncate text-xs font-semibold text-slate-800 mb-0.5" title={file.original_name}>
          {file.original_name}
        </div>
        <div className="flex items-center justify-between mt-1">
          <div className="text-[10px] text-slate-400 font-mono bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
            {formatBytes(file.size_bytes)}
          </div>
          {canManage && (
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(); }} 
              className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-1 rounded transition-colors"
              title="Hapus Gambar"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Modal Preview Gambar Full Size
function ImagePreviewModal({ file, onClose }: { file: FileRecord; onClose: () => void }) {
  const { url, isLoading } = useFilePreview(file.id);

  return (
    <Modal title="Preview Gambar" onClose={onClose} maxWidth={800}>
      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 mb-4 flex flex-wrap gap-x-6 gap-y-2 text-xs">
        <div><strong className="text-slate-500 mr-1">Nama:</strong> <span className="font-semibold">{file.original_name}</span></div>
        <div><strong className="text-slate-500 mr-1">Ukuran:</strong> {formatBytes(file.size_bytes)}</div>
        <div><strong className="text-slate-500 mr-1">Tipe:</strong> {file.mime_type}</div>
        <div><strong className="text-slate-500 mr-1">Waktu Upload:</strong> {file.created_at}</div>
      </div>
      
      <div className="bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center min-h-[300px] relative shadow-inner">
        {isLoading && <Loader2 className="animate-spin text-white opacity-50" size={32} />}
        {!isLoading && url && (
          <img src={url} alt={file.original_name} className="max-w-full max-h-[60vh] object-contain" />
        )}
        {!isLoading && !url && <div className="text-slate-400 text-sm">Gagal memuat gambar preview.</div>}
      </div>
    </Modal>
  );
}

// Modal Upload Manual
function UploadImageModal({ folders, onClose }: { folders: { id: number; name: string; depth: number }[]; onClose: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [folderId, setFolderId] = useState<number | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = useUploadImage();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) { setError("Pilih file gambar."); return; }
    setError(null);
    try {
      await uploadMutation.mutateAsync({ file, folderId: folderId });
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  return (
    <Modal title="Upload Gambar Manual" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        
        <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
          <input type="file" accept="image/*" ref={fileInputRef} onChange={(e) => setFile(e.target.files?.[0] || null)} className="hidden" />
          {file ? (
            <div className="text-emerald-600 font-semibold flex flex-col items-center gap-2">
              <FileDigit size={32} />
              <span className="text-sm">{file.name} ({formatBytes(file.size)})</span>
              <span className="text-xs text-slate-500 font-normal">Klik untuk mengganti gambar</span>
            </div>
          ) : (
            <div className="text-slate-500 flex flex-col items-center gap-2">
              <Upload size={32} className="text-slate-400 mb-1" />
              <span className="text-sm font-semibold">Klik atau Pilih File Gambar</span>
              <span className="text-xs">Maks. batas sesuai konfigurasi server (biasanya 2MB - 5MB)</span>
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Pilih Folder Tujuan (Opsional)</label>
          <select value={folderId ?? ""} onChange={(e) => setFolderId(e.target.value ? Number(e.target.value) : undefined)} className="w-full bg-white border border-slate-300 text-sm rounded-lg px-3 py-2.5 focus:ring-amber-500 focus:border-amber-500">
            <option value="">📁 Root / Tanpa Folder</option>
            {folders.map((f) => (
              <option key={f.id} value={f.id}>{"—".repeat(f.depth)} {f.name}</option>
            ))}
          </select>
        </div>

        {error && <div className="text-sm text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-100">{error}</div>}
        
        <div className="pt-2">
          <Button type="submit" disabled={!file || uploadMutation.isPending} className="w-full flex items-center justify-center gap-2 py-2.5">
            {uploadMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            {uploadMutation.isPending ? "Mengunggah..." : "Mulai Upload"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ============================================================
// TAB 2 - Pengaturan (Folder & Storage)
// ============================================================
function ImageSettingsSection({ canManage }: { canManage: boolean }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      <FolderSettingsCard canManage={canManage} />
      <StorageConfigCard canManage={canManage} />
    </div>
  );
}

// ----- FOLDER SETTINGS -----
function FolderSettingsCard({ canManage }: { canManage: boolean }) {
  const { data: folders, isLoading } = useFolderList({ root_only: 1 });
  const createMutation = useCreateFolder();
  const updateMutation = useUpdateFolder();
  const deleteMutation = useDeleteFolder();

  const [newName, setNewName] = useState("");
  const [newParentId, setNewParentId] = useState<number | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  const flat = useMemo(() => flattenFolders(folders ?? []), [folders]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setError(null);
    try {
      await createMutation.mutateAsync({ name: newName.trim(), parent_id: newParentId });
      setNewName("");
    } catch (err) { setError(extractErrorMessage(err)); }
  }

  async function handleRename(id: number) {
    const newFolderName = window.prompt("Masukkan nama folder baru:");
    if (!newFolderName || !newFolderName.trim()) return;
    try {
      await updateMutation.mutateAsync({ id, values: { name: newFolderName.trim() } });
    } catch (err) { window.alert(extractErrorMessage(err)); }
  }

  async function handleDelete(id: number, name: string) {
    if (!window.confirm(`Hapus folder "${name}"? Gambar di dalamnya akan dipindah ke root.`)) return;
    try {
      await deleteMutation.mutateAsync(id);
    } catch (err) { window.alert(extractErrorMessage(err)); }
  }

  return (
    <div className="bg-slate-50/60 p-5 rounded-2xl border border-slate-200">
      <div className="flex items-center gap-2.5 mb-2">
        <div className="p-2 bg-blue-100 text-blue-700 rounded-lg"><FolderTree size={20} /></div>
        <h3 className="font-bold text-slate-800 text-lg">Kategori & Folder</h3>
      </div>
      <p className="text-slate-500 text-xs mb-5 leading-relaxed">
        Kelompokkan gambar secara logis. Menghapus folder tidak menghapus gambar di dalamnya (gambar otomatis pindah ke direktori root utama).
      </p>

      {isLoading && <LoadingState />}
      
      {!isLoading && (
        <div className="bg-white rounded-xl border border-slate-200 p-2 mb-5 max-h-[300px] overflow-y-auto">
          {(folders?.length ?? 0) === 0 ? (
            <div className="text-xs text-slate-400 text-center py-6">Belum ada folder yang dibuat.</div>
          ) : (
            <div className="space-y-0.5">
              {flat.map((f) => (
                <div key={f.id} className="flex items-center justify-between py-1.5 px-3 hover:bg-slate-50 rounded-lg group transition-colors">
                  <div className="flex items-center gap-2 text-sm text-slate-700 font-medium">
                    <span className="text-slate-300 font-mono select-none">{"—".repeat(f.depth)}</span>
                    <Folder size={14} className="text-amber-500" />
                    {f.name}
                  </div>
                  {canManage && (
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                      <button onClick={() => handleRename(f.id)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded" title="Ganti Nama">
                        <Pencil size={12} />
                      </button>
                      <button onClick={() => handleDelete(f.id, f.name)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded" title="Hapus">
                        <FolderX size={12} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {canManage && (
        <form onSubmit={handleCreate} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
          <h4 className="text-xs font-bold text-slate-700 mb-1">Buat Folder Baru</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <input value={newName} onChange={(e) => setNewName(e.target.value)} className="w-full text-xs rounded-lg border-slate-300 py-2 focus:ring-amber-500 focus:border-amber-500" placeholder="Nama Folder (mis. Brosur)" required />
            </div>
            <div>
              <select value={newParentId ?? ""} onChange={(e) => setNewParentId(e.target.value ? Number(e.target.value) : undefined)} className="w-full text-xs rounded-lg border-slate-300 py-2 focus:ring-amber-500 focus:border-amber-500 text-slate-600">
                <option value="">Root (Folder Utama)</option>
                {flat.map((f) => (
                  <option key={f.id} value={f.id}>{"—".repeat(f.depth)} {f.name}</option>
                ))}
              </select>
            </div>
          </div>
          {error && <div className="text-xs text-red-600">{error}</div>}
          <div className="flex justify-end pt-1">
            <Button type="submit" disabled={createMutation.isPending} className="py-1.5 px-3 text-[11px] gap-1.5">
              <FolderPlus size={14} /> Tambah Folder
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

// ----- STORAGE CONFIG SETTINGS -----
function StorageConfigCard({ canManage }: { canManage: boolean }) {
  const { data: configs, isLoading } = useStorageConfigs();
  const deleteMutation = useDeleteStorageConfig();
  const [modalConfig, setModalConfig] = useState<FileStorageConfig | "new" | null>(null);

  async function handleDelete(config: FileStorageConfig) {
    if (!window.confirm(`Hapus konfigurasi disk "${config.disk_name}"?`)) return;
    try {
      await deleteMutation.mutateAsync(config.id);
    } catch (err) { window.alert(extractErrorMessage(err)); }
  }

  return (
    <div className="bg-slate-50/60 p-5 rounded-2xl border border-slate-200">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg"><HardDrive size={20} /></div>
          <h3 className="font-bold text-slate-800 text-lg">Konfigurasi Disk (Storage)</h3>
        </div>
        {canManage && (
          <Button variant="secondary" onClick={() => setModalConfig("new")} className="text-xs px-2.5 py-1.5 gap-1.5">
            <Cloud size={14} /> Tambah Disk
          </Button>
        )}
      </div>
      <p className="text-slate-500 text-xs mb-5 leading-relaxed">
        Pusat pengaturan tujuan simpan file fisik (Local, S3 Object Storage, GCS). Engine memprioritaskan disk bertanda Default saat API menerima unggahan.
      </p>

      {isLoading && <LoadingState />}
      
      {!isLoading && (configs?.length ?? 0) === 0 && (
        <EmptyState title="Sistem Bawaan" subtitle="Sistem hanya memakai disk 'local' bawaan framework sampai konfigurasi ditambahkan." />
      )}

      {!isLoading && (configs?.length ?? 0) > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold">
              <tr>
                <th className="py-2.5 px-4">NAMA DISK</th>
                <th className="py-2.5 px-3">DRIVER</th>
                <th className="py-2.5 px-3">STATUS</th>
                {canManage && <th className="py-2.5 px-4 text-right">AKSI</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {configs!.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-700">{c.disk_name}</td>
                  <td className="py-3 px-3">
                    <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200 uppercase">{c.driver}</span>
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex flex-col gap-1">
                      {c.is_default && <span className="inline-flex w-fit text-[9px] font-bold bg-amber-100 text-amber-800 px-1.5 rounded">DEFAULT</span>}
                      {c.is_active ? (
                        <span className="inline-flex w-fit text-[9px] font-bold bg-emerald-100 text-emerald-800 px-1.5 rounded">AKTIF</span>
                      ) : (
                        <span className="inline-flex w-fit text-[9px] font-bold bg-slate-200 text-slate-600 px-1.5 rounded">NONAKTIF</span>
                      )}
                    </div>
                  </td>
                  {canManage && (
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1 justify-end">
                        <button onClick={() => setModalConfig(c)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded" title="Edit Disk"><Pencil size={14} /></button>
                        <button onClick={() => handleDelete(c)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded" title="Hapus Disk"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalConfig && <StorageConfigModal config={modalConfig === "new" ? null : modalConfig} onClose={() => setModalConfig(null)} />}
    </div>
  );
}

// Modal Storage Config
function StorageConfigModal({ config, onClose }: { config: FileStorageConfig | null; onClose: () => void }) {
  const createMutation = useCreateStorageConfig();
  const updateMutation = useUpdateStorageConfig();
  const [diskName, setDiskName] = useState(config?.disk_name ?? "");
  const [driver, setDriver] = useState<FileStorageConfig["driver"]>(config?.driver ?? "local");
  const [configJson, setConfigJson] = useState(config?.config ? JSON.stringify(config.config, null, 2) : "");
  const [isDefault, setIsDefault] = useState(config?.is_default ?? false);
  const [isActive, setIsActive] = useState(config?.is_active ?? true);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    let parsedConfig: Record<string, unknown> | null = null;
    if (configJson.trim()) {
      try {
        parsedConfig = JSON.parse(configJson);
      } catch {
        setError("Format Config JSON tidak valid.");
        return;
      }
    }

    try {
      if (config) {
        await updateMutation.mutateAsync({ id: config.id, values: { driver, config: parsedConfig, is_default: isDefault, is_active: isActive } });
      } else {
        await createMutation.mutateAsync({ disk_name: diskName, driver, config: parsedConfig, is_default: isDefault });
      }
      onClose();
    } catch (err) { setError(extractErrorMessage(err)); }
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal title={config ? `Edit Disk: ${config.disk_name}` : "Tambah Storage Disk"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {!config && (
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Nama Disk (Identifier)</label>
            <input value={diskName} onChange={(e) => setDiskName(e.target.value)} className="w-full text-sm rounded-lg border-slate-300 py-2 focus:ring-amber-500 focus:border-amber-500" placeholder="mis. s3-archive" required />
          </div>
        )}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Driver Backend</label>
          <select value={driver} onChange={(e) => setDriver(e.target.value as FileStorageConfig["driver"])} className="w-full text-sm rounded-lg border-slate-300 py-2 focus:ring-amber-500 focus:border-amber-500">
            <option value="local">local (Server Disk)</option>
            <option value="s3">s3 (AWS / MinIO / DO Spaces)</option>
            <option value="gcs">gcs (Google Cloud Storage)</option>
            <option value="azure">azure (Azure Blob)</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Kredensial Config (Format JSON)</label>
          <textarea 
            value={configJson} 
            onChange={(e) => setConfigJson(e.target.value)} 
            className="w-full text-xs font-mono rounded-lg border-slate-300 py-2 focus:ring-amber-500 focus:border-amber-500 bg-slate-50" 
            rows={5} 
            placeholder={'{\n  "bucket": "my-bucket",\n  "region": "ap-southeast-1"\n}'} 
          />
          <div className="text-[10px] text-slate-400 mt-1">Isi sesuai kebutuhan kredensial driver S3/GCS. Kosongkan bila driver local.</div>
        </div>
        
        <div className="flex gap-6 bg-slate-50 p-3 rounded-lg border border-slate-200">
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 cursor-pointer">
            <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} className="text-amber-500 rounded border-slate-300 focus:ring-amber-500" /> 
            Jadikan Default Upload
          </label>
          {config && (
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 cursor-pointer">
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="text-emerald-500 rounded border-slate-300 focus:ring-emerald-500" /> 
              Disk Aktif
            </label>
          )}
        </div>
        
        {error && <div className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-100">{error}</div>}
        
        <div className="pt-2">
          <Button type="submit" disabled={isPending} className="w-full justify-center py-2.5">
            {isPending ? "Menyimpan Config..." : "Simpan Konfigurasi"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
