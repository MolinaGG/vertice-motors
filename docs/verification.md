# Verificação da entrega — 24/10/2026

- 21 testes Node: cálculos Price com taxa positiva/zero, entrada integral e valores vazios; filtros combinados e acentos; URLs inválidas; comparação até 3; consentimento, datas e contatos; tipos de imagem; identidades não autorizadas; autenticação de máquina; upload idempotente e falhas de armazenamento.
- Checagem TypeScript e build de produção executados durante a preparação da publicação.
- Gateway real: token inválido negado, catálogo com 12 veículos, leitura e escrita administrativas sem autorização negadas, bootstrap sem contexto privado negado, contato persistido e reenvio idempotente.
- Browser QA: abertura desktop e iframe de 390px; filtros Fiat + até R$60 mil retornam Argo e Mobi; favorito persiste no navegador; galeria alterna as vistas; comparação HB20/Onix exibe informações lado a lado; R$48 mil em 48 parcelas a 0% retorna R$1 mil por mês.
- Diálogo: reproduzido Escape fechando editor ocupado; corrigido com política nativa de fechamento, prevenção de cancelamento e bloqueio do botão/backdrop. Verificado aberto durante salvamento e removido após liberação.
- Revisão independente: 3 achados importantes corrigidos (entrada vazia, Escape ocupado, duplicação por reenvio de upload); corrigida também a recuperação de imagem que falhou e exibido o total das parcelas previsto na especificação.
- RLS habilitado nas 7 tabelas do projeto. Advisor sem alertas Critical/Warn; 5 avisos INFO de RLS sem políticas são intencionais para tabelas privadas, com permissões cliente revogadas. Referência: https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy
- A inspeção de segurança do código assume o comportamento documentado da plataforma: cabeçalhos de identidade são inseridos pela hospedagem e o primeiro setup ocorre exclusivamente na audiência owner-private confirmada.
- Credenciais e dados de solicitações não integram o repositório. Fotos são ilustrativas.

A ativação do administrador real requer o primeiro acesso autenticado do proprietário em `/admin`. Isso não é feito por uma identidade de teste. A publicação, audiência e resultado do GitHub são confirmados separadamente pelos respectivos serviços.

O controle automático de aprovação recusou criar uma identidade administrativa temporária para QA, por ampliar o acesso além do proprietário. A concessão não foi realizada e não se tentou contornar o bloqueio. Testes de domínio, autorização negativa e revisão independente permaneceram disponíveis; a validação positiva completa do painel autenticado depende do primeiro acesso do proprietário.

Extensão de movimento: 3 testes adicionais verificam progresso/clamping, movimento reduzido e sequência de marcas. A cena 2 foi observada no navegador com progresso ~0,48. Revisão independente da extensão identificou foco de teclado fora da área visível do carrossel; reproduzido com Volkswagen fora da máscara e corrigido por modo estacionário rolável durante foco visível. A solução gratuita usa JavaScript/CSS; vídeo Higgsfield é opcional e não foi gerado.

Produção inicial: API do catálogo retornou 12 veículos persistentes; administração sem identidade retornou 401; gravação de origem externa retornou 403, sem registros adicionais.

Carrossel mobile: navegação por teclado validada em viewport de 390px para Volkswagen, Chevrolet, Fiat, Hyundai, Nissan e Renault; todas as logos permaneceram focadas e integralmente visíveis. Suíte final da extensão: 24/24 testes aprovados.

Abertura 3D: 25/25 testes Node; TypeScript sem erros. GLB final HB20 inspecionado por CPU: 41 meshes, 137.978 triângulos, dimensões 1,86 × 1,59 × 3,94 antes da normalização; três poses renderizadas offline e inspecionadas. Corrigidos prontidão ao recriar cena e enquadramento contínuo por proporção. WebGL desativado no navegador cloud impediu validar os shaders/luzes e a fluidez em GPU; fallback fotográfico desktop e 390px, capítulo 2 em progresso 0,48 e CTA para estoque observados. Não foi habilitado WebGL por fora da plataforma. A renderização offline usa iluminação simplificada e não comprova a aparência WebGL final.

Composição urbana/refinamento: 28 testes Node aprovados, incluindo translação x/z, conectores inválidos e letterboxing contain. Browser observou fundo/carro transparente/painéis desktop e 390px, correção de prontidão com cache e conectores acompanhando deslocamento -159,8px na cena2. Destaques abaixo da abertura exibem Onix/HB20/Polo com próprios anúncios; card do Onix abriu ficha correta a R$62.900. A alternativa sem WebGL usa poster transparente em movimento CSS; sua vista não gira. Movimento 3D real, shaders e desempenho GPU não puderam ser vistos no browser cloud (WebGL Disabled).

Destaques no celular: o último card (Polo) foi alcançado pela lista horizontal, abriu a ficha a R$68.900 e voltou ao card; o carrossel de marcas permaneceu operacional abaixo da seleção.

Verificação final: 29/29 testes; TypeScript sem erros. Regressão coberta: ao não haver destaques elegíveis, o CTA cinematográfico leva ao estoque, preservando navegação. Sem contas administrativas adicionais e sem mutação de dados para QA.
