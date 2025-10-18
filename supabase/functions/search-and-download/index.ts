import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SearchResult {
  id: string;
  title: string;
  artist: string;
  thumbnail: string;
  duration: number;
}

async function getHealthyInstances(): Promise<string[]> {
  try {
    console.log('[LOG] Buscando lista de instâncias saudáveis de api.invidious.io...');
    const response = await fetch('https://api.invidious.io/instances.json');
    if (!response.ok) {
      throw new Error(`Não foi possível buscar a lista de provedores: Status ${response.status}`);
    }
    const instances = await response.json();
    
    const healthyInstances = instances
      .filter((instance: any) => {
        const details = instance[1];
        return details &&
               details.type === 'https' &&
               details.api === true &&
               details.cors === true &&
               details.monitor?.down === false;
      })
      .map((instance: any) => instance[1].uri);

    console.log(`[LOG] Encontradas ${healthyInstances.length} instâncias saudáveis.`);
    if (healthyInstances.length === 0) {
      throw new Error('Nenhum provedor de busca saudável está disponível no momento.');
    }
    return healthyInstances;
  } catch (error) {
    console.error('[ERROR] Falha ao obter instâncias saudáveis. Usando lista de fallback:', error);
    // Lista de fallback revisada para maior estabilidade.
    return [
      'https://invidious.sethforprivacy.com',
      'https://yewtu.be', 
      'https://invidious.projectsegfau.lt', // Nova instância
      'https://inv.riverside.rocks', // Nova instância
    ];
  }
}

async function searchYouTube(query: string): Promise<SearchResult[]> {
  console.log(`[LOG] Iniciando busca no YouTube por: "${query}"`);
  const healthyInstances = await getHealthyInstances();
  let lastError: Error | null = null;

  for (const instance of healthyInstances) {
    const url = `${instance}/api/v1/search?q=${encodeURIComponent(query)}&type=video`;
    try {
      console.log(`[LOG] Tentando instância: ${url}`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); 

      const response = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        let data;
        try {
          data = await response.json();
        } catch (jsonError) {
          lastError = new Error(`Instância ${instance} retornou conteúdo inválido (não-JSON).`);
          console.warn(`[WARN] Falha na análise JSON para ${instance}.`, jsonError);
          continue; 
        }

        console.log(`[LOG] Sucesso com ${instance}, ${data.length} resultados encontrados.`);
        if (data && Array.isArray(data)) {
          return data.slice(0, 12).map((video: any) => ({
            id: video.videoId,
            title: video.title,
            artist: video.author || 'Unknown Artist',
            thumbnail: video.videoThumbnails?.find((t: any) => t.quality === 'mqdefault')?.url || `https://i.ytimg.com/vi/${video.videoId}/mqdefault.jpg`,
            duration: video.lengthSeconds || 0,
          }));
        }
      } else {
        lastError = new Error(`Instância ${instance} retornou status ${response.status}`);
        console.warn(`[WARN] ${lastError.message}`);
      }
    } catch (err) {
      lastError = err as Error;
      console.warn(`[WARN] Falha na instância ${instance}:`, err.message);
    }
  }

  console.error('[ERROR] Todas as instâncias saudáveis falharam. Último erro:', lastError);
  throw new Error(`Não foi possível buscar músicas. O serviço pode estar instável. (Detalhe: ${lastError?.message || 'Todos os provedores falharam'})`);
}

serve(async (req) => {
  const jsonHeaders = { ...corsHeaders, 'Content-Type': 'application/json' };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ success: false, error: 'Não autorizado: Token ausente' }), { status: 401, headers: jsonHeaders });
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ success: false, error: `Falha na autenticação: ${authError?.message}` }), { status: 401, headers: jsonHeaders });
    }

    const body = await req.json();
    const { action, query, videoId } = body;

    if (action === 'search') {
      if (!query) throw new Error('O parâmetro "query" é obrigatório para a busca');
      const results = await searchYouTube(query);
      return new Response(JSON.stringify({ success: true, results }), { headers: jsonHeaders });
    } else if (action === 'download') {
      if (!videoId) throw new Error('O parâmetro "videoId" é obrigatório para o download');
      
      // 1. Check if song already exists
      const { data: existingSong } = await supabase.from('songs').select('id').eq('youtube_id', videoId).eq('user_id', user.id).maybeSingle();
      if (existingSong) {
        return new Response(JSON.stringify({ success: false, error: 'Música já existe na biblioteca' }), { status: 409, headers: jsonHeaders });
      }
      
      // 2. Search for video info
      const searchResults = await searchYouTube(videoId);
      if (!searchResults || searchResults.length === 0) throw new Error('Vídeo não encontrado');
      const videoInfo = searchResults[0];
      
      // 3. Insert into database
      const audioUrl = `https://www.youtube.com/watch?v=${videoId}`; // Usando URL do YouTube como audio_url
      
      const { data: song, error } = await supabase.from('songs').insert({
        title: videoInfo.title, artist: videoInfo.artist, duration: videoInfo.duration,
        thumbnail_url: videoInfo.thumbnail, youtube_id: videoId, user_id: user.id, audio_url: audioUrl,
      }).select().single();
      
      if (error) throw error;
      
      return new Response(JSON.stringify({ success: true, song }), { headers: jsonHeaders });
    }

    return new Response(JSON.stringify({ success: false, error: 'Ação inválida' }), { status: 400, headers: jsonHeaders });

  } catch (error) {
    console.error('--- [FATAL] Erro não tratado na função ---', error);
    const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido no servidor.';
    return new Response(JSON.stringify({ success: false, error: errorMessage }), { status: 500, headers: jsonHeaders });
  }
});