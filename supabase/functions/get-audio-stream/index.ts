import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
// @ts-ignore
import { ytdl } from "https://deno.land/x/ytdl_core@v0.1.2/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  console.log("get-audio-stream function invoked for streaming.");

  if (req.method === 'OPTIONS') {
    console.log("Handling OPTIONS request.");
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log("Parsing request body...");
    const { videoId } = await req.json();
    console.log(`Received videoId for streaming: ${videoId}`);

    if (!videoId) {
      console.error("Error: videoId is required.");
      return new Response(JSON.stringify({ error: 'videoId is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    console.log(`Processing video URL: ${videoUrl}`);

    console.log("Fetching video info from ytdl...");
    const info = await ytdl.getInfo(videoUrl);
    console.log("Successfully fetched video info.");

    console.log("Filtering for audio-only formats...");
    const audioFormats = ytdl.filterFormats(info.formats, 'audioonly');
    
    if (audioFormats.length === 0) {
      console.error("No audio-only formats found for this video.");
      return new Response(JSON.stringify({ error: 'No audio-only formats found' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 404,
      });
    }

    console.log("Finding best audio format...");
    const bestAudio = audioFormats.find((f: any) => f.mimeType.includes('audio/webm')) || audioFormats[0];
    if (!bestAudio) {
        console.error("Could not find a valid audio format.");
        return new Response(JSON.stringify({ error: 'Could not find a valid audio format' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 404,
        });
    }

    console.log("Downloading audio stream from info...");
    const audioStream = await ytdl.downloadFromInfo(info, { format: bestAudio });
    console.log("Successfully created audio stream.");

    const responseHeaders = new Headers(corsHeaders);
    responseHeaders.set('Content-Type', bestAudio.mimeType);
    responseHeaders.set('Cache-Control', 'no-cache');

    console.log("Streaming audio back to client.");
    return new Response(audioStream, {
      headers: responseHeaders,
      status: 200,
    });

  } catch (error) {
    console.error("An error occurred in the get-audio-stream function:");
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error message: ${errorMessage}`);
    
    return new Response(JSON.stringify({ error: `Failed to process video: ${errorMessage}` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});