import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
// @ts-ignore
import play from "npm:play-dl@1.9.7";
import { Readable } from "node:stream";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  console.log("get-audio-stream function invoked with play-dl and Deno's Node compatibility layer.");

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

    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    console.log(`Fetching stream for URL: ${videoUrl}`);
    
    const streamData = await play.stream(videoUrl, {
        quality: 2, // 0: low, 1: medium, 2: high
    });

    const nodeStream = streamData.stream;
    // Convert Node.js stream to a Web API ReadableStream that Deno can serve
    const webStream = Readable.toWeb(nodeStream as any);
    
    console.log(`Successfully created stream of type ${streamData.type}.`);

    const responseHeaders = new Headers(corsHeaders);
    responseHeaders.set('Content-Type', streamData.type);
    if (streamData.content_length) {
        responseHeaders.set('Content-Length', String(streamData.content_length));
    }
    responseHeaders.set('Cache-Control', 'no-cache');

    console.log("Streaming audio back to client.");
    return new Response(webStream, {
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