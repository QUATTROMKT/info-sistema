# Deploy do Sistema na Vercel

Siga este passo a passo para colocar seu sistema no ar.

## 1. Preparar o Código (Git)

Você precisa ter o código no GitHub.

1.  Crie um novo repositório no GitHub (ex: `sistema-info`).
2.  No terminal do projeto (`sistema`), rode:
    ```bash
    git init
    git add .
    git commit -m "Primeiro commit: Sistema completo"
    git branch -M main
    git remote add origin https://github.com/SEU_USUARIO/sistema-info.git
    git push -u origin main
    ```

## 2. Deploy na Vercel

1.  Acesse [vercel.com](https://vercel.com) e faça login.
2.  Clique em **"Add New..."** -> **"Project"**.
3.  Importe o repositório do GitHub que você acabou de criar.
4.  Nas configurações do projeto ("Configure Project"):
    *   **Environment Variables**: Adicione uma nova variável.
        *   **Name**: `DATABASE_URL`
        *   **Value**: Cole a connection string do Supabase (a mesma do `.env`).
5.  Clique em **Deploy**.

## 3. Finalização

A Vercel vai construir o projeto e te dar uma URL (ex: `sistema-info.vercel.app`).
Acesse e teste!

> **Nota:** Se precisar atualizar o banco de dados no futuro, rode `npx prisma migrate deploy` durante o build ou localmente apontando para o banco de produção.
