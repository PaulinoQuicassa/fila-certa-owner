# Fila Certa — Owner

App separada, para o dono da plataforma Fila Certa: cria/remove empresas (instituições), filiais e balcões, gere a facturação de cada empresa (NIF, tipo, preço por balcão, estado activo/trial/suspenso, receita mensal recorrente), define perfis de acesso nomeados, e atribui colaboradores (agente/gestor) e outros donos a uma instituição/filial/perfil. Partilha o mesmo projecto Supabase das outras duas apps (`fila-certa-staff`, `projectogestaodefilas`); as migrações (`owners`, `institution_billing`, `access_profiles`, RPCs `owner_*`) vivem em `fila-certa-staff/supabase/migrations`.

Design visual replicado do exemplar `AppOwnerFilacerta/` (mockup de referência, não versionado -- ver `.gitignore`).

Nota sobre "perfis de acesso": são uma camada real e persistida de catalogação (nome, âmbito, permissões, contagem de utilizadores) -- mas a aplicação técnica de quem pode fazer o quê continua a ser `staff.role` (agente/gestor) e a pertença à tabela `owners`, exactamente como no resto do projecto. Ver comentário no topo de `20260909150000_owner_billing_and_profiles.sql`.

## Como entrar pela primeira vez

1. Crie a sua conta em Supabase → **Authentication → Add User** (email + palavra-passe).
2. No **SQL Editor**, torne-se dono:
   ```sql
   insert into owners (id, name)
   select id, 'O Seu Nome' from auth.users where email = 'o-seu-email@exemplo.com';
   ```
3. Entre em https://paulinoquicassa.github.io/fila-certa-owner/ com esse email/palavra-passe.

## Criar um novo colaborador (agente/gestor)

1. Crie a conta de login no Dashboard do Supabase (Authentication → Add User) — esta app nunca cria contas, só as associa.
2. Em **Colaboradores**, atribua essa conta (por email) a uma instituição/filial/perfil operacional.

## Desenvolvimento

```
npm install
cp .env.example .env.local
npm run dev
```
