# Vértice Motors

[Abrir o site privado](https://vertice-motors-molina.guilhermemolinasolan.chatgpt.site) · Entre com a conta proprietária para acessar.

Revenda **fictícia** de seminovos, com direção visual cinematográfica em vermelho, preto e branco. Interface em HTML semântico, CSS próprio e JavaScript/React, com servidor Vinext e dados persistentes no Supabase.

## Experiência

- Abertura cinematográfica com três momentos ligados à rolagem, feita gratuitamente com JavaScript/CSS; carrossel de logos com pausa e atalhos por marca.
- Três seções na mesma página: Explore os carros, Estoque disponível e Nossa loja.
- 12 veículos ilustrativos, com duas fotografias geradas por IA para cada um.
- Filtros combináveis, ordenação, favoritos por conta, comparação de até três veículos e links compartilháveis.
- Ficha completa, galeria e simulador Price com entrada, prazo, taxa e totais editáveis.
- Contatos e solicitações de test-drive gravados somente após validação e consentimento.
- Painel para criar, editar e arquivar veículos, enviar/remover imagens, acompanhar solicitações e editar informações da loja.
- Interface responsiva, navegação por teclado, diálogos nativos e suporte a movimento reduzido.

**Não há oferta comercial real.** Loja, endereço, preços, histórico e equipamentos são demonstrativos. Fotografias são ilustrativas e podem diferir de versões reais. O simulador não inclui IOF, tarifas, seguros ou CET e não representa aprovação de crédito. Não há envio automático de mensagens ou e-mails nem agendamento confirmado.

## Executar

Requisitos: Node.js >=22.13 e pnpm. Instale com `pnpm install --frozen-lockfile`; use `pnpm dev` e abra o endereço retornado. `pnpm build` gera a aplicação Worker. O projeto preserva a integração de hospedagem de Sites do starter Vinext.

Sem configuração de servidor, a interface mostra uma prévia demonstrativa do catálogo e sinaliza a indisponibilidade. Formulários e administração não fingem persistência local. Para o backend local, configure os valores da `.env.example` no ambiente de desenvolvimento do Worker, fora do Git. Nunca coloque valores secretos na interface ou no repositório.

## Arquitetura

- `app/components`: experiência do visitante, formulários, galeria e simulador.
- `app/admin`: painel e onboarding do administrador.
- `app/api`: validação, identidade e acesso ao backend.
- `lib/domain`: lógica pura, validação, autorização e upload idempotente.
- `supabase/migrations`: migrações aditivas apenas da Vértice.
- `supabase/seed.sql`: conteúdo fictício inicial.
- `supabase/functions/vertice-gateway`: gateway de máquina com autenticação própria.
- `public/images`: 26 imagens originais otimizadas, aproximadamente 2,2 MB no total.

Sites autentica o visitante administrativo pelo ChatGPT. O servidor exige autorização específica e encaminha operações para o gateway usando um token aleatório configurado como segredo. O banco guarda somente o hash desse token. O gateway usa as credenciais gerenciadas do ambiente Supabase; nenhuma chave privilegiada é exportada para o navegador. `verify_jwt=false` no gateway é intencional: toda requisição exige a autenticação própria de máquina antes de acessar dados.

Todas as tabelas possuem prefixo `vertice_` e RLS ativo. Apenas catálogo publicado e configurações públicas têm políticas de leitura. Contatos, auditoria, autorização, hash de acesso e limites de solicitações têm acesso cliente negado. O bucket `vertice-vehicle-images` é privado; fotos cadastradas pelo painel passam por URLs assinadas de curta duração e verificação da publicação do veículo. A instância é compartilhada: recursos e limites do plano continuam compartilhados, embora os objetos sejam separados.

Uploads usam o hash do conteúdo como nome e uma operação atômica no banco para anexar fotos sem sobrescrever os outros campos. Reenviar o mesmo arquivo não cria duplicatas. O envio aceita JPG, PNG e WebP até 5 MB; até 12 fotos por veículo.

## Configuração e primeiro administrador

Valores do servidor, definidos no gerenciador de segredos da hospedagem:

| Nome | Uso |
|---|---|
| `VERTICE_GATEWAY_URL` | URL da Edge Function deste projeto |
| `VERTICE_GATEWAY_TOKEN` | Segredo aleatório de máquina, nunca público |
| `VERTICE_SITE_ORIGIN` | Origem HTTPS do site |
| `VERTICE_PRIVATE_OWNER_SETUP` | Habilitação temporária do primeiro acesso, somente com site confirmado como privado do proprietário |

O site começa **privado e exclusivo do proprietário**. Abra `/admin`, entre com sua conta do ChatGPT e clique em **Ativar minha administração**. A conta é vinculada pelo identificador estável; a chave primária única impede que outra ativação substitua esse administrador. Antes de compartilhar o site ou publicá-lo para visitantes anônimos, conclua essa ativação e configure `VERTICE_PRIVATE_OWNER_SETUP=false`, publicando a revisão de ambiente correspondente. Não altere a audiência deixando o onboarding aberto.

O WhatsApp começa vazio. No painel, configure somente um número real autorizado, com país e DDD. Enquanto vazio, a interface permite copiar a mensagem ou registrar a solicitação pelo formulário. O endereço fictício não é tratado como destino confirmado para visita.

## Verificação

- `node --test tests/*.test.mjs`: lógica de filtros, Price, validação, autorização e reenvio de imagens.
- `pnpm exec tsc --noEmit --incremental false`: checagem de tipos.
- `scripts/verify-live.py`: verificações reais do gateway, com token lido por entrada oculta.

O script de QA nunca recebe segredos em argumentos ou os grava em arquivos. Não crie administradores temporários nem substitua o administrador real para executar testes. A verificação autenticada do painel é feita com o proprietário após sua ativação. Veja `docs/verification.md`.

## Limites

Supabase Free pode pausar por baixa atividade; monitore armazenamento e tráfego conforme o uso. Não há garantia de disponibilidade comercial neste ambiente de demonstração. Não envie dados pessoais reais aos formulários. A abertura pública, domínio próprio, e-mail transacional e integração com WhatsApp podem ser configurados em uma etapa posterior.

### Abertura 3D gratuita

A abertura carrega Three.js sob demanda e apresenta um carro ilustrativo que atravessa a tela em uma trajetória reta conforme a rolagem, com ângulo fixo alinhado à rua, amortecimento de movimento, quatro rodas girando pela distância percorrida e rastros vermelhos. O movimento é implementado em JavaScript nativo; não depende de GSAP, Higgsfield nem APIs pagas. Respeita movimento reduzido e economia de dados e preserva uma renderização transparente do mesmo carro, com deslocamento CSS, quando WebGL está indisponível. Não é uma vista 3D de um anúncio. Modelo e licença: [créditos](public/models/CREDITS.md), também disponíveis em `/creditos` no site. O carrossel de marcas foi preservado.

A composição urbana usa um fundo original gerado por IA e painéis pretos foscos translúcidos. As chamadas de qualidade e segurança acompanham pontos do carro por conectores SVG. Logo abaixo, a seção de destaques usa anúncios disponíveis marcados no painel, com fotos e dados próprios, sem associar o modelo da abertura a um anúncio.

### Consulta FIPE

A página `/fipe`, integrada ao menu, consulta marcas, modelos, anos/combustíveis e valores reais pelo serviço independente Fipe API v2 de Deivid Fortuna. A API não é oficial da Fundação FIPE. O acesso sem token tem limite documentado de 500 requisições/dia; não há cadastro, assinatura ou cobrança configurada. O servidor usa destino fixo, valida respostas, limita cache/concor­rência e trata indisponibilidade sem inventar valores. O cache é por instância e não garante quota global. Referências: https://deividfortuna.github.io/fipe/v2/ e https://www.fipe.org.br/pt-br/indices/veiculos/.

### Compartilhar a demonstração

A audiência atual é exclusiva do proprietário. Para abrir a visualização a outras pessoas: primeiro entre em `/admin` com a conta proprietária e ative a administração; depois desabilite `VERTICE_PRIVATE_OWNER_SETUP` na hospedagem e publique essa revisão de ambiente. Só então amplie a audiência para link público ou convites individuais. O painel e as gravações administrativas continuam exigindo a identidade cadastrada. Não compartilhar a audiência enquanto o primeiro cadastro administrativo estiver aberto.

### Minha garagem

A página `/minha-garagem` usa a identidade autenticada do Sites/ChatGPT. O servidor associa favoritos e consultas FIPE reais ao identificador opaco do visitante, sem senhas adicionais. Cada conta só acessa seus próprios registros. O gateway privado usa o token de máquina já configurado; nenhuma credencial Supabase é enviada ao navegador. As duas tabelas têm RLS habilitado e acesso direto do browser revogado.

Favoritos só são confirmados após persistência; a importação da antiga lista local é opcional e exige revisão explícita. O histórico deduplica consultas por veículo/referência e conserva as 50 últimas, com exclusão individual ou completa. Falhas ou limites FIPE não criam registros. Uma consulta válida continua visível se o salvamento falhar, com aviso. A migração aplicada está em `supabase/migrations/20261024192641_vertice_user_garage.sql`.
