# ObserveIt v5 — find objects by shape, name the object

Date: 2026-10-22. Replaces the student flow of v4 (`observeit-proposal-v4.md`); v4's device decisions (LIM first, pointer events, on-screen keyboard, Italian only), scene style and box matching still apply.

Verified 2026-10-22: drawing and adjusting the box works on the Helgi LIM with touch.

## Game

Linking the shape word to real objects must happen in the student's head, so **shapes are never pictured**, neither in the prompt nor in the progress ("Forma 2 di 4").

**No unnecessary confirmations:** after each answer the game moves on by itself, and the outcome appears as a notice in the panel. The only two-tap guards are "Ricomincia" and the teacher's "Accetta". The only button at the end is "Nuova partita".

1. The app asks for one shape at a time, in a **random order** per game: "TROVA un oggetto a forma di cerchio", then "TROVA un altro oggetto a forma di cerchio".
2. The student draws a box around an object. The keyboard appears at once. While writing, the box can be adjusted with its corners or redrawn by dragging elsewhere; "Ridisegna" starts over.
3. The student **writes the object's name** and presses Fatto. Box and word are checked together:
   - box on nothing → notice "Non trovo un oggetto qui."; back to drawing.
   - box on two objects equally → "Il riquadro prende più oggetti." Box and word stay, so the box can be tightened.
   - object of another shape → "Questo oggetto non è a forma di cerchio." (without saying which shape it is); back to drawing.
   - object already found → "Hai già trovato questo oggetto."; back to drawing.

   Box problems don't use up attempts.
4. Naming, with **at most 3 attempts per object**:
   - accepted name → notice "Esatto!" with the word; the object stays outlined in green with the student's word. Play goes straight on to the next object.
   - near-miss (edit distance ≤ 2) → "Quasi! Controlla come si scrive." Wrong → "No. Prova un'altra parola." The student stays on the keyboard with the word still there, and a counter shows "Tentativo n di 3". The correct word is **not** shown.
   - 3rd wrong name → notice "Questo oggetto si chiama: cartello". The object is marked in **amber** as revealed, and play goes on.
5. **Teacher override**: every wrong-name notice, including the reveal, has a small "Accetta (insegnante)" button. Two taps within 3 seconds count the student's own word for that object (green). It lasts for the current game only; to accept a word permanently, add it to the object's names in the scene data.
6. **"Non ci sono altri oggetti a forma di cerchio"**:
   - if any are missing → "Guarda bene! C'è ancora almeno un oggetto a forma di cerchio." No counts are shown.
   - otherwise → straight to the next shape, with the notice "Giusto! Hai trovato tutti gli oggetti a forma di cerchio."
7. After the last shape: "Hai trovato tutti gli oggetti!", confetti, "Nuova partita".

No precision stars. No saving, login or audio.

## Vocabulary

Each object accepts **several descriptions, also of several words**; the first is the one shown on reveal. Articles, case and extra spaces are ignored, and "dell' auto" counts as "dell'auto". The on-screen keyboard has an apostrophe key.

For example, the no-parking sign accepts `cartello`, `segnale`, `cartello stradale`, `segnale stradale`, `divieto di sosta`, `divieto`, `cartello di divieto`, `segnale di divieto` and `divieto di parcheggio`. Other examples:
- the doors: `porta del negozio`, `ingresso`;
- the car wheels: `ruota dell'auto`, `pneumatico`;
- the church gable: `tetto della chiesa`.

Because the student decides when a shape is finished, **every visible taught shape must be a target**. The triangular stone decorations over the windows and the church door were therefore removed from the drawing, not just from the answers.

The street scene now has 28 objects: 7 cerchi, 6 quadrati, 3 triangoli, 12 rettangoli.

## Code

- `src/lib/observeit/game.ts`: shapes present in the scene, shuffling, what is left of a shape, the attempt limit.
- `src/lib/observeit/vocabulary.ts`: shape words (singular and plural), and `judgeName`.
- `src/lib/observeit/scenes/street.ts`: targets with their shape, geometry and names.
- `src/components/observeit/ShapeHunt.tsx`: the game.

The page shuffles the shape order on the server, so the server and the browser render the same order.

## Open

- Teacher acceptance of a valid object that isn't among the prepared targets (the override only covers names of prepared objects).
- Whether more triangle objects are wanted: only 3 remain in the street scene.
