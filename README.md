# Buddy Dashboards

Buddy Dashboards é uma plataforma de Business Intelligence focada em TVs corporativas (layout 16:9) e integrada ao Kommo CRM. O objetivo é monitorar vendas em tempo real com uma interface simples para usuários não técnicos.

## Recursos principais

- **Autenticação Supabase**: cadastro, login, logout e proteção automática de rotas.
- **Onboarding Kommo**: conexão via Token de Longa Duração (cada usuário gera seu token no Kommo e cola no wizard).
- **Dashboard 6x4**: grid preparado para TVs, dark mode minimalista, tipografia Inter 400.
- **Widgets iniciais**: placeholders de métricas (vendas totais, pipeline, atividade recente) e slots livres para expansão.

## Como executar em desenvolvimento

1. Instale dependências:
   ```bash
   npm install
   ```
2. Configure o arquivo `.env.local` (modelo abaixo).
3. Execute em modo desenvolvimento:
   ```bash
   npm run dev
   ```
4. Acesse `http://localhost:3000`.

### `.env.local` (exemplo)
```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
KOMMO_TOKEN_SECRET=troque-por-uma-string-forte
```

> Na Vercel, adicione as mesmas variáveis (se já existem com prefixo `buddy_`, crie aliases `NEXT_PUBLIC_SUPABASE_URL=${buddy_NEXT_PUBLIC_SUPABASE_URL}` etc.).

## Supabase

1. Execute `supabase/schema.sql` no **SQL Editor** para criar/atualizar tabelas, triggers e políticas RLS.
2. Garanta que a extensão `pgcrypto` esteja habilitada.
3. Opcional: desative confirmação de e-mail em *Authentication → Providers → Email* durante o desenvolvimento.

## Conexão Kommo (Token)

1. Informe o subdomínio (ex.: `suaempresa.kommo.com`).
2. No Kommo, acesse **Configurações → API** e gere um token de longa duração com permissões de leitura.
3. Cole o token na tela de onboarding; ele será validado e armazenado criptografado (`KOMMO_TOKEN_SECRET`).

## Scripts disponíveis

- `npm run dev` – ambiente de desenvolvimento.
- `npm run build` – build de produção.
- `npm run start` – inicia o build otimizado.

## Deploy (Vercel)

1. Confirme que as variáveis estão definidas em *Project → Settings → Environment Variables* (sem prefixo ou usando aliases).
2. Rode `npm run build` local para validar.
3. Faça o deploy; se falhar, copie o log e verifique mensagens sobre variáveis ausentes.

## Roadmap

- Popular dashboard com métricas reais (Supabase cache + Kommo Webhooks).
- Drag-and-drop de widgets e presets de TV.
- Alertas visuais para TVs (metas batidas, tickets críticos).

---
Sinta-se livre para sugerir ajustes ou novas métricas para o dashboard!
