# Korrá Running Club · app

Site público + área do aluno + painel do treinador da assessoria **Korrá Running Club**.

- **Site:** korrarunningclub.com.br
- **Tecnologia:** Next.js 15 (App Router) · Supabase (login e banco) · Cloudflare Workers (hospedagem, via OpenNext)

## Estrutura

| Caminho | O que é |
|---|---|
| `app/page.tsx` | Site público (home) |
| `app/entrar` | Login por código no e-mail, sem senha |
| `app/aluno` | Área do aluno (precisa estar logado) |
| `app/treinador` | Painel do treinador: alunos, receita prevista, despesas |
| `components/` | Logo, cabeçalho e rodapé |
| `lib/supabase/` | Conexão com o Supabase (navegador, servidor e middleware) |
| `supabase/migrations/` | Estrutura do banco de dados (SQL) |

## Rodar no computador

```bash
npm install
cp .env.example .env.local   # preencha com os dados do Supabase
npm run dev                  # abre em http://localhost:3000
```

## Publicar

O Cloudflare publica automaticamente a cada *push* na branch `main` (Workers Builds).
Variáveis necessárias no Cloudflare: `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

## Fases

1. **Agora:** site público, login do aluno, painel do treinador, pagamentos (Asaas).
2. Fórum e conteúdos.
3. Comunidade ("Diz Aí Como Foi") e rankings (Garmin / Coros / Strava).
