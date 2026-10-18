import { expect, test, type Page } from "@playwright/test";
import type { Box } from "../src/lib/observeit/geometry.ts";
import { streetScene } from "../src/lib/observeit/scenes/street.ts";

// The draw → adjust → name → feedback flow, driven with a real mouse in the
// browser. Boxes are given in scene units and mapped onto the screen through
// the SVG's own transform, so the tests don't depend on the viewport size.

const total = streetScene.targets.length;

function targetBox(id: string): Box {
  const t = streetScene.targets.find((t) => t.id === id);
  if (!t) throw new Error(`no target ${id}`);
  return t.box;
}

const box = (x: number, y: number, width: number, height: number): Box => ({ x, y, width, height });

async function toScreen(page: Page, x: number, y: number) {
  return page.locator("main svg").evaluate(
    (svg, [x, y]) => {
      const p = new DOMPoint(x, y).matrixTransform((svg as SVGSVGElement).getScreenCTM()!);
      return { x: p.x, y: p.y };
    },
    [x, y],
  );
}

async function dragScene(page: Page, from: [number, number], to: [number, number]) {
  const a = await toScreen(page, ...from);
  const b = await toScreen(page, ...to);
  await page.mouse.move(a.x, a.y);
  await page.mouse.down();
  await page.mouse.move(b.x, b.y, { steps: 8 });
  await page.mouse.up();
}

async function drawBox(page: Page, b: Box) {
  await dragScene(page, [b.x, b.y], [b.x + b.width, b.y + b.height]);
}

async function typeOnScreen(page: Page, word: string) {
  const keyboard = page.locator("aside");
  for (const letter of word) {
    await keyboard.getByRole("button", { name: letter, exact: true }).click();
  }
}

const panel = (page: Page) => page.locator("aside");
const counter = (page: Page, n: number) => panel(page).getByText(`${n} / ${total}`);

test.beforeEach(async ({ page }) => {
  await page.goto("/observeit");
  await expect(panel(page).getByText("CERCA")).toBeVisible();
  await expect(counter(page, 0)).toBeVisible();
});

test("framing the clock and writing its name finds the shape with three stars", async ({ page }) => {
  await drawBox(page, targetBox("orologio"));
  await expect(panel(page).getByText("Il riquadro va bene?")).toBeVisible();
  await panel(page).getByRole("button", { name: "Conferma" }).click();

  await expect(panel(page).getByText("SCRIVI")).toBeVisible();
  await expect(panel(page).getByRole("button", { name: "Fatto" })).toBeDisabled();
  await typeOnScreen(page, "cerchio");
  await panel(page).getByRole("button", { name: "Fatto" }).click();

  await expect(panel(page).getByText("Esatto!")).toBeVisible();
  await expect(panel(page).getByLabel("3 stelle su 3")).toBeVisible();
  await expect(panel(page).getByText("Riquadro perfetto!")).toBeVisible();
  await expect(counter(page, 1)).toBeVisible();

  await panel(page).getByRole("button", { name: "Avanti" }).click();
  await expect(panel(page).getByText("CERCA")).toBeVisible();
});

test("finding the same shape again doesn't count twice", async ({ page }) => {
  for (let i = 0; i < 2; i++) {
    await drawBox(page, targetBox("orologio"));
    await panel(page).getByRole("button", { name: "Conferma" }).click();
    await typeOnScreen(page, "cerchio");
    await panel(page).getByRole("button", { name: "Fatto" }).click();
    await expect(panel(page).getByText("Esatto!")).toBeVisible();
    if (i === 0) await panel(page).getByRole("button", { name: "Avanti" }).click();
  }
  await expect(panel(page).getByText("Hai già trovato questa forma.")).toBeVisible();
  await expect(counter(page, 1)).toBeVisible();
});

test("the physical keyboard works for confirming and naming", async ({ page }) => {
  await drawBox(page, targetBox("portale"));
  await page.keyboard.press("Enter");
  await expect(panel(page).getByText("SCRIVI")).toBeVisible();
  await page.keyboard.type("rettangolx");
  await page.keyboard.press("Backspace");
  await page.keyboard.type("o");
  await page.keyboard.press("Enter");
  await expect(panel(page).getByText("Esatto!")).toBeVisible();
  await expect(counter(page, 1)).toBeVisible();
});

test("Escape goes back one step", async ({ page }) => {
  await drawBox(page, targetBox("portale"));
  await page.keyboard.press("Enter");
  await expect(panel(page).getByText("SCRIVI")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(panel(page).getByText("Il riquadro va bene?")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(panel(page).getByText("CERCA")).toBeVisible();
});

test("Enter confirms the box even when a panel button kept the focus", async ({ page }) => {
  await drawBox(page, targetBox("orologio"));
  // "Ricomincia" stays on screen in every phase, so a focused one would also
  // receive the Enter if the shortcut didn't consume it.
  await panel(page).getByRole("button", { name: "Ricomincia" }).focus();
  await page.keyboard.press("Enter");
  await expect(panel(page).getByText("SCRIVI")).toBeVisible();
  // Checked once, not retried: an armed restart disarms itself after 3 s.
  expect(await panel(page).getByRole("button", { name: "Tocca ancora" }).count()).toBe(0);
  await page.keyboard.type("cerchio");
  await page.keyboard.press("Enter");
  await expect(panel(page).getByText("Esatto!")).toBeVisible();
  expect(await panel(page).getByRole("button", { name: "Tocca ancora" }).count()).toBe(0);
});

test("a tap doesn't start a box", async ({ page }) => {
  await dragScene(page, [800, 700], [805, 703]);
  await expect(panel(page).getByText("CERCA")).toBeVisible();
  await expect(panel(page).getByRole("button", { name: "Conferma" })).toHaveCount(0);
});

test("a box on empty sky finds no shape, and can be fixed", async ({ page }) => {
  await drawBox(page, box(700, 10, 60, 30));
  await panel(page).getByRole("button", { name: "Conferma" }).click();
  await expect(panel(page).getByText("Non trovo una forma qui.")).toBeVisible();

  await panel(page).getByRole("button", { name: "Sistema il riquadro" }).click();
  await expect(panel(page).getByText("Il riquadro va bene?")).toBeVisible();
  await panel(page).getByRole("button", { name: "Cancella il riquadro" }).click();
  await expect(panel(page).getByText("CERCA")).toBeVisible();
});

test("dragging a corner and moving the box fixes a bad box", async ({ page }) => {
  const door = targetBox("portale");
  // Start too small and too far left of the church door.
  const start = box(door.x - 100, door.y, door.width / 2, door.height / 2);
  await drawBox(page, start);

  // Drag the bottom-right corner so the box has the door's size...
  await dragScene(page, [start.x + start.width, start.y + start.height], [start.x + door.width, start.y + door.height]);
  // ...then grab the middle of the box and slide it onto the door.
  await dragScene(page, [start.x + door.width / 2, start.y + door.height / 2], [door.x + door.width / 2, door.y + door.height / 2]);

  await panel(page).getByRole("button", { name: "Conferma" }).click();
  await typeOnScreen(page, "rettangolo");
  await panel(page).getByRole("button", { name: "Fatto" }).click();
  await expect(panel(page).getByLabel("3 stelle su 3")).toBeVisible();
});

test("a box that is too big gets one star and is told to shrink", async ({ page }) => {
  // A window framed together with its open shutters.
  await drawBox(page, box(28, 230, 164, 144));
  await panel(page).getByRole("button", { name: "Conferma" }).click();
  await typeOnScreen(page, "rettangolo");
  await panel(page).getByRole("button", { name: "Fatto" }).click();
  await expect(panel(page).getByLabel("1 stelle su 3")).toBeVisible();
  await expect(panel(page).getByText("Puoi stringere di più il riquadro.")).toBeVisible();
});

test("a box that cuts the shape gets one star and is told to take all of it", async ({ page }) => {
  const door = targetBox("portale");
  await drawBox(page, box(door.x, door.y + 40, door.width, door.height * 0.6));
  await panel(page).getByRole("button", { name: "Conferma" }).click();
  await typeOnScreen(page, "rettangolo");
  await panel(page).getByRole("button", { name: "Fatto" }).click();
  await expect(panel(page).getByLabel("1 stelle su 3")).toBeVisible();
  await expect(panel(page).getByText("Il riquadro deve prendere tutta la forma.")).toBeVisible();
});

test("a wrong shape name is corrected, not accepted, and can be rewritten", async ({ page }) => {
  await drawBox(page, targetBox("orologio"));
  await panel(page).getByRole("button", { name: "Conferma" }).click();
  await typeOnScreen(page, "triangolo");
  await panel(page).getByRole("button", { name: "Fatto" }).click();

  await expect(panel(page).getByText("No, non è un triangolo.")).toBeVisible();
  await expect(panel(page).getByText("cerchio", { exact: true })).toBeVisible();
  await expect(counter(page, 0)).toBeVisible();

  await panel(page).getByRole("button", { name: "Scrivi di nuovo" }).click();
  await typeOnScreen(page, "cerchio");
  await panel(page).getByRole("button", { name: "Fatto" }).click();
  await expect(panel(page).getByText("Esatto!")).toBeVisible();
  await expect(counter(page, 1)).toBeVisible();
});

test("a misspelled name shows the right spelling", async ({ page }) => {
  await drawBox(page, targetBox("orologio"));
  await panel(page).getByRole("button", { name: "Conferma" }).click();
  await typeOnScreen(page, "cerkio");
  await panel(page).getByRole("button", { name: "Fatto" }).click();
  await expect(panel(page).getByText("Quasi! Si scrive:")).toBeVisible();
  await expect(counter(page, 0)).toBeVisible();
});

test("restart needs a second tap and clears the found shapes", async ({ page }) => {
  await drawBox(page, targetBox("orologio"));
  await panel(page).getByRole("button", { name: "Conferma" }).click();
  await typeOnScreen(page, "cerchio");
  await panel(page).getByRole("button", { name: "Fatto" }).click();
  await expect(counter(page, 1)).toBeVisible();

  await panel(page).getByRole("button", { name: "Ricomincia" }).click();
  await expect(counter(page, 1)).toBeVisible();
  await panel(page).getByRole("button", { name: "Tocca ancora" }).click();
  await expect(counter(page, 0)).toBeVisible();
  await expect(panel(page).getByText("CERCA")).toBeVisible();
});
