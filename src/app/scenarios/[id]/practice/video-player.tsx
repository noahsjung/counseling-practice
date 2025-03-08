"use client";

import { Button } from "@/components/ui/button";
import { useRef, useState, useEffect } from "react";
import { Play, Pause, SkipForward, SkipBack } from "lucide-react";

type Segment = {
  id: string;
  title: string;
  start_time: number;
  end_time: number | null;
  pause_point: boolean;
};

type VideoPlayerProps = {
  videoUrl: string;
  segments: Segment[];
  currentSegmentIndex: number;
  onSegmentChange?: (segment: Segment) => void;
};

export default function VideoPlayer({
  videoUrl,
  segments,
  currentSegmentIndex,
  onSegmentChange,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentSegment, setCurrentSegment] = useState<Segment | null>(null);

  // Initialize video event listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);

      // Check if we've reached a pause point
      const activeSegment = segments.find((segment) => {
        const startTime = segment.start_time;
        const endTime = segment.end_time || Infinity;
        return video.currentTime >= startTime && video.currentTime < endTime;
      });

      if (activeSegment && activeSegment !== currentSegment) {
        setCurrentSegment(activeSegment);
        if (onSegmentChange) {
          onSegmentChange(activeSegment);
        }

        // If this is a pause point, pause the video
        if (activeSegment.pause_point) {
          video.pause();
          setIsPlaying(false);
        }
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("loadedmetadata", handleLoadedMetadata);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
    };
  }, [segments, currentSegment, onSegmentChange]);

  // Set video to current segment when currentSegmentIndex changes
  useEffect(() => {
    if (segments && segments.length > 0 && segments[currentSegmentIndex]) {
      const segment = segments[currentSegmentIndex];
      setCurrentSegment(segment);

      const video = videoRef.current;
      if (video) {
        video.currentTime = segment.start_time;
        setCurrentTime(segment.start_time);
      }
    }
  }, [currentSegmentIndex, segments]);

  // Play/pause functionality
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }

    setIsPlaying(!isPlaying);
  };

  // Skip forward/backward
  const skip = (seconds: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime += seconds;
    setCurrentTime(video.currentTime);
  };

  // Format time display (mm:ss)
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // Handle progress bar interaction
  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const newTime = parseFloat(e.target.value);
    video.currentTime = newTime;
    setCurrentTime(newTime);
  };

  return (
    <div className="bg-black rounded-lg overflow-hidden">
      {/* Video player */}
      <div className="relative">
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full aspect-video"
          onClick={togglePlay}
        />
      </div>

      {/* Controls */}
      <div className="bg-gray-900 text-white p-4">
        {/* Progress bar */}
        <div className="mb-4">
          <input
            type="range"
            min="0"
            max={duration || 100}
            value={currentTime}
            onChange={handleProgressChange}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Control buttons */}
        <div className="flex justify-center items-center gap-4">
          <Button
            onClick={() => skip(-10)}
            variant="ghost"
            size="icon"
            className="text-white"
          >
            <SkipBack className="h-5 w-5" />
          </Button>

          <Button
            onClick={togglePlay}
            variant="ghost"
            size="icon"
            className="text-white h-12 w-12 rounded-full"
          >
            {isPlaying ? (
              <Pause className="h-6 w-6" />
            ) : (
              <Play className="h-6 w-6" />
            )}
          </Button>

          <Button
            onClick={() => skip(10)}
            variant="ghost"
            size="icon"
            className="text-white"
          >
            <SkipForward className="h-5 w-5" />
          </Button>
        </div>

        {/* Current segment info */}
        {currentSegment && (
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-400">
              Current segment:{" "}
              <span className="text-white">{currentSegment.title}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
