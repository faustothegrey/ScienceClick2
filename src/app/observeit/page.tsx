import ShapeHunt from "@/components/observeit/ShapeHunt";
import StreetIllustration from "@/components/observeit/StreetIllustration";
import { streetScene } from "@/lib/observeit/scenes/street";

// Pilot: a single scene, used on the interactive whiteboard (LIM).
// `?debug` outlines every target, for checking a scene while drawing it.
export default async function ObserveitPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { debug } = await searchParams;
  return <ShapeHunt scene={streetScene} illustration={<StreetIllustration />} showTargets={debug !== undefined} />;
}
