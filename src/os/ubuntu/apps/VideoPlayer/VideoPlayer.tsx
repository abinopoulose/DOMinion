import React, { useState, useRef, useEffect } from 'react';
import { useFileUrl } from '../../hooks/useFileUrl';
import { useWindowStore } from '../../store';
import './VideoPlayer.css';

interface VideoPlayerProps {
  windowId: string;
}

export function VideoPlayer({ windowId }: VideoPlayerProps) {
  const win = useWindowStore((s: any) => s.windows.find((w: any) => w.id === windowId));
  const fileId = (win?.appState as any)?.fileId;
  const { url, loading, error, mimeType } = useFileUrl(fileId);

  const mediaRef = useRef<HTMLVideoElement & HTMLAudioElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (mediaRef.current) {
      if (isPlaying) {
        mediaRef.current.play().catch(() => setIsPlaying(false));
      } else {
        mediaRef.current.pause();
      }
    }
  }, [isPlaying]);

  useEffect(() => {
    if (mediaRef.current) {
      mediaRef.current.volume = volume;
      mediaRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  const togglePlay = () => setIsPlaying(!isPlaying);
  const handleStop = () => {
    if (mediaRef.current) {
      mediaRef.current.pause();
      mediaRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  const handleTimeUpdate = () => {
    if (mediaRef.current) {
      setCurrentTime(mediaRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (mediaRef.current) {
      setDuration(mediaRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    if (mediaRef.current) {
      mediaRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => {
        console.error("Error attempting to enable full-screen mode:", err.message);
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#fff', background: '#000' }}>Loading media...</div>;
  if (error) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#ff5555', background: '#000' }}>Failed to load media.</div>;
  if (!url) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#aaa', background: '#000' }}>No media selected</div>;

  const ext = fileId.split('.').pop()?.toLowerCase() || '';
  const isAudio = mimeType?.startsWith('audio/') || ['mp3', 'wav', 'flac', 'aac', 'm4a', 'ogg'].includes(ext);

  return (
    <div className={`vlc-container ${isFullscreen ? 'vlc-fullscreen' : ''}`} ref={containerRef}>
      <div className="vlc-media-area" onClick={togglePlay}>
        {isAudio ? (
          <div className="vlc-cone-container">
            <svg width="150" height="150" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <path d="M 20 85 L 80 85 C 85 85, 90 90, 85 95 L 15 95 C 10 90, 15 85, 20 85 Z" fill="#222" />
              <path d="M 25 85 L 75 85 L 70 80 L 30 80 Z" fill="#333" />
              <path d="M 45 10 L 55 10 L 70 80 L 30 80 Z" fill="#e95420" />
              <path d="M 42 25 L 58 25 L 62 40 L 38 40 Z" fill="#fff" />
              <path d="M 35 55 L 65 55 L 68 70 L 32 70 Z" fill="#fff" />
            </svg>
            <audio 
              ref={mediaRef as any} 
              src={url} 
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onEnded={() => setIsPlaying(false)}
              autoPlay
            />
          </div>
        ) : (
          <video 
            ref={mediaRef as any} 
            src={url} 
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={() => setIsPlaying(false)}
            autoPlay
          />
        )}
      </div>
      
      <div className="vlc-controls" onClick={(e) => e.stopPropagation()}>
        <div className="vlc-slider-container">
          <input 
            type="range" 
            className="vlc-time-slider" 
            min={0} 
            max={duration || 100} 
            value={currentTime} 
            onChange={handleSeek}
            style={{
              background: `linear-gradient(to right, #e95420 ${(currentTime / (duration || 1)) * 100}%, #444 ${(currentTime / (duration || 1)) * 100}%)`
            }}
          />
        </div>
        
        <div className="vlc-controls-row">
          <div className="vlc-controls-group">
            <button className="vlc-btn" onClick={togglePlay} title="Play/Pause">
              {isPlaying ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              )}
            </button>
            <button className="vlc-btn" onClick={handleStop} title="Stop">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="4" y="4" width="16" height="16"/></svg>
            </button>
            <button className="vlc-btn" onClick={() => mediaRef.current && (mediaRef.current.currentTime = Math.max(0, mediaRef.current.currentTime - 10))} title="Step Backward">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="11 19 2 12 11 5 11 19"/><polygon points="22 19 13 12 22 5 22 19"/></svg>
            </button>
            <button className="vlc-btn" onClick={() => mediaRef.current && (mediaRef.current.currentTime = Math.min(duration, mediaRef.current.currentTime + 10))} title="Step Forward">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="13 19 22 12 13 5 13 19"/><polygon points="2 19 11 12 2 5 2 19"/></svg>
            </button>
            <button className="vlc-btn" onClick={toggleFullscreen} title="Toggle Fullscreen">
              {isFullscreen ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="8 3 8 8 3 8"/><polyline points="16 3 16 8 21 8"/><polyline points="8 21 8 16 3 16"/><polyline points="16 21 16 16 21 16"/></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
              )}
            </button>
          </div>
          
          <div className="vlc-controls-group">
            <span className="vlc-time-display">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
          
          <div className="vlc-controls-group">
            <button className="vlc-btn" onClick={() => setIsMuted(!isMuted)} title="Mute/Unmute">
              {isMuted || volume === 0 ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
              ) : volume < 0.5 ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
              )}
            </button>
            <input 
              type="range" 
              className="vlc-volume-slider" 
              min={0} 
              max={1} 
              step={0.05} 
              value={isMuted ? 0 : volume} 
              onChange={(e) => {
                setVolume(Number(e.target.value));
                if (isMuted) setIsMuted(false);
              }}
              style={{
                background: `linear-gradient(to right, #ccc ${(isMuted ? 0 : volume) * 100}%, #444 ${(isMuted ? 0 : volume) * 100}%)`
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
