/**
 * pack.mjs — build output/packages/<id>-<version>.zip from a plugin's source folder with
 * ../pack-plugin.mjs (deterministic bytes, forward-slashed entries). No site access, so it can be
 * imported before INSTATIC_BASE_URL is known.
 */
import { existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'
import { HERE } from './fleet.mjs'

export function packPlugin(p, id) {
  const outDir = join(HERE, 'output', 'packages')
  mkdirSync(outDir, { recursive: true })
  const zip = join(outDir, `${id}-${p.version}.zip`)
  execFileSync(process.execPath, [join(HERE, 'pack-plugin.mjs'), join(HERE, p.dir), zip], { stdio: 'ignore' })
  if (!existsSync(zip)) throw new Error(`pack produced no ${zip}`)
  return zip
}
