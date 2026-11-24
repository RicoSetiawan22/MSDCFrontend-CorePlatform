import { useState, type FormEvent } from "react";
import { Modal } from "@shared/components/Modal";
import { Button } from "@shared/components/Button";
import { useCreateRoom } from "../api/useRooms";
import { extractErrorMessage } from "@shared/types/api";
import { generateRoomCode } from "../utils/roomCodeGenerator";

interface RoomFormModalProps {
  siteId: number;
  siteName: string;
  onClose: () => void;
  onSuccess: (room: { id: number; room_name: string; room_code: string }) => void;
}

const EMPTY = {
  room_name: "",
  floor: "",
  zone: "",
  room_type: "server_room",
  area_sqm: "",
};

export function RoomFormModal({ siteId, siteName, onClose, onSuccess }: RoomFormModalProps) {
  const [form, setForm] = useState(EMPTY);
  const [roomCode, setRoomCode] = useState(() => generateRoomCode("", "server_room"));
  const [isCustomCode, setIsCustomCode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const create = useCreateRoom(siteId);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.room_name.trim()) {
      setError("Nama room wajib diisi.");
      return;
    }
    setError(null);

    try {
      const room = await create.mutateAsync({
        room_code: roomCode.trim() || undefined,
        room_name: form.room_name.trim(),
        floor: form.floor || undefined,
        zone: form.zone || undefined,
        room_type: form.room_type,
        area_sqm: form.area_sqm ? Number(form.area_sqm) : undefined,
      });
      onSuccess(room);
      onClose();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  }

  function set(key: keyof typeof EMPTY, value: string) {
    setForm((f) => {
      const next = { ...f, [key]: value };
      if (!isCustomCode && (key === "floor" || key === "room_type")) {
        const auto = generateRoomCode(
          key === "floor" ? value : next.floor,
          key === "room_type" ? value : next.room_type
        );
        setRoomCode(auto);
      }
      return next;
    });
  }

  function handleCustomCode(val: string) {
    setRoomCode(val.toUpperCase());
    setIsCustomCode(true);
  }

  function handleResetCode() {
    const auto = generateRoomCode(form.floor, form.room_type);
    setRoomCode(auto);
    setIsCustomCode(false);
  }

  return (
    <Modal title={`Room Baru — ${siteName}`} onClose={onClose} maxWidth={520}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              Kode Room
            </label>
            {isCustomCode && (
              <button
                type="button"
                onClick={handleResetCode}
                className="text-xs text-amber-600 hover:text-amber-700 font-semibold cursor-pointer underline"
              >
                Reset ke Auto ({generateRoomCode(form.floor, form.room_type)})
              </button>
            )}
          </div>
          <input
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-mono font-bold uppercase"
            value={roomCode}
            onChange={(e) => handleCustomCode(e.target.value)}
            placeholder="mis. R2-SRV"
          />
          <div className="text-[11px] text-slate-500 mt-1">
            {isCustomCode
              ? "Kode diubah secara manual. Klik 'Reset ke Auto' untuk kembali ke format standar."
              : "Kode otomatis mengikuti Lantai & Tipe Room: R{lantai}-{tipe} (mis. R2-SRV, R2-NET)."}
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700 mb-1.5 block">
            Tipe Room
          </label>
          <select
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all cursor-pointer"
            value={form.room_type}
            onChange={(e) => set("room_type", e.target.value)}
          >
            <option value="server_room">Server Room</option>
            <option value="network_room">Network Room</option>
            <option value="ups_room">UPS & Power Room</option>
            <option value="other">Lainnya</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-700 mb-1.5 block">
            Nama Room *
          </label>
          <input
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
            placeholder="mis. Server Room Lantai 3"
            value={form.room_name}
            onChange={(e) => set("room_name", e.target.value)}
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-bold text-slate-700 mb-1.5 block">
              Lantai
            </label>
            <input
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
              placeholder="mis. 3"
              value={form.floor}
              onChange={(e) => set("floor", e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700 mb-1.5 block">
              Zone
            </label>
            <input
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
              placeholder="mis. A"
              value={form.zone}
              onChange={(e) => set("zone", e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-700 mb-1.5 block">
              Luas (m²)
            </label>
            <input
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
              type="number"
              min="0"
              placeholder="mis. 200"
              value={form.area_sqm}
              onChange={(e) => set("area_sqm", e.target.value)}
            />
          </div>
        </div>

        {error && (
          <div className="text-xs text-rose-600 font-medium bg-rose-50 border border-rose-200 rounded-xl p-3">
            {error}
          </div>
        )}

        <div className="flex gap-2.5 pt-2">
          <Button type="submit" disabled={create.isPending} className="flex-1">
            {create.isPending ? "Menyimpan..." : "Simpan Room"}
          </Button>
          <Button type="button" variant="secondary" onClick={onClose}>
            Batal
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default RoomFormModal;
