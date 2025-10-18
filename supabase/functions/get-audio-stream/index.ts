import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Ytdl } from "https://deno.land/x/ytdl_deno@v0.1.1/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  console.log("get-audio-stream function invoked with ytdl-deno.");

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
    const streamResult = await Ytdl.stream(videoId, {
        filter: "audio"
    });

    const { stream, mimeType } = streamResult;

    if (!stream) {
        console.error("Could not get audio stream.");
        return new Response(JSON.stringify({ error: 'Could not get audio stream' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }
    
    console.log(`Successfully got audio stream with mimeType: ${mimeType}`);

    const responseHeaders = new Headers(corsHeaders);
    responseHeaders.set('Content-Type', mimeType);
    responseHeaders.set('Cache-Control', 'no-cache');

    console.log("Streaming audio back to client.");
    return new Response(stream, {
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