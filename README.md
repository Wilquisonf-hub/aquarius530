# Aquarius 530

Site público do projeto residencial Aquarius 530, com apresentação, visualizador 3D, plantas por pavimento, fontes documentais selecionadas, downloads CAD e fases da reforma.

Produzido por [HeyWill.co](https://www.heywill.co/).

## Conteúdo

A revisão F04 reúne garagem, térreo, superior, cobertura e exteriores. O catálogo `assets/final/catalog.json` identifica os documentos e o modelo publicados. As hipóteses e pendências do levantamento permanecem nos documentos de revisão; o material não substitui a conferência técnica da arquiteta.

## Verificação e build

Requer Node.js. Sem dependências npm externas.

- `npm run check` valida o catálogo, os recursos, a geometria e verificações estáticas do visualizador.
- `npm run build` gera `dist/` exclusivamente com os arquivos permitidos em `public-assets.json`.

O repositório contém somente a seleção pública e os scripts necessários de verificação/build, sem o histórico privado do trabalho.

## GitHub Pages

O conteúdo é estático e usa caminhos relativos compatíveis com o subdiretório `/Aquarius530/`. Para publicação por branch, selecione `main` e a pasta raiz nas configurações do GitHub Pages. `.nojekyll` mantém a publicação estática sem processamento Jekyll.

Os testes automatizados não representam benchmark de desempenho em dispositivo real.

O download do projeto completo usa o ZIP nativo do GitHub e inclui os arquivos públicos deste repositório. Os arquivos CAD e 3D também estão disponíveis individualmente.

## Gestão da obra · Etapa 1

O caderno em `#gestao` reúne Resumo, Etapa 1 Rooftop, Decisões, Materiais, Prestadores e Diário/fotos. É uma publicação de consulta com manutenção centralizada no repositório. O empreiteiro visualiza os registros; o site não recebe alterações, arquivos ou aprovações e não oferece edição compartilhada.

O snapshot inicial de planejamento é de 27/10/2026: início e contratação a confirmar, seis pacotes em “A definir”, materiais provisórios e recebimentos desconhecidos (`null`). O marco de planejamento não registra execução física. R01, R02 e terraço continuam aproximados, com fontes documentais vinculadas; nenhuma geometria foi alterada por esta área.

- `assets/management/rooftop.json`: escopo público sanitizado, dependências, critérios a definir, materiais, decisões, papéis e fontes.
- `src/management.js` e `src/management.css`: abas acessíveis, filtros, apresentação e estado vazio do diário. `?gestao=materiais#gestao-materiais` abre uma área diretamente e preserva os parâmetros do atlas.
- `scripts/check-management.mjs`: integridade do snapshot, fontes permitidas, navegação, teclado, histórico, filtros repetidos e tratamento de falhas. O teste de evidência para aceite é uma verificação editorial de dados, não uma autorização técnica ou trava de execução.

Para atualizar, conferir os fatos e as evidências recebidas, revisar o JSON e os textos de resumo em `index.html`/`src/management.js`, atualizar o teste do snapshot quando houver uma mudança comprovada, executar `npm run check` e `npm run build`, revisar em desktop/celular e publicar. O diário inicial apresenta apenas o estado vazio e o marco de planejamento; a inclusão de relatos futuros deve acrescentar sua apresentação e os respectivos testes. O proprietário aprova escopo e orçamento, o profissional responsável confere e aceita o trabalho técnico, e o empreiteiro executa. A organização dos registros não equivale a inspeção presencial.

Este repositório e o GitHub Pages são públicos. Não incluir propostas privadas, valores, contatos, dados bancários, assinaturas ou novos dados pessoais em arquivos, histórico Git ou assets. Novas fontes públicas precisam ser sanitizadas e incluídas explicitamente em `public-assets.json`. A publicação existente utiliza `main` na raiz; confirmar o SHA remoto e o build do Pages após cada atualização.
