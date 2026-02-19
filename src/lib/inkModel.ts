import { BLOCK_IDS } from "../types/ink";
import type { BlockId, InkState, Stroke } from "../types/ink";

export function createEmptyInkState(): InkState {
  return BLOCK_IDS.reduce((acc, blockId) => {
    acc[blockId] = [];
    return acc;
  }, {} as InkState);
}

export function appendStroke(state: InkState, blockId: BlockId, stroke: Stroke): InkState {
  return {
    ...state,
    [blockId]: [...state[blockId], stroke]
  };
}

export function clearBlock(state: InkState, blockId: BlockId): InkState {
  return {
    ...state,
    [blockId]: []
  };
}

export function clearAll(): InkState {
  return createEmptyInkState();
}
