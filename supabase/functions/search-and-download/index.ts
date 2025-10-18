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
  console.log('Iniciando busca no YouTube por:', query);
  const invidiousInstances = [
    'https://invidious.kavin.rocks', 'https://vid.puffyan.us', 'https://iv.ggtyler.dev',
    'https://yewtu.be', 'https://invidious.projectsegfau.lt', 'https://invidious.protokolla.fi',
  ];
  let lastError: Error | null = null;
  for (const instance of invidiousInstances) {
    try {
      console.log(`Tentando instância: ${instance}`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      const response = await fetch(`${instance}/api/v1/search?q=${encodeURIComponent(query)}&type=video`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if (response.ok) {
        const data = await response.json();
        console.log(`Sucesso com ${instance}, ${data.length} resultados encontrados.`);
        if (data && data.length > 0) {
          return data.slice(0, 12).map((video: any) => ({
            id: video.videoId,
            title: video.title,
            artist: video.author || 'Unknown Artist',
            thumbnail: video.videoThumbnails?.find((t: any) => t.quality === 'mqdefault')?.url || `https://i.ytimg.com/vi/${video.videoId}/mqdefault.jpg`,
            duration: video.lengthSeconds || 0,
          }));
        }
      } else {
        console.warn(`Instância ${instance} retornou status: ${response.status}`);
      }
    } catch (err) {
      lastError = err as Error;
      console.warn(`Falha na instância ${instance}:`, err instanceof Error ? err.message : 'Erro desconhecido');
    }
  }
  console.error('Todas as instâncias falharam. Último erro:', lastError);
  throw new Error(`Não foi possível buscar músicas. O serviço pode estar instável. (Detalhe: ${lastError?.message || 'Todos os provedores falharam'})`);
}

serve(async (req) => {
  console.log('Função invocada. Método:', req.method);
  const jsonHeaders = { ...corsHeaders, 'Content-Type': 'application/json' };

  if (req.method === 'OPTIONS') {
    console.log('Tratando requisição OPTIONS.');
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('Lendo variáveis de ambiente...');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !supabaseKey) {
      console.error('Variáveis de ambiente SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não encontradas.');
      throw new Error('Erro de configuração no servidor.');
    }
    console.log('Variáveis de ambiente carregadas.');

    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('Cliente Supabase criado.');

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Cabeçalho de autorização ausente.');
      return new Response(JSON.stringify({ error: 'Não autorizado: Token ausente' }), { status: 401, headers: jsonHeaders });
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('Erro de autenticação:', authError?.message || 'Usuário não encontrado.');
      return new Response(JSON.stringify({ error: `Falha na autenticação: ${authError?.message}` }), { status: 401, headers: jsonHeaders });
    }
    console.log('Usuário autenticado:', user.id);

    console.log('Analisando corpo da requisição...');
    const body = await req.json();
    const { action, query, videoId } = body;
    console.log('Corpo da requisição analisado. Ação:', action);

    if (action === 'search') {
      if (!query) throw new Error('O parâmetro "query" é obrigatório para a busca');
      const results = await searchYouTube(query);
      console.log('Busca concluída com sucesso.');
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
      console.log('Download concluído com sucesso.');
      return new Response(JSON.stringify(song), { headers: jsonHeaders });
    }

    console.error('Ação inválida recebida:', action);
    return new Response(JSON.stringify({ error: 'Ação inválida' }), { status: 400, headers: jsonHeaders });

  } catch (error) {
    console.error('!!! Erro não tratado na função:', error);
    const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido no servidor.';
    return new Response(JSON.stringify({ error: errorMessage }), { status: 500, headers: jsonHeaders });
  }
});