import { readFile } from "node:fs/promises";
import process from "node:process";

const WASM_PATH = new URL("../public/wasm/pkg/sudoku_generator_bg.wasm", import.meta.url);
const EXTERNREF_EXPORT_NAME = "__wbindgen_externrefs";
const FUNCREF_TYPE = 0x70;
const EXTERNREF_TYPE = 0x6f;

function decodeU32(buffer, cursor) {
  let result = 0;
  let shift = 0;

  while (true) {
    const byte = buffer[cursor.value];
    if (byte === undefined) {
      throw new Error("Unexpected EOF while decoding LEB128 value.");
    }
    cursor.value += 1;
    result |= (byte & 0x7f) << shift;
    if ((byte & 0x80) === 0) {
      return result >>> 0;
    }
    shift += 7;
  }
}

function decodeString(buffer, cursor) {
  const length = decodeU32(buffer, cursor);
  const start = cursor.value;
  const end = start + length;
  if (end > buffer.length) {
    throw new Error("Unexpected EOF while decoding UTF-8 string.");
  }
  cursor.value = end;
  return new TextDecoder().decode(buffer.subarray(start, end));
}

function readWasmTableMetadata(buffer) {
  if (
    buffer[0] !== 0x00 ||
    buffer[1] !== 0x61 ||
    buffer[2] !== 0x73 ||
    buffer[3] !== 0x6d ||
    buffer[4] !== 0x01 ||
    buffer[5] !== 0x00 ||
    buffer[6] !== 0x00 ||
    buffer[7] !== 0x00
  ) {
    throw new Error("Invalid WebAssembly binary header.");
  }

  const cursor = { value: 8 };
  const tables = [];
  const tableExportMap = new Map();

  while (cursor.value < buffer.length) {
    const sectionId = buffer[cursor.value];
    cursor.value += 1;
    const sectionSize = decodeU32(buffer, cursor);
    const sectionEnd = cursor.value + sectionSize;
    if (sectionEnd > buffer.length) {
      throw new Error(`Invalid section size for section ${sectionId}.`);
    }

    if (sectionId === 4) {
      const tableCount = decodeU32(buffer, cursor);
      for (let i = 0; i < tableCount; i += 1) {
        const reftype = buffer[cursor.value];
        cursor.value += 1;
        const flags = decodeU32(buffer, cursor);
        const min = decodeU32(buffer, cursor);
        let max = null;
        if ((flags & 0x01) === 0x01) {
          max = decodeU32(buffer, cursor);
        }
        tables.push({ reftype, flags, min, max });
      }
    } else if (sectionId === 7) {
      const exportCount = decodeU32(buffer, cursor);
      for (let i = 0; i < exportCount; i += 1) {
        const name = decodeString(buffer, cursor);
        const kind = buffer[cursor.value];
        cursor.value += 1;
        const index = decodeU32(buffer, cursor);
        if (kind === 0x01) {
          tableExportMap.set(name, index);
        }
      }
    }

    cursor.value = sectionEnd;
  }

  return { tables, tableExportMap };
}

function formatRefType(value) {
  if (value === EXTERNREF_TYPE) {
    return "externref";
  }
  if (value === FUNCREF_TYPE) {
    return "funcref";
  }
  return `0x${value.toString(16)}`;
}

async function main() {
  const bytes = new Uint8Array(await readFile(WASM_PATH));
  const { tables, tableExportMap } = readWasmTableMetadata(bytes);
  const index = tableExportMap.get(EXTERNREF_EXPORT_NAME);

  if (index === undefined) {
    throw new Error(`Missing table export: ${EXTERNREF_EXPORT_NAME}`);
  }
  if (index < 0 || index >= tables.length) {
    throw new Error(
      `Table export ${EXTERNREF_EXPORT_NAME} points to invalid table index ${index} (table count=${tables.length}).`
    );
  }

  const target = tables[index];
  const isExternref = target.reftype === EXTERNREF_TYPE;
  const hasNoMax = target.max === null;
  const allowsGrow = hasNoMax || target.max > target.min;

  if (!isExternref || !allowsGrow) {
    throw new Error(
      [
        `Invalid externref table binding in ${WASM_PATH.pathname}.`,
        `${EXTERNREF_EXPORT_NAME} -> table[${index}]`,
        `reftype=${formatRefType(target.reftype)}, min=${target.min}, max=${target.max ?? "none"}`,
        "Expected an externref table that can grow."
      ].join(" ")
    );
  }

  console.log(
    `WASM externref table check passed: ${EXTERNREF_EXPORT_NAME} -> table[${index}] (reftype=${formatRefType(
      target.reftype
    )}, min=${target.min}, max=${target.max ?? "none"}).`
  );
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`WASM externref table check failed: ${message}`);
  process.exitCode = 1;
});
