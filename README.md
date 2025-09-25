# Buddy Dashboards

Buddy Dashboards é uma plataforma de Business Intelligence focada em TVs corporativas (layout 16:9) e integrada ao Kommo CRM. O objetivo é monitorar vendas em tempo real com uma interface simples para usuários não técnicos.

## Recursos principais

- **Autenticação Supabase**: cadastro, login e proteção automática de rotas.
- **Onboarding Kommo**: conexão via OAuth (em breve) ou Token de Longa Duração com validação e armazenamento criptografado.
- **Dashboard 6x4**: grid preparado para TVs, dark mode minimalista, tipografia Inter 400.
- **Widgets iniciais**: métricas placeholders (vendas totais, pipeline, atividade recente) e slots livres para expansão.
- **Logout**: botão dedicado no painel principal.

## Como executar em desenvolvimento

1. Instale dependências:
   ```bash
   npm install
   ```
2. Configure o arquivo `.env.local` (exemplo abaixo).
3. Rode em modo desenvolvimento:
   ```bash
   npm run dev
   ```
4. Acesse `http://localhost:3000`.

## Variáveis de ambiente

| Variável | Descrição |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave pública anon do Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave service role (usar somente no servidor) |
| `KOMMO_TOKEN_SECRET` | Chave de criptografia local para tokens Kommo (mínimo 16 caracteres) |
| `KOMMO_CLIENT_ID` | Opcional — client id OAuth do Kommo |
| `KOMMO_CLIENT_SECRET` | Opcional — client secret OAuth |
| `KOMMO_REDIRECT_URI` | Opcional — redirect configurado no Kommo |

> Em produção (Vercel) configure as mesmas variáveis em **Settings → Environment Variables**. Nunca exponha `SUPABASE_SERVICE_ROLE_KEY`, `KOMMO_TOKEN_SECRET` ou segredos OAuth no cliente.

## Supabase

1. Execute o script `supabase/schema.sql` no **SQL Editor** do painel Supabase para criar tabelas, triggers e políticas RLS.
2. Habilite a extensão `pgcrypto` (já requisitado pelo script).
3. Opcional: desative confirmação de e-mail durante o desenvolvimento em *Authentication → Providers → Email*.

## Conexão Kommo

1. Informe o subdomínio (ex.: `suaempresa.kommo.com`).
2. Escolha OAuth (redirige para o Kommo) ou Token de Longa Duração.
3. Tokens são validados na API `api/v4/account` e armazenados criptografados.

## Scripts disponíveis

- `npm run dev`: ambiente de desenvolvimento (Next.js com Turbopack).
- `npm run build`: build de produção.
- `npm run start`: inicia o build default do Next.js.

## Deploy

O projeto foi preparado para deploy na Vercel. Certifique-se de:

1. Definir todas as variáveis de ambiente acima em **Production/Preview**.
2. Executar o build local (`npm run build`) para validar antes do push.
3. Conferir os logs da Vercel caso falhe — geralmente por variáveis ausentes.

## Roadmap

- Finalizar fluxo OAuth com troca de código por tokens.
- Popular dashboard com métricas reais (Supabase cache + Kommo Webhooks).
- Drag-and-drop de widgets no grid 6x4.
- Tema configurável e presets de TV.

---
Sinta-se livre para sugerir ajustes ou novas métricas para o dashboard!
