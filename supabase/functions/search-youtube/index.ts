import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore
import YouTube from 'https://esm.sh/youtube-sr@4.3.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  console.log("search-youtube function invoked.");

  if (req.method === 'OPTIONS') {
    console.log("Handling OPTIONS request.");
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log("Parsing request body...");
    const { query } = await req.json();
    console.log(`Received search query: "${query}"`);

    if (!query) {
      console.error("Error: Query is required.");
      return new Response(JSON.stringify({ error: 'Query is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    console.log("Performing search on YouTube...");
    const searchResults = await YouTube.search(query, { limit: 12, type: 'video' });
    console.log(`Found ${searchResults.length} results.`);

    const formattedResults = searchResults.map((video: any) => ({
      id: video.id,
      title: video.title,
      artist: video.channel?.name,
      thumbnail: video.thumbnail?.url,
      duration: video.durationFormatted,
    }));

    console.log("Sending successful response.");
    return new Response(JSON.stringify(formattedResults), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error("An error occurred in the search-youtube function:");
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error message: ${errorMessage}`);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});