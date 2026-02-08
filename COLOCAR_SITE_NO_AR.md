# Colocar o site no ar (GitHub Pages) – passo a passo

Siga na ordem. Cada passo diz onde clicar e o que digitar.

---

## O que você vai fazer

1. Criar uma conta no GitHub (se ainda não tiver).
2. Criar um repositório novo para o projeto.
3. Enviar os arquivos do projeto para esse repositório.
4. Ativar o GitHub Pages no repositório.
5. Copiar a URL do site e colar no LINE (LIFF).

No final você terá uma URL tipo: `https://SEU_USUARIO.github.io/food-truck/`

---

## Passo 1: Conta no GitHub

1. Abra o navegador e vá em: **https://github.com**
2. Se não tiver conta, clique em **Sign up** e crie (e-mail, senha, nome de usuário).
3. Se já tiver, faça **Sign in** (entrar).

---

## Passo 2: Criar um repositório novo

1. No GitHub, no canto superior direito, clique no **+** e depois em **New repository**.
2. Em **Repository name** digite: **food-truck** (tudo minúsculo, com hífen).
3. Deixe **Public** marcado.
4. **Não** marque "Add a README file".
5. Clique em **Create repository**.

Vai abrir uma página com instruções. Você pode fechar ou minimizar; vamos fazer pelo Cursor/terminal.

---

## Passo 3: Enviar os arquivos do projeto para o GitHub

Você vai usar o **Git** (que já vem no WSL) e o **terminal do Cursor** (na pasta do projeto no WSL).

### 3.1 Abrir o terminal na pasta do projeto

1. No Cursor, abra a pasta do projeto: **File → Open Folder** → escolha a pasta **food-truck** (a do WSL: `/home/roger/projetos/food-truck` ou pelo ícone WSL).
2. Abra o terminal: **Terminal → New Terminal** (ou Ctrl+`).
3. Confirme que está na pasta certa. Digite:
   ```bash
   pwd
   ```
   Deve aparecer algo como `/home/roger/projetos/food-truck`.

### 3.2 Inicializar o Git (se ainda não tiver)

No terminal, rode um por vez:

```bash
git init
```

Se aparecer "Reinitialized" ou "Initialized", está ok.

### 3.3 Dizer ao Git para ignorar node_modules

```bash
echo "node_modules/" >> .gitignore
```

(Se o arquivo `.gitignore` já existir e já tiver `node_modules`, pode pular.)

### 3.4 Adicionar todos os arquivos

```bash
git add .
```

### 3.5 Fazer o primeiro “commit”

```bash
git commit -m "Site food truck LIFF + admin"
```

### 3.6 Ligar ao repositório do GitHub

Troque **SEU_USUARIO** pelo seu nome de usuário do GitHub (ex.: se sua página é github.com/roger083, use **roger083**):

```bash
git remote add origin https://github.com/SEU_USUARIO/food-truck.git
```

Exemplo:
```bash
git remote add origin https://github.com/roger083/food-truck.git
```

Se aparecer "error: remote origin already exists", use antes:
```bash
git remote remove origin
```
e depois rode de novo o `git remote add origin ...`.

### 3.7 Enviar os arquivos (push)

```bash
git branch -M main
git push -u origin main
```

O Git vai pedir **usuário** e **senha**. No GitHub não se usa mais senha comum; usa **Personal Access Token**:

1. No GitHub: clique na sua foto (canto superior direito) → **Settings**.
2. No menu da esquerda, lá embaixo: **Developer settings**.
3. **Personal access tokens** → **Tokens (classic)**.
4. **Generate new token (classic)**.
5. Dê um nome (ex.: "food-truck") e marque o escopo **repo**.
6. Clique em **Generate token** e **copie** o token (ele só aparece uma vez).
7. No terminal, quando pedir **Password**, **cole o token** (não a senha da conta) e aperte Enter.

Se der certo, aparece algo como "Branch 'main' set up to track 'origin/main'".

---

## Passo 4: Ativar o GitHub Pages

1. No GitHub, abra o repositório **food-truck** (github.com/SEU_USUARIO/food-truck).
2. Clique em **Settings** (aba do repositório).
3. No menu da esquerda, clique em **Pages** (em "Code and automation").
4. Em **Source** (Build and deployment), onde está "None", mude para **Deploy from a branch**.
5. Em **Branch**, escolha **main** e a pasta **/ (root)**.
6. Clique em **Save**.

Em 1–2 minutos o site fica no ar. A URL será:

**https://SEU_USUARIO.github.io/food-truck/**

(Substitua SEU_USUARIO pelo seu usuário do GitHub.)

---

## Passo 5: Configurar a URL no LINE (LIFF)

1. Vá em **https://developers.line.biz** e entre no seu canal.
2. No menu, clique em **LIFF**.
3. Clique na sua LIFF (a do food truck).
4. Em **Endpoint URL**, coloque: **https://SEU_USUARIO.github.io/food-truck/**
5. Salve (Update).

---

## Resumo das URLs

| O quê              | URL |
|--------------------|-----|
| Site (clientes)    | https://SEU_USUARIO.github.io/food-truck/ |
| LIFF (no LINE)     | mesma URL acima (Endpoint URL do LIFF) |
| Admin (iPad)       | https://SEU_USUARIO.github.io/food-truck/admin.html |

---

## Se der erro no terminal

- **"git: command not found"** → Instale o Git no WSL: `sudo apt install git`
- **"Permission denied" ou "Authentication failed"** → Use o **Personal Access Token** como senha (não a senha da conta).
- **"remote origin already exists"** → Rode `git remote remove origin` e depois `git remote add origin https://github.com/SEU_USUARIO/food-truck.git` de novo.

Se travar em algum passo, anote o número do passo e a mensagem de erro e peça ajuda.
