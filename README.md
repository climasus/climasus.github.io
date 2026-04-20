# climasus.github.io

Portal institucional estático do ecossistema ClimaSUS.

## Arquitetura

Este repositório contém apenas:
- `index.html` — página principal do portal
- `assets/css/main.css` — estilos (Neo-Brutalism Soft, dark/light theme)
- `assets/js/main.js` — orquestrador (carrega equipe + pacotes do design-system)
- `assets/js/i18n.js` — motor de i18n (PT/EN/ES via JSON)
- `assets/js/theme.js` — motor de tema (dark/light, localStorage)
- `.github/workflows/deploy.yml` — deploy automático

## i18n

Os arquivos de tradução **não são versionados aqui**. Eles vivem em:
- `https://climasus.github.io/design-system/data/i18n/pt.json`
- `https://climasus.github.io/design-system/data/i18n/en.json`
- `https://climasus.github.io/design-system/data/i18n/es.json`

No build de CI, são copiados para `assets/i18n/` antes do deploy.

## Dados dinâmicos

- **Equipe**: `https://climasus.github.io/design-system/data/team/members.json`
- **Repositórios**: `https://climasus.github.io/design-system/data/project/repositories.json`

O JS carrega esses arquivos em runtime e renderiza os cards correspondentes.

## Como atualizar conteúdo

| O que mudar | Onde editar |
|---|---|
| Textos do portal (PT/EN/ES) | `design-system/data/i18n/` |
| Membros da equipe | `design-system/data/team/members.json` |
| Pacotes listados | `design-system/data/project/repositories.json` |
| Estrutura/layout | `index.html` |
| Estilos | `assets/css/main.css` |

## Deploy

Push para `main` → GitHub Actions executa `.github/workflows/deploy.yml` → site publicado.
