import { updateSharedGame } from "../sharedGameStorage.ts";
import { applyAction, initialState, rollover, view, type Action } from "./shared.ts";
export async function sharedGame(action?: Action, boardId?: string) {
  const state = await updateSharedGame("wordleit", initialState, state => {
    rollover(state);
    if (action && boardId) applyAction(state, action, boardId);
  });
  return view(state);
}
