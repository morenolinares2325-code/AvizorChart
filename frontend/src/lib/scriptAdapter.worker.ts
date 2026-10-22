import { adaptScript } from "@/lib/scriptAdapter";

self.onmessage = (event: MessageEvent<{ source?: string; name?: string }>) => {
  try {
    const source = String(event.data?.source ?? "");
    const name = String(event.data?.name ?? "");
    self.postMessage({ ok: true, result: adaptScript(source, name) });
  } catch (error) {
    self.postMessage({
      ok: false,
      error: error instanceof Error ? error.message : "Fallo al adaptar el script.",
    });
  }
};
