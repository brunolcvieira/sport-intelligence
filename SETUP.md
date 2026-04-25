# Sport Intelligence Agent — Setup

## 1. Instalar dependências

```bash
npm install
```

## 2. Variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha:

```
DATABASE_URL       # Supabase connection string (pooled)
DIRECT_URL         # Supabase direct connection (para migrations)
API_FOOTBALL_KEY   # Chave da API-Football (api-sports.io)
CRON_SECRET        # Segredo para proteger o endpoint cron
OPENAI_API_KEY     # Opcional — melhora o texto de análise
```

## 3. Banco de dados

```bash
npm run db:generate   # gera o Prisma Client
npm run db:push       # aplica o schema no Supabase (dev)
# OU para produção:
npm run db:migrate    # migrations versionadas
```

## 4. Rodar localmente

```bash
npm run dev
# Acesse: http://localhost:3000/dashboard
```

## 5. Executar análise manualmente (dev)

```bash
curl -X POST http://localhost:3000/api/run \
  -H "Content-Type: application/json" \
  -d '{"date":"2025-04-24"}'
```

## 6. Cron automático (Vercel)

O arquivo `vercel.json` configura o cron para rodar às **06:00 UTC** (03:00 BRT).

A rota `/api/cron/daily-football-analysis` é protegida pelo header:
```
Authorization: Bearer <CRON_SECRET>
```

## 7. Ligas suportadas (padrão)

| ID  | Liga                  |
|-----|-----------------------|
| 71  | Brasileirão Série A   |
| 72  | Brasileirão Série B   |
| 39  | Premier League        |
| 140 | La Liga               |
| 135 | Serie A               |
| 78  | Bundesliga            |
| 61  | Ligue 1               |
| 2   | Champions League      |
| 3   | Europa League         |
| 848 | Conference League     |

Para adicionar mais ligas, edite `PRIORITY_LEAGUES` em:
`src/services/football/fixtures.ts`

## 8. Deploy Vercel

```bash
vercel deploy --prod
```

Adicione todas as env vars no painel Vercel. O cron é ativado automaticamente.
