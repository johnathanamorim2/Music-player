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
    const { videoId } = await req.json();
    if (!videoId) {
      throw new Error('videoId is required');
    }

    console.log(`Fetching audio stream for "${videoId}" using an expanded list of Invidious instances.`);

    for (const instance of INVIDIOUS_INSTANCES) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      try {
        const videoInfoUrl = `${instance}/api/v1/videos/${videoId}`;
        console.log(`Trying instance: ${videoInfoUrl}`);

        const response = await fetch(videoInfoUrl, {
          signal: controller.signal,
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Instance ${instance} returned status ${response.status}`);
        }

        const videoInfo = await response.json();
        
        const audioStream = videoInfo.adaptiveFormats?.find((f: any) => f.itag === '140') 
                         || videoInfo.adaptiveFormats?.filter((f: any) => f.type.startsWith('audio/'))
                                                      .sort((a: any, b: any) => b.bitrate - a.bitrate)[0];

        if (!audioStream || !audioStream.url) {
          throw new Error('No suitable audio stream found in video info.');
        }

        const audioUrl = audioStream.url;
        console.log(`Found audio stream URL from ${instance}. Sending URL to client.`);

        return new Response(JSON.stringify({ audioUrl }), {
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

    throw new Error('All Invidious instances failed to provide an audio stream or timed out.');

  } catch (error) {
    console.error("An error occurred in the get-audio-stream function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});