import ShapeHunt from "@/components/observeit/ShapeHunt";
import StreetIllustration from "@/components/observeit/StreetIllustration";
import { shapesIn, shuffled } from "@/lib/observeit/game";
import { streetScene } from "@/lib/observeit/scenes/street";

// Pilot: a single scene, used on the interactive whiteboard (LIM).
// `?debug` outlines every target, for checking a scene while drawing it.
export default async function ObserveitPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { debug } = await searchParams;
  return (
    <ShapeHunt
      scene={streetScene}
      illustration={<StreetIllustration />}
      // Shuffled here, per request, so server and client render the same order.
      initialOrder={shuffled(shapesIn(streetScene))}
      showTargets={debug !== undefined}
    />
  );
}
