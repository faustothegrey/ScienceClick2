import { updateSharedGame } from "../sharedGameStorage.ts";
import { applyHunt, initialHunt, type HuntAction } from "./shared.ts";
import { streetScene } from "./scenes/street.ts";
export function sharedHunt(action?: HuntAction, turn?: string) {
  return updateSharedGame("observeit", () => initialHunt(streetScene), state => {
    if (action && turn) applyHunt(state, streetScene, action, turn);
  });
}
