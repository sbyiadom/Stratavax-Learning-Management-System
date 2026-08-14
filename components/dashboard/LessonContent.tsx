'use client'

import { useEffect, useState, useRef } from 'react'
import dynamic from 'next/dynamic'
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, Settings, ChevronRight, ChevronLeft, SkipBack, SkipForward } from 'lucide-react'

const ReactPlayer = dynamic(() => import('react-player'), { ssr: false })

interface LessonContentProps {
  lesson: any
  contentType: string
  onProgress?: (progress: number) => void
  onComplete?: () => void
}

export default function LessonContent({ lesson, contentType, onProgress, onComplete }: LessonContentProps) {
  const [isClient, setIsClient] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playerError, setPlayerError] = useState(false)
  const [played, setPlayed] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.8)
  const [muted, setMuted] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [showSpeedMenu, setShowSpeedMenu] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const playerRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const speedOptions = [0.75, 1, 1.25, 1.5, 2]

  useEffect(() => {
    setIsClient(true)
  }, [])

  const handleProgress = (state: { played: number; playedSeconds: number }) => {
    setPlayed(state.played)
    onProgress?.(state.played * 100)
    
    // Auto-mark complete when video reaches 90%
    if (state.played >= 0.9 && !lesson.completed) {
      onComplete?.()
    }
  }

  const handleDuration = (duration: number) => {
    setDuration(duration)
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPlayed = parseFloat(e.target.value)
    setPlayed(newPlayed)
    if (playerRef.current) {
      playerRef.current.seekTo(newPlayed)
    }
  }

  const toggleFullscreen = () => {
    if (!containerRef.current) return
    
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  if (!isClient) {
    return (
      <div className="aspect-video bg-gradient-to-br from-gray-200 to-gray-300 rounded-2xl animate-pulse shadow-xl" />
    )
  }

  if (contentType === 'video') {
    const videoUrl = lesson.content_url || lesson.content?.videoUrl
    
    if (!videoUrl) {
      return (
        <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex flex-col items-center justify-center shadow-xl">
          <div className="text-center p-8">
            <div className="w-20 h-20 bg-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
              <Play size={32} className="text-gray-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Video Available</h3>
            <p className="text-gray-500">This lesson doesn't have video content yet.</p>
          </div>
        </div>
      )
    }

    // Clean YouTube URLs
    let processedUrl = videoUrl
    const isYouTube = videoUrl.includes('youtube') || videoUrl.includes('youtu.be')
    
    if (isYouTube) {
      let videoId = ''
      if (videoUrl.includes('youtu.be')) {
        videoId = videoUrl.split('youtu.be/')[1]?.split('?')[0] || ''
      } else if (videoUrl.includes('watch')) {
        videoId = videoUrl.split('v=')[1]?.split('&')[0] || ''
      } else if (videoUrl.includes('embed')) {
        videoId = videoUrl.split('embed/')[1]?.split('?')[0] || ''
      }
      
      if (videoId) {
        processedUrl = `https://www.youtube.com/watch?v=${videoId}`
      }
    }

    // Iframe fallback for YouTube - ✅ FIXED with sandbox attribute
    if (isYouTube && playerError) {
      let embedUrl = videoUrl
      if (videoUrl.includes('youtu.be')) {
        const videoId = videoUrl.split('youtu.be/')[1]?.split('?')[0]
        embedUrl = `https://www.youtube.com/embed/${videoId}`
      } else if (videoUrl.includes('watch')) {
        const videoId = videoUrl.split('v=')[1]?.split('&')[0]
        embedUrl = `https://www.youtube.com/embed/${videoId}`
      } else if (videoUrl.includes('youtube.com/embed')) {
        embedUrl = videoUrl
      }

      return (
        <div className="aspect-video w-full bg-black rounded-2xl overflow-hidden shadow-xl">
          <iframe
            src={embedUrl}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            sandbox="allow-scripts allow-same-origin allow-forms allow-presentation"
          />
        </div>
      )
    }

    return (
      <div ref={containerRef} className="relative bg-black rounded-2xl overflow-hidden shadow-2xl group">
        <div className="aspect-video">
          <ReactPlayer
            ref={playerRef}
            url={processedUrl}
            width="100%"
            height="100%"
            playing={isPlaying}
            volume={volume}
            muted={muted}
            playbackRate={playbackSpeed}
            onProgress={handleProgress}
            onDuration={handleDuration}
            onError={() => setPlayerError(true)}
            config={{
              youtube: {
                playerVars: { 
                  showinfo: 1,
                  rel: 0,
                  modestbranding: 1,
                  controls: 0
                }
              }
            }}
          />
        </div>
        
        {/* Custom Controls */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-4">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-white text-sm font-mono">
              {formatTime(played * duration)} / {formatTime(duration)}
            </span>
            <div className="flex-1">
              <input
                type="range"
                min="0"
                max="1"
                step="0.001"
                value={played}
                onChange={handleSeek}
                className="w-full h-1.5 bg-gray-600 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
              />
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-2 hover:bg-white/20 rounded-lg transition text-white"
              >
                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
              </button>
              <button
                onClick={() => {
                  if (playerRef.current) {
                    playerRef.current.seekTo(Math.max(0, played - 0.1))
                  }
                }}
                className="p-2 hover:bg-white/20 rounded-lg transition text-white"
              >
                <SkipBack size={18} />
              </button>
              <button
                onClick={() => {
                  if (playerRef.current) {
                    playerRef.current.seekTo(Math.min(1, played + 0.1))
                  }
                }}
                className="p-2 hover:bg-white/20 rounded-lg transition text-white"
              >
                <SkipForward size={18} />
              </button>
              <button
                onClick={() => setMuted(!muted)}
                className="p-2 hover:bg-white/20 rounded-lg transition text-white"
              >
                {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={muted ? 0 : volume}
                onChange={(e) => {
                  setVolume(parseFloat(e.target.value))
                  setMuted(false)
                }}
                className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <div className="relative">
                <button
                  onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                  className="p-2 hover:bg-white/20 rounded-lg transition text-white text-sm font-medium flex items-center gap-1"
                >
                  <Settings size={16} />
                  {playbackSpeed}x
                </button>
                {showSpeedMenu && (
                  <div className="absolute bottom-full mb-2 right-0 bg-gray-800 rounded-lg shadow-xl overflow-hidden">
                    {speedOptions.map((speed) => (
                      <button
                        key={speed}
                        onClick={() => {
                          setPlaybackSpeed(speed)
                          setShowSpeedMenu(false)
                        }}
                        className={`block w-full px-4 py-2 text-sm text-left hover:bg-gray-700 transition ${
                          playbackSpeed === speed ? 'text-blue-400 bg-gray-700' : 'text-white'
                        }`}
                      >
                        {speed}x
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={toggleFullscreen}
                className="p-2 hover:bg-white/20 rounded-lg transition text-white"
              >
                {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
              </button>
            </div>
          </div>
        </div>
        
        {playerError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <div className="text-center">
              <p className="text-white mb-4">Failed to load video</p>
              <button 
                onClick={() => setPlayerError(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Try Again
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (contentType === 'html' || contentType === 'interactive') {
    if (lesson.content_url) {
      return (
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          <div className="p-6 bg-gradient-to-r from-gray-50 to-white border-b">
            <h3 className="text-lg font-semibold text-gray-800">Interactive Content</h3>
            <p className="text-sm text-gray-500">Complete the interactive exercise below</p>
          </div>
          <iframe
            srcDoc={lesson.content_url}
            className="w-full min-h-[600px] border-0"
            title={lesson.title}
            sandbox="allow-scripts allow-same-origin allow-forms"
          />
        </div>
      )
    }
    return (
      <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Play size={32} className="text-gray-400" />
        </div>
        <p className="text-gray-500">Interactive content not available</p>
      </div>
    )
  }

  if (contentType === 'reading' || contentType === 'article') {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8 prose prose-lg max-w-none">
        <div dangerouslySetInnerHTML={{ 
          __html: lesson.content?.content || lesson.content_url || '<p>Content coming soon...</p>' 
        }} />
      </div>
    )
  }

  if (contentType === 'quiz') {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Play size={28} className="text-blue-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800">Knowledge Check</h3>
          <p className="text-gray-500 mt-2">Test your understanding of this lesson</p>
        </div>
        <div className="border-t pt-6">
          <p className="text-gray-600 text-center">Quiz content would be loaded here.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
      <p className="text-gray-500">Content type not supported: {contentType}</p>
    </div>
  )
}
