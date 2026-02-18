export type CellOrigin = "given" | "user" | "empty";

export interface CellData {
  value: number | null;
  origin: CellOrigin;
}

export type Board = CellData[][];
