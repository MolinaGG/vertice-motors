# Vértice Motors Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver the approved cinematic dealership, persistent inventory and protected administration.

**Architecture:** Vinext server renders HTML with React/JavaScript interactions and authored CSS. A narrowly scoped Supabase Edge gateway uses its managed credentials, authenticates the Sites server with a random API token whose hash is stored privately, and accesses only vertice_ objects. Sites authenticates the administrator; the Supabase instance remains shared and untouched outside this project.

**Tech Stack:** Vinext starter, React 19, CSS, JavaScript ES modules, Supabase Postgres/Storage/Edge Functions, Node test runner.

**Spec:** ../specs/2026-10-24-vertice-motors-design.md

## Global Constraints
- Portuguese, black/red/white, premium cinematic, 3 sections, 12 initial vehicles.
- Preserve all unrelated Supabase objects; prefix vertice_, dedicated bucket.
- No secrets in source/client/GitHub. RLS enabled; contacts never public.
- Private initial hosting; public GitHub repository MolinaGG/vertice-motors.
- Responsive, accessible, reduced motion; no fake 360° or fictitious WhatsApp recipient.

## Review Focus
- Malformed numeric inputs and zero/full financing: reject invalid inputs and return correct totals.
- Missing identity and authenticated non-admin: deny every administrative mutation.
- Concurrent bootstrap: exactly one admin identity, never replaced by subsequent requests.
- Browser history, empty filters, deleted favorites and no storage access: usable catalog without crashes.
- Server errors, oversized files and duplicate form submissions: explicit failure, no false success or duplicate uploads.

### Task 1: Domain and seed catalog
**Files:** lib/domain/catalog.mjs, lib/domain/finance.mjs, lib/domain/validation.mjs, lib/seed.mjs, tests/domain.test.mjs.
**Interfaces:** filterVehicles(vehicles, filters) -> array; simulateFinance(price,entry,months,rate) -> totals; validateLead(input,today) -> sanitized lead; validateVehicle(input) -> vehicle; seedVehicles -> array of 12.
- [ ] Write tests for combined filters, accents, year/km bounds, deterministic sorts, positive/zero rate, full entry, invalid inputs, consent and date checks.
- [ ] Run node --test tests/domain.test.mjs: expected failure before implementation.
- [ ] Implement pure functions and coherent fictional catalog; run tests: PASS.

### Task 2: Supabase storage and gateway
**Files:** supabase/migrations/*_vertice_initial.sql, supabase/seed.sql, supabase/functions/vertice-gateway/index.ts, lib/domain/access.mjs, tests/access.test.mjs.
**Interfaces:** gateway accepts POST {action,payload,actor}; token checked before dispatch. Actions: catalog, createLead, adminState, bootstrapAdmin, saveVehicle, archiveVehicle, updateLead, saveSettings, uploadPhoto, deletePhoto.
- [ ] Write access tests: missing/mismatched token rejected, anonymous/non-admin denied, public actions cannot dispatch admin actions.
- [ ] Run tests: expected failure; implement helpers and gateway.
- [ ] Create migration with RLS, private runtime-token hash and singleton admin, project tables, atomic rate limit RPC restricted to service role, bucket and published-photo read policy.
- [ ] Apply additive migration; seed 12 vehicles and settings, store random token hash, deploy uniquely named gateway; verify SQL and denial with invalid token.
- [ ] Supabase code uses built-in service credentials only in Edge environment. All server-to-server permissions are project-scoped by action and code.

### Task 3: Server API and identity
**Files:** lib/server.ts, app/api/catalog/route.ts, app/api/leads/route.ts, app/api/admin/route.ts, app/api/admin/photo/route.ts.
**Interfaces:** GET /api/catalog -> vehicles/settings; POST /api/leads -> persisted id; GET /api/admin -> authorized state or 401/403; POST /api/admin -> whitelisted admin action; POST /api/admin/photo -> upload, DELETE -> scoped removal.
- [ ] Write tests for action authorization, origin validation, upload signatures/size, lead sanitization; run RED.
- [ ] Implement API with body limits, no-store contacts, error mapping, CSRF origin checks and project-scoped gateway calls; run GREEN.
- [ ] Configure Sites runtime token as secret. Bootstrap requires signed-in owner on confirmed owner-private hosting and explicit setup flag; save singleton userId, deny concurrent different user and disable bootstrap once initialized.

### Task 4: Public experience and generated assets
**Files:** app/page.tsx, app/components/*, app/globals.css, app/layout.tsx, public/images/*, public/favicon.svg.
**Interfaces:** server catalog passed to interactive Showroom; dialogs receive vehicle and callback; contact form calls /api/leads; state uses validated URL params and resilient localStorage.
- [ ] Generate individual realistic assets for 12 vehicles, hero and showroom; optimize into project and inspect them.
- [ ] Implement 3 sections, responsive navigation, categories, complete catalog, favorites, filters, comparison up to 3, detail galleries, Price simulator, forms and contact fallback.
- [ ] Use native dialog focus behavior, semantic headings and reduced motion. Add lightweight scroll and image motion, no scroll hijack.
- [ ] Start supported preview and inspect desktop and mobile; exercise filters, modal, financing, form failure/success, keyboard and browser history.

### Task 5: Administration
**Files:** app/admin/page.tsx, app/admin/AdminPanel.tsx, app/admin/admin.css.
**Interfaces:** admin uses /api/admin and photo endpoint; no credentials reach browser.
- [ ] Implement protected login/setup states and admin dashboard, vehicle CRUD/archive, safe photo upload/delete, lead status changes, store settings.
- [ ] Verify persistence, denied unauthorized calls, validation failures and restricted lists; all metrics derive from database.

### Task 6: Verification, review and release
**Files:** README.md, .env.example, docs/verification.md, .gitignore, source release metadata.
- [ ] Run node --test tests/*.test.mjs, TypeScript/build and targeted live API checks; expected PASS.
- [ ] Run Supabase security advisors and inspect table policies/grants and bucket.
- [ ] Request one independent whole-project code review; fix material findings with regression tests.
- [ ] Publish exact committed source through Sites; verify terminal success URL. Keep site private.
- [ ] Prepare public GitHub upload and create repo through supported capability; request browser fallback only if required after code is ready. Verify remote files, never imply success from intent.
- [ ] Deliver deployed link, GitHub result, admin entry, genuine remaining limits and setup needs.
