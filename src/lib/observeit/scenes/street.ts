import { circle, polygon, rect, target, type Scene } from "../scene.ts";

// An Italian street, 1600×900 (16:9, the board's aspect ratio), seen front-on.
// Shapes are parts of real objects (a clock face, a wheel, a road sign), not
// objects reduced to shapes. Students find an object of the requested shape and
// write its name. Each object accepts several everyday descriptions, also of more
// than one word; the first one is shown when the name is revealed.
//
// Authoring rules (checked by tests): rectangles are clearly elongated, squares
// and circles exact, every target big enough to frame. Nested targets are fine
// (a triangle inside a square sign): the box matches the one it fits. A detail
// inside a target (a wheel's rim) must be big enough to still match its target.
// Every visible taught shape must be a target, or "there are no more" is unfair.

const FINESTRA = ["finestra", "finestrella", "finestra piccola"];
const FINESTRA_PERSIANE = ["finestra", "persiana", "persiane", "finestra chiusa", "finestra con le persiane"];
const PORTA = ["porta", "portone", "ingresso", "entrata"];
const SEGNALE = ["cartello", "segnale", "cartello stradale", "segnale stradale"];
const PEDONI = [...SEGNALE, "attraversamento pedonale", "passaggio pedonale", "cartello pedonale", "pedoni", "strisce pedonali"];
const RUOTA = ["ruota", "gomma", "pneumatico"];

export const streetScene: Scene = {
  id: "strada",
  title: "Osserva la strada",
  width: 1600,
  height: 900,
  targets: [
    // --- Palazzo with the grocery shop (left)
    target("palazzo-finestrella-1", "quadrato", rect(170, 105, 50, 50), FINESTRA),
    target("palazzo-finestrella-2", "quadrato", rect(340, 105, 50, 50), FINESTRA),
    target("palazzo-finestra-1", "rettangolo", rect(68, 230, 84, 144), ["finestra", "finestra aperta"]),
    target("palazzo-finestra-2", "rettangolo", rect(238, 230, 84, 144), ["finestra", "finestra aperta"]),
    target("palazzo-finestra-3", "rettangolo", rect(408, 230, 84, 144), ["finestra", "finestra aperta"]),
    target("insegna-alimentari", "rettangolo", rect(40, 405, 480, 42), ["insegna", "cartello", "scritta", "insegna del negozio", "alimentari"]),
    target("vetrina-alimentari", "quadrato", rect(70, 455, 140, 140), ["vetrina", "finestra", "vetrina del negozio"]),
    target("porta-alimentari", "rettangolo", rect(300, 450, 80, 150), [...PORTA, "porta del negozio"]),
    target("targa-via", "rettangolo", rect(415, 470, 125, 36), ["targa", "cartello", "insegna", "nome della via", "targa della via", "targa stradale"]),

    // --- Church
    target("frontone-chiesa", "triangolo", polygon([560, 210], [1080, 210], [820, 50]), ["tetto", "chiesa", "frontone", "tetto della chiesa"]),
    target("rosone", "cerchio", circle(820, 150, 36), ["finestra", "rosone", "finestra rotonda", "finestra della chiesa"]),
    target("orologio", "cerchio", circle(820, 285, 44), ["orologio", "orologio della chiesa"]),
    target("portale", "rettangolo", rect(760, 400, 120, 200), [...PORTA, "portale", "porta della chiesa"]),

    // --- Palazzo with the bar (right)
    target("bar-finestrella-1", "quadrato", rect(1185, 110, 50, 50), FINESTRA),
    target("bar-finestrella-2", "quadrato", rect(1445, 110, 50, 50), FINESTRA),
    target("bar-finestra-1", "rettangolo", rect(1168, 230, 84, 144), FINESTRA_PERSIANE),
    target("bar-finestra-2", "rettangolo", rect(1428, 230, 84, 144), FINESTRA_PERSIANE),
    target("insegna-bar", "rettangolo", rect(1120, 410, 220, 45), ["insegna", "cartello", "scritta", "insegna del bar", "bar"]),
    target("vetrina-bar", "rettangolo", rect(1120, 465, 220, 105), ["vetrina", "finestra", "vetrina del bar"]),
    target("porta-bar", "rettangolo", rect(1370, 440, 90, 160), [...PORTA, "porta del bar"]),

    // --- Road signs
    target("cartello-precedenza", "triangolo", polygon([548, 330], [652, 330], [600, 420]), [
      ...SEGNALE,
      "dare precedenza",
      "precedenza",
      "cartello di precedenza",
      "segnale di precedenza",
    ]),
    target("cartello-pedoni", "quadrato", rect(950, 290, 100, 100), PEDONI),
    target("triangolo-pedoni", "triangolo", polygon([965, 378], [1035, 378], [1000, 308]), PEDONI),
    target("cartello-divieto", "cerchio", circle(1545, 350, 42), [
      ...SEGNALE,
      "divieto di sosta",
      "divieto",
      "cartello di divieto",
      "segnale di divieto",
      "divieto di parcheggio",
    ]),

    // --- Bicycle and car
    target("bici-ruota-dietro", "cerchio", circle(1090, 612, 42), [...RUOTA, "ruota della bici", "ruota della bicicletta"]),
    target("bici-ruota-davanti", "cerchio", circle(1215, 612, 42), [...RUOTA, "ruota della bici", "ruota della bicicletta"]),
    target("auto-ruota-dietro", "cerchio", circle(395, 828, 46), [...RUOTA, "ruota della macchina", "ruota dell'auto", "ruota della auto"]),
    target("auto-ruota-davanti", "cerchio", circle(665, 828, 46), [...RUOTA, "ruota della macchina", "ruota dell'auto", "ruota della auto"]),
  ],
};
