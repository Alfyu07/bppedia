import {
  ArrowDownRight,
  ArrowRight,
  BookOpenText,
  Check,
  CircleAlert,
  FileSearch,
  Search,
  ShieldCheck,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { DesignReviewMotion } from "@/components/design-review-motion";

export const metadata: Metadata = {
  description: "Eksplorasi brand-led cinematic untuk BPPedia.",
  title: "Design Review · BPPedia",
};

export default function DesignReviewPage() {
  return (
    <DesignReviewMotion>
      <main className="min-h-[100dvh] w-full max-w-full overflow-x-hidden bg-background text-foreground">
        <Navigation />
        <Hero />
        <Manifesto />
        <ColorSystem />
        <PolicyJourney />
        <Marquee />
        <Action />
      </main>
    </DesignReviewMotion>
  );
}

function Navigation() {
  return (
    <nav
      aria-label="Navigasi utama"
      className="fixed top-4 right-0 left-0 z-20 mx-auto flex h-14 w-[calc(100%-2rem)] max-w-[1340px] items-center justify-between rounded-xl border border-white/10 bg-background/88 px-4 shadow-[0_12px_40px_-24px_oklch(0.12_0.04_160/0.45)] backdrop-blur-xl md:top-6 md:px-5"
      data-reveal
    >
      <Link
        className="font-semibold text-brand text-lg tracking-[-0.045em] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
        href="/design-review"
      >
        BPPedia
      </Link>
      <div className="hidden items-center gap-7 text-muted-foreground text-xs md:flex">
        <a className="transition-colors hover:text-foreground" href="#gagasan">
          Gagasan
        </a>
        <a className="transition-colors hover:text-foreground" href="#warna">
          Sistem warna
        </a>
        <a className="transition-colors hover:text-foreground" href="#alur">
          Pengalaman
        </a>
      </div>
      <Link
        className="group inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3.5 font-medium text-primary-foreground text-xs transition-transform duration-200 active:translate-y-px"
        href="/"
      >
        Buka produk
        <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
      </Link>
    </nav>
  );
}

function Hero() {
  return (
    <section className="relative flex min-h-[100dvh] items-center overflow-hidden bg-[linear-gradient(145deg,var(--background)_0%,var(--background)_54%,var(--brand-soft)_100%)] pt-24">
      <div className="pointer-events-none absolute inset-0 opacity-[0.22] [background-image:linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] [background-size:72px_72px] [mask-image:linear-gradient(to_bottom,black,transparent_82%)]" />
      <div className="relative mx-auto grid w-full max-w-[1400px] items-center gap-12 px-4 py-20 md:grid-cols-[1.05fr_0.95fr] md:px-8 md:py-28">
        <div className="relative z-10 max-w-6xl">
          <p
            className="mb-7 max-w-md font-mono text-brand text-xs leading-5 tracking-[0.12em]"
            data-reveal
          >
            RUJUKAN RESMI. PEMAHAMAN YANG BERGERAK.
          </p>
          <h1
            className="max-w-6xl text-balance font-semibold text-[clamp(3rem,6.2vw,6.25rem)] leading-[0.93] tracking-[-0.065em]"
            data-reveal
          >
            Pengetahuan yang bergerak bersama perusahaan.
          </h1>
          <p
            className="mt-8 max-w-xl text-balance text-lg text-muted-foreground leading-8 md:text-xl"
            data-reveal
          >
            BPPedia mengubah pedoman yang padat menjadi jawaban yang hidup,
            dapat ditelusuri, dan selalu berpijak pada sumber resmi.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row" data-reveal>
            <Link
              className="group inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-primary px-5 font-medium text-primary-foreground transition-transform duration-200 active:translate-y-px"
              href="/"
            >
              Jelajahi BPPedia
              <ArrowDownRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:translate-y-0.5" />
            </Link>
            <a
              className="inline-flex h-12 items-center justify-center rounded-lg border bg-card/75 px-5 font-medium transition-colors hover:bg-card"
              href="#gagasan"
            >
              Lihat gagasan visual
            </a>
          </div>
        </div>
        <InstitutionRibbon />
      </div>
      <div className="absolute right-8 bottom-7 hidden items-center gap-3 font-mono text-muted-foreground text-[10px] tracking-[0.14em] md:flex">
        <span className="h-px w-16 bg-border" />
        GULIR UNTUK MENELUSURI
      </div>
    </section>
  );
}

function InstitutionRibbon() {
  return (
    <div
      aria-hidden="true"
      className="relative mx-auto aspect-[4/5] w-full max-w-[590px]"
      data-reveal
      data-testid="institution-ribbon"
    >
      <div className="absolute inset-[8%] rounded-[42%_58%_48%_52%/52%_42%_58%_48%] bg-brand opacity-10 blur-3xl" />
      <svg
        className="absolute inset-0 h-full w-full overflow-visible"
        fill="none"
        viewBox="0 0 620 760"
      >
        <path
          d="M87 648C-1 531 46 362 179 297C291 243 291 123 350 57C380 24 428 17 490 25C413 110 422 205 505 302C604 417 539 602 403 670C289 727 165 752 87 648Z"
          data-ribbon-part
          fill="var(--brand)"
        />
        <path
          d="M87 648C30 572 28 476 71 398C109 329 168 300 225 281C263 332 274 387 255 447C230 524 230 599 281 704C198 721 130 705 87 648Z"
          data-ribbon-part
          fill="var(--primary)"
        />
        <path
          d="M350 57C380 24 428 17 490 25C413 110 422 205 505 302C565 372 563 464 524 542C476 507 443 451 432 375C416 262 328 196 350 57Z"
          data-ribbon-part
          fill="var(--warning)"
        />
        <path
          d="M66 627C-1 523 48 370 179 306"
          data-ribbon-line
          opacity="0.35"
          stroke="var(--foreground)"
          strokeDasharray="4 10"
          strokeWidth="1"
        />
        <circle cx="180" cy="306" fill="var(--background)" r="7" />
        <circle cx="180" cy="306" fill="var(--brand)" r="3" />
      </svg>
      <div className="absolute top-[15%] right-[3%] rounded-lg border bg-card/85 px-3 py-2 font-mono text-[10px] shadow-sm backdrop-blur-md">
        SELALU BERKEMBANG
      </div>
      <div className="absolute bottom-[12%] left-[1%] max-w-40 rounded-lg border bg-card/85 p-3 text-xs leading-5 shadow-sm backdrop-blur-md">
        Satu sistem. Banyak konteks.
      </div>
    </div>
  );
}

function Manifesto() {
  return (
    <section
      className="relative overflow-hidden bg-brand text-brand-foreground"
      id="gagasan"
    >
      <div className="pointer-events-none absolute -top-32 -right-20 size-[34rem] rounded-full border border-brand-foreground/15" />
      <div className="pointer-events-none absolute -right-10 -bottom-52 size-[46rem] rounded-full border border-brand-foreground/10" />
      <div className="relative mx-auto grid min-h-[95dvh] w-full max-w-[1400px] content-between px-4 py-24 md:px-8 md:py-32">
        <div className="flex items-start justify-between gap-8" data-reveal>
          <p className="max-w-xs font-mono text-[10px] leading-5 tracking-[0.14em] opacity-65">
            DARI DOKUMEN YANG DIAM MENUJU PENGETAHUAN YANG DAPAT DIAJAK
            BERDIALOG
          </p>
          <BookOpenText className="size-7 opacity-70" strokeWidth={1.5} />
        </div>
        <h2
          className="max-w-6xl text-balance font-medium text-[clamp(3rem,7vw,7.5rem)] leading-[0.92] tracking-[-0.07em]"
          data-reveal
        >
          Kebijakan bukan halaman statis.
        </h2>
        <div
          className="grid gap-8 border-brand-foreground/20 border-t pt-8 md:grid-cols-3"
          data-reveal
        >
          <p className="font-medium text-lg">Ia berubah bersama perusahaan.</p>
          <p className="max-w-sm text-sm leading-7 opacity-70">
            Versi, konteks, dan sumber harus tetap terlihat saat informasi
            diterjemahkan menjadi jawaban.
          </p>
          <p className="max-w-sm text-sm leading-7 opacity-70">
            Karena kecepatan menemukan informasi tidak boleh mengorbankan
            kepercayaan terhadapnya.
          </p>
        </div>
      </div>
    </section>
  );
}

function ColorSystem() {
  return (
    <section
      className="mx-auto w-full max-w-[1400px] px-4 py-32 md:px-8 md:py-48"
      id="warna"
    >
      <div className="mb-16 grid gap-8 md:grid-cols-[1fr_0.8fr] md:items-end">
        <h2
          className="max-w-4xl font-semibold text-4xl tracking-[-0.05em] md:text-6xl"
          data-reveal
        >
          Satu identitas. Tiga tugas warna.
        </h2>
        <p
          className="max-w-lg text-muted-foreground leading-7 md:justify-self-end"
          data-reveal
        >
          Palet berasal dari karakter visual instansi, lalu disusun ulang agar
          setiap warna memiliki tanggung jawab yang jelas di dalam produk.
        </p>
      </div>
      <div
        className="group flex flex-col gap-2 md:h-[620px] md:flex-row"
        data-color-accordion
      >
        {COLOR_ROLES.map((role) => (
          <article
            className={`relative min-h-80 overflow-hidden rounded-xl border p-6 transition-[flex] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] md:min-h-0 md:flex-1 md:p-8 md:hover:flex-[2.4] ${role.tone}`}
            key={role.name}
          >
            <div className="flex h-full flex-col justify-between">
              <div className="flex items-center justify-between gap-4">
                <p className="font-mono text-[10px] tracking-[0.14em] opacity-65">
                  {role.name}
                </p>
                <span className="font-mono text-[10px] opacity-45">
                  {role.ratio}
                </span>
              </div>
              <div className="max-w-sm">
                <role.icon className="mb-7 size-6" strokeWidth={1.5} />
                <h3 className="font-semibold text-3xl tracking-[-0.045em]">
                  {role.title}
                </h3>
                <p className="mt-4 text-sm leading-7 opacity-70">{role.copy}</p>
              </div>
            </div>
            <div className="pointer-events-none absolute -right-28 -bottom-28 size-72 rounded-full border border-current opacity-10 transition-transform duration-700 md:group-hover:scale-110" />
          </article>
        ))}
      </div>
    </section>
  );
}

function PolicyJourney() {
  return (
    <section
      className="mx-auto grid w-full max-w-[1400px] gap-16 px-4 py-32 md:grid-cols-[0.72fr_1.28fr] md:px-8 md:py-48"
      data-story
      id="alur"
    >
      <div className="h-fit md:pr-10" data-story-title>
        <p className="mb-6 font-mono text-brand text-[10px] tracking-[0.14em]">
          DARI PERTANYAAN MENUJU KEPASTIAN
        </p>
        <h2 className="font-semibold text-4xl tracking-[-0.05em] md:text-6xl">
          Sumber tetap dekat dengan jawaban.
        </h2>
        <p className="mt-6 max-w-md text-muted-foreground leading-7">
          Pengalaman bergerak cepat, tetapi jejak dokumen tidak pernah hilang.
        </p>
      </div>
      <div className="space-y-6">
        <JourneyCard
          detail="Karyawan bertanya dengan bahasa sehari-hari, tanpa perlu mengetahui nomor dokumen."
          number="01"
          title="Mulai dari konteks."
        >
          <div className="mt-12 flex items-center gap-3 rounded-lg border bg-background/65 p-4">
            <Search className="size-4 text-primary" />
            <span className="text-sm">
              Bagaimana aturan perjalanan dinas antarkota?
            </span>
          </div>
        </JourneyCard>
        <JourneyCard
          detail="Jawaban singkat hadir lebih dulu, disertai bab dan dokumen aktif yang membentuknya."
          number="02"
          title="Jawaban membawa bukti."
          tone="bg-primary text-primary-foreground"
        >
          <div className="mt-12 border-primary-foreground/40 border-l-2 pl-4 text-sm leading-7 opacity-80">
            Perjalanan dinas memerlukan persetujuan atasan dan mengikuti batas
            biaya sesuai golongan.
          </div>
        </JourneyCard>
        <JourneyCard
          detail="Satu tindakan membuka sumber, versi, dan halaman terkait tanpa meninggalkan alur pencarian."
          number="03"
          title="Periksa tanpa kehilangan alur."
          tone="bg-brand text-brand-foreground"
        >
          <div className="mt-12 flex items-center justify-between rounded-lg border border-brand-foreground/20 p-4 text-sm">
            <span className="flex items-center gap-2">
              <BookOpenText className="size-4" /> BPP Perjalanan Dinas · Bab 3.2
            </span>
            <ArrowRight className="size-4" />
          </div>
        </JourneyCard>
      </div>
    </section>
  );
}

interface JourneyCardProps {
  children: React.ReactNode;
  detail: string;
  number: string;
  title: string;
  tone?: string;
}

function JourneyCard({
  children,
  detail,
  number,
  title,
  tone,
}: JourneyCardProps) {
  return (
    <article
      className={`min-h-[430px] overflow-hidden rounded-xl border bg-card p-7 md:p-10 ${tone ?? ""}`}
      data-story-card
    >
      <div className="flex items-start justify-between gap-8">
        <p className="font-mono text-xs opacity-50">{number}</p>
        <Check className="size-5 opacity-60" strokeWidth={1.5} />
      </div>
      <div className="mt-24 max-w-xl">
        <h3 className="font-semibold text-3xl tracking-[-0.045em] md:text-4xl">
          {title}
        </h3>
        <p className="mt-5 max-w-md text-sm leading-7 opacity-65">{detail}</p>
        {children}
      </div>
    </article>
  );
}

function Marquee() {
  return (
    <section
      aria-label="Prinsip BPPedia"
      className="overflow-hidden border-y bg-card py-7"
    >
      <div className="flex w-max items-center" data-marquee-track>
        {MARQUEE_LOOP.map((item) => (
          <div className="flex items-center" key={item.loopId}>
            <span className="px-8 font-medium text-xl tracking-[-0.025em] md:px-12 md:text-3xl">
              {item.label}
            </span>
            <span className={`size-2 rounded-full ${item.dot}`} />
          </div>
        ))}
      </div>
    </section>
  );
}

function Action() {
  return (
    <footer className="relative overflow-hidden bg-[linear-gradient(135deg,var(--brand)_0%,var(--brand)_48%,var(--primary)_100%)] text-brand-foreground">
      <div className="pointer-events-none absolute inset-0 opacity-15 [background-image:radial-gradient(circle_at_center,currentColor_1px,transparent_1px)] [background-size:28px_28px]" />
      <div className="relative mx-auto flex min-h-[86dvh] w-full max-w-[1400px] flex-col justify-between px-4 py-20 md:px-8 md:py-28">
        <div
          className="flex items-center justify-between border-brand-foreground/20 border-b pb-6 font-mono text-[10px] tracking-[0.14em]"
          data-reveal
        >
          <span>BPPEDIA</span>
          <span>KNOWLEDGE, IN MOTION</span>
        </div>
        <div className="py-20">
          <p className="max-w-xs text-sm leading-7 opacity-70" data-reveal>
            Sebuah identitas digital untuk kebijakan yang terus berkembang,
            tanpa kehilangan sumber yang membuatnya dapat dipercaya.
          </p>
          <h2
            className="mt-10 max-w-6xl text-balance font-medium text-[clamp(3.4rem,8vw,8rem)] leading-[0.9] tracking-[-0.075em]"
            data-reveal
          >
            Bergerak cepat. Tetap berpijak.
          </h2>
        </div>
        <div
          className="flex flex-col gap-6 border-brand-foreground/20 border-t pt-8 md:flex-row md:items-end md:justify-between"
          data-reveal
        >
          <p className="max-w-lg text-sm leading-7 opacity-70">
            Forest untuk identitas. Azure untuk tindakan. Gold untuk perhatian.
          </p>
          <Link
            className="group inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-background px-5 font-medium text-foreground transition-transform duration-200 active:translate-y-px"
            href="/"
          >
            Masuk ke BPPedia
            <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </footer>
  );
}

const COLOR_ROLES = [
  {
    copy: "Menandai asal, kepemilikan, dan posisi pengguna di dalam sistem.",
    icon: ShieldCheck,
    name: "FOREST / IDENTITAS",
    ratio: "10%",
    title: "Milik institusi.",
    tone: "bg-brand text-brand-foreground",
  },
  {
    copy: "Mengarahkan setiap tindakan, tautan, pilihan, dan fokus keyboard.",
    icon: FileSearch,
    name: "AZURE / INTERAKSI",
    ratio: "4%",
    title: "Siap ditindaklanjuti.",
    tone: "bg-primary text-primary-foreground",
  },
  {
    copy: "Muncul hanya ketika proses atau informasi membutuhkan perhatian.",
    icon: CircleAlert,
    name: "GOLD / PERHATIAN",
    ratio: "1%",
    title: "Layak diperhatikan.",
    tone: "bg-warning-soft text-warning-foreground",
  },
] as const;

const MARQUEE_ITEMS = [
  { dot: "bg-brand", id: "traceable", label: "Dapat ditelusuri" },
  { dot: "bg-primary", id: "contextual", label: "Kontekstual" },
  { dot: "bg-warning", id: "current", label: "Selalu mutakhir" },
  { dot: "bg-brand", id: "trusted", label: "Layak dipercaya" },
] as const;

const MARQUEE_LOOP = [
  ...MARQUEE_ITEMS.map((item) => ({ ...item, loopId: `${item.id}-a` })),
  ...MARQUEE_ITEMS.map((item) => ({ ...item, loopId: `${item.id}-b` })),
];
