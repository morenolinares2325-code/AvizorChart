import { NextResponse } from "next/server";
import { isWorldTvChannelId } from "@/components/news/worldTvChannels";
import { resolveTvChannel } from "@/lib/tvResolveServer";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const channelId = searchParams.get("channelId")?.trim() ?? "";
  if (!channelId || !isWorldTvChannelId(channelId)) {
    return NextResponse.json({ error: "channelId inválido" }, { status: 400 });
  }
  try {
    const payload = await resolveTvChannel(channelId);
    return NextResponse.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo sintonizar el canal";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
