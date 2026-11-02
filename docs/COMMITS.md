# Histórico Git e publicação

Repositório: <https://github.com/wesleymiguelweb/AppExchange> (remoto `origin`
já configurado, branch `main`).

## 1. Histórico criado

O projeto começou como um dashboard inicial (commit `cd5784b`) e foi
reconstruído sobre ele com commits pequenos e convencionais, agrupados por
responsabilidade:

| Commit | Tipo | O que entra |
| --- | --- | --- |
| `f0227f6` | `chore` | Base Vite + React: `package.json`, `vite.config.js`, `index.html`, `main.jsx` |
| `f8c12d2` | `style` | Tokens HERMES (`tokens.css`), estilos globais e `App.module.css` |
| `29406df` | `feat` | Camada de serviços: `fetch` com timeout/erro normalizado e contrato da Frankfurter |
| `c822bfa` | `feat` | Hooks de moedas, taxas, histórico, debounce, toast e largura do gráfico |
| `cde2a1e` | `feat` | i18n PT/EN/ES, formatação `Intl`, validação, série, CSV e períodos |
| `2ea2625` | `feat` | Componentes reutilizáveis de UI, cabeçalho e error boundary |
| `8b74b05` | `feat` | Cartão do conversor com validação, troca e estados |
| `5302a01` | `feat` | Gráfico histórico em SVG com tooltip, teclado e resumo |
| `c85172c` | `feat` | Tabela de cotações com busca, ordenação e exportação |
| `a338c21` | `feat` | Composição da página única e estado compartilhado (`App.jsx`) |
| `b1f646a` | `docs` | README, checklist, evidências, protótipo, QA e coleção Postman |
| `b60da17` | `docs` | Correção da captura do gráfico com o tooltip ativo |

Para conferir:

```bash
git log --oneline --decorate
git show --stat 5302a01        # exemplo de commit do gráfico
```

> Os commits foram organizados por assunto de entrega. O estado final
> (`b60da17`) é o que passou no build e no roteiro de QA; commits intermediários
> não têm a intenção de formar uma aplicação executável isolada.

## 2. Publicar / atualizar

O `origin` já aponta para o repositório público:

```bash
git remote -v
# origin  https://github.com/wesleymiguelweb/AppExchange.git (fetch)
# origin  https://github.com/wesleymiguelweb/AppExchange.git (push)
```

Envie a branch principal:

```bash
git push origin main
```

Se estiver criando um repositório novo do zero:

```bash
git init
git add .
git commit -m "chore: configurar base do projeto com Vite e React"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/SEU_REPO.git
git push -u origin main
```

## 3. Fluxo com branches

```bash
git checkout -b feat/exportacao-xlsx
# ... alterações ...
git add .
git commit -m "feat: exportar cotações em XLSX"
git push -u origin feat/exportacao-xlsx
# abra o Pull Request no GitHub
```

Depois do merge:

```bash
git checkout main
git pull origin main
git branch -d feat/exportacao-xlsx
```

## 4. Convenções usadas

| Prefixo | Uso |
| --- | --- |
| `feat` | Nova funcionalidade visível ao usuário |
| `fix` | Correção de comportamento ou acessibilidade |
| `style` | Tokens, espaçamento, tipografia — sem mudar lógica |
| `refactor` | Reorganização sem alterar comportamento |
| `docs` | README, checklist, evidências, Postman |
| `chore` | Build, dependências, configuração |
| `test` | Testes automatizados (não incluídos no escopo) |

Mensagens no imperativo, em português, com escopo claro e no máximo ~72
caracteres na primeira linha.

## 5. O que não vai para o repositório

`.gitignore` cobre `node_modules/`, `dist/`, `coverage/`, `.env*` (exceto
`.env.example`), logs e arquivos de editor/SO. As imagens `UI.JPEG` e
`Wire.JPEG` permanecem versionadas por serem referência do enunciado.
