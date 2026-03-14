---
name: foodtruck-doc-sync
description: Atualizar e consolidar documentacao local deste projeto. Use quando a tarefa envolver `README.md`, arquivos `.md` da raiz, setup, deploy, LIFF, Supabase ou quando a documentacao estiver divergente do codigo atual.
---

# Foodtruck Doc Sync

## Workflow

1. Ler primeiro os arquivos reais do codigo afetado.
2. Tratar `README.md` como documento principal.
3. Resumir ou remover instrucoes legadas em vez de expandi-las.
4. Preferir instrucoes estaveis e independentes de maquina local.

## Regras do projeto

- Nao reintroduzir `ADMIN_SECRET` ou `list-orders` como fluxo principal sem verificar o codigo.
- Distinguir claramente frontend estatico, Supabase e webhook HTTP.
- Referenciar o estado atual do repositorio, nao historico antigo.
- Manter os outros `.md` curtos e subordinados ao `README.md`.

## Checklist rapido

- O documento descreve os arquivos e fluxos realmente presentes no repo.
- O texto nao depende de caminhos pessoais ou comandos desatualizados.
- O leitor consegue identificar o fluxo principal e as alternativas.

## Saida esperada

Responder com:

- o que foi consolidado
- o que ainda permanece historico ou opcional
