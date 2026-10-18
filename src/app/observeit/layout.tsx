import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ObserveIt",
  description: "Osserva la scena, trova le forme e scrivi il loro nome",
};

export default function ObserveitLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div lang="it">{children}</div>;
}
