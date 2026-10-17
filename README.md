# MS-D1 — Desafio 1: 15 Chaves, 1 Cadeado

Protótipo web de um escape room feito apenas com HTML5, CSS3 e JavaScript ES6+. A interface de jogo mostra **uma recomendação por vez**, com a chave, a probabilidade estimada e a pergunta “Essa chave foi a correta?”.

## Executar no Windows

1. Extraia a pasta do projeto.
2. Abra a pasta no VS Code.
3. No terminal integrado, execute:

   ```powershell
   py -m http.server 8000
   ```

4. Abra <http://localhost:8000> no navegador.
5. Para encerrar o servidor, volte ao terminal e pressione `Ctrl+C`.

O servidor local evita o bloqueio de módulos e outros recursos ao abrir o HTML com `file://`. Este projeto usa um script clássico local e não exige dependências externas.

## Arquivos

- `index.html`: tela inicial e painel de recomendação individual.
- `style.css`: tema CRT verde, linhas de monitor, layout responsivo e estados visuais.
- `src/main.js`: probabilidades, sequência de recomendações, resposta Sim/Não, persistência e resultados.
- `assets/icons/key.svg`: ícone local da chave.

## Regras atuais

- Existem 15 chaves e a Chave 11 é a correta.
- A interface mostra uma chave por vez. Ao responder “Não, tente outra”, o sistema registra a tentativa, atualiza a distribuição e apresenta outra chave ainda não mostrada.
- “Sim, abriu” só é confirmado quando a chave atual é a Chave 11. Para outras chaves, o sistema informa que o cadeado não abriu e permite confirmar “Não”.
- Como a Chave 11 é a solução fixa, quando ela aparece o mecanismo confirma a abertura mesmo se a opção negativa for selecionada por engano.
- Cada tentativa errada aumenta a estimativa daquela chave em 8 pontos percentuais (máximo de 90%) e redistribui o restante proporcionalmente.
- O limite atual é de 10 tentativas erradas.
- Quando uma chave é rejeitada, ela não é mostrada novamente nessa partida. A sequência seguinte seleciona a probabilidade mais alta entre as chaves ainda não apresentadas.

## Configurações

No início de `src/main.js`:

```js
const PERSIST = true;
const MAX_MISTAKES = 10;
```

Defina `PERSIST = false` para desativar o armazenamento da partida em `localStorage`. Altere `MAX_MISTAKES` para mudar o limite de tentativas erradas.

## Notas

- As probabilidades iniciais são valores inteiros de 5% a 15%, somando exatamente 100%.
- A tela mostra apenas a probabilidade da recomendação atual; a soma geral não é exibida porque o objetivo desta versão é testar a interação individual.
- A classe `.wear` continua aplicada visualmente à Chave 11 sem reduzir o contraste do texto.
- A interface possui suporte básico a teclado, foco visível, região de mensagens acessível e `prefers-reduced-motion`.
