import { expect, type Locator, test } from "@playwright/test";
import { ModelSelectorContent } from "../../components/ai-elements/model-selector";
import { badgeVariants } from "../../components/ui/badge";
import { Button, buttonVariants } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { PopoverContent } from "../../components/ui/popover";
import { Textarea } from "../../components/ui/textarea";

const readToken = async (
  page: import("@playwright/test").Page,
  token: string
) =>
  page.locator("html").evaluate((element, property) => {
    const value = getComputedStyle(element).getPropertyValue(property).trim();
    if (/^#[\da-f]{6,8}$/i.test(value)) {
      return value.toUpperCase();
    }
    if (/^\.\d+s$/.test(value)) {
      return `${Number.parseFloat(value) * 1000}ms`;
    }
    return /^\.\d+rem$/.test(value) ? `0${value}` : value;
  }, token);

const readContrast = (locator: Locator) =>
  locator.evaluate((element) => {
    const parseRgb = (value: string) =>
      value
        .match(/[\d.]+/g)
        ?.slice(0, 3)
        .map(Number) ?? [0, 0, 0];
    const luminance = (rgb: number[]) => {
      const [red, green, blue] = rgb.map((channel) => {
        const value = channel / 255;
        return value <= 0.040_45
          ? value / 12.92
          : ((value + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
    };
    const styles = getComputedStyle(element);
    const foreground = luminance(parseRgb(styles.color));
    const background = luminance(parseRgb(styles.backgroundColor));
    return (
      (Math.max(foreground, background) + 0.05) /
      (Math.min(foreground, background) + 0.05)
    );
  });

test.describe("BPPedia design system", () => {
  test("exposes canonical light and dark semantic tokens", async ({ page }) => {
    await page.goto("/admin");

    await expect.poll(() => readToken(page, "--brand")).toBe("#0B6B48");
    await expect.poll(() => readToken(page, "--primary")).toBe("#0878D1");
    await expect.poll(() => readToken(page, "--warning")).toBe("#E3A500");
    await expect.poll(() => readToken(page, "--surface-2")).toBe("#F1F4F3");
    await expect.poll(() => readToken(page, "--motion-base")).toBe("200ms");
    await expect.poll(() => readToken(page, "--radius-control")).toBe("0.5rem");

    await page
      .locator("html")
      .evaluate((element) => element.classList.add("dark"));

    await expect.poll(() => readToken(page, "--background")).toBe("#07100D");
    await expect.poll(() => readToken(page, "--brand")).toBe("#E7F3ED");
    await expect.poll(() => readToken(page, "--warning-soft")).toBe("#3D310F");
    await expect
      .poll(() => readToken(page, "--hairline-strong"))
      .toBe("#385047");
  });

  test("synchronizes browser chrome with explicit theme", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("theme", "dark"));
    await page.goto("/admin/login");

    await expect(page.locator("html")).toHaveClass(/dark/);
    const background = await page
      .locator("html")
      .evaluate((element) =>
        getComputedStyle(element).getPropertyValue("--background").trim()
      );
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute(
      "content",
      background
    );
  });

  test("shows keyboard focus and suppresses non-essential motion", async ({
    browser,
  }) => {
    const context = await browser.newContext({ reducedMotion: "reduce" });
    const page = await context.newPage();
    await page.goto("/admin/login");
    await page.locator("main").evaluate((main) => {
      main.append(
        document.createElement("input"),
        document.createElement("button")
      );
    });

    const firstField = page.getByRole("textbox").first();
    await firstField.focus();
    await expect
      .poll(() =>
        firstField.evaluate((element) => getComputedStyle(element).outlineWidth)
      )
      .toBe("2px");
    await expect
      .poll(() =>
        firstField.evaluate(
          (element) => getComputedStyle(element).outlineOffset
        )
      )
      .toBe("2px");
    const submit = page.getByRole("button").first();
    await expect
      .poll(() =>
        submit.evaluate((element) => {
          const duration = getComputedStyle(element).transitionDuration;
          return duration.endsWith("ms")
            ? Number.parseFloat(duration)
            : Number.parseFloat(duration) * 1000;
        })
      )
      .toBe(0.01);

    await context.close();
  });

  test("uses approved primitive geometry and preserves compact buttons", async ({
    page,
  }) => {
    await page.goto("/admin/login");
    const classNames = {
      compact: Button({ className: "h-7" }).props.className,
      defaultButton: buttonVariants(),
      input: Input({}).props.className,
      largeButton: buttonVariants({ size: "lg" }),
      popover: PopoverContent({}).props.children.props.className,
      textarea: Textarea({}).props.className,
    };
    await page.locator("main").evaluate((main, classes) => {
      for (const [name, className] of Object.entries(classes)) {
        const element = document.createElement(
          name === "input"
            ? "input"
            : name === "textarea"
              ? "textarea"
              : name === "popover"
                ? "div"
                : "button"
        );
        element.dataset.testid = name;
        element.className = className;
        main.append(element);
      }
    }, classNames);

    await expect
      .poll(() =>
        page
          .getByTestId("input")
          .evaluate((element) => getComputedStyle(element).height)
      )
      .toBe("40px");
    await expect
      .poll(() =>
        page
          .getByTestId("defaultButton")
          .evaluate((element) => getComputedStyle(element).height)
      )
      .toBe("40px");
    await expect
      .poll(() =>
        page
          .getByTestId("largeButton")
          .evaluate((element) => getComputedStyle(element).height)
      )
      .toBe("40px");
    await expect
      .poll(() =>
        page
          .getByTestId("compact")
          .evaluate((element) => getComputedStyle(element).height)
      )
      .toBe("28px");

    await Promise.all(
      ["input", "defaultButton", "textarea"].map((testId) =>
        expect
          .poll(() =>
            page
              .getByTestId(testId)
              .evaluate((element) => getComputedStyle(element).borderRadius)
          )
          .toBe("8px")
      )
    );
    await expect
      .poll(() =>
        page
          .getByTestId("popover")
          .evaluate((element) => getComputedStyle(element).borderRadius)
      )
      .toBe("12px");
  });

  test("uses accessible semantic primitive states", async ({ page }) => {
    const neutral = badgeVariants({ variant: "neutral" });
    const destructive = buttonVariants({ variant: "destructive" });
    expect(neutral).toContain("bg-surface-3");
    expect(neutral).not.toContain("focus-visible:ring-[3px]");
    expect(badgeVariants({ variant: "warning" })).toContain("bg-warning-soft");
    expect(badgeVariants({ variant: "success" })).toContain("bg-success-soft");
    expect(badgeVariants({ variant: "error" })).toContain(
      "bg-destructive-soft"
    );

    await page.goto("/admin/login");
    await page.locator("main").evaluate(
      (main, classNames) => {
        const badge = document.createElement("a");
        badge.href = "#";
        badge.dataset.testid = "neutral-badge";
        badge.className = classNames.neutral;
        badge.textContent = "Neutral";
        const destructiveButton = document.createElement("button");
        destructiveButton.dataset.testid = "destructive-button";
        destructiveButton.className = classNames.destructive;
        destructiveButton.textContent = "Delete";
        main.append(badge, destructiveButton);
      },
      { destructive, neutral }
    );

    const badge = page.getByTestId("neutral-badge");
    await expect.poll(() => readContrast(badge)).toBeGreaterThanOrEqual(4.5);
    await badge.focus();
    await expect
      .poll(() =>
        badge.evaluate((element) => getComputedStyle(element).outlineWidth)
      )
      .toBe("2px");
    await expect
      .poll(() =>
        badge.evaluate((element) => getComputedStyle(element).outlineOffset)
      )
      .toBe("2px");
    await expect
      .poll(() =>
        badge.evaluate((element) =>
          /\b[1-9]\d*(?:\.\d+)?px\b/.test(getComputedStyle(element).boxShadow)
        )
      )
      .toBe(false);

    await page
      .locator("html")
      .evaluate((element) => element.classList.add("dark"));
    const destructiveButton = page.getByTestId("destructive-button");
    await destructiveButton.hover();
    await expect
      .poll(() => readContrast(destructiveButton))
      .toBeGreaterThanOrEqual(4.5);
  });

  test("keeps model selector on the shared popover visual contract", () => {
    const { className } = ModelSelectorContent({ children: null }).props;
    expect(className).not.toContain("bg-card/95");
    expect(className).not.toContain("backdrop-blur-xl");
    expect(className).not.toContain("shadow-[var(--shadow-float)]");
    expect(className).not.toContain("border-border/60");
  });

  test("uses the text-only BPPedia wordmark in shared chrome", async ({
    page,
  }) => {
    await page.goto("/admin");

    const wordmark = page.getByRole("link", { name: "BPPedia Admin" });
    await expect(wordmark).toBeVisible();
    await expect(wordmark.locator("svg")).toHaveCount(0);
    await expect
      .poll(() =>
        wordmark.evaluate((element) => getComputedStyle(element).fontWeight)
      )
      .toBe("600");
    await expect
      .poll(() =>
        wordmark.evaluate((element) => getComputedStyle(element).color)
      )
      .not.toBe("rgb(0, 0, 0)");
    await expect
      .poll(() =>
        wordmark.evaluate((element) => {
          const probe = document.createElement("span");
          probe.style.color = "var(--brand)";
          document.body.append(probe);
          const brandColor = getComputedStyle(probe).color;
          probe.remove();
          return getComputedStyle(element).color === brandColor;
        })
      )
      .toBe(true);
  });
});
