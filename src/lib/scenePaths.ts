import { cp, readdir, stat } from "fs/promises";
import path from "path";
import { SNAPIT_BASE } from "./snapitRoutes";

// Scenes shipped with the app (served as static files).
const SCENES_SEED_FS = path.join(process.cwd(), "public", "snapit", "scenes");
// Where scene data is read and written. On Vercel the app directory is read-only,
// so we work on a copy in /tmp: edits last only as long as the server instance does.
export const SCENES_ROOT_FS = process.env.VERCEL
  ? path.join("/tmp", "snapit", "scenes")
  : SCENES_SEED_FS;
export const SCENES_ROOT_URL = `${SNAPIT_BASE}/scenes`;

const IMAGE_NAMES = ["scene.svg", "scene.png", "scene.jpeg", "scene.jpg"];

let dataReady: Promise<void> | null = null;

// Seed the writable copy on first use. Images are skipped: they are always served
// from the static seed (see sceneImageUrl).
function ensureDataDir(): Promise<void> {
  if (SCENES_ROOT_FS === SCENES_SEED_FS) return Promise.resolve();
  dataReady ??= cp(SCENES_SEED_FS, SCENES_ROOT_FS, {
    recursive: true,
    force: false,
    errorOnExist: false,
    filter: (src) => !IMAGE_NAMES.includes(path.basename(src)),
  }).catch(() => {
    dataReady = null;
  });
  return dataReady;
}

const CATEGORY_SLUGS: Record<string, string> = {
  "Universe & Earth": "universe-and-earth",
  "The Matter": "the-matter",
  "Biology & Human Body": "biology-and-human-body",
  "Everyday Scenes": "everyday-scenes",
};

export const OTHER_SLUG = "other";

export function categoryToSlug(category: string | null | undefined): string {
  if (!category) return OTHER_SLUG;
  return CATEGORY_SLUGS[category] ?? OTHER_SLUG;
}

export function isValidSceneId(id: string): boolean {
  return !id.includes("..") && !id.includes("/") && !id.includes("\\");
}

async function isDir(p: string): Promise<boolean> {
  try {
    const info = await stat(p);
    return info.isDirectory();
  } catch {
    return false;
  }
}

export async function listCategorySlugs(): Promise<string[]> {
  await ensureDataDir();
  try {
    const entries = await readdir(SCENES_ROOT_FS);
    const result: string[] = [];
    for (const entry of entries) {
      if (await isDir(path.join(SCENES_ROOT_FS, entry))) result.push(entry);
    }
    return result;
  } catch {
    return [];
  }
}

export async function findSceneDir(sceneId: string): Promise<string | null> {
  if (!isValidSceneId(sceneId)) return null;
  for (const slug of await listCategorySlugs()) {
    const candidate = path.join(SCENES_ROOT_FS, slug, sceneId);
    if (await isDir(candidate)) return candidate;
  }
  return null;
}

export async function findSceneCategorySlug(sceneId: string): Promise<string | null> {
  const dir = await findSceneDir(sceneId);
  if (!dir) return null;
  return path.basename(path.dirname(dir));
}

export function sceneDirForCategory(sceneId: string, category: string | null | undefined): string {
  return path.join(SCENES_ROOT_FS, categoryToSlug(category), sceneId);
}

export function scenePublicUrl(categorySlug: string, sceneId: string, file?: string): string {
  const base = `${SCENES_ROOT_URL}/${categorySlug}/${sceneId}`;
  return file ? `${base}/${file}` : base;
}

// Public URL of a scene's image, looked up in the static seed (the files actually
// served), so it stays valid even if the scene's category changed at runtime.
export async function sceneImageUrl(sceneId: string): Promise<string | null> {
  if (!isValidSceneId(sceneId)) return null;
  let slugs: string[];
  try {
    slugs = await readdir(SCENES_SEED_FS);
  } catch {
    return null;
  }
  for (const slug of slugs) {
    for (const name of IMAGE_NAMES) {
      try {
        await stat(path.join(SCENES_SEED_FS, slug, sceneId, name));
        return scenePublicUrl(slug, sceneId, name);
      } catch {
        // not found
      }
    }
  }
  return null;
}

export async function listAllScenes(): Promise<Array<{ sceneId: string; categorySlug: string; absPath: string }>> {
  const result: Array<{ sceneId: string; categorySlug: string; absPath: string }> = [];
  for (const slug of await listCategorySlugs()) {
    const slugPath = path.join(SCENES_ROOT_FS, slug);
    let entries: string[];
    try {
      entries = await readdir(slugPath);
    } catch {
      continue;
    }
    for (const entry of entries) {
      const absPath = path.join(slugPath, entry);
      if (await isDir(absPath)) {
        result.push({ sceneId: entry, categorySlug: slug, absPath });
      }
    }
  }
  return result;
}
