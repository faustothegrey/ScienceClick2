import { readdir, stat } from "fs/promises";
import path from "path";

export const SCENES_ROOT_FS = path.join(process.cwd(), "public", "scenes");
export const SCENES_ROOT_URL = "/scenes";

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
