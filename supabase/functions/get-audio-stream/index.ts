import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore
import Innertube from 'https://esm.sh/youtubei.js@7.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize the library once outside the handler for performance.
// This can take a moment on the first run.
const youtube = await Innertube.create();

serve(async (req: Request) => {
  console.log("get-audio-stream function invoked with youtubei.js.");

  if (req.method === 'OPTIONS') {
    console.log("Handling OPTIONS request.");
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log("Parsing request body...");
    const { videoId } = await req.json();
    console.log(`Received videoId for streaming: ${videoId}`);

    if (!videoId) {
      throw new Error('videoId is required');
    }

    console.log(`Fetching audio stream for videoId: ${videoId}`);
    
    // youtubei.js returns a Web API ReadableStream directly, which is perfect for Deno.
    const stream = await youtube.download(videoId, {
      type: 'audio',
      quality: 'best',
      format: 'webm'
    });

    console.log("Successfully got stream from youtubei.js.");

    const responseHeaders = new Headers(corsHeaders);
    responseHeaders.set('Content-Type', 'audio/webm');
    responseHeaders.set('Cache-Control', 'no-cache');

    console.log("Streaming audio back to client.");
    return new Response(stream, {
      headers: responseHeaders,
      status: 200,
    });

  } catch (error) {
    console.error("An error occurred in the get-audio-stream function:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error message: ${errorMessage}`);
    
    return new Response(JSON.stringify({ error: `Failed to process video: ${errorMessage}` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});