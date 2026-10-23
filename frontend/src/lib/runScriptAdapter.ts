import { transpileOnServer } from "@/lib/builderApi";
import { adaptScript, type AdaptResult } from "@/lib/scriptAdapter";

export async function runScriptAdapter(source: string, name: string): Promise<AdaptResult> {
  const looksNative =
    /^\s*import\s+\{[^}]+\}\s+from\s+["']@avizor\/chart["']/m.test(source) ||
    source.includes("//@avizor");
  if (looksNative) {
    return adaptScript(source, name);
  }
  return transpileOnServer(source, name);
}
