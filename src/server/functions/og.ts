import { createServerFn } from "@tanstack/react-start";
import satori from "satori";

interface VNode {
  type: string;
  props: Record<string, unknown>;
}

let fontCache: Record<string, ArrayBuffer> | null = null;

async function getFonts() {
  if (fontCache) return fontCache;
  const [inter, interBold, devanagari] = await Promise.all([
    fetch("https://fonts.gstatic.com/s/inter/v18/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa1ZL7W0Q5nw.woff2").then(r => r.arrayBuffer()),
    fetch("https://fonts.gstatic.com/s/inter/v18/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa2JL7W0Q5nw.woff2").then(r => r.arrayBuffer()),
    fetch("https://fonts.gstatic.com/s/notosansdevanagari/v25/TuG4UVpzXI5FBtUq5a8bjKYTZjtRU6Sgv3NaV_SNmI0b6w.woff2").then(r => r.arrayBuffer()),
  ]);
  fontCache = { inter, interBold, devanagari };
  return fontCache;
}

const svgCache = new Map<string, string>();

export const generateOgImage = createServerFn({ method: "GET" })
  .validator((data: { title: string; deityName: string; type: string; body: string; slug: string }) => data)
  .handler(async ({ data }) => {
    const { title, deityName, type, body, slug } = data;
    const cached = svgCache.get(slug);
    if (cached) return cached;

    const fonts = await getFonts();
    const devanagariRegex = /[\u0900-\u097F]+/g;
    const devanagariText = (body.match(devanagariRegex) || []).join(" ").slice(0, 80);

    function h(type: string, props: Record<string, unknown>, ...children: (VNode | string)[]): VNode {
      return { type, props: { ...props, children: children.length > 0 ? children : props.children } };
    }

    const devanagariNodes: VNode[] = devanagariText
      ? [h("div", { style: { fontSize: 44, color: "#e8e4e0", fontFamily: "Noto Sans Devanagari", textAlign: "center", lineHeight: 1.5, marginBottom: 20 } }, devanagariText)]
      : [];

    const tree: VNode = h("div", { style: { width: 1200, height: 630, background: "linear-gradient(135deg, #0f0f1a 0%, #1a1a3e 50%, #0f3460 100%)", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "0 80px", fontFamily: "Inter" } },
      h("div", { style: { position: "absolute", top: 28, left: 48, display: "flex", alignItems: "center", gap: 8 } },
        h("span", { style: { color: "#D4AF37", fontSize: 16, fontWeight: 600, letterSpacing: 1 } }, "SacredSpace"),
      ),
      h("div", { style: { position: "absolute", top: 56, left: 48, right: 48, height: 1, background: "linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.4), transparent)" } }),
      h("div", { style: { fontSize: 18, color: "#D4AF37", fontWeight: 500, letterSpacing: 3, textTransform: "uppercase", marginBottom: 20 } }, `${deityName} · ${type}`),
      ...devanagariNodes,
      h("div", { style: { fontSize: 40, color: "#ffffff", fontWeight: 700, textAlign: "center", lineHeight: 1.3, maxWidth: 900 } }, title),
      h("div", { style: { position: "absolute", bottom: 60, left: 48, right: 48, height: 1, background: "linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.3), transparent)" } }),
      h("div", { style: { position: "absolute", bottom: 32, color: "rgba(255,255,255,0.3)", fontSize: 13, letterSpacing: 1.5 } }, "sacredspace.vercel.app"),
    );

    const svg = await satori(tree as any,
      {
        width: 1200,
        height: 630,
        fonts: [
          { name: "Inter", data: fonts.inter, weight: 400, style: "normal" },
          { name: "Inter", data: fonts.interBold, weight: 700, style: "normal" },
          { name: "Noto Sans Devanagari", data: fonts.devanagari, weight: 400, style: "normal" },
        ],
      }
    );

    const base64 = Buffer.from(svg).toString("base64");
    const dataUri = `data:image/svg+xml;base64,${base64}`;
    svgCache.set(slug, dataUri);
    return dataUri;
  });
