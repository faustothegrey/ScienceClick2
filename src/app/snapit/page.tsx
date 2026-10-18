import { redirect } from "next/navigation";
import { SNAPIT_BASE } from "@/lib/snapitRoutes";

export default function SnapitHome() {
  redirect(`${SNAPIT_BASE}/scenes`);
}
