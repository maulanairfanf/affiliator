import type { Platform, ContentType, TemplateStyle } from "@/lib/constants";
import { Platform as P, ContentType as CT, TemplateStyle as TS } from "@/lib/constants";

const platformInstructions: Record<Platform, string> = {
  [P.Threads]:
    "Buat thread pendek dan engaging, max 500 karakter per post, bahasa Indonesia casual.",
};

const typeInstructions: Partial<Record<ContentType, string>> = {
  [CT.ShortCaption]:
    "Buat short caption 50-120 kata, hook di awal, bahasa Indonesia, tambahkan 5-10 hashtag relevan.",
  [CT.LongCaption]:
    "Buat long caption storytelling yang engaging, panjang 200-500 kata, bungkus dalam cerita relatable, ada konflik dan resolusi, tone personal.",
  [CT.Hook]:
    "Buat 20 variasi hook (pembuka yang menarik perhatian) untuk berbagai angle, masing-masing max 15 kata, bahasa Indonesia.",
  [CT.Cta]:
    "Buat 10 variasi call-toaction yang mendorong klik atau pembelian, masing-masing max 20 kata, variasi dari soft ke hard selling.",
  [CT.Hashtag]:
    "Buat 10-15 hashtag relevan yang populer di platform tersebut, minimal 5 hashtag SEO dan 5 hashtag trending.",
  [CT.ProductSummary]:
    "Buat ringkasan produk yang mencakup: manfaat utama, fitur unggulan, target audiens, dan pain points yang diselesaikan.",
};

const styleModifiers: Record<TemplateStyle, string> = {
  [TS.SoftSelling]:
    "Gunakan pendekatan soft selling, fokus pada manfaat, tidak memaksa, bahasa natural.",
  [TS.HardSelling]:
    "Gunakan pendekatan hard selling, langsung ke inti, dorong pembelian, gunakan kata-kata urgensi.",
  [TS.Storytelling]:
    "Bungkus dalam cerita yang relatable, ada konflik dan resolusi, tone personal.",
  [TS.Review]:
    "Tulis sebagai review jujur seperti pengalaman pribadi, sebutkan kelebihan dan kekurangan.",
  [TS.ProblemSolution]:
    "Identifikasi masalah umum audiens, lalu tawarkan produk sebagai solusi terbaik.",
};

export function buildSystemPrompt(
  platform: Platform,
  types: ContentType[],
  style?: TemplateStyle
): string {
  const platformPart = platformInstructions[platform];
  const typesPart = types
    .map((t) => typeInstructions[t])
    .filter(Boolean)
    .join(" ");
  const stylePart = style ? styleModifiers[style] : "";

  return `Kamu adalah asisten content creator profesional untuk affiliate marketing di Indonesia. ${platformPart} ${typesPart} ${stylePart}
Output dalam format JSON dengan key: ${types.map((t) => `"${t}"`).join(", ")}. Gunakan bahasa Indonesia yang natural.`.trim();
}

export function buildUserPrompt(product: {
  title: string;
  price: number;
  currency: string;
  description: string | null;
  imageUrl: string | null;
}): string {
  return `Buat konten promosi untuk produk berikut:

Nama Produk: ${product.title}
Harga: ${product.currency === "IDR" ? `Rp ${product.price.toLocaleString("id-ID")}` : `$${product.price.toFixed(2)}`}
Deskripsi: ${product.description || "Tidak ada deskripsi"}
${product.imageUrl ? `Gambar: ${product.imageUrl}` : ""}

Buat konten yang menarik dan mendorong pembelian.`.trim();
}
