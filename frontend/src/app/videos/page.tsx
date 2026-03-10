"use client";

import EmptyState from "@/components/common/empty-state";
import SectionHeader from "@/components/common/section-header";
import VideoCard from "@/components/video/video-card";
import VideoModal from "@/components/video/video-modal";
import { videos } from "@/data/videos";
import { useMemo, useState } from "react";

export default function VideosPage() {
  const [category, setCategory] = useState("All");
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);

  const categories = useMemo(() => ["All", ...Array.from(new Set(videos.map((video) => video.category)))], []);
  const filteredVideos = useMemo(
    () => (category === "All" ? videos : videos.filter((video) => video.category === category)),
    [category]
  );
  const selectedVideo = useMemo(
    () => videos.find((video) => video.id === selectedVideoId) ?? null,
    [selectedVideoId]
  );

  return (
    <div className="pt-12 space-y-8">
      <SectionHeader
        eyebrow="Education Hub"
        title="Hair IQ Video Library"
        description="Explore install walkthroughs, care rituals, and styling frameworks from our experts."
      />

      <div className="flex flex-wrap gap-2">
        {categories.map((item) => (
          <button
            key={item}
            onClick={() => setCategory(item)}
            className={`rounded-full px-4 py-2 text-sm transition ${
              category === item ? "bg-champagne text-coal" : "border border-white/20 text-gray-600 hover:text-coal"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      {filteredVideos.length ? (
        <div className="grid gap-5 md:grid-cols-2">
          {filteredVideos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              hoverPreviewEnabled={false}
              autoPreviewEnabled={false}
              onClick={() => setSelectedVideoId(video.id)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No videos found"
          description="Try a different category or check back as new tutorials are added each week."
          ctaLabel="Browse all videos"
          ctaHref="/videos"
        />
      )}

      <VideoModal
        open={!!selectedVideo}
        onClose={() => setSelectedVideoId(null)}
        embedUrl={selectedVideo?.embedUrl || ""}
        title={selectedVideo?.title || "Video"}
      />
    </div>
  );
}
