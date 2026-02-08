import HeaderBar from "@/components/editor/HeaderBar";
import Canvas from "@/components/editor/Canvas";
import TermBank from "@/components/editor/TermBank";

export default function SceneEditorPage() {
  return (
    <div className="flex flex-col h-screen">
      <HeaderBar />
      <div className="flex flex-1 overflow-hidden">
        <Canvas />
        <TermBank />
      </div>
    </div>
  );
}
