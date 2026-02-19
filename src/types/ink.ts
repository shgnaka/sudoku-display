export type BlockRow = 0 | 1 | 2;
export type BlockCol = 0 | 1 | 2;
export type BlockId = `${BlockRow}-${BlockCol}`;

export interface InkPoint {
  x: number;
  y: number;
  pressure?: number;
}

export interface Stroke {
  points: InkPoint[];
  color: string;
  width: number;
  ts: number;
}

export type InkState = Record<BlockId, Stroke[]>;

export const BLOCK_IDS: BlockId[] = [
  "0-0",
  "0-1",
  "0-2",
  "1-0",
  "1-1",
  "1-2",
  "2-0",
  "2-1",
  "2-2"
];
