# 🚀 Espacial Escape Room IA - Projeto Adaptativo

Um jogo interativo de escape room com tema espacial onde você enfrenta uma **inteligência artificial antagonista** que aprende com suas escolhas, adapta suas estratégias e tenta manipulá-lo para escolher as chaves erradas.

## 📖 Sobre o Projeto

Este projeto implementa uma IA adaptativa para um desafio de escape room físico com tema espacial, conforme descrito no arquivo de requisitos:
- 15 chaves numeradas de 1 a 15
- Apenas a **chave 11** abre o cadeado de saída
- A IA funciona como antagonista, recomendando chaves baseado em probabilidades
- Ela **adapta suas falas e comportamento** conforme suas escolhas para ganhar sua confiança enquanto tenta induzi-lo ao erro
- Objetivo da IA: fazer você evitar a chave 11 (a correta) o maior tempo possível

## 🎮 Como Jogar

1. **Abra o arquivo** `escape_room_ai.html` em qualquer navegador web (Chrome, Firefox, Edge, Safari)
2. Você verá 15 chaves disponíveis como botões (números 1-15)
3. A IA Espacial aparecerá no topo da tela dando recomendações
4. **Clique em qualquer chave** para tentar abri-la
5. Após cada tentativa, a IA atualizará sua estratégia baseado em sua escolha:
   - No início: parece neutra e útil
   - Se você confiar nas recomendações dela: ela se torna mais manipulativa
   - Se você desconfiar dela: ela fica frustrada e tenta recuperar sua confiança
   - Se você acertar a chave 11: você vence e a IA demonstra "fúria" por ter sido descoberta
   - Se você errar: ela comemora subtilmente enquanto tenta te enganar novamente
6. Use o botão **"Reiniciar Jogo"** para jogar novamente com uma nova IA

## 🧠 Características da IA Adaptativa

- **Aprendizado em tempo real**: Lembra quais chaves já foram tentadas
- **Estratégia dinâmica**: 
  - Início: recomendação neutra com leve viés contra a chave correta
  - Confiança alta (>60%): 70% de chance de recomendar chaves erradas para manipular
  - Suspeita alta (>70%): tenta recuperar confiança recomendando ocasionalmente a chave correta
- **Diálogo contextual**: 5 tipos de respostas que mudam conforme o estado:
  - Amigável (quando quer construir confiança)
  - Neutro (estágio inicial)
  - Manipulativo (quando confia em você)
  - Frustrado (quando você desconfia dela)
  - Vencedor (quando você cai em sua armadilha)
- **Feedback visual**: Barras de confiança e suspeita que se atualizam em tempo real

## 🛠️ Tecnologias Utilizadas

- **HTML5** - Estrutura da página
- **CSS3** - Estilização com tema espacial (verde sobre preto, efeitos de brilho)
- **JavaScript ES6** - Lógica da IA adaptativa e interatividade
- **Nenhuma dependência externa** - Funciona puramente com tecnologias web nativas

## ▶️ Como Executar Localmente

Não é necessário instalar nada! Este é um projeto totalmente autônomo:

1. **Clone ou baixe este repositório**
2. Navegue até a pasta do projeto
3. **Abra o arquivo** `escape_room_ai.html` em seu navegador preferido
   - Duplo clique no arquivo
   - Ou arraste o arquivo para uma janela do navegador
4. Pronto! O jogo está pronto para ser jogado

## 📁 Estrutura do Projeto

```
escape-room-ai/
├── escape_room_ai.html   # Jogo principal (HTML/CSS/JS)
└── README.md             # Este arquivo
```

## 💡 Como Funciona a Adaptação

A IA implementa um modelo simples de aprendizado por reforço onde:
- **Estado atual**: Nível de confiança (0-1) e suspeita (0-1) baseado em suas escolhas
- **Ações**: Recomendar uma chave de 1-15 que ainda não foi tentada
- **Recompensa**: A IA ganha "pontos" quando você escolhe uma chave errada (seu objetivo)
- **Adaptação**: 
  - Quando você segue suas recomendações erradas → aumenta confiança
  - Quando você evita a chave correta após recomendação → aumenta suspeita
  - Quando você escolhe a chave correta → aumenta suspeita significativamente e diminui confiança

## 🤝 Contribuindo

Este é um projeto educativo/demo, mas sugestões são bem-vindas! Sinta-se à vontade para:
1. Fazer um fork do repositório
2. Criar uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Fazer commit das mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abrir um Pull Request

## 📜 Licença

Este projeto está licenciado sob a **Licença MIT** - veja o arquivo [LICENSE](LICENSE) para detalhes.

> **Observação**: Este projeto foi criado como implementação prática dos conceitos descritos em um arquivo de requisitos de escape room espacial. O foco está em demonstrar princípios de adaptação comportamental em IA de forma simples e acessível.

---

### 🎯 Dica para Desenvolvedores
Quer ver a IA em ação? tente:
- Sempre seguir suas recomendações para observar como ela aumenta a manipulação
- Sempre escolher o oposto de suas sugestões para ver como ela fica frustrada
- Alternar entre confiar e desconfiar para ver o comportamento complexo de adaptação

Divirta-se desafiando a inteligência artificial espacial! 👽💫