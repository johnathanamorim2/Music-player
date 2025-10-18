import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
// @ts-ignore
import ytdl from "https://esm.sh/deno-ytdl@1.2.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  console.log("get-audio-stream function invoked with deno-ytdl via esm.sh.");

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

    console.log(`Fetching audio stream for videoId: ${videoId}`);
    
    const audioStream = ytdl(videoId, {
      filter: "audioonly",
      quality: "highestaudio",
    });

    if (!audioStream) {
        console.error("Could not get audio stream.");
        return new Response(JSON.stringify({ error: 'Could not get audio stream' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }
    
    console.log(`Successfully got audio stream.`);

    const responseHeaders = new Headers(corsHeaders);
    responseHeaders.set('Content-Type', 'audio/webm');
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