/**
 * Encoder QR Code lokal (ISO/IEC 18004, mode byte, versi 1-40) - port ringkas dari
 * algoritma "QR Code generator library" karya Project Nayuki (MIT License).
 *
 * KENAPA LOKAL: payload QR visitor pass adalah KREDENSIAL AKSES FISIK data center.
 * Payload TIDAK BOLEH dikirim ke layanan pihak ketiga (mis. api.qrserver.com) dan
 * halaman E-Badge publik tidak punya sesi login untuk memanggil generator CorePlatform.
 * Semua proses encoding berjalan di browser, tanpa request jaringan.
 */

export type QrErrorCorrection = "L" | "M" | "Q" | "H";

/** Matriks modul QR: matrix[y][x] = true untuk modul gelap. */
export interface QrMatrix {
  size: number;
  version: number;
  errorCorrection: QrErrorCorrection;
  mask: number;
  modules: boolean[][];
}

const ECC_ORDINAL: Record<QrErrorCorrection, number> = { L: 0, M: 1, Q: 2, H: 3 };
const ECC_FORMAT_BITS: Record<QrErrorCorrection, number> = { L: 1, M: 0, Q: 3, H: 2 };

// Indeks [ecl][version], indeks 0 tidak dipakai.
const ECC_CODEWORDS_PER_BLOCK: number[][] = [
  [-1, 7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
  [-1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],
  [-1, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30, 30, 30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
  [-1, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],
];

const NUM_ERROR_CORRECTION_BLOCKS: number[][] = [
  [-1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4, 4, 4, 4, 4, 6, 6, 6, 6, 7, 8, 8, 9, 9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25],
  [-1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49],
  [-1, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8, 8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34, 34, 35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68],
  [-1, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37, 40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81],
];

const PENALTY_N1 = 3;
const PENALTY_N2 = 3;
const PENALTY_N3 = 40;
const PENALTY_N4 = 10;

function getBit(value: number, index: number): boolean {
  return ((value >>> index) & 1) !== 0;
}

function getNumRawDataModules(version: number): number {
  let result = (16 * version + 128) * version + 64;
  if (version >= 2) {
    const numAlign = Math.floor(version / 7) + 2;
    result -= (25 * numAlign - 10) * numAlign - 55;
    if (version >= 7) result -= 36;
  }
  return result;
}

function getNumDataCodewords(version: number, ecl: QrErrorCorrection): number {
  const o = ECC_ORDINAL[ecl];
  return (
    Math.floor(getNumRawDataModules(version) / 8) -
    ECC_CODEWORDS_PER_BLOCK[o][version] * NUM_ERROR_CORRECTION_BLOCKS[o][version]
  );
}

function reedSolomonMultiply(x: number, y: number): number {
  let z = 0;
  for (let i = 7; i >= 0; i--) {
    z = (z << 1) ^ ((z >>> 7) * 0x11d);
    z ^= ((y >>> i) & 1) * x;
  }
  return z & 0xff;
}

function reedSolomonComputeDivisor(degree: number): number[] {
  const result: number[] = new Array(degree - 1).fill(0);
  result.push(1);
  let root = 1;
  for (let i = 0; i < degree; i++) {
    for (let j = 0; j < result.length; j++) {
      result[j] = reedSolomonMultiply(result[j], root);
      if (j + 1 < result.length) result[j] ^= result[j + 1];
    }
    root = reedSolomonMultiply(root, 0x02);
  }
  return result;
}

function reedSolomonComputeRemainder(data: number[], divisor: number[]): number[] {
  const result = divisor.map(() => 0);
  for (const b of data) {
    const factor = b ^ (result.shift() as number);
    result.push(0);
    divisor.forEach((coef, i) => {
      result[i] ^= reedSolomonMultiply(coef, factor);
    });
  }
  return result;
}

function getAlignmentPatternPositions(version: number, size: number): number[] {
  if (version === 1) return [];
  const numAlign = Math.floor(version / 7) + 2;
  const step = version === 32 ? 26 : Math.ceil((version * 4 + 4) / (numAlign * 2 - 2)) * 2;
  const result = [6];
  for (let pos = size - 7; result.length < numAlign; pos -= step) result.splice(1, 0, pos);
  return result;
}

class QrBuilder {
  readonly size: number;
  readonly modules: boolean[][];
  private readonly isFunction: boolean[][];

  constructor(
    readonly version: number,
    readonly ecl: QrErrorCorrection,
    dataCodewords: number[],
  ) {
    this.size = version * 4 + 17;
    this.modules = Array.from({ length: this.size }, () => new Array<boolean>(this.size).fill(false));
    this.isFunction = Array.from({ length: this.size }, () => new Array<boolean>(this.size).fill(false));

    this.drawFunctionPatterns();
    this.drawCodewords(this.addEccAndInterleave(dataCodewords));
  }

  /** Pilih mask dengan skor penalti terendah, lalu terapkan secara permanen. */
  applyBestMask(): number {
    let bestMask = 0;
    let minPenalty = Infinity;
    for (let mask = 0; mask < 8; mask++) {
      this.applyMask(mask);
      this.drawFormatBits(mask);
      const penalty = this.getPenaltyScore();
      if (penalty < minPenalty) {
        bestMask = mask;
        minPenalty = penalty;
      }
      this.applyMask(mask); // XOR kedua kali = kembali ke kondisi semula
    }
    this.applyMask(bestMask);
    this.drawFormatBits(bestMask);
    return bestMask;
  }

  private setFunctionModule(x: number, y: number, isDark: boolean): void {
    this.modules[y][x] = isDark;
    this.isFunction[y][x] = true;
  }

  private drawFunctionPatterns(): void {
    for (let i = 0; i < this.size; i++) {
      this.setFunctionModule(6, i, i % 2 === 0);
      this.setFunctionModule(i, 6, i % 2 === 0);
    }

    this.drawFinderPattern(3, 3);
    this.drawFinderPattern(this.size - 4, 3);
    this.drawFinderPattern(3, this.size - 4);

    const alignPatPos = getAlignmentPatternPositions(this.version, this.size);
    const numAlign = alignPatPos.length;
    for (let i = 0; i < numAlign; i++) {
      for (let j = 0; j < numAlign; j++) {
        const overlapsFinder =
          (i === 0 && j === 0) || (i === 0 && j === numAlign - 1) || (i === numAlign - 1 && j === 0);
        if (!overlapsFinder) this.drawAlignmentPattern(alignPatPos[i], alignPatPos[j]);
      }
    }

    this.drawFormatBits(0); // placeholder, ditimpa setelah mask dipilih
    this.drawVersion();
  }

  private drawFormatBits(mask: number): void {
    const data = (ECC_FORMAT_BITS[this.ecl] << 3) | mask;
    let rem = data;
    for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
    const bits = ((data << 10) | rem) ^ 0x5412;

    for (let i = 0; i <= 5; i++) this.setFunctionModule(8, i, getBit(bits, i));
    this.setFunctionModule(8, 7, getBit(bits, 6));
    this.setFunctionModule(8, 8, getBit(bits, 7));
    this.setFunctionModule(7, 8, getBit(bits, 8));
    for (let i = 9; i < 15; i++) this.setFunctionModule(14 - i, 8, getBit(bits, i));

    for (let i = 0; i < 8; i++) this.setFunctionModule(this.size - 1 - i, 8, getBit(bits, i));
    for (let i = 8; i < 15; i++) this.setFunctionModule(8, this.size - 15 + i, getBit(bits, i));
    this.setFunctionModule(8, this.size - 8, true); // dark module
  }

  private drawVersion(): void {
    if (this.version < 7) return;
    let rem = this.version;
    for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
    const bits = (this.version << 12) | rem;
    for (let i = 0; i < 18; i++) {
      const color = getBit(bits, i);
      const a = this.size - 11 + (i % 3);
      const b = Math.floor(i / 3);
      this.setFunctionModule(a, b, color);
      this.setFunctionModule(b, a, color);
    }
  }

  private drawFinderPattern(x: number, y: number): void {
    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        const dist = Math.max(Math.abs(dx), Math.abs(dy));
        const xx = x + dx;
        const yy = y + dy;
        if (xx >= 0 && xx < this.size && yy >= 0 && yy < this.size) {
          this.setFunctionModule(xx, yy, dist !== 2 && dist !== 4);
        }
      }
    }
  }

  private drawAlignmentPattern(x: number, y: number): void {
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        this.setFunctionModule(x + dx, y + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
      }
    }
  }

  private addEccAndInterleave(data: number[]): number[] {
    const o = ECC_ORDINAL[this.ecl];
    const numBlocks = NUM_ERROR_CORRECTION_BLOCKS[o][this.version];
    const blockEccLen = ECC_CODEWORDS_PER_BLOCK[o][this.version];
    const rawCodewords = Math.floor(getNumRawDataModules(this.version) / 8);
    const numShortBlocks = numBlocks - (rawCodewords % numBlocks);
    const shortBlockLen = Math.floor(rawCodewords / numBlocks);

    const blocks: number[][] = [];
    const rsDiv = reedSolomonComputeDivisor(blockEccLen);
    for (let i = 0, k = 0; i < numBlocks; i++) {
      const dat = data.slice(k, k + shortBlockLen - blockEccLen + (i < numShortBlocks ? 0 : 1));
      k += dat.length;
      const ecc = reedSolomonComputeRemainder(dat, rsDiv);
      if (i < numShortBlocks) dat.push(0);
      blocks.push(dat.concat(ecc));
    }

    const result: number[] = [];
    for (let i = 0; i < blocks[0].length; i++) {
      blocks.forEach((block, j) => {
        if (i !== shortBlockLen - blockEccLen || j >= numShortBlocks) result.push(block[i]);
      });
    }
    return result;
  }

  private drawCodewords(data: number[]): void {
    let i = 0;
    for (let right = this.size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5; // lompati kolom timing pattern vertikal
      for (let vert = 0; vert < this.size; vert++) {
        for (let j = 0; j < 2; j++) {
          const x = right - j;
          const upward = ((right + 1) & 2) === 0;
          const y = upward ? this.size - 1 - vert : vert;
          if (!this.isFunction[y][x] && i < data.length * 8) {
            this.modules[y][x] = getBit(data[i >>> 3], 7 - (i & 7));
            i++;
          }
        }
      }
    }
  }

  private applyMask(mask: number): void {
    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        let invert: boolean;
        switch (mask) {
          case 0: invert = (x + y) % 2 === 0; break;
          case 1: invert = y % 2 === 0; break;
          case 2: invert = x % 3 === 0; break;
          case 3: invert = (x + y) % 3 === 0; break;
          case 4: invert = (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0; break;
          case 5: invert = ((x * y) % 2) + ((x * y) % 3) === 0; break;
          case 6: invert = (((x * y) % 2) + ((x * y) % 3)) % 2 === 0; break;
          case 7: invert = (((x + y) % 2) + ((x * y) % 3)) % 2 === 0; break;
          default: throw new Error("Mask QR tidak valid");
        }
        if (!this.isFunction[y][x] && invert) this.modules[y][x] = !this.modules[y][x];
      }
    }
  }

  private getPenaltyScore(): number {
    const n = this.size;
    const m = this.modules;
    let result = 0;

    // Aturan 1 & 3: run warna sama dan pola mirip finder pada baris/kolom
    const finderLike = [true, false, true, true, true, false, true];
    const scanLine = (get: (i: number) => boolean) => {
      let runColor = get(0);
      let runLen = 1;
      for (let i = 1; i < n; i++) {
        const c = get(i);
        if (c === runColor) {
          runLen++;
        } else {
          if (runLen >= 5) result += PENALTY_N1 + (runLen - 5);
          runColor = c;
          runLen = 1;
        }
      }
      if (runLen >= 5) result += PENALTY_N1 + (runLen - 5);

      for (let i = 0; i + 7 <= n; i++) {
        let match = true;
        for (let k = 0; k < 7; k++) {
          if (get(i + k) !== finderLike[k]) { match = false; break; }
        }
        if (!match) continue;
        const lightBefore = [1, 2, 3, 4].every((d) => i - d < 0 || !get(i - d));
        const lightAfter = [0, 1, 2, 3].every((d) => i + 7 + d >= n || !get(i + 7 + d));
        if (lightBefore || lightAfter) result += PENALTY_N3;
      }
    };
    for (let y = 0; y < n; y++) scanLine((x) => m[y][x]);
    for (let x = 0; x < n; x++) scanLine((y) => m[y][x]);

    // Aturan 2: blok 2x2 warna sama
    for (let y = 0; y < n - 1; y++) {
      for (let x = 0; x < n - 1; x++) {
        const c = m[y][x];
        if (c === m[y][x + 1] && c === m[y + 1][x] && c === m[y + 1][x + 1]) result += PENALTY_N2;
      }
    }

    // Aturan 4: keseimbangan modul gelap/terang
    let dark = 0;
    for (const row of m) for (const c of row) if (c) dark++;
    const total = n * n;
    const k = Math.ceil(Math.abs(dark * 20 - total * 10) / total) - 1;
    result += k * PENALTY_N4;

    return result;
  }
}

/**
 * Encode teks (UTF-8, mode byte) menjadi matriks QR. Versi terkecil yang muat dipilih otomatis,
 * dan level koreksi error dinaikkan selama tidak menambah versi.
 */
export function encodeQr(text: string, minErrorCorrection: QrErrorCorrection = "M"): QrMatrix {
  const bytes = Array.from(new TextEncoder().encode(text));

  let version = 1;
  let usedBits = 0;
  for (; ; version++) {
    if (version > 40) throw new Error("Data terlalu panjang untuk QR Code.");
    const ccBits = version < 10 ? 8 : 16;
    usedBits = 4 + ccBits + bytes.length * 8;
    if (usedBits <= getNumDataCodewords(version, minErrorCorrection) * 8) break;
  }

  let ecl = minErrorCorrection;
  for (const candidate of ["M", "Q", "H"] as QrErrorCorrection[]) {
    if (ECC_ORDINAL[candidate] > ECC_ORDINAL[ecl] && usedBits <= getNumDataCodewords(version, candidate) * 8) {
      ecl = candidate;
    }
  }

  const bits: boolean[] = [];
  const appendBits = (value: number, length: number) => {
    for (let i = length - 1; i >= 0; i--) bits.push(getBit(value, i));
  };
  appendBits(0x4, 4); // mode byte
  appendBits(bytes.length, version < 10 ? 8 : 16);
  for (const b of bytes) appendBits(b, 8);

  const capacityBits = getNumDataCodewords(version, ecl) * 8;
  appendBits(0, Math.min(4, capacityBits - bits.length)); // terminator
  appendBits(0, (8 - (bits.length % 8)) % 8);
  for (let pad = 0xec; bits.length < capacityBits; pad ^= 0xec ^ 0x11) appendBits(pad, 8);

  const dataCodewords: number[] = new Array(bits.length / 8).fill(0);
  bits.forEach((bit, i) => {
    if (bit) dataCodewords[i >>> 3] |= 1 << (7 - (i & 7));
  });

  const builder = new QrBuilder(version, ecl, dataCodewords);
  const mask = builder.applyBestMask();

  return { size: builder.size, version, errorCorrection: ecl, mask, modules: builder.modules };
}

/**
 * Render QR menjadi data URI PNG di browser (canvas) - siap dipakai untuk <img src> & tombol download.
 * Tidak ada request jaringan.
 */
export function renderQrPngDataUri(
  text: string,
  options: { size?: number; margin?: number; darkColor?: string; lightColor?: string } = {},
): string {
  const { size = 280, margin = 4, darkColor = "#000000", lightColor = "#FFFFFF" } = options;
  const qr = encodeQr(text);
  const totalModules = qr.size + margin * 2;
  const scale = Math.max(1, Math.floor(size / totalModules));
  const pixelSize = totalModules * scale;

  const canvas = document.createElement("canvas");
  canvas.width = pixelSize;
  canvas.height = pixelSize;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D tidak tersedia untuk merender QR Code.");

  ctx.fillStyle = lightColor;
  ctx.fillRect(0, 0, pixelSize, pixelSize);
  ctx.fillStyle = darkColor;
  for (let y = 0; y < qr.size; y++) {
    for (let x = 0; x < qr.size; x++) {
      if (qr.modules[y][x]) ctx.fillRect((x + margin) * scale, (y + margin) * scale, scale, scale);
    }
  }

  return canvas.toDataURL("image/png");
}
