# Fila Certa — Consola do Dono

App separada, para o dono da plataforma Fila Certa: cria/remove instituições, filiais e balcões, e atribui colaboradores (agente/gestor) a uma instituição/filial. Partilha o mesmo projecto Supabase das outras duas apps (`fila-certa-staff`, `projectogestaodefilas`); as migrações (tabela `owners`, RPCs `owner_*`) vivem em `fila-certa-staff/supabase/migrations`.

## Como entrar pela primeira vez

1. Crie a sua conta em Supabase → **Authentication → Add User** (email + palavra-passe).
2. No **SQL Editor**, torne-se dono:
   ```sql
   insert into owners (id, name)
   select id, 'O Seu Nome' from auth.users where email = 'o-seu-email@exemplo.com';
   ```
3. Entre em https://paulinoquicassa.github.io/fila-certa-owner/ com esse email/palavra-passe.

## Criar um novo colaborador (agente/gestor)

1. Crie a conta de login no Dashboard do Supabase (Authentication → Add User) — a consola do dono nunca cria contas, só as associa.
2. Em **Colaboradores**, atribua essa conta (por email) a uma instituição/filial/perfil.

## Desenvolvimento

```
npm install
cp .env.example .env.local
npm run dev
```
