import { adaptScript, type AdaptResult } from "@/lib/scriptAdapter";

export async function runScriptAdapter(source: string, name: string): Promise<AdaptResult> {
  return adaptScript(source, name);
}
