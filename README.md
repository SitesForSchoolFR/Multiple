# múltiplo

um lugar só para **jogos, links, navegação e estudo** — estático, preto e branco,
customizável, sem conta e sem rastreamento. Feito para rodar no GitHub Pages.

**URL pública única:** `https://SitesForSchoolFR.github.io/Multiple/`. A navegação interna preserva exatamente essa URL na barra do navegador; a tela atual e seus filtros são mantidos como rota interna da aba.

## Páginas

| página | o que tem |
| --- | --- |
| `index.html` | vitrine, números, sorteio de jogo e atalhos |
| `jogos.html` | catálogo de **3.500** jogos (GN-Math, DuckMath, BlogPaste, Drive U-7, BikeSense, P2P, Mantle) + **26** que rodam no próprio site |
| `jogar.html` | player — abre jogos locais ou externos, com troca de espelho e aviso honesto quando o site recusa iframe |
| `links.html` | coleção de **2.000+** links: jogos, estudos, filmes, unblockers e espelhos |
| `navegar.html` | atalho para o proxy + lista de espelhos |
| `proxy/` | proxy real: Scramjet v2 + Ultraviolet com BareMux (escopo próprio do service worker) |
| `estudar.html` | 267 perguntas com explicação, cronômetro de foco, notas e progresso (local) |
| `creditos.html` | fontes, autores e licenças de tudo |

## Estrutura

```
assets/css/site.css      design system (preto e branco, temas, cursor, transições)
assets/js/router.js      navegação interna mantendo a URL pública fixa em /Multiple/
assets/js/core.js        configs, cursor com bolinha+anel de atraso, paleta (ctrl+k), segredos
assets/js/data.js        catálogos, expansão de espelhos, thumbnails
assets/js/jogos.js       busca/filtros/favoritos do catálogo
assets/js/jogar.js       player
assets/js/links.js       coleção de links
assets/js/estudar.js     quiz/notas/foco
assets/js/pages.js       início, navegar, créditos
assets/js/navegar.js     não existe: navegar usa pages.js
data/games.json          catálogo gerado
data/links.json          coleção gerada
data/questions.js        banco de perguntas gerado
data/thumbs.json         manifesto de thumbnails locais
play/games/              jogos que rodam no domínio do site
proxy/                   scramjet, uv, baremux, transports, config, backend opcional
tools/                   scripts de manutenção (não rodam no navegador)
```

## Regerar os dados

Os catálogos vêm de repositórios públicos. Para reconstruí-los:

```bash
# --src precisa ter: estudoescolar/ Nebula/ Links/ LuminSDK/ (clones)
node tools/build-data.mjs --src ../repos
node tools/merge-extra-links.mjs     # colagem da comunidade (tools/sources/links-extra.txt)
node tools/add-nebula-web.mjs        # jogos só do projeto original
node tools/build-thumbs.mjs          # thumbnails (precisa de ImageMagick)
node tools/build-pages.mjs           # HTML a partir dos dados
```

## Atalhos e customização

- `ctrl` + `k` ou `/` — paleta de comandos (busca jogos e navegação)
- `g` `j` jogos · `g` `l` links · `g` `e` estudar · `g` `n` navegar · `g` `c` créditos
- `,` ajustes: tema (tinta/papel/contraste), acento, cursor, atraso do anel, grade, forma, som, movimento
- `shift` + `a` + `y` alterna o disfarce de aba (como no *links for me*)
- `` ` `` leva rápido para o Google Sala de Aula (tecla de pânico)
- konami code liga o modo contraste
- na paleta, digite `obrigado, ryan` ☕

## Créditos

Ver `creditos.html`. Resumo: Links (SitesForSchoolFR), estudo escolar, Nebula
(Onex558 / UGS), LuminSDK (Ryan Smith, MIT), Mantle (dobberr), além de
GN-Math, DuckMath, BlogPaste, Drive U-7, BikeSense e a colagem da comunidade.
Scramjet e Ultraviolet são da Mercury Workshop / Titanium Network.

Este site não hospeda os jogos de terceiros: ele aponta para os projetos
originais. As marcas pertencem aos seus donos.
