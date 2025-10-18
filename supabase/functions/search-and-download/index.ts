import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SearchResult {
  id: string;
  title: string;
  artist: string;
  thumbnail: string;
  duration: number;
}

// Function to search YouTube videos using Invidious API
async function searchYouTube(query: string): Promise<SearchResult[]> {
  console.log('Searching YouTube for:', query);
  
  const invidiousInstances = [
    'https://invidious.kavin.rocks',
    'https://vid.puffyan.us',
    'https://iv.ggtyler.dev',
    'https://yewtu.be',
    'https://invidious.projectsegfau.lt',
    'https://invidious.protokolla.fi',
  ];
  
  let lastError: Error | null = null;
  
  for (const instance of invidiousInstances) {
    try {
      console.log(`Trying instance: ${instance}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(
        `${instance}/api/v1/search?q=${encodeURIComponent(query)}&type=video`,
        { 
          headers: { 
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
          signal: controller.signal
        }
      );
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`Success with ${instance}, found ${data.length} results`);
        
        if (data && data.length > 0) {
          const results = data.slice(0, 12).map((video: any) => ({
            id: video.videoId,
            title: video.title,
            artist: video.author || 'Unknown Artist',
            thumbnail: video.videoThumbnails?.find((t: any) => t.quality === 'mqdefault')?.url || `https://i.ytimg.com/vi/${video.videoId}/mqdefault.jpg`,
            duration: video.lengthSeconds || 0,
          }));
          return results;
        }
      } else {
        console.warn(`Instance ${instance} returned status: ${response.status}`);
      }
    } catch (err) {
      lastError = err as Error;
      console.warn(`Failed with instance ${instance}:`, err instanceof Error ? err.message : 'Unknown error');
    }
  }
  
  console.error('All Invidious instances failed. Last error:', lastError);
  throw new Error('Não foi possível buscar músicas no momento. Tente novamente mais tarde.');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const { action, query, videoId } = await req.json();

    if (action === 'search') {
      if (!query) throw new Error('Query is required for search');
      const results = await searchYouTube(query);
      return new Response(JSON.stringify(results), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    
    } else if (action === 'download') {
      if (!videoId) throw new Error('videoId is required for download');

      const { data: existingSong } = await supabase
        .from('songs')
        .select('id')
        .eq('youtube_id', videoId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingSong) {
        return new Response(JSON.stringify({ error: 'Song already in library' }), { status: 409, headers: corsHeaders });
      }

      const searchResults = await searchYouTube(videoId);
      if (!searchResults || searchResults.length === 0) {
        throw new Error('Video not found');
      }
      const videoInfo = searchResults[0];
      
      const { data: song, error } = await supabase
        .from('songs')
        .insert({
          title: videoInfo.title,
          artist: videoInfo.artist,
          duration: videoInfo.duration,
          thumbnail_url: videoInfo.thumbnail,
          youtube_id: videoId,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify(song), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400, headers: corsHeaders });

  } catch (error) {
    console.error('Error in function:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }
});