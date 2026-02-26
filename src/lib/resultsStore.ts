type SceneResult = {
  correctCount: number;
  totalCount: number;
  allCorrect: boolean;
  updatedAt: number;
};

type UserResults = {
  scenes: Record<string, SceneResult>;
};

const store: Record<string, UserResults> = {};

export function loginUser(name: string) {
  store[name] = { scenes: {} };
}

export function recordResult(name: string, sceneId: string, result: Omit<SceneResult, "updatedAt">) {
  if (!store[name]) store[name] = { scenes: {} };
  store[name].scenes[sceneId] = { ...result, updatedAt: Date.now() };
}

export function getResult(name: string, sceneId?: string) {
  const user = store[name];
  if (!user) return null;
  if (!sceneId) return user;
  return user.scenes[sceneId] ?? null;
}
