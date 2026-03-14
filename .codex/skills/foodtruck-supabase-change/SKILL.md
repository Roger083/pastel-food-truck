---
name: foodtruck-supabase-change
description: Ajustar schema, migrations, RPCs, RLS, storage e funcoes do Supabase deste projeto. Use quando a tarefa envolver `supabase/migrations/`, `supabase/functions/`, autenticacao admin, notificacao LINE, compatibilidade entre frontend e banco ou erros de contrato entre paginas e RPCs.
---

# Foodtruck Supabase Change

## Workflow

1. Ler a migration ou funcao atual antes de editar.
2. Confirmar qual contrato o frontend esta usando.
3. Preferir compatibilidade aditiva em vez de quebrar ambientes antigos.
4. Atualizar documentacao apenas se o contrato mudar de forma relevante.

## Regras do projeto

- Tratar `supabase/migrations/` como historico cumulativo.
- Nao reescrever migrations antigas sem necessidade clara.
- Se o bug vier de diferenca entre frontend e RPC, considerar fallback no frontend e correcao no backend.
- Para admin, considerar que o fluxo principal atual usa Supabase Auth por email e senha.
- Para notificacao LINE, o projeto suporta Edge Function e webhook HTTP; evitar assumir um unico fluxo sem verificar.

## Checklist rapido

- Assinatura da RPC bate com os parametros reais enviados pelo frontend.
- Polices de RLS continuam coerentes com o uso anon e autenticado.
- Tabelas referenciadas no frontend ainda existem ou possuem substituto claro.
- Funcoes e secrets mencionados em docs batem com o codigo atual.

## Saida esperada

Responder com:

- contrato atual confirmado
- mudanca aplicada
- migration ou deploy adicional necessario, se houver
