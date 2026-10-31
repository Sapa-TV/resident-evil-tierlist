# Resident Evil — тир-лист

Интерактивный тир-лист персонажей Resident Evil на [Astro](https://astro.build): 74 персонажа, перетаскивание карточек по линиям S–F, банк персонажей, поиск, лайтбокс с портретами 512×512. Состояние сохраняется в localStorage браузера.

Сайт: https://sapa-tv.github.io/resident-evil-tierlist/

## Локальный запуск

```sh
npm install
npm run dev
```

Сборка и предпросмотр прод-версии (с путями как на GitHub Pages):

```sh
npm run build
npm run preview
```

## Деплой

1. Запушить репо в `Sapa-TV/resident-evil-tierlist`, ветка `main`.
2. GitHub → Settings → Pages → Source: **GitHub Actions**.
3. Воркфлоу `.github/workflows/deploy.yml` собирает и публикует сайт на каждый push в `main` (или вручную через Run workflow).

## Структура

- `src/pages/index.astro` — страница.
- `src/scripts/tierlist.js` — вся клиентская логика: drag&drop, localStorage, поиск, лайтбокс.
- `src/styles/tierlist.css` — стили.
- `characters.json` — данные персонажей (`nameRu` — русские имена, `attacks` — приёмы).
- `public/avatars/<id>.png` — портреты 512×512.
- `scripts/add_ru_names.py` — проставляет `nameRu` в `characters.json` (уже выполнен; при добавлении новых персонажей дополнить словарь и запустить снова).
- `scripts/fetch_portraits.py` — качает исходные портреты с residentevil.fandom.com в `raw/` (в git не входит).

## Пути (base)

Репо деплоится как project page, поэтому все пути строятся от base `/resident-evil-tierlist/` (`astro.config.mjs`). Если переименовать репозиторий — поменять `base` (и `site` при смене пользователя).

## Не коммитится (см. `.gitignore`)

`raw/`, `avatars.zip`, `sheet_all.png`, `tierlist.html`, `scripts/build_tierlist.py`, `node_modules/`, `dist/`, `.astro/`.
