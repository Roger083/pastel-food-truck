# Push para GitHub

Guia enxuto para publicar alteracoes no repositorio remoto.

## Fluxo normal

Na raiz do repositorio:

```bash
git status
git add .
git commit -m "Descreva a alteracao"
git push origin main
```

Se a branch principal do repositorio for outra, ajuste o nome da branch.

## Antes do push

Confirme:

- `README.md` e os demais `.md` estao coerentes com o codigo atual
- `js/config.js` nao contem segredos que voce nao quer versionar
- migrations novas foram adicionadas ao repositorio

## Observacao

Versoes antigas deste guia tinham instrucoes especificas para caminhos Windows e arquivos pontuais. Elas foram removidas para evitar divergencia com o estado atual do repositorio.
