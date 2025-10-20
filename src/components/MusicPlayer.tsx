import { useEffect, useRef, useState, useCallback } from "react";
import { Play, Pause, SkipBack, SkipForward, Volume2, X, Loader2, Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
import { useOfflineAudio } from "@/hooks/useOfflineAudio";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

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

  // 1. Inicialização do YouTube API (apenas se necessário)
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
    
    // Tenta carregar do cache primeiro
    getCachedAudioUrl(currentSong).then(url => {
      if (url) {
        // Modo Offline/Local
        console.log("Reproduzindo áudio do cache local.");
        setIsLocalMode(true);
        setLocalAudioUrl(url);
        
        // Destrói o player do YouTube se estiver ativo
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
      // Limpeza de URL de Blob
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
      height: '1', // Mínimo visível
      width: '1', // Mínimo visível
      videoId: videoId,
      playerVars: {
        autoplay: 1,
        controls: 0,
        disablekb: 1,
        fs: 0,
        modestbranding: 1,
        playsinline: 1,
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
          setIsPlaying(false); // Permite que o usuário clique em play
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


  // 7. Funções de Controle
  const togglePlay = () => {
    if (isLocalMode && audioRef.current) {
      if (isPlaying) audioRef.current.pause();
      else audioRef.current.play().catch(e => console.error("Erro ao tentar reproduzir:", e));
      setIsPlaying(!isPlaying);
    } else if (!isLocalMode && youtubePlayerRef.current) {
      if (isPlaying) youtubePlayerRef.current.pauseVideo();
      else youtubePlayerRef.current.playVideo();
    }
  };

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

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900/80 backdrop-blur-md text-white p-4 border-t border-purple-800 z-50">
      {/* Elemento de áudio para reprodução offline/local */}
      <audio ref={audioRef} preload="auto" style={{ display: 'none' }} />
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
      
      <div className="container mx-auto flex flex-col lg:flex-row items-center justify-between gap-4 relative">
        
        {/* Botão de Fechar (Mobile: Canto Superior Esquerdo) */}
        {isMobile && (
          <Button 
            size="icon" 
            variant="secondary"
            onClick={closePlayer} 
            // Ajustado para left-0 para alinhar com a borda do container
            className="absolute top-[-40px] left-0 text-gray-300 hover:text-white bg-gray-800/70 hover:bg-gray-700/90 transition-colors w-8 h-8 rounded-full shadow-lg"
          >
            <X size={18} />
          </Button>
        )}

        {/* 1. Info da Música (Esquerda) */}
        <div className="flex items-center gap-4 w-full lg:w-1/4">
          <img src={currentSong.thumbnail} alt={currentSong.title} className="w-14 h-14 rounded-md flex-shrink-0" />
          <div className="min-w-0 flex-grow">
            <p className="font-semibold truncate text-sm lg:text-base">{currentSong.title}</p>
            <p className="text-xs text-gray-400 truncate">{currentSong.artist}</p>
          </div>
        </div>

        {/* 2. Controles Principais e Barra de Progresso (Centro) */}
        <div className="flex flex-col items-center gap-2 w-full lg:w-1/2 order-first lg:order-none">
          <div className="flex items-center gap-4 lg:gap-6">
            {/* Botão de Shuffle */}
            <Button 
              size="icon" 
              variant="ghost" 
              onClick={toggleShuffle} 
              className={cn(
                "hover:text-purple-400 transition-colors w-8 h-8 lg:w-10 lg:h-10",
                isShuffling ? "text-purple-400" : "text-gray-400"
              )}
            >
              <Shuffle size={20} />
            </Button>
            
            <Button size="icon" variant="ghost" onClick={playPrevious} className="hover:text-purple-400 transition-colors disabled:text-gray-600 w-8 h-8 lg:w-10 lg:h-10" disabled={!playPrevious}>
              <SkipBack size={20} />
            </Button>
            <Button onClick={togglePlay} className="bg-purple-600 hover:bg-purple-500 rounded-full p-3 transition-colors w-12 h-12 lg:w-14 lg:h-14 flex items-center justify-center" disabled={isLoading && !isLocalMode}>
              {isLoading ? <Loader2 className="animate-spin w-6 h-6 lg:w-7 lg:h-7" /> : isPlaying ? <Pause size={28} /> : <Play size={28} className="ml-1" />}
            </Button>
            <Button size="icon" variant="ghost" onClick={playNext} className="hover:text-purple-400 transition-colors disabled:text-gray-600 w-8 h-8 lg:w-10 lg:h-10" disabled={!playNext}>
              <SkipForward size={20} />
            </Button>
          </div>
          
          {/* Barra de Progresso e Volume */}
          <div className="flex items-center gap-2 w-full relative">
            <span className="text-xs text-gray-400 w-8 text-center flex-shrink-0">{formatTime(currentTime)}</span>
            <Slider value={[currentTime]} max={duration || 1} onValueChange={handleSeek} className="w-full" />
            <span className="text-xs text-gray-400 w-8 text-center flex-shrink-0">{formatTime(duration)}</span>
            
            {/* Controle de Volume (Mobile: Ícone + Pop-up, Desktop: Slider) */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button 
                size="icon" 
                variant="ghost" 
                onClick={() => isMobile ? setShowVolumeSlider(prev => !prev) : undefined}
                className={cn(
                  "hover:text-purple-400 transition-colors text-gray-400 lg:text-white w-8 h-8",
                  !isMobile && "hidden"
                )}
              >
                <Volume2 size={20} />
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

        {/* 3. Controles de Volume e Fechar (Direita) - APENAS DESKTOP */}
        <div className="hidden lg:flex items-center gap-4 w-1/4 justify-end">
          <div className="flex items-center gap-2 w-full lg:w-auto">
            <Volume2 size={20} className="flex-shrink-0" />
            <Slider value={[volume]} max={100} step={1} onValueChange={handleVolumeChange} className="w-full lg:w-24" />
          </div>
          <Button 
            size="icon" 
            variant="ghost" 
            onClick={closePlayer} 
            className="hover:text-purple-400 transition-colors flex-shrink-0"
          >
            <X size={20} />
          </Button>
        </div>
      </div>
    </div>
  );
};