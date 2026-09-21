/**
 * field-capture.ts
 * One-shot slot for a field-camera frame captured on the "Phone/Laptop
 * Camera" tab and consumed by the Leaf Scanner tab (which mounts fresh on
 * tab switch, so it picks the pending frame up in its mount effect).
 */

export interface PendingCapture {
  canvas: HTMLCanvasElement;
  dataUrl: string;
  at: number;
}

let pending: PendingCapture | null = null;

export function setPendingCapture(canvas: HTMLCanvasElement, dataUrl: string): void {
  pending = { canvas, dataUrl, at: Date.now() };
}

export function takePendingCapture(): PendingCapture | null {
  const p = pending;
  pending = null;
  return p;
}
