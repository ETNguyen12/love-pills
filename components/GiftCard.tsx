"use client";

import confetti from "canvas-confetti";
import { useMemo, useState } from "react";

export type Gift = {
  gift_number: number;
  storage_path: string;
  media_type: "image" | "video";
  caption: string | null;
  opened_at: string | null;
  public_url: string;
};

export default function GiftCard({
  gift,
  onOpen,
  soundEnabled,
}: {
  gift: Gift;
  onOpen: (gift_number: number) => Promise<void>;
  soundEnabled: boolean;
}) {
  const [isAnimating, setIsAnimating] = useState(false);

  const isOpen = !!gift.opened_at;

  const label = useMemo(() => gift.gift_number.toString(), [gift.gift_number]);

  async function handleClick() {
    if (isAnimating) return;

    if (!isOpen) {
      setIsAnimating(true);

      if (soundEnabled) {
        // tiny “unwrap” sound using WebAudio (no file needed)
        try {
          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.type = "triangle";
          o.frequency.value = 440;
          g.gain.value = 0.001;
          o.connect(g);
          g.connect(ctx.destination);
          o.start();
          g.gain.exponentialRampToValueAtTime(0.06, ctx.currentTime + 0.02);
          g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
          o.stop(ctx.currentTime + 0.2);
        } catch {}
      }

      // Start confetti near end of unwrap
      setTimeout(() => {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.65 },
        });
      }, 650);

      // Mark opened in DB
      await onOpen(gift.gift_number);

      // Finish animation
      setTimeout(() => setIsAnimating(false), 900);
    }
  }

  return (
    <button
      onClick={handleClick}
      className="group relative w-full aspect-square rounded-2xl p-3 shadow-sm hover:shadow-md transition-shadow"
      style={{
        background:
          "linear-gradient(135deg, rgba(255,225,244,0.9), rgba(220,235,255,0.9))",
        border: "1px solid rgba(255, 255, 255, 0.6)",
        overflow: "hidden",
      }}
      aria-label={`Gift ${label}`}
    >
      {/* Ribbon / wrap overlay */}
      <div
        className={[
          "absolute inset-0 transition-all duration-700 ease-out",
          isOpen ? "opacity-0 pointer-events-none" : "opacity-100",
          isAnimating ? "scale-105 rotate-2" : "scale-100 rotate-0",
        ].join(" ")}
      >
        <div className="absolute inset-0 opacity-70"
             style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.55), rgba(255,255,255,0.12))" }}
        />
        <div className="absolute left-1/2 top-0 h-full w-10 -translate-x-1/2 opacity-60"
             style={{ background: "linear-gradient(180deg, rgba(255,140,190,0.9), rgba(255,210,235,0.9))" }}
        />
        <div className="absolute top-1/2 left-0 w-full h-10 -translate-y-1/2 opacity-60"
             style={{ background: "linear-gradient(90deg, rgba(255,140,190,0.9), rgba(255,210,235,0.9))" }}
        />
        {/* peel effect */}
        <div
          className={[
            "absolute inset-0",
            "transition-transform duration-700 ease-out",
            isAnimating ? "-translate-y-full -rotate-6" : "translate-y-0 rotate-0",
          ].join(" ")}
          style={{ background: "rgba(255,255,255,0.10)" }}
        />
      </div>

      {/* Number badge */}
      <div className="absolute top-3 left-3 z-10">
        <div className="rounded-full px-3 py-1 text-sm font-semibold shadow-sm"
             style={{ background: "rgba(255,255,255,0.75)" }}>
          {label}
        </div>
      </div>

      {/* Content */}
      <div className="relative z-0 h-full w-full flex items-center justify-center">
        {!isOpen ? (
          <div className="text-center px-2">
            <div className="text-xl font-semibold" style={{ color: "rgba(60,30,80,0.9)" }}>
              Wrapped 💝
            </div>
            <div className="text-xs mt-1" style={{ color: "rgba(60,30,80,0.6)" }}>
              tap to open
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2">
            <div className="w-full h-[72%] rounded-xl overflow-hidden shadow-sm bg-white/50">
              {gift.media_type === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={gift.public_url}
                  alt={gift.caption ?? `Gift ${gift.gift_number}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <video
                  src={gift.public_url}
                  className="w-full h-full object-cover"
                  controls
                  playsInline
                  preload="metadata"
                />
              )}
            </div>
            {gift.caption ? (
              <div className="text-sm text-center px-2" style={{ color: "rgba(60,30,80,0.85)" }}>
                {gift.caption}
              </div>
            ) : (
              <div className="text-xs text-center px-2" style={{ color: "rgba(60,30,80,0.55)" }}>
                opened ✨
              </div>
            )}
          </div>
        )}
      </div>

      {/* subtle hover glow */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
           style={{ boxShadow: "inset 0 0 0 2px rgba(255,255,255,0.6)" }}
      />
    </button>
  );
}
