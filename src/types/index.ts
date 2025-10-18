// Represents a song from a search result or in the library
export interface Song {
  id: string; // YouTube video ID
  title: string;
  artist: string;
  thumbnail: string;
  duration: number;
  audio_url?: string; // URL do YouTube (para reprodução)
  db_id?: string; // O UUID da tabela 'songs' no banco de dados
}

export interface Playlist {
  id: string;
  name: string;
  user_id: string;
  song_count: number;
}