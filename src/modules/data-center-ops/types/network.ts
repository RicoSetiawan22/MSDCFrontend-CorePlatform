/**
 * @file network.ts
 * @module data-center-ops/types/network
 * @description Tipe data arsitektur jaringan (VLAN & Network Port) untuk Data Center Operations.
 * Disiapkan sebagai kontrak tipe dasar untuk persiapan roadmap Master Data VLAN Pool dan Switch Port Management.
 *
 * Catatan Arsitektur:
 * - Entitas Cross-Connect dikelola secara terpusat dan kanonikal di `crossConnect.ts`. Duplikasi pada file ini telah dibersihkan.
 * - Definisi pada modul ini difokuskan untuk abstraksi layer jaringan L2/L3 (VLAN segmentasi dan port perangkat).
 */

/**
 * Representasi entitas VLAN (Virtual Local Area Network) pada infrastruktur Data Center.
 *
 * Digunakan untuk alokasi segmentasi broadcast domain jaringan pelanggan (tenant) maupun
 * manajemen infrastruktur internal data center (in-band/out-of-band management).
 *
 * @remarks
 * Entitas ini disiapkan untuk integrasi modul Master Data VLAN Pool pada roadmap DC Ops mendatang.
 */
export interface Vlan {
  /** Identifier unik VLAN di database */
  id: number;
  /** Nomor tag VLAN IEEE 802.1Q (1 - 4094) */
  vlan_number: number;
  /** Nama deskriptif VLAN (contoh: 'VLAN-CUST-CORP-100', 'MGMT-OOB') */
  vlan_name: string;
  /** ID site / data center lokasi VLAN dialokasikan (null jika beroperasi lintas-site/global) */
  site_id: number | null;
  /** ID pelanggan yang memiliki atau menyewa alokasi VLAN ini (null jika internal DC) */
  customer_id: number | null;
  /** Catatan atau deskripsi fungsi alokasi VLAN */
  description: string | null;
  /**
   * Status operasional alokasi VLAN:
   * - `active`: Sedang digunakan secara aktif dalam routing/switching
   * - `reserved`: Dicadangkan untuk pesanan/kontrak yang sedang diproses
   * - `inactive`: Dinonaktifkan atau belum dialokasikan ke perangkat aktif
   */
  status: "active" | "reserved" | "inactive";
  /** Timestamp ISO 8601 pembuatan record */
  created_at: string;
}

/**
 * Representasi port jaringan fisik atau modular pada perangkat switch, router, atau server.
 *
 * Digunakan untuk inventarisasi port perangkat jaringan serta pemetaan konfigurasi VLAN (access/trunk)
 * dan hubungan antar-port perangkat (interconnect/uplink).
 *
 * @remarks
 * Entitas ini disiapkan untuk integrasi modul Switch Port Management & Topologi Rack.
 */
export interface NetworkPort {
  /** Identifier unik port di database */
  id: number;
  /** ID perangkat switch/router/server pemilik port (merujuk ke entitas Device) */
  device_id: number;
  /** Label atau identitas nama interface port pada perangkat (contoh: 'GigabitEthernet0/1', 'TenGigE0/0/1') */
  port_name: string;
  /** Tipe media fisik / interface port */
  port_type: "ethernet" | "fiber" | "sfp" | "other";
  /** Kecepatan tautan (link speed) dalam satuan Megabit per detik (Mbps) */
  speed_mbps: number | null;
  /** ID VLAN yang diasosiasikan dengan port ini (access port) atau null jika unassigned/trunk */
  vlan_id: number | null;
  /** ID port lawan jika terhubung langsung ke port perangkat lain (uplink/patching) */
  connected_to_port_id: number | null;
  /**
   * Status operasional port:
   * - `active`: Port aktif dan membawa lalu lintas data (UP/UP)
   * - `inactive`: Port dinonaktifkan secara administratif atau link down
   * - `reserved`: Port dicadangkan untuk ekspansi atau alokasi tertentu
   */
  status: "active" | "inactive" | "reserved";
  /** Catatan teknis, dokumentasi patch cord, atau konfigurasi khusus port */
  notes: string | null;
  /** Timestamp ISO 8601 pembuatan record */
  created_at: string;
}
