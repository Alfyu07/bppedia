import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { chromium } from "@playwright/test";
import {
  getMockDocumentOverview,
  getMockDocumentSlugs,
} from "@/lib/mocks/documents";

async function main() {
  const browser = await chromium.launch({ headless: true });

  try {
    await Promise.all(
      getMockDocumentSlugs().map(async (slug) => {
        const document = getMockDocumentOverview(slug);
        if (!document) {
          return;
        }

        const page = await browser.newPage();
        const pages = Array.from(
          { length: document.pageCount },
          (_, index) => `
            <section>
              <header>${document.title} · Versi ${document.versionLabel}</header>
              <main>
                <h1>${document.title}</h1>
                <p>${document.summary}</p>
                <p>Konten mock halaman ${index + 1} untuk validasi pratinjau frontend BPPedia.</p>
              </main>
              <footer>Halaman ${index + 1} dari ${document.pageCount}</footer>
            </section>`
        ).join("");
        await page.setContent(`
          <!doctype html>
          <html lang="id">
            <head>
              <meta charset="utf-8" />
              <style>
                @page { size: A4; margin: 0; }
                * { box-sizing: border-box; }
                body { margin: 0; color: #18211c; font: 16px Arial, sans-serif; }
                section { display: flex; flex-direction: column; min-height: 297mm; padding: 22mm 20mm 18mm; page-break-after: always; }
                header, footer { color: #526258; font-size: 12px; }
                main { flex: 1; padding-top: 34mm; }
                h1 { font-size: 28px; margin: 0 0 18px; }
                p { line-height: 1.7; max-width: 65ch; }
              </style>
            </head>
            <body>${pages}</body>
          </html>`);

        const output = join(process.cwd(), "public", document.pdfHref);
        await mkdir(dirname(output), { recursive: true });
        await page.pdf({
          format: "A4",
          outline: true,
          path: output,
          printBackground: true,
          tagged: true,
        });
        const pdf = await readFile(output);
        await writeFile(
          output,
          pdf
            .toString("latin1")
            .replaceAll(/D:\d{14}\+00'00'/g, "D:20260101000000+00'00'"),
          "latin1"
        );
        await page.close();
      })
    );
  } finally {
    await browser.close();
  }
}

main().catch((error: unknown) => {
  process.stderr.write(`${String(error)}\n`);
  process.exitCode = 1;
});
