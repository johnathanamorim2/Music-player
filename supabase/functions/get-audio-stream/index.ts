import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
// @ts-ignore
import play from 'https://esm.sh/play-dl@1.9.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { videoId } = await req.json();
    if (!videoId) {
      return new Response(JSON.stringify({ error: 'videoId is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    
    const videoInfo = await play.video_info(videoUrl);
    const audioFormats = videoInfo.format.filter((f: any) => f.mime_type?.includes('audio/'));
    
    if (!audioFormats || audioFormats.length === 0) {
        return new Response(JSON.stringify({ error: 'No audio-only formats found' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 404,
        });
    }

    const bestAudio = audioFormats.sort((a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0))[0];

    if (!bestAudio || !bestAudio.url) {
        return new Response(JSON.stringify({ error: 'Could not find a valid audio URL' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 404,
        });
    }

    return new Response(JSON.stringify({ audioUrl: bestAudio.url }), {
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