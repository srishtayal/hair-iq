"use client";

import { Video } from "@/types";
import { motion } from "framer-motion";
import { Play } from "lucide-react";
import Image from "next/image";

export default function VideoCard({ video, onPlay }: { video: Video; onPlay: (video: Video) => void }) {
  return (
    <motion.article whileHover={{ y: -4 }} className="group overflow-hidden rounded-2xl border border-graphite/10 bg-transparent">
      <div className="relative aspect-[3/4]">
        <Image
          src={video.thumbnail}
          alt={video.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-transparent" />
        <button
          onClick={() => onPlay(video)}
          className="absolute left-3 top-3 rounded-full border border-white/30 bg-transparent p-3 text-white"
          aria-label={`Play ${video.title}`}
        >
          <Play className="h-4 w-4" />
        </button>
        <span className="absolute bottom-3 right-3 rounded bg-transparent px-2 py-1 text-xs text-white">{video.duration}</span>
      </div>
      <div className="space-y-2 p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-champagne">{video.category}</p>
        <h3 className="font-semibold text-coal">{video.title}</h3>
        <p className="text-sm text-gray-600">{video.description}</p>
      </div>
    </motion.article>
  );
}
