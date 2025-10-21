import { useEffect, useRef, useState, useCallback } from "react";
import { Play, Pause, SkipBack, SkipForward, Volume2, X, Loader2, Shuffle, WifiOff, Youtube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
import { useOfflineAudio } from "@/hooks/useOfflineAudio";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export const MusicPlayer = () => {
  const { currentSong, playlist, playNext, playPrevious, closePlayer, isShuffling, toggleShuffle } = useMusicPlayer();
  const isMobile = useIsMobile();
  
  // YouTube Player Refs
  const youtubePlayerRef = useRef<any>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const [isApiReady, setIsApiReady] = useState(false);

  // Audio Player Refs
  const audioRef = useRef<HTMLAudioElement>(null);
  const { getCachedAudioUrl } = useOfflineAudio();
  const [localAudioUrl, setLocalAudioUrl] = useState<string | null>(null);
  const [isLocalMode, setIsLocalMode] = useState(false);

  // Player State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(50);
  const [isLoading, setIsLoading] = useState(true);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  // Ref para o container do player (para detectar cliques fora)
  const playerBarRef = useRef<HTMLDivElement>(null);
  // Ref para o container do volume (para detectar cliques dentro)
  const volumeControlRef = useRef<HTMLDivElement>(null);


  // --- Funções de Controle Explícitas (useCallback para Media Session) ---

  const handlePlay = useCallback(() => {
    if (isLocalMode && audioRef.current) {
      audioRef.current.play().catch(e => console.error("Erro ao tentar reproduzir:", e));
      setIsPlaying(true);
    } else if (!isLocalMode && youtubePlayerRef.current) {
      youtubePlayerRef.current.playVideo();
      // O estado isPlaying será atualizado pelo onStateChange do YouTube
    }
  }, [isLocalMode]);

  const handlePause = useCallback(() => {
    if (isLocalMode && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else if (!isLocalMode && youtubePlayerRef.current) {
      youtubePlayerRef.current.pauseVideo();
      // O estado isPlaying será atualizado pelo onStateChange do YouTube
    }
  }, [isLocalMode]);

  const togglePlay = () => {
    if (isPlaying) {
      handlePause();
    } else {
      handlePlay();
    }
  };
  
  // --- Efeitos ---

  // Lógica de Click Outside para fechar o slider de volume
  useEffect(() => {
    if (!isMobile || !showVolumeSlider) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (volumeControlRef.current && !volumeControlRef.current.contains(event.target as Node)) {
        setShowVolumeSlider(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMobile, showVolumeSlider]);


  // 1. Inicialização do YouTube API
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => setIsApiReady(true);
    } else {
      setIsApiReady(true);
    }
  }, []);

  // 2. Lógica de Carregamento de Nova Música (Offline ou YouTube)
  useEffect(() => {
    if (!currentSong) return;

    setIsLoading(true);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setLocalAudioUrl(null);
    
    getCachedAudioUrl(currentSong).then(url => {
      if (url) {
        // Modo Offline/Local
        console.log("Reproduzindo áudio do cache local.");
        setIsLocalMode(true);
        setLocalAudioUrl(url);
        
        if (youtubePlayerRef.current) {
          youtubePlayerRef.current.destroy();
          youtubePlayerRef.current = null;
        }
      } else {
        // Modo YouTube
        console.log("Reproduzindo via YouTube Iframe API.");
        setIsLocalMode(false);
        loadYouTubePlayer(currentSong.id);
      }
    });

    return () => {
      if (localAudioUrl) {
        URL.revokeObjectURL(localAudioUrl);
      }
    };
  }, [currentSong, getCachedAudioUrl]);


  // 3. Lógica do YouTube Player
  const loadYouTubePlayer = useCallback((videoId: string) => {
    if (!isApiReady || !playerContainerRef.current) return;

    if (youtubePlayerRef.current) {
      youtubePlayerRef.current.destroy();
    }

    youtubePlayerRef.current = new window.YT.Player(playerContainerRef.current, {
      height: '1', 
      width: '1', 
      videoId: videoId,
      playerVars: {
        autoplay: 1,
        controls: 0,
        disablekb: 1,
        fs: 0,
        modestbranding: 1,
        playsinline: 1,
        // Adicionando 'audioonly' se possível, mas o YT API não suporta nativamente.
      },
      events: {
        onReady: (event: any) => {
          event.target.setVolume(volume);
          event.target.playVideo();
        },
        onStateChange: (event: any) => {
          const playerState = event.data;
          if (playerState === window.YT.PlayerState.PLAYING) {
            setIsPlaying(true);
            setIsLoading(false);
            setDuration(event.target.getDuration());
          } else if (playerState === window.YT.PlayerState.PAUSED) {
            setIsPlaying(false);
          } else if (playerState === window.YT.PlayerState.ENDED) {
            setIsPlaying(false);
            playNext();
          } else if (playerState === window.YT.PlayerState.BUFFERING) {
            setIsLoading(true);
          }
        },
        onError: (event: any) => {
          console.error('YouTube Player Error:', event.data);
          setIsLoading(false);
          setIsPlaying(false);
        },
      },
    });
  }, [isApiReady, volume, playNext]);


  // 4. Lógica do Audio Player (Offline)
  useEffect(() => {
    const audio = audioRef.current;
    if (isLocalMode && audio && localAudioUrl) {
      audio.src = localAudioUrl;
      audio.volume = volume / 100;
      
      const handleLoadedMetadata = () => {
        setDuration(audio.duration);
        setIsLoading(false);
        audio.play().then(() => setIsPlaying(true)).catch(e => {
          console.error("Erro ao tentar reproduzir áudio local automaticamente:", e);
          setIsPlaying(false); 
          setIsLoading(false);
        });
      };

      const handleTimeUpdate = () => {
        setCurrentTime(audio.currentTime);
      };

      const handleEnded = () => {
        setIsPlaying(false);
        playNext();
      };

      audio.addEventListener('loadedmetadata', handleLoadedMetadata);
      audio.addEventListener('timeupdate', handleTimeUpdate);
      audio.addEventListener('ended', handleEnded);

      return () => {
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audio.removeEventListener('timeupdate', handleTimeUpdate);
        audio.removeEventListener('ended', handleEnded);
      };
    }
  }, [isLocalMode, localAudioUrl, playNext, volume]);


  // 5. Sincronização de Volume
  useEffect(() => {
    if (isLocalMode && audioRef.current) {
      audioRef.current.volume = volume / 100;
    } else if (!isLocalMode && youtubePlayerRef.current && typeof youtubePlayerRef.current.setVolume === 'function') {
      youtubePlayerRef.current.setVolume(volume);
    }
  }, [volume, isLocalMode]);


  // 6. Atualização de Tempo (YouTube)
  useEffect(() => {
    if (!isLocalMode) {
      const interval = setInterval(() => {
        if (isPlaying && youtubePlayerRef.current && typeof youtubePlayerRef.current.getCurrentTime === 'function') {
          setCurrentTime(youtubePlayerRef.current.getCurrentTime());
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isPlaying, isLocalMode]);
  
  
  // 7. Media Session API
  useEffect(() => {
    if (!('mediaSession' in navigator) || !currentSong) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentSong.title,
      artist: currentSong.artist,
      album: 'Leccor Music',
      artwork: [
        { src: currentSong.thumbnail, sizes: '96x96', type: 'image/jpeg' },
        { src: currentSong.thumbnail, sizes: '512x512', type: 'image/jpeg' },
      ],
    });

    const actionHandlers = [
      ['play', handlePlay], 
      ['pause', handlePause], 
      ['previoustrack', playPrevious],
      ['nexttrack', playNext],
    ] as const;

    for (const [action, handler] of actionHandlers) {
      try {
        // @ts-ignore
        navigator.mediaSession.setActionHandler(action, handler);
      } catch (error) {
        console.log(`A ação de mídia ${action} não é suportada.`);
      }
    }
    
    if (isPlaying) {
      navigator.mediaSession.playbackState = 'playing';
    } else {
      navigator.mediaSession.playbackState = 'paused';
    }

    return () => {
      for (const [action] of actionHandlers) {
        try {
          // @ts-ignore
          navigator.mediaSession.setActionHandler(action, null);
        } catch (e) {
          // Ignorar
        }
      }
    };
  }, [currentSong, isPlaying, playNext, playPrevious, handlePlay, handlePause]);
  
  
  // O listener de visibilidade foi removido, pois o controle de reprodução em segundo plano
  // deve ser feito pelo Media Session API, que o usuário confirmou estar funcionando.


  const handleSeek = (value: number[]) => {
    const seekTime = value[0];
    if (isLocalMode && audioRef.current) {
      audioRef.current.currentTime = seekTime;
      setCurrentTime(seekTime);
    } else if (!isLocalMode && youtubePlayerRef.current && typeof youtubePlayerRef.current.seekTo === 'function') {
      youtubePlayerRef.current.seekTo(seekTime, true);
      setCurrentTime(seekTime);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0]);
  };

  const formatTime = (time: number) => {
    if (isNaN(time) || time < 0) return "0:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!currentSong) return null;

  const ModeIcon = isLocalMode ? WifiOff : Youtube;
  const ModeText = isLocalMode ? "Offline" : "Streaming (YouTube)";
  const ModeColor = isLocalMode ? "bg-green-600 hover:bg-green-500" : "bg-red-600 hover:bg-red-500";

  return (
    <div ref={playerBarRef} className="fixed bottom-0 left-0 right-0 bg-gray-900/80 backdrop-blur-md text-white p-3 border-t border-purple-800 z-50">
      {/* Elemento de áudio para reprodução offline/local - Adicionado playsInline e controls (oculto) */}
      <audio ref={audioRef} preload="auto" playsInline controls style={{ display: 'none' }} />
      {/* Container do YouTube Player (agora com tamanho mínimo e posicionado fora da tela) */}
      <div 
        ref={playerContainerRef} 
        style={{ 
          position: 'fixed', 
          bottom: '-10px', 
          right: '-10px', 
          width: '1px', 
          height: '1px', 
          overflow: 'hidden' 
        }} 
      />
      
      <div className="container mx-auto flex flex-col lg:flex-row items-center justify-between gap-2 relative">
        
        {/* Botão de Fechar (Mobile: Canto Superior Esquerdo) */}
        {isMobile && (
          <Button 
            size="icon" 
            variant="secondary"
            onClick={closePlayer} 
            className="absolute top-[-35px] left-0 text-gray-300 hover:text-white bg-gray-800/70 hover:bg-gray-700/90 transition-colors w-7 h-7 rounded-full shadow-lg"
          >
            <X size={16} />
          </Button>
        )}

        {/* 1. Info da Música (Esquerda) */}
        <div className="flex items-center gap-3 w-full lg:w-1/4">
          <img src={currentSong.thumbnail} alt={currentSong.title} className="w-12 h-12 rounded-md flex-shrink-0" />
          <div className="min-w-0 flex-grow">
            <p className="font-semibold truncate text-xs lg:text-sm">{currentSong.title}</p>
            <p className="text-xs text-gray-400 truncate">{currentSong.artist}</p>
            
            {/* Indicador de Modo de Reprodução */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge 
                  className={cn("mt-1 px-2 py-0.5 text-xs font-medium cursor-help", ModeColor)}
                >
                  <ModeIcon size={12} className="mr-1" /> {ModeText}
                </Badge>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                {isLocalMode 
                  ? "Reprodução garantida em segundo plano." 
                  : "Reprodução via YouTube. Pode ser pausada pelo navegador ao minimizar o app. Use os controles de mídia do sistema para retomar."
                }
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* 2. Controles Principais e Barra de Progresso (Centro) */}
        <div className="flex flex-col items-center gap-1 w-full lg:w-1/2 order-first lg:order-none">
          <div className="flex items-center gap-3 lg:gap-4">
            {/* Botão de Shuffle */}
            <Button 
              size="icon" 
              variant="ghost" 
              onClick={toggleShuffle} 
              className={cn(
                "hover:text-purple-400 transition-colors w-7 h-7 lg:w-8 lg:h-8",
                isShuffling ? "text-purple-400" : "text-gray-400"
              )}
            >
              <Shuffle size={16} />
            </Button>
            
            <Button size="icon" variant="ghost" onClick={playPrevious} className="hover:text-purple-400 transition-colors disabled:text-gray-600 w-7 h-7 lg:w-8 lg:h-8" disabled={!playPrevious}>
              <SkipBack size={16} />
            </Button>
            <Button onClick={togglePlay} className="bg-purple-600 hover:bg-purple-500 rounded-full p-2 transition-colors w-10 h-10 lg:w-12 lg:h-12 flex items-center justify-center" disabled={isLoading && !isLocalMode}>
              {isLoading ? <Loader2 className="animate-spin w-5 h-5 lg:w-6 lg:h-6" /> : isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
            </Button>
            <Button size="icon" variant="ghost" onClick={playNext} className="hover:text-purple-400 transition-colors disabled:text-gray-600 w-7 h-7 lg:w-8 lg:h-8" disabled={!playNext}>
              <SkipForward size={16} />
            </Button>
          </div>
          
          {/* Barra de Progresso e Volume */}
          <div className="flex items-center gap-2 w-full relative">
            <span className="text-xs text-gray-400 w-7 text-center flex-shrink-0">{formatTime(currentTime)}</span>
            <Slider 
              value={[currentTime]} 
              max={duration || 1} 
              onValueChange={handleSeek} 
              className="w-full [&>span:first-child]:bg-gray-700 [&>span:first-child>span]:bg-purple-500" // Customizando o track (fundo) e o range (preenchimento)
            />
            <span className="text-xs text-gray-400 w-7 text-center flex-shrink-0">{formatTime(duration)}</span>
            
            {/* Controle de Volume (Mobile: Ícone + Pop-up, Desktop: Slider) */}
            <div ref={volumeControlRef} className="flex items-center gap-2 flex-shrink-0">
              <Button 
                size="icon" 
                variant="ghost" 
                onClick={() => isMobile ? setShowVolumeSlider(prev => !prev) : undefined}
                className={cn(
                  "hover:text-purple-400 transition-colors text-gray-400 lg:text-white w-7 h-7",
                  !isMobile && "hidden"
                )}
              >
                <Volume2 size={16} />
              </Button>
              
              {/* Slider de Volume (Mobile Pop-up) */}
              {isMobile && (
                <div className={cn(
                  "absolute bottom-full right-0 mb-2 p-2 bg-gray-800 rounded-md shadow-lg transition-opacity duration-300",
                  !showVolumeSlider && "opacity-0 pointer-events-none",
                  showVolumeSlider && "opacity-100"
                )}>
                  <Slider 
                    value={[volume]} 
                    max={100} 
                    step={1} 
                    onValueChange={handleVolumeChange} 
                    className="w-32"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 3. Controles de Volume e Fechar (Direita) - APENNAS DESKTOP */}
        <div className="hidden lg:flex items-center gap-4 w-1/4 justify-end">
          <div className="flex items-center gap-2 w-full lg:w-auto">
            <Volume2 size={16} className="flex-shrink-0" />
            <Slider value={[volume]} max={100} step={1} onValueChange={handleVolumeChange} className="w-full lg:w-24" />
          </div>
          <Button 
            size="icon" 
            variant="ghost" 
            onClick={closePlayer} 
            className="hover:text-purple-400 transition-colors flex-shrink-0 w-8 h-8"
          >
            <X size={18} />
          </Button>
        </div>
      </div>
    </div>
  );
};