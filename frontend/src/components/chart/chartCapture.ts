export const CHART_CAPTURE_EVENT = "avizor-chart-capture";

export function requestChartCapture(): void {
  window.dispatchEvent(new Event(CHART_CAPTURE_EVENT));
}

function stamp(): string {
  const now = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("img"));
    image.src = src;
  });
}

async function svgAsImage(svg: SVGSVGElement): Promise<HTMLImageElement | null> {
  const box = svg.getBoundingClientRect();
  if (box.width < 2 || box.height < 2) {
    return null;
  }
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("width", String(Math.round(box.width)));
  clone.setAttribute("height", String(Math.round(box.height)));
  const xml = new XMLSerializer().serializeToString(clone);
  try {
    return await loadImage(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`);
  } catch {
    return null;
  }
}

export async function captureChartPane(root: HTMLElement, ticker: string, interval: string): Promise<void> {
  const rect = root.getBoundingClientRect();
  const width = Math.max(1, Math.round(rect.width));
  const height = Math.max(1, Math.round(rect.height));
  const dpr = Math.min(3, Math.max(2, window.devicePixelRatio || 2));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("No se pudo crear el lienzo de captura.");
  }
  ctx.scale(dpr, dpr);
  const fill = getComputedStyle(root).backgroundColor || "#050508";
  ctx.fillStyle = fill === "rgba(0, 0, 0, 0)" || fill === "transparent" ? "#050508" : fill;
  ctx.fillRect(0, 0, width, height);

  const layers = [
    ...root.querySelectorAll("canvas"),
    ...root.querySelectorAll("img"),
    ...root.querySelectorAll("svg"),
  ];
  for (const node of layers) {
    const box = node.getBoundingClientRect();
    const x = box.left - rect.left;
    const y = box.top - rect.top;
    if (box.width < 2 || box.height < 2) {
      continue;
    }
    if (node instanceof HTMLCanvasElement) {
      ctx.drawImage(node, x, y, box.width, box.height);
      continue;
    }
    if (node instanceof HTMLImageElement) {
      try {
        ctx.drawImage(node, x, y, box.width, box.height);
      } catch {
        continue;
      }
      continue;
    }
    if (node instanceof SVGSVGElement) {
      const image = await svgAsImage(node);
      if (image) {
        ctx.drawImage(image, x, y, box.width, box.height);
      }
    }
  }

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((next) => (next ? resolve(next) : reject(new Error("No se pudo generar el PNG."))), "image/png");
  });
  const filename = `AvizorChart-${ticker}-${interval}-${stamp()}.png`;
  try {
    await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
  } catch {
    /* el archivo se descarga igual */
  }
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}
