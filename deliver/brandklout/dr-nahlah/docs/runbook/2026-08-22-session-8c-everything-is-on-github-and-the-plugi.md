## DONE 2026-08-22 (session 8c): everything is on GitHub, and the plugin is canonical

**The repository had not been pushed since the laptop migration.** GitHub's `main` sat at `0f86911` while local `main` was 171 commits ahead and every client branch was unpushed — `bk-dr-nahlah` by 187, `bk-marvel-dental` by 172, `bk-legacy-dental` by 168, `bk-west-la-implants` by 153, and five more. Weeks of client work existed on one laptop. `git push --all` fixed it; all 12 branches are now on the remote (private, confirmed 404 anonymously) and `main` moved `0f86911 → 4a8149e`.

**The plugin is promoted to `deliver/process/18-instatic-embeds/`** — canonical, per `DELIVER_SYSTEM_RULES.md` §3.2 ("do not leave the only copy of a new rule or tool in one client workflow"). It is **18**, not 16: the client folder invented `15-instatic-api-sync` / `16-instatic-plugins` locally, and those numbers already mean `15-improvement-intake-audit` and `16-vercel-deployment` canonically. `PROCESS_INDEX.md` and `OFFER_ROUTING.md` are updated in the same commit, as their integrity rule requires.

The module is self-contained: `lib/insta-api.mjs` is its own copy of the admin client and every script imports `./lib/insta-api.mjs`, so it does not reach into a client folder. It ships the plugin, both offline suites (54 + 44), all three gates, both vendor probes, the marketer guide, a `TRIGGER_PROMPT.txt` and a real `.py` orchestrator (`test` / `install` / `verify [--published]`) that puts the non-publishing gate first.

**`lib/insta-api.mjs` has NO default site, deliberately.** The client copy defaults to `https://encorercm.com`; a shared installer that inherited that would publish one client's plugin to another client's site. It now requires `INSTATIC_BASE_URL` and says so in a sentence. Two bugs found while proving it actually runs rather than just copies:

- **`BASE` must be declared AFTER `loadEnv()`.** Above it the repo-root `.env` has not been read, so the guard fired on a correctly configured site. The original could sit higher only because it carried a hardcoded default.
- **`**/.tmp/.session` is now gitignored repo-wide.** The cached admin session cookie — a live CMS credential — was protected only by a local `.tmp/.gitignore` in the Dr. Nahlah folder, which does nothing for any other copy of the toolkit.

Proven from the new location: `node set-origins.mjs` reads the live settings (`embedPolicy: compatible`), and the guard still fires on a blank site value.

Tag: **`embed-origins-v1.3.0`** marks the working version.

### For the next Instatic client

```bash
cd deliver/process/18-instatic-embeds
# repo-root .env: INSTATIC_BASE_URL / INSTATIC_EMAIL / INSTATIC_PASSWORD
python 18-instatic-embeds.py test                 # offline, no site
python 18-instatic-embeds.py install --apply      # step-up auth
python 18-instatic-embeds.py verify               # editor gate, publishes nothing
python 18-instatic-embeds.py verify --published   # also the publishing gate
```
