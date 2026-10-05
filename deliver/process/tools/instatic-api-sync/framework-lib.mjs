/**
 * The Instatic Framework (`site.settings.framework`), as data: which CSS
 * variables it owns and what it emits for them. Mirrors Instatic's
 * `src/core/framework/` (colors.ts, scale.ts, scaleModule.ts) so a script can
 * answer "does anything else re-declare a Framework token?" without a publish.
 *
 * Standard and reasons: ../client-first-style-guide/INSTATIC-FRAMEWORK.md
 */
import { randomBytes } from 'node:crypto'

export const nid = () => randomBytes(12).toString('base64url').slice(0, 21)

const round2 = (v) => Number(Number(v).toFixed(2))

/** colors.ts normalizeFrameworkColorSlug */
export const colorSlug = (input) =>
  String(input).trim().toLowerCase().replace(/^--+/, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'color'

/** scale.ts manualSizeVariableName + convertToVariableDeclarationName */
export const manualVar = (name) => {
  const safe = String(name).replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-_]/g, '') || 'size'
  return `--${safe}`.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
}

/** scale.ts getVariableName */
const stepVar = (convention, step) =>
  convention.includes('{step}')
    ? `--${convention.replace('{step}', step).replace(/\s/g, '-')}`
    : `--${convention.replace(/\s/g, '-')}-${step}`

export const DEFAULT_PREFERENCES = { rootFontSize: 10, minScreenWidth: 320, maxScreenWidth: 1400, isRem: true }

/**
 * Every variable the Framework emits at :root, with its value where it is a
 * fixed one: `{ name, value, source }`. Colour variants (shades, tints,
 * transparent) are listed by name only when enabled. Fluid (automatic) scale
 * steps are listed with value null.
 */
export function frameworkVariables(framework) {
  const out = []
  if (!framework) return out
  const prefs = { ...DEFAULT_PREFERENCES, ...(framework.preferences ?? {}) }
  const unit = (px) => (prefs.isRem ? `${round2(px / prefs.rootFontSize)}rem` : `${px}px`)
  const seen = new Set()
  for (const t of [...(framework.colors?.tokens ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))) {
    let slug = colorSlug(t.slug)
    for (let n = 2; seen.has(slug); n++) slug = `${colorSlug(t.slug)}-${n}`
    seen.add(slug)
    out.push({ name: `--${slug}`, value: t.lightValue, source: 'colors' })
  }
  for (const family of ['typography', 'spacing']) {
    const settings = framework[family]
    if (!settings || settings.isDisabled) continue
    for (const g of [...(settings.groups ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))) {
      if (g.isDisabled) continue
      if (g.mode === 'fluid_manual') {
        for (const s of g.manualSizes ?? []) {
          out.push({
            name: manualVar(s.name),
            value: Number(s.min) === Number(s.max) ? unit(Number(s.min)) : null,
            source: `${family}:${g.name}`,
          })
        }
      } else {
        for (const step of String(g.steps ?? '').split(',').filter(Boolean)) {
          out.push({ name: stepVar(g.namingConvention ?? (family === 'typography' ? 'text' : 'space'), step), value: null, source: `${family}:${g.name}` })
        }
      }
    }
  }
  return out
}

export const ownedNames = (framework) => new Set(frameworkVariables(framework).map((v) => v.name))

/** A selector that declares page-wide tokens (where a re-declaration shadows the Framework). */
export const isRootSelector = (sel) =>
  String(sel ?? '').split(',').map((s) => s.trim()).some((s) => s === ':root' || s === 'html' || s === ':root:root')

/**
 * Upsert a spec into a framework object (mutates and returns it).
 *
 * spec = {
 *   preferences: { rootFontSize: 16, isRem: true },
 *   colors: [{ slug, value }],
 *   typography: [{ group, sizes: [{ name, px }] }],
 *   spacing:    [{ group, sizes: [{ name, px }] }],
 * }
 * Sizes are fixed (min = max, Manual mode): the fluid root does the scaling.
 * Existing tokens and sizes are matched by slug / name and updated in place;
 * nothing the spec does not name is removed.
 */
export function applySpec(framework, spec, log = () => {}) {
  const now = Date.now()
  const fw = framework ?? {}
  fw.colors ??= { tokens: [] }
  fw.colors.tokens ??= []
  if (spec.preferences) {
    const before = JSON.stringify(fw.preferences ?? {})
    fw.preferences = { ...DEFAULT_PREFERENCES, treeShakeGeneratedFrameworkUtilities: true, ...(fw.preferences ?? {}), ...spec.preferences }
    if (JSON.stringify(fw.preferences) !== before) log(`preferences ${before} -> ${JSON.stringify(fw.preferences)}`)
  }
  for (const c of spec.colors ?? []) {
    const slug = colorSlug(c.slug)
    const t = fw.colors.tokens.find((x) => colorSlug(x.slug) === slug)
    if (t) {
      if (t.lightValue !== c.value) {
        log(`colour  ${slug}: ${t.lightValue} -> ${c.value}`)
        Object.assign(t, { lightValue: c.value, updatedAt: now })
      }
      continue
    }
    log(`colour  + ${slug}: ${c.value}`)
    fw.colors.tokens.push({
      id: nid(), category: c.category ?? '', slug, lightValue: c.value, darkValue: c.value, darkModeEnabled: false,
      generateUtilities: { text: false, background: false, border: false, fill: false },
      generateTransparent: false, generateShades: { enabled: false, count: 0 }, generateTints: { enabled: false, count: 0 },
      order: fw.colors.tokens.length, createdAt: now, updatedAt: now,
    })
  }
  for (const family of ['typography', 'spacing']) {
    for (const g of spec[family] ?? []) {
      fw[family] ??= { groups: [], classes: [] }
      fw[family].groups ??= []
      let group = fw[family].groups.find((x) => x.name === g.group)
      if (!group) {
        const base = family === 'typography'
          ? { namingConvention: 'text', min: { fontSize: 16, scaleRatio: 1.125 }, max: { fontSize: 16, scaleRatio: 1.125 }, steps: 'm', baseScaleIndex: 0 }
          : { namingConvention: 'space', min: { size: 16, scaleRatio: 1.25 }, max: { size: 16, scaleRatio: 1.25 }, steps: 'm', baseScaleIndex: 0 }
        group = { id: nid(), name: g.group, ...base, mode: 'fluid_manual', manualSizes: [], order: fw[family].groups.length, createdAt: now, updatedAt: now }
        fw[family].groups.push(group)
        log(`${family} + group ${g.group}`)
      }
      group.mode = 'fluid_manual'
      group.manualSizes ??= []
      for (const s of g.sizes) {
        const hit = group.manualSizes.find((x) => x.name === s.name)
        if (hit) {
          if (hit.min !== s.px || hit.max !== s.px) {
            log(`${family} ${g.group}/${s.name}: ${hit.min}/${hit.max} -> ${s.px}px`)
            Object.assign(hit, { min: s.px, max: s.px })
          }
        } else {
          log(`${family} ${g.group} + ${s.name}: ${s.px}px`)
          group.manualSizes.push({ id: nid(), name: s.name, min: s.px, max: s.px })
        }
      }
      group.steps = group.manualSizes.map((_, i) => `s${i + 1}`).join(',')
      group.updatedAt = now
    }
  }
  return fw
}

const COLOR_RE = /^(#[0-9a-f]{3,8}|(rgb|rgba|hsl|hsla)\([^)]*\)|transparent)$/i
const LEN_RE = /^(-?\d*\.?\d+)(rem|px)$/i

/**
 * Draft a spec from a tokens stylesheet's top-level `:root` declarations.
 * Colours, colour aliases (`var(--other-colour)`) and fixed rem/px lengths are
 * proposed; anything else (formulas, clamp(), font stacks, numbers) is listed
 * under `stays` for a person to decide. Review before `apply`.
 */
export function extractSpec(decls, { root = 16 } = {}) {
  const spec = { preferences: { rootFontSize: 16, isRem: true }, colors: [], typography: [], spacing: [], stays: [] }
  const colorNames = new Set()
  const type = []
  const space = []
  const ui = []
  for (const { prop, value } of decls) {
    if (!prop.startsWith('--')) continue
    const name = prop.slice(2)
    const alias = value.match(/^var\(\s*--([\w-]+)\s*\)$/)
    if (COLOR_RE.test(value) || (alias && colorNames.has(alias[1]))) {
      if (colorSlug(name) !== name) spec.stays.push(`${prop}: ${value}   (rename: the Framework would publish it as --${colorSlug(name)})`)
      else {
        spec.colors.push({ slug: name, value })
        colorNames.add(name)
      }
      continue
    }
    const len = value.match(LEN_RE)
    if (len) {
      const px = len[2].toLowerCase() === 'rem' ? round2(Number(len[1]) * root) : Number(len[1])
      if (len[2].toLowerCase() === 'px' && px > 200) {
        spec.stays.push(`${prop}: ${value}   (a px layout limit: the Framework would emit it in rem, which the fluid root scales)`)
        continue
      }
      const bucket = /radius|border|stroke|divider/.test(name) ? ui
        : /^(text|font|size|h\d|d\d|display|heading|body|label|lead|caption|title)/.test(name) ? type
          : space
      bucket.push({ name, px })
      continue
    }
    spec.stays.push(`${prop}: ${value}`)
  }
  if (type.length) spec.typography.push({ group: 'Typography', sizes: type })
  if (space.length) spec.spacing.push({ group: 'Spacing', sizes: space })
  if (ui.length) spec.spacing.push({ group: 'UI', sizes: ui })
  return spec
}
