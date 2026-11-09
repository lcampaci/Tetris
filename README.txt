TETRIS 3.1 - PWA RETRÔ

Conteúdo:
- index.html: estrutura do jogo
- style.css: visual inspirado no Windows 3.1 e layout responsivo
- game.js: lógica do Tetris, cronômetro e recordes
- manifest.json / sw.js: instalação PWA e funcionamento offline
- icon-192.png / icon-512.png: ícones do aplicativo

COMO TESTAR:
1. Extraia a pasta.
2. Para testar localmente, abra um terminal nesta pasta e execute:
   py -m http.server 8000
3. Acesse http://localhost:8000

INSTALAÇÃO:
- Hospede a pasta em um endereço HTTPS (GitHub Pages, por exemplo).
- No Chrome/Edge, abra o endereço e escolha Instalar aplicativo.
- No Android, abra no Chrome e use "Instalar app" ou "Adicionar à tela inicial".

RECORDES:
Os 10 melhores resultados ficam no localStorage do navegador/dispositivo.
Não há servidor ou sincronização entre aparelhos nesta versão.

SONS RETRÔ:
Os bipes são sintetizados com Web Audio API (sem arquivos externos):
movimento, rotação, queda, encaixe, linha eliminada, início, pausa e fim de jogo.
Use o botão 'Som: ligado/desligado' para controlar os efeitos.

MÚSICA E CONTROLES DE ÁUDIO:
- Trilha original chiptune de 8 bits sintetizada pelo navegador.
- Botão 'Música: ligada/desligada' controla a trilha de fundo.
- Botão 'Efeitos: ligados/desligados' controla os bipes e efeitos do jogo.
- O navegador só libera áudio após uma interação do usuário.

MELHORIAS DA VERSÃO v4:
- O nome do jogador só é solicitado ao terminar a partida.
- O Ranking fica na coluna direita em telas maiores e passa para baixo no celular.
- O menu Jogo não reinicia mais a partida; use o botão Reiniciar para isso.
- É possível fechar a solicitação de nome sem salvar o resultado.

MELHORIAS DA VERSÃO v5:
- Menu no estilo Windows 3.1: "Jogo" foi removido; agora há "Ajuda" (lista suspensa: Como jogar, Teclas, Pontuação, Sobre) e, ao lado, "Sobre".
- Atalhos: F1 abre a ajuda; Alt+A abre o menu Ajuda; Alt+S abre o Sobre. Abrir uma janela durante a partida pausa o jogo.
- "Sobre" abre uma janela modal com informações do primeiro Tetris (criador, data, país, local, computador etc.).
- Ranking agora mostra Jogador, Pontos, Tempo (mm:ss.mmm, até o milissegundo) e Data/hora da partida.
- Recordes antigos (tempo em segundos) são convertidos automaticamente.
- Correção: as teclas P e Espaço não podem mais travar a digitação do nome no Ranking.
