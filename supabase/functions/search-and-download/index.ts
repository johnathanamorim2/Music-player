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

async function searchYouTube(query: string): Promise<SearchResult[]> {
  console.log(`[LOG] Iniciando busca no YouTube por: "${query}"`);
  const invidiousInstances = [
    'https://vid.puffyan.us',
    'https://iv.ggtyler.dev',
    'https://invidious.lunar.icu',
    'https://invidious.nerdvpn.de',
    'https://invidious.projectsegfau.lt',
    'https://invidious.slipfox.xyz',
    'https://inv.tux.pizza',
    'https://invidious.kavin.rocks'
  ];
  let lastError: Error | null = null;

  for (const instance of invidiousInstances) {
    const url = `${instance}/api/v1/search?q=${encodeURIComponent(query)}&type=video`;
    try {
      console.log(`[LOG] Tentando instância: ${url}`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
      const response = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      console.log(`[LOG] Resposta da instância ${instance}: Status ${response.status}`);
      if (response.ok) {
        let data;
        try {
          // Tenta clonar a resposta para ler o texto sem consumir o corpo
          const responseClone = response.clone();
          const text = await responseClone.text();
          if (text.trim().startsWith('<')) {
            throw new Error('A resposta é HTML, não JSON.');
          }
          data = await response.json();
        } catch (jsonError) {
          console.warn(`[WARN] Instância ${instance} retornou uma resposta inválida (não-JSON). Pulando. Erro: ${jsonError.message}`);
          lastError = new Error(`A instância ${instance} retornou dados inválidos.`);
          continue; // Pula para a próxima instância
        }

        console.log(`[LOG] Sucesso com ${instance}, ${data.length} resultados encontrados.`);
        if (data && Array.isArray(data) && data.length > 0) {
          return data.slice(0, 12).map((video: any) => ({
            id: video.videoId,
            title: video.title,
            artist: video.author || 'Unknown Artist',
            thumbnail: video.videoThumbnails?.find((t: any) => t.quality === 'mqdefault')?.url || `https://i.ytimg.com/vi/${video.videoId}/mqdefault.jpg`,
            duration: video.lengthSeconds || 0,
          }));
        }
      } else {
        console.warn(`[WARN] Instância ${instance} retornou status não-OK: ${response.status}`);
        lastError = new Error(`A instância ${instance} retornou status ${response.status}`);
      }
    } catch (err) {
      lastError = err as Error;
      console.warn(`[WARN] Falha na instância ${instance}:`, err instanceof Error ? err.message : 'Erro desconhecido');
    }
  }
  console.error('[ERROR] Todas as instâncias falharam. Último erro:', lastError);
  throw new Error(`Não foi possível buscar músicas. O serviço pode estar instável. (Detalhe: ${lastError?.message || 'Todos os provedores falharam'})`);
}

serve(async (req) => {
  const jsonHeaders = { ...corsHeaders, 'Content-Type': 'application/json' };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    let supabase;
    try {
      console.log('[DIAGNOSTIC] Lendo variáveis de ambiente...');
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      
      if (!supabaseUrl || !supabaseKey) {
        console.error('[FATAL] Variáveis de ambiente SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não encontradas.');
        throw new Error('Erro de configuração do servidor: Variáveis de ambiente ausentes.');
      }
      console.log('[DIAGNOSTIC] Variáveis de ambiente encontradas. Criando cliente Supabase...');
      supabase = createClient(supabaseUrl, supabaseKey);
      console.log('[DIAGNOSTIC] Cliente Supabase criado com sucesso.');
    } catch (e) {
      console.error('[FATAL] Falha ao inicializar o cliente Supabase:', e);
      throw new Error(`Erro de inicialização do servidor: ${e.message}`);
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autorizado: Token ausente' }), { status: 401, headers: jsonHeaders });
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: `Falha na autenticação: ${authError?.message}` }), { status: 401, headers: jsonHeaders });
    }

    const body = await req.json();
    const { action, query, videoId } = body;

    if (action === 'search') {
      if (!query) throw new Error('O parâmetro "query" é obrigatório para a busca');
      const results = await searchYouTube(query);
      return new Response(JSON.stringify(results), { headers: jsonHeaders });
    } else if (action === 'download') {
      if (!videoId) throw new Error('O parâmetro "videoId" é obrigatório para o download');
      const { data: existingSong } = await supabase.from('songs').select('id').eq('youtube_id', videoId).eq('user_id', user.id).maybeSingle();
      if (existingSong) {
        return new Response(JSON.stringify({ error: 'Música já existe na biblioteca' }), { status: 409, headers: jsonHeaders });
      }
      const searchResults = await searchYouTube(videoId);
      if (!searchResults || searchResults.length === 0) throw new Error('Vídeo não encontrado');
      const videoInfo = searchResults[0];
      const { data: song, error } = await supabase.from('songs').insert({
        title: videoInfo.title, artist: videoInfo.artist, duration: videoInfo.duration,
        thumbnail_url: videoInfo.thumbnail, youtube_id: videoId, user_id: user.id,
      }).select().single();
      if (error) throw error;
      return new Response(JSON.stringify(song), { headers: jsonHeaders });
    }

    return new Response(JSON.stringify({ error: 'Ação inválida' }), { status: 400, headers: jsonHeaders });

  } catch (error) {
    console.error('--- [FATAL] Erro não tratado na função ---', error);
    const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido no servidor.';
    return new Response(JSON.stringify({ error: errorMessage }), { status: 500, headers: jsonHeaders });
  }
});