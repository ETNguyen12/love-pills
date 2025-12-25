"use client";

import { useEffect, useMemo, useState } from "react";
import GiftCard, { Gift } from "@/components/GiftCard";

export default function HomePage() {
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [loading, setLoading] = useState(true);

  // Confirm modal state
  const [confirmGift, setConfirmGift] = useState<Gift | null>(null);

  // Fullscreen viewer state
  const [viewerGift, setViewerGift] = useState<Gift | null>(null);

  async function loadGifts() {
    setLoading(true);
    const res = await fetch("/api/gifts", { cache: "no-store" });
    const json = await res.json();
    setGifts(Array.isArray(json?.gifts) ? json.gifts : []);
    setLoading(false);
  }

  useEffect(() => {
    loadGifts();
  }, []);

  const openedCount = useMemo(
    () => gifts.filter((g) => g.opened_at).length,
    [gifts]
  );

  async function openGift(gift_number: number) {
    // optimistic
    setGifts((prev) =>
      prev.map((g) =>
        g.gift_number === gift_number
          ? { ...g, opened_at: new Date().toISOString() }
          : g
      )
    );

    const res = await fetch("/api/open", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gift_number }),
    });

    const json = await res.json().catch(() => null);
    if (json?.gift?.opened_at) {
      setGifts((prev) =>
        prev.map((g) =>
          g.gift_number === gift_number
            ? { ...g, opened_at: json.gift.opened_at }
            : g
        )
      );
    }
  }

  function requestOpen(gift: Gift) {
    setConfirmGift(gift);
  }

  async function confirmOpen() {
    if (!confirmGift) return;
    const g = confirmGift;
    setConfirmGift(null);

    // open + then immediately show fullscreen
    await openGift(g.gift_number);

    // use latest url/caption from current state if needed
    const fresh = gifts.find((x) => x.gift_number === g.gift_number) ?? g;
    setViewerGift({ ...fresh, opened_at: new Date().toISOString() });
  }

  function openViewer(gift: Gift) {
    setViewerGift(gift);
  }

  function closeViewer() {
    setViewerGift(null);
  }

  return (
    <main className="min-h-screen px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col items-center gap-4 text-center">
          <h1
            className="text-3xl sm:text-4xl font-semibold"
            style={{ color: "rgba(60,30,80,0.92)" }}
          >
            Open the gift that matches the number from the pill 💝
          </h1>

          <div className="flex justify-center text-sm">
            <div
  className="rounded-2xl px-4 py-2 shadow-sm"
  style={{
    background:
      "linear-gradient(135deg, rgba(255,255,255,0.78), rgba(255,255,255,0.52))",
    border: "1px solid rgba(255,255,255,0.70)",
    backdropFilter: "blur(10px)",
  }}
>
  <div className="text-[10px] tracking-[0.18em] uppercase text-[rgba(60,30,80,0.55)]">
    Opened
  </div>
  <div className="flex items-end gap-2">
    <div
      className="font-extrabold leading-none"
      style={{ fontSize: "clamp(22px, 3.8vw, 34px)", color: "rgba(60,30,80,0.92)" }}
    >
      {openedCount}
    </div>
    <div className="pb-[2px] text-sm text-[rgba(60,30,80,0.55)]">
      / {gifts.length || 53}
    </div>
  </div>
</div>
          </div>
        </div>

        <div className="mt-8">
          {loading ? (
            <div className="text-sm" style={{ color: "rgba(60,30,80,0.65)" }}>
              Loading gifts…
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-5">
              {gifts.map((gift) => (
                <GiftCard
                  key={gift.gift_number}
                  gift={gift}
                  onRequestOpen={requestOpen}
                  onOpenViewer={openViewer}
                  soundEnabled={true}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Confirm Open Modal */}
      {confirmGift && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: "rgba(20,10,30,0.55)" }}
          onClick={() => setConfirmGift(null)}
        >
          <div
            className="w-full max-w-sm rounded-3xl p-5 shadow-xl"
            style={{
              background:
                "linear-gradient(135deg, rgba(255,235,246,0.95), rgba(232,242,255,0.95))",
              border: "1px solid rgba(255,255,255,0.7)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-xl font-semibold text-center text-[rgba(60,30,80,0.92)]">
              Open Gift #{confirmGift.gift_number}?
            </div>
            <div className="mt-2 text-sm text-center text-[rgba(60,30,80,0.65)]">
              Once you open it, it stays open!
            </div>

            <div className="mt-5 flex gap-3">
              <button
                className="flex-1 rounded-2xl py-2.5 bg-white/70 hover:bg-white/90 transition shadow-sm text-black"
                onClick={() => setConfirmGift(null)}
              >
                Cancel
              </button>
              <button
                className="flex-1 rounded-2xl py-2.5 text-white shadow-sm transition active:scale-[0.99]"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(255,120,190,0.95), rgba(140,170,255,0.95))",
                }}
                onClick={confirmOpen}
              >
                Open
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Viewer */}
      {viewerGift && (
        <div
          className="fixed inset-0 z-50"
          style={{ background: "rgba(10,6,16,0.88)" }}
          onClick={closeViewer}
        >
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div
              className="w-full max-w-4xl max-h-[92vh] rounded-3xl overflow-hidden shadow-2xl"
              style={{
                background:
                  "linear-gradient(135deg, rgba(255,235,246,0.25), rgba(232,242,255,0.18))",
                border: "1px solid rgba(255,255,255,0.18)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative">
                {/* Close hint */}
                <button
                  className="absolute right-3 top-3 z-10 rounded-full px-3 py-1 text-xs bg-white/20 text-white backdrop-blur hover:bg-white/30 transition"
                  onClick={closeViewer}
                >
                  close
                </button>

                <div className="bg-black/40">
                  {viewerGift.media_type === "image" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={viewerGift.public_url}
                      alt={viewerGift.caption ?? `Gift ${viewerGift.gift_number}`}
                      className="w-full max-h-[82vh] object-contain"
                      loading="eager"
                    />
                  ) : (
                    <video
                      src={viewerGift.public_url}
                      className="w-full max-h-[82vh] object-contain"
                      controls
                      playsInline
                      autoPlay
                      // helps iOS/Safari
                      preload="auto"
                    />
                  )}
                </div>

                {viewerGift.caption ? (
                  <div className="px-4 py-3 text-center text-sm text-white/90">
                    {viewerGift.caption}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
