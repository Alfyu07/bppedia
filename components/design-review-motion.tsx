"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { ReactNode } from "react";
import { useRef } from "react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

interface DesignReviewMotionProps {
  children: ReactNode;
}

export function DesignReviewMotion({ children }: DesignReviewMotionProps) {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

      if (reduceMotion) {
        return;
      }

      gsap.from("[data-reveal]", {
        duration: 0.8,
        ease: "power3.out",
        opacity: 0,
        stagger: 0.08,
        y: 28,
      });

      ScrollTrigger.matchMedia({
        "(min-width: 768px)": () => {
          ScrollTrigger.create({
            end: "bottom 78%",
            pin: "[data-story-title]",
            pinSpacing: false,
            start: "top 18%",
            trigger: "[data-story]",
          });
        },
      });

      for (const card of gsap.utils.toArray<HTMLElement>("[data-story-card]")) {
        gsap.fromTo(
          card,
          { opacity: 0.3, scale: 0.88, y: 48 },
          {
            ease: "none",
            opacity: 1,
            scale: 1,
            scrollTrigger: {
              end: "top 48%",
              scrub: true,
              start: "top 88%",
              trigger: card,
            },
            y: 0,
          }
        );
      }

      for (const word of gsap.utils.toArray<HTMLElement>("[data-word]")) {
        gsap.fromTo(
          word,
          { opacity: 0.16 },
          {
            ease: "none",
            opacity: 1,
            scrollTrigger: {
              end: "bottom 42%",
              scrub: true,
              start: "top 82%",
              trigger: "[data-scrub-copy]",
            },
          }
        );
      }
    },
    { scope }
  );

  return (
    <div className="w-full max-w-full overflow-x-hidden" ref={scope}>
      {children}
    </div>
  );
}
