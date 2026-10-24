# Execution ledger — docs/superpowers/plans/2026-10-24-vertice-motors.md

Design approved by user on 2026-10-24. User authorizes creation and delegates routine decisions. Execute inline without additional plan approval, per session authorization.
Pre-flight: Tasks 1–5 share sanitized vehicle/lead data and gateway action names; interfaces consistent.
Ruling: use managed Supabase Edge credentials behind a token-authenticated project-scoped gateway — avoids exporting project-wide secret keys from a shared instance; gateway authentication and action authorization require targeted tests.
Ruling: bootstrap admin only with signed-in identity on confirmed owner-private hosting and explicit setup flag, store singleton identity atomically — permits secure owner onboarding without asking for private account details; public deployment requires setup flag disabled and configured admin identity.
Status: Task 1 in progress; installation launched; Site identity persisted.

Task 1: complete — 17 initial tests passed after RED missing modules; financing/filter/lead helpers and seed implemented.
Task 2: complete — additive migration 20261024162533, 12 vehicle seeds, RLS and private bucket, authenticated Edge gateway deployed.
Task 3: complete — Sites API routes and secret runtime configured; 7 live gateway checks passed.
Task 4: complete — 26 generated assets optimized to 2,241,660 bytes; desktop/mobile browser QA exercised filters, galleries, financing, favorites and comparison.
Task 5: implemented — administrative CRUD, photo management, leads and settings; initial real admin activation remains an owner action.
Review: independent whole-project review received. Important findings fixed in one pass with finance/photos RED→GREEN and actual native-dialog RED→GREEN. Total 21 tests passed.
Ruling: gallery recovery and total installments upgraded from review polish to release requirements — failed image must not hide subsequent photos and approved financial totals must be visible; fixed, no deferral.
Ruling: actual hosting policy verified custom with exactly one allowed user, no groups, current role owner — private bootstrap conforms to spec; sharing later requires disabling setup flag first.

Verification limit: auto-review rejected provisioning a disposable QA admin because it would expand access beyond the owner. No grant occurred; no alternate provisioning attempted. Use existing unit, browser and negative-auth integration evidence; owner completes actual activation.

User steering: add cinematic scroll-linked scene and brand-logo carousel. Implement native sticky progression with reduced-motion fallback; Higgsfield clip awaits account connection. Brand icons sourced from Simple Icons, with credits. New motion tests written RED first.

Extension review: focused brand link could remain offscreen after marquee movement. Reproduced live (Volkswagen left -617 vs viewport left250); fixed stationary scrollable focus-visible mode, then browser verification. Free native JavaScript/CSS scene selected as the implementation path; no Higgsfield cost or account dependency.

Referência do usuário: vídeo 8wjw5lz-7lM usa Three.js e rolagem para mover objetos 3D. Usuário permite carro ilustrativo. Integrada cena Three.js sob demanda com pintura vermelha, estúdio procedural, caminho reversível de câmera/rotação e pausa de renderização fora da tela/aba oculta. GSAP não é dependência: a rolagem usa JavaScript nativo. Não há API de vídeo nem custo de geração. GLB Hyundai HB20 por Nieve5677, CC BY 4.0, com atribuição pública. Inspeção CPU revelou geometrias alheias ao HB20, removidas da cena antes da normalização. Primeiro modelo Onix descartado após inspeção visual.
Revisão focada: corrigido estado ready persistente ao recriar cena e adaptado FOV continuamente à proporção mobile. Browser cloud sem WebGL (vendor/renderer Disabled); fallback e progresso 0,48 confirmados, sem contornar restrição. Inspeção offline do modelo e projeção complementam a verificação, sem substituir a validação visual de iluminação/desempenho WebGL no aparelho real.
