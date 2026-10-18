import { circle, polygon, rect, target, type Scene } from "../scene.ts";

// An Italian street, 1600×900 (16:9, the board's aspect ratio), seen front-on.
// Shapes are parts of real objects (a clock face, a wheel, a pediment, a road
// sign), not objects reduced to shapes.
//
// Authoring rules (checked by tests): rectangles are clearly elongated, squares
// and circles exact, every target big enough to frame. Nested targets are fine
// (a triangle inside a square sign): the box matches the one it fits. A detail
// inside a target (a wheel's rim) must be big enough to still match its target.

export const streetScene: Scene = {
  id: "strada",
  title: "Osserva la strada",
  width: 1600,
  height: 900,
  targets: [
    // --- Palazzo with the grocery shop (left)
    target("palazzo-finestrella-1", "quadrato", rect(170, 105, 50, 50)),
    target("palazzo-finestrella-2", "quadrato", rect(340, 105, 50, 50)),
    target("palazzo-finestra-1", "rettangolo", rect(68, 230, 84, 144)),
    target("palazzo-finestra-2", "rettangolo", rect(238, 230, 84, 144)),
    target("palazzo-finestra-3", "rettangolo", rect(408, 230, 84, 144)),
    target("insegna-alimentari", "rettangolo", rect(40, 405, 480, 42)),
    target("vetrina-alimentari", "quadrato", rect(70, 455, 140, 140)),
    target("porta-alimentari", "rettangolo", rect(300, 450, 80, 150)),
    target("targa-via", "rettangolo", rect(415, 470, 125, 36)),

    // --- Church
    target("frontone-chiesa", "triangolo", polygon([560, 210], [1080, 210], [820, 50])),
    target("rosone", "cerchio", circle(820, 150, 36)),
    target("orologio", "cerchio", circle(820, 285, 44)),
    target("timpano-portale", "triangolo", polygon([735, 392], [905, 392], [820, 340])),
    target("portale", "rettangolo", rect(760, 400, 120, 200)),

    // --- Palazzo with the bar (right)
    target("bar-finestrella-1", "quadrato", rect(1185, 110, 50, 50)),
    target("bar-finestrella-2", "quadrato", rect(1445, 110, 50, 50)),
    target("bar-timpano-1", "triangolo", polygon([1158, 222], [1262, 222], [1210, 182])),
    target("bar-timpano-2", "triangolo", polygon([1418, 222], [1522, 222], [1470, 182])),
    target("bar-finestra-1", "rettangolo", rect(1168, 230, 84, 144)),
    target("bar-finestra-2", "rettangolo", rect(1428, 230, 84, 144)),
    target("insegna-bar", "rettangolo", rect(1120, 410, 220, 45)),
    target("vetrina-bar", "rettangolo", rect(1120, 465, 220, 105)),
    target("porta-bar", "rettangolo", rect(1370, 440, 90, 160)),

    // --- Road signs
    target("cartello-precedenza", "triangolo", polygon([548, 330], [652, 330], [600, 420])),
    target("cartello-pedoni", "quadrato", rect(950, 290, 100, 100)),
    target("triangolo-pedoni", "triangolo", polygon([965, 378], [1035, 378], [1000, 308])),
    target("cartello-divieto", "cerchio", circle(1545, 350, 42)),

    // --- Bicycle and car
    target("bici-ruota-dietro", "cerchio", circle(1090, 612, 42)),
    target("bici-ruota-davanti", "cerchio", circle(1215, 612, 42)),
    target("auto-ruota-dietro", "cerchio", circle(395, 828, 46)),
    target("auto-ruota-davanti", "cerchio", circle(665, 828, 46)),
  ],
};
