// Represents a song from a search result or in the library
export interface Song {
  id: string; // YouTube video ID
  title: string;
  artist: string;
  thumbnail: string;
  duration: number;
  db_id?: string; // The UUID from the database, if it's in the library
}