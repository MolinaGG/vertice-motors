# Vértice Motors — especificação do projeto

Data: 24/10/2026. Estado: proposta final para revisão e aprovação; implementação ainda não iniciada.

## Objetivo e decisões do usuário

Criar uma revenda fictícia de carros populares e seminovos variados, em português do Brasil, com experiência premium e cinematográfica. HTML, CSS e JavaScript sustentam a interface e as animações. As três áreas principais são seções da mesma página: Explore os carros, Estoque disponível e Nossa loja. O site deve funcionar com fluidez no computador e celular, incluindo um painel administrativo real, dados persistentes e publicação com link acessível. O código deve estar em um repositório novo e público na conta GitHub MolinaGG.

O usuário escolheu uma aplicação completa com banco de dados e sugeriu Supabase gratuito. Autorizou decisões rotineiras de implementação. O projeto Supabase existente será compartilhado com outros testes e sistemas: preservar seus objetos, suas configurações globais e seus usuários. Não criar um segundo projeto nem ativar serviços pagos sem necessidade e autorização aplicável.

## Abordagens consideradas e escolha

1. Site estático e administração demonstrativa no navegador: simples, mas alterações não são compartilhadas entre dispositivos. Não atende à opção escolhida.
2. Site com servidor, dados persistentes e painel protegido: atende à administração compartilhada. Esta foi a escolha do usuário. Supabase será a base de dados e o armazenamento de fotos; a hospedagem de Sites servirá o site e as rotas de servidor.

Recomendação do implementador: preservar a integração de autenticação da hospedagem, mantendo o painel restrito à identidade autorizada. Supabase será acessado pelo servidor para operações privilegiadas. A interface deve continuar usando HTML semântico, CSS próprio e animações em JavaScript; o adaptador de aplicação necessário ao servidor é um detalhe de implementação, não uma troca da proposta visual.

## Direção visual

Nome proposto: Vértice Motors. Assinatura proposta: “Seu próximo capítulo começa aqui.” Identidade tipográfica simples com símbolo vetorial original, sem reutilizar marcas alheias como identidade da loja.

Paleta: preto/carvão (#090909 e #151515), branco e vermelho (#E3272D). Fotografias automotivas grandes, títulos de impacto, espaços generosos e hierarquia editorial. Evitar estética de neon, painéis decorativos e excesso de cartões repetitivos. Usar modelos populares brasileiros, fotografados de forma premium, sem sugerir uma revenda exclusivamente de luxo.

Abertura com fotografia gerada de seminovo brasileiro, iluminação cinematográfica, texto curto e ações claras: Explorar estoque e Conhecer a Vértice. Navegação fixa discreta, indicador da seção atual e menu acessível no celular. Não bloquear a navegação com introdução animada obrigatória.

## Conteúdo das três seções

### Explore os carros

Abertura cinematográfica; veículos em destaque que levam à ficha do catálogo; seleção por categoria (hatch, sedã, SUV e utilitário compacto, conforme estoque); explicações úteis de câmbio, consumo, tecnologias e o que avaliar na compra de um seminovo; resumo de como funcionam a escolha, a visita e a negociação. São informações editoriais, sem inventar certificações, avaliações de clientes ou resultados comerciais da loja.

### Estoque disponível

Exatamente 12 veículos de demonstração no carregamento inicial. Sugestão de composição do implementador: Chevrolet Onix, Hyundai HB20, Volkswagen Polo, Fiat Argo, Renault Kwid, Fiat Mobi, Chevrolet Prisma, Hyundai HB20S, Nissan Versa, Volkswagen T-Cross, Chevrolet Tracker e Fiat Strada. Versões e anos finais ficam a cargo do implementador, com coerência entre imagem, descrição e especificações. Preços e condições são explicitamente fictícios, sem afirmação de cotação ou disponibilidade real.

Cada veículo terá identificador, marca, modelo, versão, ano de fabricação/modelo, preço, quilometragem, câmbio, combustível, cor, carroceria, motorização, potência quando verificável, portas, lugares, equipamentos, descrição, condição documental ilustrativa, histórico ilustrativo quando aplicável, disponibilidade (disponível, reservado, vendido), selo de destaque e fotos. Dados numéricos de fábrica devem ser verificados ou omitidos; não misturar ano, versão e motor incompatíveis. Não gerar placa identificável, chassi real ou dados de proprietário.

Busca por marca/modelo/versão; filtros combináveis de marca, categoria, preço, ano, quilometragem, câmbio e combustível; ordenação por destaque, preço, ano e quilometragem; contador de resultados; limpar filtros; estado vazio com ação de recuperação. Filtros podem ser refletidos na URL para compartilhamento e devem preservar a navegação do navegador.

Favoritos locais, sem cadastro do visitante. Comparação de até três veículos por preço, ano, km, motorização, câmbio e equipamentos; seleção acessível e remoção fácil. A ficha detalhada abre em diálogo acessível ou área equivalente, com URL compartilhável, galeria navegável por teclado e toque, informações completas, simulador e contato relacionado ao veículo.

O simulador usa amortização Price: valor financiado = preço − entrada; parcela mensal = PV × i / (1 − (1+i)^−n), tratando taxa zero separadamente. Entrada, prazo e taxa são editáveis, com validação e formatação BRL. Exibir valor financiado, parcela, total das parcelas, juros simulados e desembolso com entrada. Não há aprovação de crédito, integração bancária ou promessa de taxa/CET; taxas, encargos e condições definitivas dependem da instituição.

### Nossa loja

História e diferenciais fictícios, atendimento, horários, endereço demonstrativo claramente identificado e orientações para visita. Não atribuir uma revenda real a um imóvel real; o endereço demonstrativo não deve ser tratado como local navegável confirmado. Formulários persistentes para contato e solicitação de test-drive (veículo, nome, e-mail/telefone, data preferida, período e observação). Mostrar confirmação somente após gravação, sem prometer reserva ou envio de e-mail automático. Formulários têm aviso curto para utilizar dados fictícios nesta demonstração, consentimento de contato e link de privacidade do próprio projeto.

WhatsApp: telefone real será configuração opcional, vazia inicialmente. Sem destinatário configurado, o botão abre a composição de mensagem e oferece copiar a mensagem ou registrar solicitação pelo formulário. Não inventar número ativo, abrir conversa com terceiros ou mostrar encaminhamento inexistente. O administrador poderá configurar o destino real depois. Endereço, horários e canais da loja são editáveis no painel.

## Imagens e movimento

Gerar imagens realistas e originais para o destaque, loja e veículos. O catálogo inicial deve ter imagem individual por veículo; a galeria deve oferecer vistas adicionais coerentes, deixando perceptível o caráter ilustrativo. Não repetir uma fotografia genérica como se representasse modelos diferentes. Sem falso giro 360°: não anunciar reconstrução tridimensional fiel. Caso não haja imagens suficientes para um giro coerente, apresentar galeria profissional e explicitar esse limite na entrega.

Animações: revelação suave por rolagem, profundidade sutil na abertura, transições entre imagens e estados do catálogo e feedback nos controles. Priorizar transform e opacity, IntersectionObserver e requestAnimationFrame quando necessário; limitar efeitos no celular, nunca capturar a rolagem ou esconder conteúdo até JavaScript executar. Respeitar prefers-reduced-motion, toque, teclado e conexões lentas. Sem autoplay sonoro.

Imagens responsivas em WebP/AVIF ou formato otimizado equivalente, dimensões explícitas para estabilidade, thumbnails e lazy loading abaixo da dobra. Carregar a imagem principal com prioridade e evitar carregar todas as galerias de uma vez. Fontes devem ter fallback e não bloquear leitura. O projeto não deve depender de vídeo pesado ou WebGL para apresentar o conteúdo principal.

## Administração e segurança

Rota administrativa separada da página pública, com login e verificação de autorização no servidor para cada operação. Estar autenticado não basta: a identidade precisa ser autorizada especificamente para a Vértice. Não conceder administração ao primeiro visitante ou a todos os usuários da organização. Usar a identidade autenticada da hospedagem e uma lista de administradores configurada no ambiente. A identificação inicial do proprietário deve ocorrer na publicação privada, antes de eventual abertura pública; até haver identidade configurada, as operações administrativas falham de forma segura.

Painel: visão geral derivada dos dados reais do projeto, listar/criar/editar/arquivar veículos, alterar disponibilidade e destaque, administrar imagens, editar informações da loja e visualizar/atualizar solicitações de contato e test-drive (nova, em atendimento, concluída, descartada). Arquivar preserva referências de solicitações antigas. Excluir/arquivar e remover imagens exigem confirmação na interface; nunca apagar objetos de outros projetos. Não incluir pagamentos, concessão de crédito, CRM externo ou campanhas automáticas.

Validação no servidor, limites de tamanho e tipo de upload (JPG, PNG e WebP, máximo proposto de 5 MB por arquivo), nomes gerados e escopo de armazenamento próprio. Rejeitar arquivos executáveis e SVG enviados pelo usuário. Formulários públicos precisam de proteção contra abuso, campo-isca e limite por janela; não depender exclusivamente do JavaScript do navegador. Erros devem ser úteis sem expor detalhes internos. Registro de alterações administrativas sem senhas ou tokens.

## Separação dentro do Supabase compartilhado

Conexão confirmada: organização Guilherme Molina Solano (iwyehljstxbcgbrlpmbi), projeto MolinaGG's Project (fseguvhkdewecteuvasd), região us-east-1, plano free. Inspeção em 24/10/2026: esquema public sem tabelas. Os IDs não são credenciais. Nenhuma senha fornecida na conversa deve ser incorporada ao projeto ou ao repositório.

Usar tabelas dedicadas com prefixo vertice_: veículos, fotos, configurações, solicitações e auditoria. Os nomes finais e normalização são decisões do implementador. Preferir concessões explícitas e RLS habilitado: visitantes acessam somente os dados publicados do catálogo; contatos e auditoria jamais são públicos. Configurações visíveis devem ser separadas de dados administrativos. Cada política e migração tem nome identificado como Vértice. As rotas do servidor verificam autorização antes de acessar operações privilegiadas.

Bucket próprio vertice-vehicle-images. Somente imagens aprovadas de veículos publicados podem ser públicas; escritas e remoções são restritas ao administrador do projeto. Não alterar buckets, tabelas, políticas, usuários ou funções existentes de outros sistemas. Não executar reset, recriação global, grants amplos no schema, desabilitar RLS ou mudar a configuração global de Auth da organização.

As credenciais privilegiadas do Supabase, se necessárias ao servidor, serão configuradas exclusivamente no ambiente protegido da hospedagem por mecanismo suportado. A integração atual permite consultas e migrações, mas ainda não confirmou fornecimento de chave secreta ao runtime. Isso é uma dependência de configuração: concluir todo o código, dados e testes independentes primeiro; solicitar entrada segura da chave apenas se o conector não suprir essa etapa. Nunca colocar uma chave secreta em código cliente, manifesto, arquivo de especificação, log, README ou commit. Chaves públicas de cliente exigem políticas corretas; uma senha de banco não substitui uma chave de API.

O isolamento por tabelas/bucket é lógico, não um banco independente: desempenho, limites, região e administração da instância continuam compartilhados. Documentar isso e exportar o esquema/seeds da Vértice para permitir migração futura, sem exportar conteúdo de outros sistemas.

## Publicação e GitHub

Repositório proposto: MolinaGG/vertice-motors, público. Manter README com execução, arquitetura, configuração e limites da demonstração; .env.example apenas com nomes e valores fictícios; migrações e seeds apenas da Vértice; .gitignore adequado; sem dados reais de contatos e credenciais. O conector GitHub disponível ainda não oferece criação de repositórios; confirmar caminho suportado de criação antes da etapa de upload, usando fallback com autorização quando exigido. Não afirmar que o GitHub foi atualizado sem retorno verificável.

Hospedagem inicial em Sites, privada por padrão, com URL acessível ao proprietário no computador e celular. Site privado e repositório público são configurações independentes. O usuário ainda não pediu explicitamente abertura do site a visitantes anônimos; preservar publicação privada. Se pedir abertura pública, ajustar audiência somente depois de concluir autorização administrativa e políticas de acesso.

Código e ativos devem ficar sincronizados com os repositórios de publicação, com versão de deploy ligada ao commit efetivamente enviado. Não usar cron ou tráfego artificial para contornar regras do plano gratuito. Alertar se faltar configuração para tornar alguma função efetivamente operacional; não substituí-la silenciosamente por simulação local.

## Verificação e critérios de aceitação

- Os 12 veículos iniciais e as três seções estão completos; todos os botões têm resultado útil.
- Filtros combinados, favoritos, comparação e galeria funcionam; estado vazio, valores inválidos e voltar/avançar são tratados.
- Simulação confere com exemplos independentes (taxa positiva e zero, entrada parcial e total, limites inválidos).
- Contato/test-drive só confirmam sucesso após persistência; registros ficam visíveis apenas no painel autorizado.
- Visitante anônimo e identidade autenticada não autorizada não conseguem editar estoque, carregar dados de contato ou enviar uploads administrativos.
- Administrador pode criar/editar/arquivar veículo, gerenciar fotos e atualizar solicitação; mudança persiste após reload e entre dispositivos.
- RLS, grants, bucket e advisors são inspecionados; nenhum objeto de outro projeto é modificado.
- Interface navegável por teclado, foco visível, diálogos com foco e fechamento corretos, labels e estados acessíveis; movimento reduzido respeitado.
- QA em dimensões desktop e celular se a infraestrutura de preview estiver disponível. Se não, informar o limite e executar verificações possíveis sem inventar resultados.
- Verificar build, testes pertinentes de lógica/autorização e resultado de publicação. Confirmar estado do GitHub e URL publicada separadamente.

## Decisões delegadas e limites

Ficam a cargo do implementador: tipografia, composição final, versões e preços fictícios dos veículos, textos editoriais, nomes exatos das tabelas, componentes de interface e ferramenta de animação leve. Não há checkout, pagamento, integração bancária, disparo de mensagens ou e-mails, garantia de financiamento, inventário real nem avaliação comercial certificada.

Pendências operacionais resolvíveis durante a execução: configurar identidade administrativa, entregar chave do runtime por mecanismo seguro se necessária e habilitar criação/upload no novo GitHub. Nenhuma dessas pendências autoriza publicar segredos ou substituir acesso protegido por senha no frontend.

## Extensão solicitada pelo usuário durante a implementação

Adicionar animação cinematográfica ligada à barra de rolagem e preparar uso de um clipe do Higgsfield. A cena usa rolagem nativa, enquadramento progressivo, três momentos de texto e suporte a movimento reduzido; o vídeo real depende da conexão da conta Higgsfield e dos créditos necessários. Substituir a faixa estática de nomes por carrossel com logos de Volkswagen, Chevrolet, Fiat, Hyundai, Nissan e Renault, pausa por mouse/foco/controle e atalhos ao estoque da marca.

## Abertura 3D — referência de rolagem

Pedido adicional: aplicar ao início a técnica do vídeo 8wjw5lz-7lM, preservando o carrossel aprovado. O usuário aceita um veículo ilustrativo, sem fidelidade a um modelo do estoque. Decisão de implementação delegada: Three.js carregado sob demanda, carro GLB local com licença e créditos, pintura vermelha, estúdio escuro e câmera/rotação ligados à rolagem nativa. Não há custo de geração de vídeo. A foto atual permanece como alternativa durante carregamento, falha, economia de dados ou preferência por movimento reduzido. Não ampliar a cena para o resto da página. Não apresentar o objeto 3D como vista de um carro anunciado.

Alternativas consideradas: vídeo controlado pela rolagem exige produzir e baixar um clipe; foto com zoom não fornece novos ângulos. A cena 3D permite o movimento pedido e mantém controle sobre tamanho e descarte dos recursos.

### Composição e movimento — refinamento pedido

Reorganizar títulos à esquerda e texto/botão à direita no desktop, com veículo central ocupando a faixa inferior. No celular, título no alto e botão na base. Remover a ficha de oferta da abertura para manter a cena ilustrativa independente de um anúncio. Somar deslocamento lateral e em profundidade à rotação; a rolagem reversa repete a trajetória ao contrário. Linhas projetadas a partir de dois pontos 3D acompanham o veículo até chamadas de qualidade e segurança. Conteúdo das chamadas descreve cuidado e informação; não promete inspeção, certificação ou equipamento de um anúncio. Cards continuam legíveis na alternativa fotográfica; conectores são exibidos apenas após renderização 3D válida.

### Fundo urbano e painéis foscos

Pedido adicional: fundo de cidade com composição transparente do carro, mantendo translação e rotação por rolagem. Fundo original gerado para o projeto; painéis pretos foscos com ~72% de opacidade e desfoque discreto, textos brancos. A cena WebGL usa alpha; não há tela verde visível. Para aparelhos sem WebGL, renderizações transparentes do mesmo carro substituem a antiga fotografia, com deslocamento em CSS, preservando a cidade e as anotações. Essa alternativa não simula novas vistas 3D. Manter preferência por movimento reduzido e economia de dados.

### Anúncios em destaque, separados da abertura

Pedido adicional: seção de destaques imediatamente abaixo da experiência cinematográfica. Exibir até três anúncios disponíveis com flag featured, usando exclusivamente seus próprios nomes, versões, anos, fotos, preços, km e câmbio do catálogo; favoritos e ficha detalhada compartilham estado com o restante do site. A administração existente controla featured. Cards em grade desktop e lista horizontal manual no celular. Carrossel de marcas preservado abaixo da nova seção. A abertura não associa o modelo ilustrativo a um anúncio ou preço; CTA e indicação de rolagem conduzem aos destaques.
