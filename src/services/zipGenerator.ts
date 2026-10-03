/**
 * GERADOR BINÁRIO DE ARQUIVOS ZIP REAL (PADRÃO PKZIP)
 * Gera arquivos .zip autênticos em TypeScript puro (sem bibliotecas externas)
 * Suporta arquivos de texto e arquivos binários (ex: imagens PNG/JPG).
 */

function makeCrcTable(): Uint32Array {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c;
  }
  return table;
}

const CRC_TABLE = makeCrcTable();

function calculateCrc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ data[i]) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
}

export interface ZipFileInput {
  path: string;
  data: Uint8Array | string;
}

export function createRealZipBlob(files: ZipFileInput[]): Blob {
  const encoder = new TextEncoder();
  const fileEntries: Array<{
    pathBytes: Uint8Array;
    dataBytes: Uint8Array;
    crc: number;
    offset: number;
  }> = [];

  const chunks: Uint8Array[] = [];
  let currentOffset = 0;

  // 1. Gravar Local File Headers e Conteúdo
  for (const file of files) {
    const cleanPath = file.path.replace(/^\/+/, '');
    const pathBytes = encoder.encode(cleanPath);
    let dataBytes: Uint8Array;

    if (typeof file.data === 'string') {
      dataBytes = encoder.encode(file.data);
    } else {
      dataBytes = file.data;
    }

    const crc = calculateCrc32(dataBytes);
    const offset = currentOffset;

    // Header Local (30 bytes + tamanho do caminho)
    const localHeader = new Uint8Array(30 + pathBytes.length);
    const view = new DataView(localHeader.buffer);

    view.setUint32(0, 0x04034b50, true); // Assinatura Local File Header
    view.setUint16(4, 20, true);         // Versão necessária (2.0)
    view.setUint16(6, 0x0800, true);     // Flag UTF-8 (bit 11)
    view.setUint16(8, 0, true);          // Compressão: Stored (0)
    view.setUint16(10, 0, true);         // Hora mod
    view.setUint16(12, 0, true);         // Data mod
    view.setUint32(14, crc, true);       // CRC-32
    view.setUint32(18, dataBytes.length, true); // Tamanho comprimido
    view.setUint32(22, dataBytes.length, true); // Tamanho não comprimido
    view.setUint16(26, pathBytes.length, true); // Tamanho do nome do arquivo
    view.setUint16(28, 0, true);         // Campo extra tamanho

    localHeader.set(pathBytes, 30);

    chunks.push(localHeader);
    chunks.push(dataBytes);

    currentOffset += localHeader.length + dataBytes.length;

    fileEntries.push({
      pathBytes,
      dataBytes,
      crc,
      offset,
    });
  }

  const centralDirectoryOffset = currentOffset;
  let centralDirectorySize = 0;

  // 2. Gravar Central Directory Headers
  for (const entry of fileEntries) {
    const cdHeader = new Uint8Array(46 + entry.pathBytes.length);
    const view = new DataView(cdHeader.buffer);

    view.setUint32(0, 0x02014b50, true); // Assinatura Central Directory Header
    view.setUint16(4, 20, true);         // Versão criada por
    view.setUint16(6, 20, true);         // Versão necessária
    view.setUint16(8, 0x0800, true);     // Flag UTF-8
    view.setUint16(10, 0, true);        // Compressão Stored (0)
    view.setUint16(12, 0, true);        // Hora mod
    view.setUint16(14, 0, true);        // Data mod
    view.setUint32(16, entry.crc, true); // CRC-32
    view.setUint32(20, entry.dataBytes.length, true); // Tamanho comprimido
    view.setUint32(24, entry.dataBytes.length, true); // Tamanho não comprimido
    view.setUint16(28, entry.pathBytes.length, true); // Tamanho do nome
    view.setUint16(30, 0, true);        // Campo extra
    view.setUint16(32, 0, true);        // Comentário
    view.setUint16(34, 0, true);        // Número do disco
    view.setUint16(36, 0, true);        // Atributos internos
    view.setUint32(38, 0, true);        // Atributos externos
    view.setUint32(42, entry.offset, true); // Offset do Local Header

    cdHeader.set(entry.pathBytes, 46);

    chunks.push(cdHeader);
    centralDirectorySize += cdHeader.length;
    currentOffset += cdHeader.length;
  }

  // 3. Gravar End of Central Directory Record (22 bytes)
  const eocd = new Uint8Array(22);
  const eocdView = new DataView(eocd.buffer);

  eocdView.setUint32(0, 0x06054b50, true); // Assinatura EOCD
  eocdView.setUint16(4, 0, true);          // Número do disco
  eocdView.setUint16(6, 0, true);          // Disco onde começa o CD
  eocdView.setUint16(8, fileEntries.length, true);  // Número de entradas neste disco
  eocdView.setUint16(10, fileEntries.length, true); // Total de entradas
  eocdView.setUint32(12, centralDirectorySize, true); // Tamanho do CD
  eocdView.setUint32(16, centralDirectoryOffset, true); // Offset inicial do CD
  eocdView.setUint16(20, 0, true);         // Tamanho do comentário

  chunks.push(eocd);

  return new Blob(chunks, { type: 'application/zip' });
}
