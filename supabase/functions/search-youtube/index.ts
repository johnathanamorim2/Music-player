import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore
import YouTube from 'https://esm.sh/youtube-sr@4.3.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();

    if (!query) {
      return new Response(JSON.stringify({ error: 'Query is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const searchResults = await YouTube.search(query, { limit: 12, type: 'video' });

    const formattedResults = searchResults.map((video: any) => ({
      id: video.id,
      title: video.title,
      artist: video.channel?.name,
      thumbnail: video.thumbnail?.url,
      duration: video.durationFormatted,
    }));

    return new Response(JSON.stringify(formattedResults), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});