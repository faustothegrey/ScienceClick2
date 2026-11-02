import type { Metadata } from "next";
import WordleGame from "./WordleGame";
export const metadata: Metadata = { title: "WordleIt · ScienceClick", description: "Indovina la parola italiana di cinque lettere in sei tentativi." };
export default function Page() { return <WordleGame />; }
