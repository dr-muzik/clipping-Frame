// src/VideoClipper.tsx
import React, { useEffect, useRef, useState } from "react";

const VideoClipper: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [ffmpeg, setFFmpeg] = useState<any>(null);

  const castrMp4Url =
    "https://eu-storage-1.castr.io/archives/edge/67c4838dbe0752c1920ed79e/live_b7488920529e11f08b4255ec9dd1bdc4/archive-1751391577-168.mp4";

  // Load FFmpeg dynamically on mount
  useEffect(() => {
    const loadFFmpeg = async () => {
      const ffmpegModule = await import("@ffmpeg/ffmpeg");
      const instance = ffmpegModule.createFFmpeg({ log: true });
      await instance.load();
      setFFmpeg(instance);
    };

    loadFFmpeg();
  }, []);

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const videoDuration = videoRef.current.duration;
      setDuration(videoDuration);
      setEndTime(videoDuration);
    }
  };

  const handleSetStart = () => {
    if (videoRef.current) setStartTime(videoRef.current.currentTime);
  };

  const handleSetEnd = () => {
    if (videoRef.current) setEndTime(videoRef.current.currentTime);
  };

  const handleDownloadClip = async () => {
    if (!ffmpeg) return;

    setProcessing(true);
    setOutputUrl(null);

    try {
      const ffmpegModule = await import("@ffmpeg/ffmpeg");
      const fetchFile = ffmpegModule.fetchFile;

      const inputBlob = await fetch(castrMp4Url).then((res) => res.blob());
      await ffmpeg.FS("writeFile", "input.mp4", await fetchFile(inputBlob));

      const clipDuration = endTime - startTime;

      await ffmpeg.run(
        "-ss",
        String(startTime),
        "-t",
        String(clipDuration),
        "-i",
        "input.mp4",
        "-c",
        "copy",
        "output.mp4"
      );

      const data = ffmpeg.FS("readFile", "output.mp4");
      const url = URL.createObjectURL(
        new Blob([data.buffer], { type: "video/mp4" })
      );
      setOutputUrl(url);
    } catch (error) {
      console.error("FFmpeg error:", error);
      alert("Failed to clip video. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div style={{ padding: "1rem", maxWidth: 800, margin: "auto" }}>
      <h2>🎬 Castr Video Clipper</h2>

      <video
        ref={videoRef}
        width="100%"
        controls
        onLoadedMetadata={handleLoadedMetadata}
      >
        <source src={castrMp4Url} type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      <p>Total duration: {duration.toFixed(2)} seconds</p>

      <div style={{ marginTop: "1rem" }}>
        <button onClick={handleSetStart}>Set Start Time</button>
        <span style={{ marginLeft: 10 }}>Start: {startTime.toFixed(2)}s</span>
      </div>

      <div style={{ marginTop: "1rem" }}>
        <button onClick={handleSetEnd}>Set End Time</button>
        <span style={{ marginLeft: 10 }}>End: {endTime.toFixed(2)}s</span>
      </div>

      <div style={{ marginTop: "2rem" }}>
        <button
          onClick={handleDownloadClip}
          disabled={processing || endTime <= startTime}
        >
          {processing ? "Processing..." : "Clip & Download"}
        </button>
      </div>

      {outputUrl && (
        <div style={{ marginTop: "1rem" }}>
          <a href={outputUrl} download="castr-clip.mp4">
            📥 Download Clipped Video
          </a>
        </div>
      )}
    </div>
  );
};

export default VideoClipper;
