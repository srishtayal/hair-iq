"use client";

import SectionHeader from "@/components/common/section-header";
import VideoCard from "@/components/video/video-card";
import VideoModal from "@/components/video/video-modal";
import { videos } from "@/data/videos";
import { Video } from "@/types";
import Link from "next/link";
import { useState } from "react";

export default function VideoPreview() {
  const [activeVideo, setActiveVideo] = useState<Video | null>(null);

  return (
    <section className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeader eyebrow="Video Library" title="Pro install and styling tutorials" />
        <Link href="/videos" className="text-sm font-semibold text-champagne hover:text-[#e4c399]">
          View all videos
        </Link>
      </div>
      <div className="flex snap-x gap-5 overflow-x-auto pb-2 bg-transparent">
        {videos.slice(0, 4).map((video) => (
          <div key={video.id} className="min-w-[200px] flex-1 snap-start md:min-w-[260px]">
            <VideoCard video={video} onPlay={setActiveVideo} />
          </div>
        ))}
      </div>
      <VideoModal
        open={!!activeVideo}
        onClose={() => setActiveVideo(null)}
        embedUrl={activeVideo?.embedUrl ?? ""}
        title={activeVideo?.title ?? ""}
      />
    </section>
  );
}
