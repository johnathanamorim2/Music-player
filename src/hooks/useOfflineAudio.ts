import { useState, useCallback } from 'react';
import { Song } from '@/types';
import { showError, showSuccess } from '@/utils/toast';

const CACHE_NAME = 'music-finder-audio-cache-v1';

export const useOfflineAudio = () => {
  const [isCaching, setIsCaching] = useState(false);

  const getCachedAudioUrl = useCallback(async (song: Song): Promise<string | null> => {
    if (!song.audio_url) return null;

    try {
      const cache = await caches.open(CACHE_NAME);
      const response = await cache.match(song.audio_url);
      
      if (response) {
        // Se estiver em cache, retorna a URL do blob para reprodução offline
        const blob = await response.blob();
        return URL.createObjectURL(blob);
      }
      return null;
    } catch (error) {
      console.error("Erro ao verificar cache de áudio:", error);
      return null;
    }
  }, []);

  const cacheAudio = useCallback(async (song: Song) => {
    if (!song.audio_url || isCaching) return;

    setIsCaching(true);
    try {
      const cache = await caches.open(CACHE_NAME);
      
      // Verifica se já está em cache
      const existing = await cache.match(song.audio_url);
      if (existing) {
        setIsCaching(false);
        return;
      }

      // Nota: Em um ambiente real, o audio_url deve apontar para um arquivo MP3/OGG,
      // e não para o YouTube, para que o cache funcione.
      // Aqui, assumimos que o audio_url é a URL direta do arquivo de áudio.
      
      const response = await fetch(song.audio_url);
      if (!response.ok) {
        throw new Error(`Falha ao baixar áudio: ${response.statusText}`);
      }

      await cache.put(song.audio_url, response);
      showSuccess(`Áudio de "${song.title}" salvo para uso offline.`);
    } catch (error) {
      showError(`Falha ao salvar áudio offline: ${song.title}`);
      console.error("Erro ao cachear áudio:", error);
    } finally {
      setIsCaching(false);
    }
  }, [isCaching]);

  const removeCachedAudio = useCallback(async (song: Song) => {
    if (!song.audio_url) return;

    try {
      const cache = await caches.open(CACHE_NAME);
      const deleted = await cache.delete(song.audio_url);
      if (deleted) {
        console.log(`Áudio de ${song.title} removido do cache.`);
      }
    } catch (error) {
      console.error("Erro ao remover cache de áudio:", error);
    }
  }, []);

  return {
    cacheAudio,
    removeCachedAudio,
    getCachedAudioUrl,
    isCaching,
  };
};