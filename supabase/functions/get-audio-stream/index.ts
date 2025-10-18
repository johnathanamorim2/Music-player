import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
// @ts-ignore
import play from 'https://esm.sh/play-dl@1.9.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  console.log("get-audio-stream function invoked with play-dl.");

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
    console.log(`Fetching audio stream for URL: ${videoUrl}`);
    
    const streamInfo = await play.stream(videoUrl, {
        quality: 2, // 0 = lowest, 1 = low, 2 = high
    });

    if (!streamInfo || !streamInfo.stream) {
        console.error("Could not get audio stream from play-dl.");
        return new Response(JSON.stringify({ error: 'Could not get audio stream' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }
    
    console.log(`Successfully got audio stream with type: ${streamInfo.type}`);

    const responseHeaders = new Headers(corsHeaders);
    responseHeaders.set('Content-Type', streamInfo.type);
    responseHeaders.set('Cache-Control', 'no-cache');

    console.log("Streaming audio back to client.");
    return new Response(streamInfo.stream, {
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