import {
  ArrowRight,
  BookOpenText,
  Check,
  ChevronRight,
  CircleAlert,
  FileSearch,
  Quote,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { DesignReviewMotion } from "@/components/design-review-motion";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  description: "Pratinjau arah visual institutional-tech BPPedia.",
  title: "Design Review · BPPedia",
};

export default function DesignReviewPage() {
  return (
    <DesignReviewMotion>
      <main className="min-h-[100dvh] bg-background text-foreground">
        <Navigation />
        <Hero />
        <Interest />
        <Narrative />
        <Action />
      </main>
    </DesignReviewMotion>
  );
}

function Navigation() {
  return (
    <nav
      aria-label="Navigasi utama"
      className="mx-auto flex h-20 w-full max-w-[1400px] items-center justify-between px-4 md:px-8"
      data-reveal
    >
      <Link
        className="font-semibold text-brand text-xl tracking-[-0.04em] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
        href="/design-review"
      >
        BPPedia
      </Link>
      <div className="hidden items-center gap-8 text-muted-foreground text-sm md:flex">
        <a className="transition-colors hover:text-foreground" href="#manfaat">
          Cara kerja
        </a>
        <a className="transition-colors hover:text-foreground" href="#prinsip">
          Prinsip
        </a>
      </div>
      <Link
        className="group inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 font-medium text-primary-foreground text-sm transition-transform duration-200 active:translate-y-px"
        href="/"
      >
        Buka BPPedia
        <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
      </Link>
    </nav>
  );
}

function Hero() {
  return (
    <section className="mx-auto grid min-h-[calc(100dvh-5rem)] w-full max-w-[1400px] items-center gap-16 px-4 py-20 md:grid-cols-[1.12fr_0.88fr] md:px-8 md:py-28">
      <div className="max-w-5xl">
        <p
          className="mb-7 font-mono text-brand text-xs tracking-[0.12em]"
          data-reveal
        >
          SATU RUJUKAN UNTUK SETIAP KEBIJAKAN
        </p>
        <h1
          className="max-w-5xl text-balance font-semibold text-[clamp(3rem,5vw,5.25rem)] leading-[0.98] tracking-[-0.06em]"
          data-reveal
        >
          Temukan kebijakan. Pahami konteksnya.
        </h1>
        <p
          className="mt-8 max-w-2xl text-balance text-lg text-muted-foreground leading-8 md:text-xl"
          data-reveal
        >
          BPPedia membantu setiap karyawan menemukan jawaban yang tepat, lengkap
          dengan sumber yang dapat diperiksa.
        </p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row" data-reveal>
          <Link
            className="group inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-5 font-medium text-primary-foreground transition-transform duration-200 active:translate-y-px"
            href="/"
          >
            Mulai mencari
            <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
          <a
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border bg-card px-5 font-medium transition-colors hover:bg-secondary"
            href="#manfaat"
          >
            Lihat cara kerja
          </a>
        </div>
      </div>
      <KnowledgePreview />
    </section>
  );
}

function KnowledgePreview() {
  return (
    <div
      className="relative mx-auto w-full max-w-xl overflow-hidden rounded-2xl border bg-card p-2 shadow-[0_24px_64px_-32px_oklch(0.15_0.04_160/0.34)]"
      data-reveal
    >
      <div className="rounded-xl border bg-background p-5 md:p-7">
        <div className="flex items-center gap-3 border-b pb-5">
          <div className="flex size-10 items-center justify-center rounded-lg bg-brand-soft text-brand">
            <Search className="size-5" />
          </div>
          <div>
            <p className="font-medium text-sm">Tanyakan kebijakan perusahaan</p>
            <p className="mt-1 text-muted-foreground text-xs">
              Jawaban dengan rujukan dokumen
            </p>
          </div>
        </div>
        <p className="mt-7 font-medium text-lg leading-7">
          Bagaimana ketentuan perjalanan dinas untuk wilayah operasional?
        </p>
        <div className="mt-7 space-y-4 border-l-2 border-brand pl-5">
          <p className="text-muted-foreground text-sm leading-6">
            Perjalanan dinas memerlukan persetujuan atasan dan mengacu pada
            batas biaya sesuai golongan serta wilayah tujuan.
          </p>
          <div className="flex items-center gap-2 text-primary text-xs">
            <BookOpenText className="size-4" />
            BPP Perjalanan Dinas · Bab 3.2
          </div>
        </div>
        <div className="mt-8 flex items-center justify-between border-t pt-5 text-muted-foreground text-xs">
          <span>Jawaban diperbarui dari dokumen aktif</span>
          <span className="flex items-center gap-1.5 text-brand">
            <Check className="size-3.5" /> Terverifikasi
          </span>
        </div>
      </div>
      <div className="pointer-events-none absolute -right-16 -bottom-24 size-52 rounded-full bg-[radial-gradient(circle,var(--primary)_0%,transparent_68%)] opacity-[0.08]" />
    </div>
  );
}

function Interest() {
  return (
    <section
      className="mx-auto w-full max-w-[1400px] px-4 py-32 md:px-8 md:py-48"
      id="manfaat"
    >
      <div className="mb-16 max-w-3xl">
        <h2
          className="font-semibold text-4xl tracking-[-0.045em] md:text-5xl"
          data-reveal
        >
          Kejelasan yang dapat ditelusuri.
        </h2>
        <p className="mt-6 text-lg text-muted-foreground leading-8" data-reveal>
          Identitas hijau menjaga rasa institusional. Biru menandai aksi. Kuning
          hanya muncul ketika perhatian benar-benar dibutuhkan.
        </p>
      </div>
      <div className="grid grid-flow-dense grid-cols-1 gap-3 md:grid-cols-12 md:grid-rows-2">
        <FeatureCard
          className="md:col-span-8 md:row-span-1"
          description="Setiap jawaban menyertakan dokumen, bab, dan konteks yang bisa diperiksa kembali."
          icon={<FileSearch className="size-5" />}
          title="Jawaban dengan sumber."
        >
          <CitationStrip />
        </FeatureCard>
        <FeatureCard
          className="bg-brand text-brand-foreground md:col-span-4 md:row-span-1"
          description="Hijau membawa identitas, tanpa mengambil alih seluruh antarmuka."
          icon={<ShieldCheck className="size-5" />}
          title="Terasa resmi. Tetap modern."
        />
        <FeatureCard
          className="md:col-span-4 md:row-span-1"
          description="Blue focus, primary action, dan tautan selalu berarti interaksi."
          icon={<Sparkles className="size-5" />}
          title="Warna punya tugas."
        />
        <FeatureCard
          className="bg-primary text-primary-foreground md:col-span-4 md:row-span-1"
          description="Aksi utama terlihat jelas di light maupun dark mode."
          icon={<ArrowRight className="size-5" />}
          title="Tindakan tanpa ragu."
        />
        <FeatureCard
          className="bg-warning-soft text-warning-foreground md:col-span-4 md:row-span-1"
          description="Peringatan tampil tegas, tetapi tidak bersaing dengan tindakan utama."
          icon={<CircleAlert className="size-5" />}
          title="Perhatian yang terukur."
        />
      </div>
    </section>
  );
}

interface FeatureCardProps {
  children?: React.ReactNode;
  className: string;
  description: string;
  icon: React.ReactNode;
  title: string;
}

function FeatureCard({
  children,
  className,
  description,
  icon,
  title,
}: FeatureCardProps) {
  return (
    <article
      className={cn(
        "group min-h-72 overflow-hidden rounded-xl border bg-card p-7 transition-transform duration-700 hover:-translate-y-1 md:p-9",
        className
      )}
      data-reveal
    >
      <div className="flex size-10 items-center justify-center rounded-lg bg-current/10">
        {icon}
      </div>
      <h3 className="mt-12 max-w-md font-semibold text-2xl tracking-[-0.035em]">
        {title}
      </h3>
      <p className="mt-3 max-w-lg text-sm leading-6 opacity-75">
        {description}
      </p>
      {children}
    </article>
  );
}

function CitationStrip() {
  return (
    <div className="mt-10 flex items-center gap-3 overflow-hidden rounded-lg border bg-background p-3 text-sm transition-transform duration-700 group-hover:scale-[1.02]">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-brand-soft text-brand">
        <BookOpenText className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">BPP Perjalanan Dinas</p>
        <p className="text-muted-foreground text-xs">Bab 3.2 · Dokumen aktif</p>
      </div>
      <ChevronRight className="size-4 text-primary" />
    </div>
  );
}

function Narrative() {
  return (
    <section
      className="mx-auto grid w-full max-w-[1400px] gap-16 px-4 py-32 md:grid-cols-[0.8fr_1.2fr] md:px-8 md:py-48"
      data-story
      id="prinsip"
    >
      <div className="h-fit md:pr-12" data-story-title>
        <h2 className="font-semibold text-4xl tracking-[-0.045em] md:text-5xl">
          Tenang di permukaan. Tegas saat dibutuhkan.
        </h2>
        <p className="mt-6 max-w-md text-muted-foreground leading-7">
          Sistem visual menjaga fokus pada kebijakan, bukan dekorasi.
        </p>
      </div>
      <div className="space-y-8">
        {PRINCIPLES.map(({ copy, title, tone }) => (
          <article
            className={`min-h-80 rounded-xl border p-8 md:p-12 ${tone}`}
            data-story-card
            key={title}
          >
            <p className="font-mono text-xs opacity-65">{title}</p>
            <p className="mt-16 max-w-2xl text-2xl leading-10 tracking-[-0.025em] md:text-3xl md:leading-[1.35]">
              {copy}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

function Action() {
  return (
    <>
      <section className="mx-auto w-full max-w-[1400px] px-4 py-32 md:px-8 md:py-48">
        <div
          className="max-w-6xl font-medium text-4xl leading-[1.25] tracking-[-0.045em] md:text-6xl"
          data-scrub-copy
        >
          {STATEMENT_WORDS.map(({ id, word }) => (
            <span className="mr-[0.24em] inline-block" data-word key={id}>
              {word}
            </span>
          ))}
        </div>
      </section>
      <footer className="border-t bg-card">
        <div className="mx-auto grid w-full max-w-[1400px] gap-12 px-4 py-20 md:grid-cols-[1fr_auto] md:items-end md:px-8">
          <div>
            <Quote className="size-7 text-brand" />
            <h2 className="mt-8 max-w-3xl font-semibold text-4xl tracking-[-0.045em] md:text-5xl">
              Pengetahuan perusahaan, tanpa menebak.
            </h2>
            <p className="mt-5 max-w-xl text-muted-foreground leading-7">
              Tinjau arah visual ini pada light dan dark mode sebelum token
              diterapkan ke seluruh produk.
            </p>
          </div>
          <Link
            className="group inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-5 font-medium text-primary-foreground transition-transform duration-200 active:translate-y-px"
            href="/"
          >
            Masuk ke BPPedia
            <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        </div>
        <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-3 border-t px-4 py-6 text-muted-foreground text-xs md:flex-row md:items-center md:justify-between md:px-8">
          <span className="font-semibold text-brand">BPPedia</span>
          <div className="flex items-center gap-5">
            <span data-testid="brand-green">Identitas · Forest</span>
            <span data-testid="action-blue">Interaksi · Azure</span>
            <span data-testid="attention-gold">Perhatian · Gold</span>
          </div>
        </div>
      </footer>
    </>
  );
}

const STATEMENT_WORDS = [
  { id: "knowledge", word: "Pengetahuan" },
  { id: "company", word: "perusahaan" },
  { id: "should", word: "seharusnya" },
  { id: "easy", word: "mudah" },
  { id: "found", word: "ditemukan," },
  { id: "clear", word: "jelas" },
  { id: "source", word: "sumbernya," },
  { id: "and", word: "dan" },
  { id: "safe", word: "aman" },
  { id: "to", word: "untuk" },
  { id: "trusted", word: "dipercaya." },
] as const;

const PRINCIPLES = [
  {
    copy: "Forest green memberi rasa institusional pada wordmark dan navigasi aktif—bukan pada setiap tombol.",
    title: "IDENTITAS",
    tone: "bg-brand text-brand-foreground",
  },
  {
    copy: "Azure blue membuat aksi, tautan, dan fokus keyboard mudah dikenali tanpa mencampur makna.",
    title: "INTERAKSI",
    tone: "bg-primary text-primary-foreground",
  },
  {
    copy: "Golden yellow hadir hanya untuk proses dan peringatan yang memang membutuhkan perhatian.",
    title: "PERHATIAN",
    tone: "bg-warning-soft text-warning-foreground",
  },
] as const;
