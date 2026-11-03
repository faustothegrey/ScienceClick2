import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import { classroomLinks } from "@/lib/classroomLinks";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  const links = classroomLinks(request.nextUrl.origin, request.nextUrl.searchParams.get("path") ?? "/");
  const options = await Promise.all(links.map(async link => ({ ...link, qr: await QRCode.toDataURL(link.url, { width: 320, margin: 4, errorCorrectionLevel: "M" }) })));
  return NextResponse.json({ links: options, local: !process.env.VERCEL }, { headers: { "Cache-Control": "no-store" } });
}
