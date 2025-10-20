# Leccor Music

Este é um aplicativo de música PWA (Progressive Web App) construído com React, TypeScript, Tailwind CSS e Supabase para autenticação e armazenamento de dados.

## Configuração Local

Siga os passos abaixo para configurar e rodar o projeto em sua máquina local.

### Pré-requisitos

Você precisará ter o Node.js (versão 18+) e o npm instalados.

### 1. Clonar o Repositório

```bash
git clone <URL_DO_SEU_REPOSITORIO>
cd leccor-music
```

### 2. Instalar Dependências

Use o npm para instalar todas as dependências do projeto:

```bash
npm install
```

### 3. Configurar Variáveis de Ambiente

Este projeto utiliza o Supabase. Você precisará criar um arquivo `.env.local` na raiz do projeto e adicionar suas chaves do Supabase:

```
# Exemplo de .env.local
VITE_SUPABASE_URL="SUA_URL_DO_SUPABASE"
VITE_SUPABASE_ANON_KEY="SUA_CHAVE_ANON_DO_SUPABASE"
```

### 4. Rodar o Aplicativo

Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

O aplicativo estará acessível em `http://localhost:8080` (ou outra porta, se 8080 estiver ocupada).

### 5. PWA (Progressive Web App)

Este aplicativo é configurado como um PWA. Após rodar o projeto, você deve ver a opção de instalar o aplicativo no seu navegador (dependendo do suporte do navegador).