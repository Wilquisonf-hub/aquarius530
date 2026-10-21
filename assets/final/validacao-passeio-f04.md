# Passeio 3D F04

Implementado no visualizador existente, sem trocar o modelo CAD/GLB ou remover paredes para permitir passagem.

## Controles
- “Caminhar em 3D” entra no térreo. WASD ou setas movem; arrastar o modelo controla o olhar.
- Botões na tela permitem movimento por toque, sem exigir teclado ou autorização de pointer lock.
- Escape, “Sair da caminhada”, vista superior ou redefinir perspectiva encerram o passeio. A saída restaura a câmera orbital anterior.
- Os botões de pavimento e “Entrar no ambiente” são transferências explícitas, não trajetos físicos. Rooftop não tem ligação de escada validada e só é acessado por transferência.
- Todas as geometrias/pavimentos ficam visíveis, sem recorte de pisos, durante o passeio. Hipóteses de rooftop continuam sendo hipóteses, mesmo visíveis no passeio.

## Colisão e suporte
A caminhada usa triângulos reais do GLB F04, com passo máximo de 25 cm, descida máxima de 30 cm por subpasso, subpassos horizontais de no máximo 5,5 cm e aproximação radial do corpo (raio 16 cm, altura 1,68 m). O olhar fica 1,60 m acima do apoio. Raios detectam paredes, guarda-corpos, vidros e teto. A água ilustrativa e vegetação esquemática não servem como chão. Sem piso apoiado, a caminhada para; não há voo nem queda livre.

Portas e outras barreiras modeladas não são tornadas invisíveis ou ignoradas. Portas fechadas permanecem bloqueadas. Cada entrada por catálogo procura um ponto apoiado com espaço para o corpo dentro do envelope do ambiente e recusa a transferência se não houver posição segura.

## Testes executados no GLB real
- Subida e descida garagem ↔ térreo, pela escada existente.
- Subida e descida térreo ↔ superior, pela escada existente (início à direita, retorno à esquerda).
- Subida e descida completas do acesso lateral estimado, incluindo degraus inferiores em leque e lance superior, entre o lado da garagem e o deck da piscina.
- Caminhada física desde a circulação até o interior dos Dormitórios 1, 2, 3 e 4, pelos vãos correspondentes no CAD. Não foram usadas transferências nessas provas.
- 39 ambientes/pontos com posição apoiada e livre dentro de seus envelopes. Entradas apenas documentais, sem geometria, não permitem caminhada.
- Bloqueio por fachada em movimento longo; rejeição de chão inexistente.

## Testes de interação
Controlador real com DOM simulado: teclado, proteção a campos de digitação, pausa em aba oculta/perda de foco, cancelamento de toque e captura, arrastar para olhar, Escape, saída/reentrada sem teclas presas e retorno à inatividade.

OrbitControls real com DOM/GPU simulados: câmera não volta após arrastar, zoom ou toque; seleção repetida de pavimento não redefine a posição; saída do passeio restaura a órbita; durante o passeio não há isolamento/recorte de pavimentos. O agendamento de quadros ocorre por alteração ou movimento, não em loop contínuo quando parado.

## Limites
Não houve teste visual em navegador real ou em celular físico nesta execução. Não há alegação de FPS medido ou de acessibilidade/conformidade construtiva. A colisão é uma aproximação de navegação, não um cálculo de segurança. A geometria é o levantamento reconstruído disponível, com hipóteses documentadas; não substitui levantamento fiel em campo. Os testes físicos de portas cobrem os quatro dormitórios principais; não certificam todas as demais portas da casa. Não há escada inventada até o rooftop.

