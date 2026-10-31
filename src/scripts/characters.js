import { initTierList } from "./core.js";
import RAW from "../../characters.json";

const BASE = import.meta.env.BASE_URL;
const AVATAR = (BASE.endsWith("/") ? BASE : BASE + "/") + "avatars/";

const CHARACTERS = RAW.characters.map(c => ({
  id: c.id,
  name: c.name,
  nameRu: c.nameRu || c.name,
  games: c.games.join("/"),
  attacks: c.attacks || [],
}));

initTierList({
  items: CHARACTERS,
  lsPrefix: "re-tierlist",
  resetMessage: "Убрать всех из линий обратно в банк?",
  card: c => ({
    img: AVATAR + c.id + ".png",
    alt: c.nameRu,
    caption: c.nameRu,
    title: c.nameRu + "  [" + c.games + "]\n" + c.attacks.join("\n"),
  }),
  matches: (c, q) =>
    c.nameRu.toLowerCase().includes(q)
    || c.name.toLowerCase().includes(q)
    || c.games.toLowerCase().includes(q),
  lightbox: c => ({
    img: AVATAR + c.id + ".png",
    alt: c.nameRu,
    name: c.nameRu,
    sub: c.name,
    chips: c.games.split("/"),
    blocks: [{ kind: "list", items: c.attacks }],
  }),
});
