import { promises as fs } from 'fs'
import path from 'path'

const ROOT = path.join(process.cwd(), 'data', 'artifacts')

export type ShareArtifactMeta = {
  id: string
  name: string
  kind: 'image' | 'video'
  mime: string
  size: number
}

function safePart(value: string, label: string) {
  if (!/^[a-zA-Z0-9._-]+$/.test(value)) throw new Error(`Invalid ${label}`)
  return value
}

function dirFor(token: string) {
  return path.join(ROOT, safePart(token, 'share'))
}

function fileFor(token: string, id: string) {
  return path.join(dirFor(token), safePart(id, 'artifact'))
}

function metaFor(token: string, id: string) {
  return `${fileFor(token, id)}.meta.json`
}

export const shareArtifactStore = {
  async save(token: string, meta: ShareArtifactMeta, bytes: Buffer) {
    const folder = dirFor(token)
    await fs.mkdir(folder, { recursive: true })
    await fs.writeFile(fileFor(token, meta.id), bytes)
    await fs.writeFile(metaFor(token, meta.id), JSON.stringify({ ...meta, size: bytes.length }))
    return { ...meta, size: bytes.length }
  },

  async get(token: string, id: string): Promise<{ meta: ShareArtifactMeta; bytes: Buffer } | null> {
    try {
      const [bytes, raw] = await Promise.all([
        fs.readFile(fileFor(token, id)),
        fs.readFile(metaFor(token, id), 'utf8'),
      ])
      const meta = JSON.parse(raw) as ShareArtifactMeta
      return { meta: { ...meta, size: bytes.length }, bytes }
    } catch (error: any) {
      if (error?.code === 'ENOENT') return null
      throw error
    }
  },

  async remove(token: string, id: string) {
    await Promise.allSettled([
      fs.unlink(fileFor(token, id)),
      fs.unlink(metaFor(token, id)),
    ])
  },

  async removeAll(token: string) {
    await fs.rm(dirFor(token), { recursive: true, force: true }).catch(() => undefined)
  },
}
