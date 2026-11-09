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
