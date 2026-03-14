# LINE: conta, canais e LIFF

Este documento foi consolidado para o modelo atual de canais do LINE.

## Regra principal

O LIFF deve ficar em um canal `LINE Login`.

A notificacao push usa o canal `Messaging API`.

## Estrutura recomendada

- `LINE Login`: hospeda o app LIFF e fornece o `liffId`
- `Messaging API`: envia a mensagem "pedido pronto"

## Passos

1. Crie ou selecione um provider no LINE Developers.
2. Crie um canal `LINE Login`.
3. Dentro dele, crie o app LIFF e copie o `LIFF ID`.
4. Configure a `Endpoint URL` com a URL publica do site.
5. Crie ou selecione um canal `Messaging API`.
6. Gere o `Channel access token` desse canal para a notificacao.

## No projeto

Atualize `js/config.js` com o `liffId` do canal LINE Login.

Guarde o token do canal Messaging API no backend escolhido:

- `CHANNEL_ACCESS_TOKEN` no Supabase ou no ambiente do webhook

## Observacao operacional

Para receber push, o usuario precisa conseguir receber mensagens do Official Account vinculado ao canal Messaging API.
