"use client";

import SectionHeader from "@/components/common/section-header";
import VideoCard from "@/components/video/video-card";
import { videos } from "@/data/videos";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

export default function VideoPreview() {
  const featuredVideos = useMemo(() => videos.slice(0, 12), []);
  const [activeIndex, setActiveIndex] = useState(0);
  const touchStartXRef = useRef<number | null>(null);

  useEffect(() => {
    if (!featuredVideos.length) return;
    const timer = window.setInterval(() => {
      setActiveIndex((previous) => (previous + 1) % featuredVideos.length);
    }, 4500);

    return () => window.clearInterval(timer);
  }, [featuredVideos.length]);

  const goToNext = () => {
    setActiveIndex((previous) => (previous + 1) % featuredVideos.length);
  };

  const goToPrev = () => {
    setActiveIndex((previous) => (previous === 0 ? featuredVideos.length - 1 : previous - 1));
  };

  const activeVideo = featuredVideos[activeIndex];

  return (
    <section className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeader eyebrow="Video Library" title="Expert Styling & Installation Tips" />
        <Link href="/videos" className="text-sm font-semibold text-champagne hover:text-[#e4c399]">
          View all videos
        </Link>
      </div>
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-2 sm:p-3 md:hidden">
        <button
          type="button"
          onClick={goToPrev}
          className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/30 bg-black/45 p-2 text-white backdrop-blur"
          aria-label="Previous video"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={goToNext}
          className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/30 bg-black/45 p-2 text-white backdrop-blur"
          aria-label="Next video"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        <div
          onTouchStart={(event) => {
            touchStartXRef.current = event.touches[0]?.clientX ?? null;
          }}
          onTouchEnd={(event) => {
            const start = touchStartXRef.current;
            const end = event.changedTouches[0]?.clientX ?? null;
            if (start === null || end === null) return;
            const delta = end - start;
            if (Math.abs(delta) < 32) return;
            if (delta < 0) {
              goToNext();
            } else {
              goToPrev();
            }
          }}
          className="mx-auto max-w-sm px-8 sm:max-w-md"
        >
          {activeVideo ? <VideoCard key={activeVideo.id} video={activeVideo} uniformHeight /> : null}
        </div>
        <div className="mt-3 flex items-center justify-center gap-1.5">
          {featuredVideos.map((video, index) => (
            <button
              key={video.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`h-2 rounded-full transition-all ${index === activeIndex ? "w-7 bg-champagne" : "w-2 bg-black/20"}`}
              aria-label={`Go to video ${index + 1}`}
            />
          ))}
        </div>
      </div>
      <div className="hidden gap-5 overflow-x-auto pb-2 [scrollbar-width:thin] md:flex">
        {featuredVideos.slice(0, 4).map((video) => (
          <div key={video.id} className="w-[300px] min-w-[300px] lg:w-[340px] lg:min-w-[340px]">
            <VideoCard video={video} uniformHeight />
          </div>
        ))}
      </div>
    </section>
  );
}
