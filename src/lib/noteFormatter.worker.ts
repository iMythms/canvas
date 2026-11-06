import { formatNote } from './noteFormatter'
self.onmessage = async (event: MessageEvent<{ id: number; text: string; choice: string; offsets: number[] }>) => {
  const { id, text, choice, offsets } = event.data
  self.postMessage({ id, result: await formatNote(text, choice, offsets) })
}
