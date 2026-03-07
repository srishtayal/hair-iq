"use client";

import SectionHeader from "@/components/common/section-header";
import VideoCard from "@/components/video/video-card";
import { videos } from "@/data/videos";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

export default function VideoPreview() {
  const featuredVideos = useMemo(() => videos.slice(0, 12), []);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [visibilityRatios, setVisibilityRatios] = useState<Record<string, number>>({});
  const [autoPreviewVideoId, setAutoPreviewVideoId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const pointerQuery = window.matchMedia("(pointer: coarse)");
    const updateTouchState = () => {
      setIsTouchDevice(pointerQuery.matches || navigator.maxTouchPoints > 0);
    };

    updateTouchState();
    pointerQuery.addEventListener("change", updateTouchState);

    return () => {
      pointerQuery.removeEventListener("change", updateTouchState);
    };
  }, []);

  const handleVisibilityChange = useCallback((videoId: string, ratio: number) => {
    setVisibilityRatios((previous) => {
      if ((previous[videoId] ?? 0) === ratio) return previous;
      return { ...previous, [videoId]: ratio };
    });
  }, []);

  useEffect(() => {
    if (!isTouchDevice) {
      setAutoPreviewVideoId(null);
      return;
    }

    const minFocusRatio = 0.55;
    const focusedEntries = Object.entries(visibilityRatios).filter(([, ratio]) => ratio >= minFocusRatio);

    if (!focusedEntries.length) {
      setAutoPreviewVideoId(null);
      return;
    }

    focusedEntries.sort((a, b) => b[1] - a[1]);
    const [topId, topRatio] = focusedEntries[0];

    setAutoPreviewVideoId((currentId) => {
      if (!currentId) return topId;
      const currentRatio = visibilityRatios[currentId] ?? 0;
      if (currentRatio >= minFocusRatio && currentRatio + 0.05 >= topRatio) {
        return currentId;
      }
      return topId;
    });
  }, [isTouchDevice, visibilityRatios]);

  return (
    <section className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeader eyebrow="Video Library" title="Hear From Our Hair Expert" />
        <Link href="/videos" className="text-sm font-semibold text-champagne hover:text-[#e4c399]">
          View all videos
        </Link>
      </div>
      <div className="flex snap-x gap-5 overflow-x-auto pb-2 bg-transparent [scrollbar-width:thin]">
        {featuredVideos.map((video) => (
          <div key={video.id} className="flex min-w-[220px] flex-1 snap-start md:min-w-[280px]">
            <VideoCard
              video={video}
              autoPreviewEnabled={isTouchDevice}
              isAutoFocused={autoPreviewVideoId === video.id}
              onVisibilityChange={handleVisibilityChange}
              uniformHeight
            />
          </div>
        ))}
      </div>
    </section>
  );
}
