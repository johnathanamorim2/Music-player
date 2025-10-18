import { Song } from "@/types";
import { Card, CardContent } from "./ui/card";
import React from "react";

interface SongCardProps {
  song: Song;
  onAction: (song: Song) => void;
  actionIcon: React.ReactNode;
}

export const SongCard = ({ song, onAction, actionIcon }: SongCardProps) => {
  return (
    <Card
      className="bg-gray-800 border-transparent text-white overflow-hidden group relative"
    >
      <CardContent className="p-4">
        <div className="aspect-square relative mb-4">
          <img
            src={song.thumbnail}
            alt={song.title}
            className="w-full h-full object-cover rounded-md"
          />
          <button
            onClick={() => onAction(song)}
            className="absolute bottom-2 right-2 bg-purple-600 text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-y-0 translate-y-2 focus:outline-none focus:ring-2 focus:ring-purple-400"
          >
            {actionIcon}
          </button>
        </div>
        <p className="font-semibold truncate">{song.title}</p>
        <p className="text-sm text-gray-400 truncate">{song.artist}</p>
      </CardContent>
    </Card>
  );
};