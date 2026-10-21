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
