# MS-D1 — 15 Chaves, 1 Cadeado

Versão 2 — três confirmações incorretas no máximo.

Jogo feito em HTML, CSS e JavaScript puro, com interface terminal verde e adaptação para celulares e tablets. Inclui suporte PWA para instalação na tela inicial e cache para uso offline após a primeira visita por HTTPS.

## Regras

- Existem no máximo **3 confirmações incorretas de “Sim, abriu”**.
- Confirmar “Sim” na Chave 11 conclui o desafio; confirmar “Sim” em outra chave conta como erro.
- Ao chegar a três confirmações incorretas, a partida atual fica bloqueada, sem botão para reiniciar na própria tela.
- **Atualizar a página volta ao menu “COMEÇAR DESAFIO” e zera as tentativas**, começando uma nova sessão para a próxima pessoa. O progresso não é salvo entre carregamentos.
- Atenção: atualizar durante a partida também inicia uma nova sessão e devolve as três confirmações, conforme necessário para uso compartilhado do dispositivo.
- “Não, tente outra” atualiza as estimativas. “Pular recomendação” troca a chave sem alterar a estimativa ou consumir uma confirmação.
- A Chave 11 tem o mesmo ícone e a mesma aparência das outras chaves.

## Testar no computador

1. Extraia os arquivos.
2. Abra a pasta no VS Code e abra **Terminal → Novo Terminal**.
3. Confirme que está na pasta certa: `Test-Path .\index.html` deve retornar `True` no PowerShell.
4. Execute `py -m http.server 8000`.
5. Acesse `http://localhost:8000`.

## Publicar no GitHub Pages

1. Crie um repositório no GitHub, por exemplo `ms-d1-desafio-chaves`.
2. Envie **o conteúdo desta pasta** para a raiz do repositório (o arquivo `index.html` deve ficar na raiz, não dentro de uma pasta adicional).
3. No repositório, abra **Settings → Pages**.
4. Em **Build and deployment**, selecione **Deploy from a branch**, escolha a branch `main` e a pasta `/(root)`, e salve.
5. Aguarde a publicação do GitHub Pages e abra o endereço apresentado nessa mesma página.
6. No celular/tablet, abra o link pelo navegador e escolha **Adicionar à tela inicial** ou **Instalar app**. Abra o app uma vez conectado à internet para instalar o cache offline.

## Uso no celular/tablet sem depender do PC

Depois de publicado e carregado uma primeira vez via HTTPS, o service worker armazena os arquivos necessários para abrir o jogo sem o PC e, normalmente, sem internet. Para receber futuras atualizações, abra o app conectado à internet de vez em quando.

## Sessões para várias pessoas

O jogo não grava o progresso em armazenamento local. Ao atualizar ou recarregar a página, ele volta ao menu e as três confirmações são restauradas para uma nova pessoa. Isso também significa que a pessoa atual pode reiniciar a partida atualizando a página.

## Arquivos principais

- `index.html` — interface e telas.
- `style.css` — aparência e responsividade.
- `src/main.js` — regras, probabilidades e bloqueio.
- `assets/icons/` — ícones da chave e do app.
- `manifest.webmanifest` — configuração de instalação PWA.
- `sw.js` — cache offline.
