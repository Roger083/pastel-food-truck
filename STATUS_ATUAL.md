# Status atual

Data de consolidacao: 2026-03-14

## Resumo

O projeto esta acima da versao inicial documentada historicamente.

Estado atual confirmado no codigo:

- cliente com landing e paginas de cardapio
- admin com autenticacao por email e senha via Supabase Auth
- gestao de templates de menu
- configuracao de menu ativo
- categorias, fotos e alergenicos
- pedidos agendados
- suporte a notificacao LINE por Edge Function ou webhook HTTP

## Ponto de atencao

A documentacao antiga do repositorio misturava:

- fluxo admin com `ADMIN_SECRET`
- deploy de `list-orders`
- instrucoes especificas de maquina
- caminhos desatualizados

Esses pontos foram consolidados para reduzir contradicao, mas ainda e recomendavel validar qualquer passo operacional diretamente contra o codigo e a infraestrutura do ambiente.
