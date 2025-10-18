import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const INVIDIOUS_INSTANCES = [
  'https://yewtu.be',
  'https://inv.us.projectsegfau.lt',
  'https://vid.puffyan.us',
  'https://invidious.io.lol',
  'https://iv.ggtyler.dev',
  'https://invidious.epicsite.xyz',
  'https://invidious.projectsegfau.lt',
];

function formatDuration(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) {
    return "0:00";
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();
    if (!query) {
      throw new Error('Query is required');
    }

    console.log(`Searching for "${query}" using Invidious instances.`);

    for (const instance of INVIDIOUS_INSTANCES) {
      try {
        const searchUrl = `${instance}/api/v1/search?q=${encodeURIComponent(query)}&type=video`;
        console.log(`Trying instance: ${searchUrl}`);
        
        const response = await fetch(searchUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
        });

        if (!response.ok) {
          throw new Error(`Instance ${instance} returned status ${response.status}`);
        }

        const results = await response.json();
        
        const formattedResults = results.slice(0, 12).map((video: any) => ({
          id: video.videoId,
          title: video.title,
          artist: video.author,
          thumbnail: video.videoThumbnails?.find((t: any) => t.quality === 'mqdefault')?.url || video.videoThumbnails?.[0]?.url,
          duration: formatDuration(video.lengthSeconds),
        }));

        console.log(`Successfully found ${formattedResults.length} results from ${instance}`);
        return new Response(JSON.stringify(formattedResults), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });

      } catch (error) {
        console.error(`Failed to fetch from ${instance}:`, error.message);
      }
    }

    throw new Error('All Invidious instances failed to respond.');

  } catch (error) {
    console.error("An error occurred in the search-youtube function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});