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

Refinamento do usuário: composição urbana com painéis pretos foscos translúcidos, títulos/CTA reposicionados, carro em translação lateral/profundidade além da rotação e chamadas projetadas de qualidade/segurança. SVG acompanha pontos 3D; alternativa transparente do mesmo modelo usa contain com âncoras e deslocamento CSS. Corrigido evento load perdido em imagens carregadas antes da hidratação (RED no navegador: paths presentes porém is-ready ausente; GREEN: conectores visíveis). Cenário e anotações verificados em desktop e iframe390px; no progresso0,48 o deslocamento CSS observado foi -159,8px e ambos os conectores mudaram suas origens. WebGL ao vivo segue sem validação no navegador cloud desabilitado.

Solicitação final: anúncios em destaque imediatamente abaixo da abertura, sem atribuir modelo/preço de Onix à cena ilustrativa. Nova seção usa featured/status available do catálogo, até3 cards, favoritos compartilhados e fichas existentes. CTA da abertura leva aos destaques. Foto, nome e R$62.900 do Onix confirmados na ficha aberta pelo card; carrossel preservado abaixo dos destaques. Revisão focada de movimento/composição sem novos Critical/Important. Suíte28 testes aprovada; tipos/build finais registrados pelo fluxo de publicação.

Revisão incremental dos destaques identificou CTA sem destino ao retirar/reservar todos os destacados. Corrigido com seleção compartilhada (disponível, marcado e não arquivado; máximo3) e destino do hero para estoque quando a seleção fica vazia. Teste escrito RED para seleção/ausência antes da correção; suíte final29 testes. Não houve mudança no banco para testar esse cenário.

Sincronia final: revisão independente aprovada; retângulos seguem âncoras projetadas relativas à pose0, vetores recalculados no mesmo frame e textos principais acompanham o centro. QA desktop: cena2 moveu Qualidade de x269,6 para126,2 e Segurança de1095,9 para938,2; bloco principal -30,1px. QA390px confirmou deslocamento dos cartões com limites e leitura sem sobreposição ao bloco principal. WebGL permanece indisponível no browser cloud; mesma geometria e alternativa transparente verificadas sem simular suporte GPU.

FIPE: agente independente implementou /fipe e proxyGET restrito, 12testes; revisão semCritical/Important. Fluxo real Node consultou Fiat21/Palio4828/2013-5, retornando mês outubro2026. Suíteglobal44testes e tipos aprovados. QA local identificou incompatibilidade do componente next/link com runtime de prévia; substituído por links nativos, como restante do site. Fetch real pelo handlerNode retorna108marcas; prévia gerenciada apresentou indisponibilidade do fetch externo, e a UI mostrou erro e alternativa oficial. Validação de ponta a ponta na hospedagem será conferida após publicação. Sem mudança de permissões ou usuários; contadoradministrativo0 confirmado apenas por leitura.
