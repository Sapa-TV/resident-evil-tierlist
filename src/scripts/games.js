import { initTierList } from "./core.js";
import GAMES_RAW from "../../games.json";
import CHARS_RAW from "../../characters.json";

const BASE = import.meta.env.BASE_URL;
const COVER = (BASE.endsWith("/") ? BASE : BASE + "/") + "games/";

const GAMES = GAMES_RAW.games.map(g => ({
  id: g.id,
  code: g.code,
  name: g.name,
  short: g.short,
  year: g.year,
  platforms: g.platforms,
  description: g.description,
}));

const CHARS_BY_GAME = {};
for (const c of CHARS_RAW.characters) {
  for (const code of c.games) {
    (CHARS_BY_GAME[code] ||= []).push(c.nameRu || c.name);
  }
}

initTierList({
  items: GAMES,
  lsPrefix: "re-games",
  resetMessage: "Убрать все игры из линий обратно в банк?",
  card: g => ({
    img: COVER + g.id + ".jpg",
    alt: g.name,
    caption: g.short + " · " + g.year,
    title: g.name + " [" + g.code + ", " + g.year + "]\n" + g.platforms,
  }),
  matches: (g, q) =>
    g.name.toLowerCase().includes(q)
    || g.short.toLowerCase().includes(q)
    || g.code.toLowerCase().includes(q)
    || String(g.year).includes(q),
  lightbox: g => ({
    img: COVER + g.id + ".jpg",
    alt: g.name,
    name: g.name,
    sub: g.code + " · " + g.year,
    chips: [g.platforms, (CHARS_BY_GAME[g.code] || []).length + " персонажей"],
    blocks: [
      { kind: "text", text: g.description },
      { kind: "chips", title: "Персонажи в игре", items: CHARS_BY_GAME[g.code] || [] },
    ],
  }),
});
