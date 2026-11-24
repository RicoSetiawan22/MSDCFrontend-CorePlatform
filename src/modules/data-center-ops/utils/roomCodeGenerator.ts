export const ROOM_TYPE_ABBR: Record<string, string> = {
  server_room: "SRV",
  network_room: "NET",
  ups_room: "UPS",
  other: "OTH",
};

/**
 * Menghasilkan kode room standar Data Center berdasarkan Lantai dan Tipe Room.
 * Format standar MSDC: R{floor}-{TYPE}
 * Contoh:
 * - Lantai: "2", Tipe: "server_room" -> "R2-SRV"
 * - Lantai: "2", Tipe: "network_room" -> "R2-NET"
 * - Lantai: "1", Tipe: "ups_room" -> "R1-UPS"
 * - Lantai: "B1" (Basement), Tipe: "server_room" -> "RB1-SRV"
 */
export function generateRoomCode(floor: string, roomType: string): string {
  const trimmedFloor = floor.trim();
  let floorCode = "1";

  if (/^b\d+/i.test(trimmedFloor) || /basement/i.test(trimmedFloor)) {
    const digit = trimmedFloor.replace(/\D/g, "") || "1";
    floorCode = `B${digit}`;
  } else {
    const digit = trimmedFloor.replace(/\D/g, "");
    floorCode = digit || "1";
  }

  const typeCode = ROOM_TYPE_ABBR[roomType] ?? "SRV";
  return `R${floorCode}-${typeCode}`;
}
