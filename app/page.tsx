"use client";

import { useEffect, useMemo, useState } from "react";
import GiftCard, { Gift } from "@/components/GiftCard";

export default function HomePage() {
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(false);

  async function loadGifts() {
    setLoading(true);
    const res = await fetch("/api/gifts", { cache: "no-store" });
    const json = await res.json();
    setGifts(json.gifts || []);
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
    // Optimistic UI update (instant “open”)
    setGifts((prev) =>
      prev.map((g) =>
        g.gift_number === gift_number ? { ...g, opened_at: new Date().toISOString() } : g
      )
    );

    const res = await fetch("/api/open", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gift_number }),
    });

    // If server responds with canonical opened_at, sync it
    const json = await res.json().catch(() => null);
    if (json?.gift?.opened_at) {
      setGifts((prev) =>
        prev.map((g) =>
          g.gift_number === gift_number ? { ...g, opened_at: json.gift.opened_at } : g
        )
      );
    }
  }

  return (
    <main className="min-h-screen px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col gap-3 items-start">
          <h1 className="text-3xl sm:text-4xl font-semibold" style={{ color: "rgba(60,30,80,0.92)" }}>
            Open the gift that matches the number you found 💝
          </h1>

          <div className="flex flex-wrap items-center gap-3 text-sm">
            <div className="rounded-full px-3 py-1 shadow-sm bg-white/60">
              Opened: <span className="font-semibold">{openedCount}</span> / {gifts.length || 53}
            </div>

            <label className="flex items-center gap-2 rounded-full px-3 py-1 shadow-sm bg-white/60 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={soundEnabled}
                onChange={(e) => setSoundEnabled(e.target.checked)}
              />
              sound
            </label>

            <button
              onClick={loadGifts}
              className="rounded-full px-3 py-1 shadow-sm bg-white/60 hover:bg-white/80 transition"
            >
              refresh
            </button>
          </div>

          <p className="text-sm" style={{ color: "rgba(60,30,80,0.65)" }}>
            Tap a number to unwrap it. Once it’s opened, it stays opened.
          </p>
        </div>

        <div className="mt-8">
          {loading ? (
            <div className="text-sm" style={{ color: "rgba(60,30,80,0.65)" }}>
              Loading gifts…
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
              {gifts.map((gift) => (
                <GiftCard
                  key={gift.gift_number}
                  gift={gift}
                  onOpen={openGift}
                  soundEnabled={soundEnabled}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
