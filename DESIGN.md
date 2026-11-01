---
name: Resident Evil Tierlist — Досье R.P.D.
description: Тир-лист как следственное табло отдела полиции Раккун-Сити: стальные лотки, грифы-штемпели, манильский банк улик.
colors:
  desk: "#15171c"
  steel: "#1d2027"
  inset: "#101216"
  slide: "#181c23"
  slide-line: "#333947"
  hairline: "#2a2e37"
  paper: "#d8c9a3"
  paper-hi: "#e3d6b4"
  paper-dim: "#b3a684"
  ink: "#1a1712"
  stamp: "#b5342c"
  stamp-hi: "#d0453a"
  text: "#e4e1d8"
  dim: "#98a0ab"
  tier-s: "#c2453a"
  tier-a: "#c07b2f"
  tier-b: "#b9a72e"
  tier-c: "#5d8f45"
  tier-d: "#3f7d9e"
  tier-f: "#7a6fae"
typography:
  display:
    fontFamily: "Oswald, Arial Narrow, sans-serif"
    fontSize: "24px"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "0.08em"
  label:
    fontFamily: "Oswald, Arial Narrow, sans-serif"
    fontSize: "36px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0em"
  body:
    fontFamily: "IBM Plex Mono, Consolas, monospace"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "0em"
  machine:
    fontFamily: "IBM Plex Mono, Consolas, monospace"
    fontSize: "10px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.18em"
rounded:
  none: "2px"
  sm: "3px"
  md: "4px"
  tab: "7px 7px 0 0"
spacing:
  xs: "6px"
  sm: "9px"
  md: "14px"
  lg: "16px"
  xl: "22px"
components:
  nav-tab:
    backgroundColor: "{colors.steel}"
    textColor: "{colors.dim}"
    rounded: "{rounded.tab}"
    padding: "8px 18px 7px"
  nav-tab-active:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.tab}"
    padding: "8px 18px 7px"
  button:
    backgroundColor: "{colors.steel}"
    textColor: "{colors.text}"
    rounded: "{rounded.sm}"
    padding: "8px 15px"
  input:
    backgroundColor: "{colors.inset}"
    textColor: "{colors.text}"
    rounded: "{rounded.sm}"
    padding: "8px 12px"
  card:
    backgroundColor: "{colors.slide}"
    textColor: "{colors.text}"
    rounded: "{rounded.none}"
    padding: "3px 2px 2px"
  tier-row:
    backgroundColor: "{colors.steel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0px"
---

# DESIGN.md — Досье R.P.D.

## Overview

**Creative North Star: «Досье R.P.D.»** — тир-лист как доска classified-досье отдела полиции Раккун-Сити. Стальной стол с утопленными лотками-грифами; персонажи — улики-слайды; банк — манильский лоток «Неразобранные улики»; машинопись для служебных подписей; красный штамп как единственный акцент.

**Key Characteristics:**
- Тёмный стальной ground всегда; единственная светлая поверхность — манильская бумага (банк, лайтбокс-досье).
- Типографика двух голосов: Oswald-капс (заголовки, грифы, навигация) и IBM Plex Mono (машинный текст, данные).
- Мир даёт только типографику, палитру, плотность и штампы — контролы остаются стандартными веб-компонентами.
- Десктоп-онли: страница рендерится в браузер-окно, снимаемое в стрим; мобильные вьюпорты не поддерживаются.

**The Stamp Rule.** Состояния выражаются штампами, а не подсветкой: пустой лоток несёт блеклое клеймо «Лоток пуст», dragover — красный штамп «Пометить», размещение карточки — анимация прижатия штампа.

## Colors

- Ground: `desk` — стальной стол, едва заметный световой конус сверху; в лотках уходит в `inset`.
- Светлое пятно: `paper`/`paper-hi` — только банк улик и лайтбокс-досье; текст на бумаге — `ink`, приглушённый — `#5c5140`.
- Акцент: `stamp`/`stamp-hi` — красные чернила штампа; reserved для активных состояний, клейма КЛАССИФИЦИРОВАНО и фокуса.
- Грифы S–F: приглушённые штемпельные чернила (`tier-s`…`tier-f`), текст на них — тёплый чёрный `#14100c`.
- Вторичный текст: `dim` только на тёмных поверхностях; на бумаге — тёплые коричневые из чернил, никогда серый.

## Typography

- Display: Oswald 600/700, caps, tracking +0.05…0.12em — заголовок дела, грифы, навигация-вкладки, имя в досье.
- Machine: IBM Plex Mono 400/500/600 — служебные подписи, счётчики, карточные имена (10px), примечания, лайтбокс.
- Пропорции: display 24px в шапке / 36px в плашках грифов; body 13px; машинный label 8–11px с tracking ≥0.18em.
- Шрифты самолокализованы в `public/fonts/` (cyrillic + latin, woff2), без внешних хостингов.

## Layout

- Сетка `#cols`: `minmax(0, 3fr)` лотки + `minmax(0, 2fr)` банк, gap 16px; десктоп-онли, без брейкпоинтов.
- Ряд-лоток: гребёнка 10px → плашка грифа 84px → утопленная зона с внутренним скроллом → колонка стрелок 24px; высота из `--row-h` (карточка 83px + имя 24px + воздух).
- Банк: шапка на чернильном `ink`, тело — манильская бумага; карточки в два-три столбца с переносом.
- Ритм: 6px внутри лотков, 9px между лотками, 14–16px между блоками; воздуха над заголовком больше, чем под ним.

## Elevation & Depth

- Тени мягкие с офсетом: лотки `0 2px 6px rgba(0,0,0,.25)`, банк и лайтбокс до `0 4px 26px rgba(0,0,0,.5)`.
- Утопления — материал, не декор: зоны дропа `inset 0 3px 9px rgba(0,0,0,.5)`, плашки грифов с внутренним скосом.
- Никаких нулевых цветных ореолов и жёстких офсетных блоков.

## Shapes

- Радиусы 2–4px: слайды-улики почти прямые, лотки и банк 4px, инпуты и кнопки 3px.
- Вкладки навигации — папочные `7px 7px 0 0` без нижней границы, сидят на базовой линии шапки.
- Штампы: прямоугольник 2px-границы с поворотом −4…−7°; круглые кнопки только для иконок лайтбокса.

## Components

- **Nav-вкладки**: сталь → манила у активной; hover — осветление текста, без рамочных изменений.
- **Кнопка**: сталь с hairline; hover — красная граница; active — сдвиг 1px вниз.
- **Инпут поиска**: тёмный inset, красная граница при фокусе, caret красный.
- **Карточка-улика**: тёмный слайд, фото с белой внутренней рамкой (outline −4px), имя 10px в две строки; hover — подъём 2px и красная граница.
- **Лоток-гриф**: плашка-чернила с буквой Oswald 700 и подписью ГРИФ; зона дропа пустая несёт клеймо, при dragover — красный штамп «Пометить».
- **Банк**: чернильная шапка с счётчиком в mono; карточки на бумаге получают светло-манильную подложку.
- **Лайтбокс-досье**: манильская карта, имя Oswald-капс, чипы — контурные штампы 1.5px, списки с красными маркерами, фото в рамке с тенью; позиция «n / m» в тёмном чипе на фото.

## Do's and Don'ts

- Don't: серый вторичный текст на манильской бумаге — только тёплые коричневые из чернил.
- Don't: добавлять мобильные брейкпоинты — поверхность десктоп-онли по решению продукта.
- Don't: заменять штампы-состояния на цветные подсветки или свечения.
- Don't: подключать шрифты с внешних хостингов — только самолокализованные woff2.
- Do: новые состояния выражать клеймом (граница + поворот + caps-tracking), контраст текста держать ≥4.5:1.
