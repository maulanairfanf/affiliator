import type { Platform, ContentType, TemplateStyle } from "@/lib/constants";
import {
  Platform as P,
  ContentType as CT,
  TemplateStyle as TS,
} from "@/lib/constants";

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
  [CT.Riddle]:
    "Buat tebak-tebakan lucu khas Indonesia (wordplay / plesetan) yang kreatif dan menghibur.",
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
  style?: TemplateStyle,
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

export function buildRiddlePrompt(theme?: string): {
  system: string;
  user: string;
} {
  const themeInstruction = theme
    ? `Tema spesial: "${theme}").`
    : "";

  return {
    system: `Buatkan tebak-tebakan receh berbahasa Indonesia dengan kualitas seperti humor tongkrongan. ${themeInstruction}

Aturan utama:

1. Jawabannya harus terasa natural dan sudah familiar di telinga orang Indonesia.
2. Hindari jawaban yang terasa dipaksakan atau hanya menggabungkan dua kata tanpa alasan yang jelas.
3. Targetnya adalah efek "Oh iya juga ya wkwkwk", bukan "Oh... maksudnya itu."
4. Jawaban sebaiknya berasal dari:
   - kata majemuk (contoh: jam tangan, rumah makan, kamar mandi)
   - idiom atau ungkapan umum (contoh: jalan pikiran, buah pikiran, tulang punggung)
   - bagian benda yang memang memiliki nama tersebut (contoh: mata bor, mata kail, kaki meja, ibu jari, anak tangga)
   - homonim atau permainan makna yang memang umum digunakan.
   - plesetan bunyi yang sangat natural (contoh: Sapira, Sapiderman, Bebekham). Jika terdengar dipaksakan, jangan digunakan.
5. Pertanyaan harus mengarahkan ke jawaban tanpa terlalu ambigu.
6. Jangan menggunakan istilah teknis atau kata yang jarang diketahui masyarakat.
7. Jika sebuah ide terasa kurang lucu atau perlu dijelaskan agar dimengerti, lebih baik jangan digunakan.
8. Utamakan kualitas daripada kuantitas. Lebih baik menghasilkan 10 tebak-tebakan yang bagus daripada 100 yang biasa saja.
9. Berikan hanya tebak-tebakan yang benar-benar lolos standar humor tongkrongan.

Contoh kualitas yang diharapkan:

✅ Kuda apa yang siap? → Kuda-kuda.
✅ Sapi apa yang perempuan? → Sapira.
✅ Sapi apa yang bisa nempel di tembok? → Sapiderman.
✅ Daun apa yang gak ada di pohon? → Daun telinga.
✅ Mata apa yang gak bisa melihat? → Mata bor.
✅ Kaki apa yang gak bisa jalan? → Kaki meja.
✅ Tangan apa yang gak punya jari? → Jam tangan.
✅ Lengan apa yang gak punya otot? → Lengan kursi.
✅ Mata apa yang dilempar? → Mata kail.
✅ Mata apa yang gak pernah berkedip? → Mata dadu.
✅ Jari apa yang gak punya kuku? → Jari-jari roda.
✅ Kumis apa yang gak tumbuh? → Kumis kucing.
✅ Kamar apa yang gak ada kasurnya? → Kamar mandi.
✅ Anak apa yang gak lahir? → Anak tangga.
✅ Bunga apa yang gak harum? → Bunga bank.
✅ Jalan apa yang gak bisa dilewatin mobil? → Jalan pikiran.
✅ Ibu apa yang gak melahirkan? → Ibu jari.
✅ Tulang apa yang gak ada di tubuh? → Tulang punggung keluarga.

Hindari contoh seperti:
❌ Kepala paku
❌ Leher baju
❌ Mulut botol
❌ Lidah sepatu
❌ Punggung buku
atau plesetan yang terdengar dipaksakan seperti "Sapirsa".

Sebelum memberikan jawaban, lakukan self-review:
- Apakah orang Indonesia langsung paham jawabannya?
- Apakah jawabannya memang umum dipakai?
- Apakah terdengar seperti tebak-tebakan yang bisa muncul di tongkrongan?
- Jika salah satu jawabannya "tidak", buang tebak-tebakan tersebut dan cari yang lebih baik.

Output JSON: { "riddles": [{ "question": "...", "answer": "...", "hint": "...", "explanation": "..." }] }`,
    user: `Buat 10 tebak-tebakan receh bahasa Indonesia. Prioritaskan kualitas.`,
  };
}
