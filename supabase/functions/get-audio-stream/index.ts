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

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { videoId } = await req.json();
    if (!videoId) {
      throw new Error('videoId is required');
    }

    console.log(`Fetching audio stream for "${videoId}" using Invidious instances.`);

    for (const instance of INVIDIOUS_INSTANCES) {
      try {
        const videoInfoUrl = `${instance}/api/v1/videos/${videoId}`;
        console.log(`Trying instance: ${videoInfoUrl}`);

        const response = await fetch(videoInfoUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
        });

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
        console.error(`Failed to fetch from ${instance}:`, error.message);
      }
    }

    throw new Error('All Invidious instances failed to provide an audio stream.');

  } catch (error) {
    console.error("An error occurred in the get-audio-stream function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});