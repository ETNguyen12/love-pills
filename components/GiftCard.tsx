"use client";

import confetti from "canvas-confetti";
import { useEffect, useMemo, useRef, useState } from "react";

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
  onRequestOpen,
  onOpenViewer,
  soundEnabled,
}: {
  gift: Gift;
  onRequestOpen: (gift: Gift) => void;
  onOpenViewer: (gift: Gift) => void;
  soundEnabled: boolean;
}) {
  const [isAnimating, setIsAnimating] = useState(false);
  const wasOpenRef = useRef<boolean>(!!gift.opened_at);
  const isOpen = !!gift.opened_at;

  const label = useMemo(() => gift.gift_number.toString(), [gift.gift_number]);

  // Fire confetti when it transitions from wrapped -> opened (after confirm + DB update)
  useEffect(() => {
    const wasOpen = wasOpenRef.current;
    if (!wasOpen && isOpen) {
      // a little celebratory pop
      setTimeout(() => {
        confetti({ particleCount: 90, spread: 70, origin: { y: 0.65 } });
      }, 250);
    }
    wasOpenRef.current = isOpen;
  }, [isOpen]);

  function tinyUnwrapSound() {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "triangle";
      o.frequency.setValueAtTime(520, ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.18);
      g.gain.value = 0.001;
      o.connect(g);
      g.connect(ctx.destination);
      o.start();
      g.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
      o.stop(ctx.currentTime + 0.24);
    } catch {}
  }

  async function handleClick() {
    if (isAnimating) return;

    if (!isOpen) {
      // satisfyingly “start unwrap” then ask to confirm open
      setIsAnimating(true);
      tinyUnwrapSound();

      // small local animation delay so it feels responsive
      setTimeout(() => {
        setIsAnimating(false);
        onRequestOpen(gift);
      }, 520);

      return;
    }

    // Opened: go fullscreen
    onOpenViewer(gift);
  }

  return (
    <button
      onClick={handleClick}
      className="group relative w-full aspect-square rounded-[26px] p-3 shadow-[0_10px_30px_rgba(0,0,0,0.10)] hover:shadow-[0_14px_40px_rgba(0,0,0,0.14)] transition-shadow"
      style={{
        background:
          "linear-gradient(135deg, rgba(255,235,246,0.95), rgba(25, 96, 189, 0.95))",
        border: "1px solid rgba(255, 255, 255, 0.70)",
        overflow: "hidden",
      }}
      aria-label={`Gift ${label}`}
    >
      {/* WRAP OVERLAY (only while wrapped) */}
      <div
        className={[
          "absolute inset-0 transition-all duration-700 ease-out",
          isOpen ? "opacity-0 pointer-events-none" : "opacity-100",
        ].join(" ")}
      >
        {/* soft paper sheen */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 25% 20%, rgba(255,255,255,0.85), rgba(255,255,255,0.12) 55%, rgba(255,255,255,0.10))",
            opacity: 0.55,
          }}
        />

        {/* ribbon cross */}
        <div
          className="absolute left-1/2 top-0 h-full w-12 -translate-x-1/2"
          style={{
            background:
              "linear-gradient(180deg, rgba(255,120,190,0.95), rgba(255,210,235,0.92))",
            opacity: 0.8,
          }}
        />
        <div
          className="absolute top-1/2 left-0 w-full h-12 -translate-y-1/2"
          style={{
            background:
              "linear-gradient(90deg, rgba(255,120,190,0.95), rgba(255,210,235,0.92))",
            opacity: 0.8,
          }}
        />

        {/* peel sheet */}
        <div
          className={[
            "absolute inset-0",
            "transition-transform duration-700 ease-out",
            isAnimating ? "-translate-y-[115%] -rotate-6" : "translate-y-0 rotate-0",
          ].join(" ")}
          style={{
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.22), rgba(255,255,255,0.06))",
          }}
        />

        {/* EMOJI BOW */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
            <div
                style={{
                fontSize: "clamp(32px, 10vw, 56px)",
                filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.25))",
                transform: isAnimating ? "scale(0.9) rotate(-6deg)" : "scale(1)",
                transition: "transform 0.3s ease",
            }}
            >
                🎀
            </div>
        </div>


        {/* big number badge (more apparent) */}
        <div className="absolute top-3 left-3">
            <div
                className="grid place-items-center rounded-2xl shadow-sm"
                style={{
                background: "rgba(255,255,255,0.82)",
                border: "1px solid rgba(255,255,255,0.65)",
                backdropFilter: "blur(10px)",
                width: "clamp(44px, 18%, 62px)",
                height: "clamp(44px, 18%, 62px)",
                }}
            >
                <div
                className="font-extrabold text-[rgba(60,30,80,0.92)]"
                style={{
                    fontSize: "clamp(18px, 4.5vw, 30px)",
                    lineHeight: 1,
                    letterSpacing: "-0.02em",
                    transform: "translateY(0.5px)", // tiny optical centering
                }}
                >
                {label}
                </div>
            </div>
            </div>

      </div>

      {/* CONTENT */}
      <div className="relative z-0 h-full w-full rounded-2xl overflow-hidden">
        {!isOpen ? (
          // wrapped state just shows the wrap overlay (no extra text)
          <div className="h-full w-full" />
        ) : (
          // opened state: ONLY media (no number/text)
          <>
            {gift.media_type === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={gift.public_url}
                alt={gift.caption ?? `Gift ${gift.gift_number}`}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="relative h-full w-full bg-black/20">
                <video
                  src={gift.public_url}
                  className="h-full w-full object-cover"
                  // grid preview (no controls). Fullscreen modal uses controls+autoplay.
                  muted
                  playsInline
                  preload="metadata"
                />
                {/* play icon hint */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div
                    className="rounded-full px-3 py-2 text-xs font-semibold"
                    style={{
                      background: "rgba(255,255,255,0.22)",
                      color: "rgba(255,255,255,0.92)",
                      backdropFilter: "blur(8px)",
                      border: "1px solid rgba(255,255,255,0.18)",
                    }}
                  >
                    ▶︎
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* subtle hover ring */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ boxShadow: "inset 0 0 0 2px rgba(255,255,255,0.55)" }}
      />
    </button>
  );
}
