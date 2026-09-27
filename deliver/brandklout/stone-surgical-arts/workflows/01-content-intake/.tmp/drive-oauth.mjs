#!/usr/bin/env node
// Google Drive OAuth helper + folder search.
//
// An API key (GOOGLEDRIVE) is an anonymous caller: it can read a file shared
// "anyone with the link" but it has no My Drive and no Shared with me, so
// files.list answers 403 insufficientFilePermissions. Searching the Brandklout
// Drive for the Stone folder therefore needs a real user identity: OAuth.
//
//   node drive-oauth.mjs auth            one-time consent, stores a refresh token
//   node drive-oauth.mjs search stone    find folders whose name matches
//   node drive-oauth.mjs ls <folderId>   list a folder's children
//
// Reads and writes the repo-root .env. Requires, in that file:
//   GOOGLEDRIVEOAUTHID      <...>.apps.googleusercontent.com
//   GOOGLEDRIVEOAUTH        GOCSPX-...            (already present)
//   GOOGLEDRIVEREFRESH      written by `auth`
//
// The OAuth client must be of type "Desktop app". If its publishing status is
// "Testing", the consenting account must also be listed as a test user, or the
// consent screen refuses with access_denied.

import { createServer } from 'node:http'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ENV = path.resolve(HERE, '../../../../../../.env')
const PORT = 53682
const REDIRECT = `http://127.0.0.1:${PORT}`
const SCOPE = 'https://www.googleapis.com/auth/drive.readonly'

function env () {
  const out = {}
  for (const line of readFileSync(ENV, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/)
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
  return out
}

// Rewrites one key in place, appending it if absent, so `auth` can persist the
// refresh token without disturbing the rest of the file.
function setEnv (key, value) {
  const raw = readFileSync(ENV, 'utf8')
  const line = `${key}=${value}`
  const re = new RegExp(`^${key}=.*$`, 'm')
  writeFileSync(ENV, re.test(raw) ? raw.replace(re, line) : raw.replace(/\n*$/, `\n${line}\n`))
}

function need (e, ...keys) {
  const missing = keys.filter(k => !e[k])
  if (missing.length) {
    console.error(`Missing from .env: ${missing.join(', ')}`)
    if (missing.includes('GOOGLEDRIVEOAUTHID')) {
      console.error('\nThe client ID sits directly above the secret in Google Cloud Console:')
      console.error('  APIs & Services > Credentials > your OAuth 2.0 Client ID')
      console.error('It is not itself a secret. Add it as GOOGLEDRIVEOAUTHID=...apps.googleusercontent.com')
    }
    if (missing.includes('GOOGLEDRIVEREFRESH')) console.error('\nRun `node drive-oauth.mjs auth` first.')
    process.exit(1)
  }
}

// Serves the loopback redirect Google sends the browser back to, and resolves
// with the one-time code from its query string.
function awaitCode (url) {
  return new Promise((resolve, reject) => {
    const server = createServer((req, res) => {
      const q = new URL(req.url, REDIRECT).searchParams
      const code = q.get('code')
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
      res.end(`<body style="font:16px system-ui;padding:3rem">${
        code ? 'Authorised. Close this tab and return to the terminal.'
             : `Failed: ${q.get('error') || 'no code returned'}`}</body>`)
      server.close()
      code ? resolve(code) : reject(new Error(q.get('error') || 'no code returned'))
    })
    server.listen(PORT, '127.0.0.1', () => {
      console.log('\nOpen this URL, pick the account that can see the Brandklout Drive, and approve:\n')
      console.log(url + '\n')
      console.log(`Waiting on ${REDIRECT} ...`)
    })
  })
}

async function post (body) {
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(body)
  })
  const j = await r.json()
  if (!r.ok) throw new Error(`${r.status} ${j.error}: ${j.error_description || ''}`)
  return j
}

async function auth () {
  const e = env()
  need(e, 'GOOGLEDRIVEOAUTHID', 'GOOGLEDRIVEOAUTH')
  const url = 'https://accounts.google.com/o/oauth2/v2/auth?' + new URLSearchParams({
    client_id: e.GOOGLEDRIVEOAUTHID,
    redirect_uri: REDIRECT,
    response_type: 'code',
    scope: SCOPE,
    access_type: 'offline',
    // Without this Google omits refresh_token on re-consent for an already
    // authorised client, and the next run silently has nothing to refresh with.
    prompt: 'consent'
  })
  const code = await awaitCode(url)
  const tok = await post({
    code,
    client_id: e.GOOGLEDRIVEOAUTHID,
    client_secret: e.GOOGLEDRIVEOAUTH,
    redirect_uri: REDIRECT,
    grant_type: 'authorization_code'
  })
  if (!tok.refresh_token) throw new Error('No refresh_token returned. Revoke the app at myaccount.google.com/permissions and retry.')
  setEnv('GOOGLEDRIVEREFRESH', tok.refresh_token)
  console.log('\nRefresh token stored in .env as GOOGLEDRIVEREFRESH.')
  console.log('Now run:  node drive-oauth.mjs search stone')
}

async function token () {
  const e = env()
  need(e, 'GOOGLEDRIVEOAUTHID', 'GOOGLEDRIVEOAUTH', 'GOOGLEDRIVEREFRESH')
  const t = await post({
    client_id: e.GOOGLEDRIVEOAUTHID,
    client_secret: e.GOOGLEDRIVEOAUTH,
    refresh_token: e.GOOGLEDRIVEREFRESH,
    grant_type: 'refresh_token'
  })
  return t.access_token
}

async function drive (params, access) {
  const url = 'https://www.googleapis.com/drive/v3/files?' + new URLSearchParams({
    supportsAllDrives: 'true',
    includeItemsFromAllDrives: 'true',
    corpora: 'allDrives',
    pageSize: '200',
    ...params
  })
  const r = await fetch(url, { headers: { authorization: `Bearer ${access}` } })
  const j = await r.json()
  if (!r.ok) throw new Error(`${r.status} ${JSON.stringify(j.error)}`)
  return j.files || []
}

const FOLDER = 'application/vnd.google-apps.folder'

async function search (term) {
  const access = await token()
  const q = `mimeType='${FOLDER}' and name contains '${String(term).replace(/'/g, "\\'")}' and trashed=false`
  const files = await drive({ q, fields: 'files(id,name,modifiedTime,owners(emailAddress))' }, access)
  if (!files.length) return console.log(`No folder matching "${term}".`)
  for (const f of files) {
    console.log(`${f.id}  ${f.name}`)
    console.log(`    modified ${f.modifiedTime}  owner ${f.owners?.[0]?.emailAddress || 'n/a'}`)
  }
  console.log(`\n${files.length} folder(s). Inspect one with:  node drive-oauth.mjs ls <id>`)
}

async function ls (id) {
  const access = await token()
  const files = await drive({
    q: `'${id}' in parents and trashed=false`,
    fields: 'files(id,name,mimeType,size,imageMediaMetadata(width,height))',
    orderBy: 'folder,name'
  }, access)
  let images = 0
  for (const f of files) {
    const dim = f.imageMediaMetadata ? `${f.imageMediaMetadata.width}x${f.imageMediaMetadata.height}` : ''
    const kb = f.size ? `${Math.round(f.size / 1024)}KB` : ''
    if (f.mimeType.startsWith('image/')) images++
    console.log(`${f.mimeType === FOLDER ? 'DIR ' : '    '}${f.id}  ${f.name}  ${dim} ${kb}`.trimEnd())
  }
  console.log(`\n${files.length} item(s), ${images} image(s).`)
}

const [cmd, arg] = process.argv.slice(2)
const run = { auth, search: () => search(arg || 'stone'), ls: () => ls(arg) }[cmd]
if (!run || (cmd === 'ls' && !arg)) {
  console.error('usage: drive-oauth.mjs auth | search <term> | ls <folderId>')
  process.exit(1)
}
run().catch(e => { console.error(String(e.message || e)); process.exit(1) })
