---
name: foodtruck-deploy-ops
description: Executar checks operacionais, preparar push e orientar deploy deste projeto. Use quando a tarefa envolver publicar frontend, fazer push para GitHub, validar `js/config.js`, revisar secrets do Supabase ou LINE, ou escolher entre deploy de Edge Function e webhook HTTP.
---

# Foodtruck Deploy Ops

## Workflow

1. Confirmar o alvo: frontend, git, Supabase, notificacao LINE ou combinacao deles.
2. Verificar somente o estado necessario: `git status`, arquivos alterados, docs relevantes e config atual.
3. Evitar instrucoes dependentes de maquina especifica.
4. Se houver mais de um fluxo de notificacao, explicitar qual sera usado no ambiente.

## Regras do projeto

- O frontend e estatico; deploy pode ser GitHub Pages, Vercel, Netlify ou equivalente.
- O admin atual usa Supabase Auth, nao tratar `ADMIN_SECRET` como fluxo principal.
- Para notificacao LINE, escolher entre:
- Edge Function `supabase/functions/mark-order-ready/`
- webhook HTTP `api/notify-line.js`
- Fazer push somente dos arquivos realmente alterados quando isso reduzir risco.

## Checklist rapido

- `git status` limpo ou alteracoes conhecidas
- `js/config.js` coerente com o ambiente
- migrations necessarias aplicadas
- secrets do backend definidos
- URL publica alinhada ao `liffId` e ao endpoint do LIFF

## Saida esperada

Responder com:

- o que falta para publicar
- o comando ou passo exato seguinte
- risco operacional restante, se houver
