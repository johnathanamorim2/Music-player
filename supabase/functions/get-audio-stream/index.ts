import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore
import ytdl from 'https://esm.sh/ytdl-core@4.11.5';
import { Readable } from "https://deno.land/std@0.168.0/node/stream.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  console.log("get-audio-stream function invoked with ytdl-core and stream conversion.");

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
    
    // ytdl-core returns a Node.js-style Readable stream
    const nodeStream = ytdl(videoUrl, {
      filter: 'audioonly',
      quality: 'highestaudio'
    });

    // Convert the Node.js stream to a Web API ReadableStream, which is what Deno's Response expects.
    const webStream = Readable.toWeb(nodeStream as any);
    
    console.log(`Successfully created stream.`);

    const responseHeaders = new Headers(corsHeaders);
    responseHeaders.set('Content-Type', 'audio/webm');
    responseHeaders.set('Cache-Control', 'no-cache');

    console.log("Streaming audio back to client.");
    return new Response(webStream, {
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