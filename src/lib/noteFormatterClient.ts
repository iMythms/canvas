import type { FormatResult } from './noteFormatter'
export class NoteFormatterClient {
  private worker = new Worker(new URL('./noteFormatter.worker.ts', import.meta.url), { type: 'module' })
  private nextId = 0
  private pending = new Map<number, (result: FormatResult) => void>()
  constructor() {
    this.worker.onmessage = (event: MessageEvent<{ id: number; result: FormatResult }>) => {
      this.pending.get(event.data.id)?.(event.data.result)
      this.pending.delete(event.data.id)
    }
    this.worker.onerror = () => { for (const resolve of this.pending.values()) resolve({ kind: 'error', message: 'Formatter worker failed.' }); this.pending.clear() }
  }
  format(text: string, choice: string, offsets: number[] = []): Promise<FormatResult> {
    const id = ++this.nextId
    return new Promise(resolve => { this.pending.set(id, resolve); this.worker.postMessage({ id, text, choice, offsets }) })
  }
  dispose() { this.worker.terminate(); for (const resolve of this.pending.values()) resolve({ kind: 'error', message: 'Formatter closed.' }); this.pending.clear() }
}
