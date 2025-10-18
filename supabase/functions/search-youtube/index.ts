import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Drastically expanded and updated list of instances for better reliability
const INVIDIOUS_INSTANCES = [
  'https://invidious.kavin.rocks',
  'https://vid.puffyan.us',
  'https://iv.ggtyler.dev',
  'https://yewtu.be',
  'https://invidious.projectsegfau.lt',
  'https://invidious.protokolla.fi',
  'https://invidious.no-logs.com',
  'https://invidious.privacydev.net',
  'https://invidious.incogniweb.net',
  'https://invidious.drgns.space',
  'https://inv.odyssey346.dev',
  'https://invidious.nerdvpn.de'
];

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();
    if (!query) {
      throw new Error('Query is required');
    }

    console.log(`Searching for "${query}" using an expanded list of Invidious instances.`);

    for (const instance of INVIDIOUS_INSTANCES) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      try {
        const searchUrl = `${instance}/api/v1/search?q=${encodeURIComponent(query)}&type=video`;
        console.log(`Trying instance: ${searchUrl}`);
        
        const response = await fetch(searchUrl, {
          signal: controller.signal,
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Instance ${instance} returned status ${response.status}`);
        }

        const results = await response.json();
        
        const formattedResults = results.slice(0, 12).map((video: any) => ({
          id: video.videoId,
          title: video.title,
          artist: video.author,
          thumbnail: video.videoThumbnails?.find((t: any) => t.quality === 'mqdefault')?.url || video.videoThumbnails?.[0]?.url,
          duration: video.lengthSeconds,
        }));

        console.log(`Successfully found ${formattedResults.length} results from ${instance}`);
        return new Response(JSON.stringify(formattedResults), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });

      } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
          console.error(`Request to ${instance} timed out.`);
        } else {
          console.error(`Failed to fetch from ${instance}:`, error.message);
        }
      }
    }

    throw new Error('All Invidious instances failed to respond or timed out.');

  } catch (error) {
    console.error("An error occurred in the search-youtube function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});