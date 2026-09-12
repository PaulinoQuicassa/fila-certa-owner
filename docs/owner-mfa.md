# MFA obrigatório para donos da plataforma

Mecanismo real da Auth do Supabase (TOTP), nunca um segundo factor
local/inventado. Ver `fila-certa-staff/supabase/migrations/20260912140000_owner_mfa_enforcement.sql`
para a aplicação do lado do servidor.

## Pendente de configuração externa

O CLI local (`supabase/config.toml`, `[auth.mfa.totp]`) já activa
`enroll_enabled`/`verify_enabled` -- é o que os testes de CI usam. Isso
**não** activa nada em produção: no projecto Supabase real, é preciso
activar manualmente em **Authentication → Sign In / Providers →
Multi-Factor Authentication → Authenticator App (TOTP)**. O próprio
template de configuração do Supabase nota que MFA "está disponível no
plano Pro" -- se o projecto de produção estiver no plano gratuito, a
inscrição TOTP pode ficar bloqueada até fazer upgrade; confirmar isso
antes de assumir que o ecrã `MfaEnroll` vai funcionar em produção.

## Fluxo

1. **Login** (`Login.tsx`) — email + password, como antes.
2. **Gate** (`App.tsx`) decide o próximo ecrã a partir de
   `AuthContext.mfaState`, calculado em `computeMfaState()`
   (`AuthContext.tsx`) com `supabase.auth.mfa.listFactors()` +
   `getAuthenticatorAssuranceLevel()` — nunca a partir de um campo
   nosso, sempre do estado real da sessão na Auth:
   - **Nenhum factor TOTP verificado** → `MfaEnroll.tsx` (bloqueante,
     sem opção de saltar — só "Sair"). Chama
     `supabase.auth.mfa.enroll({ factorType: 'totp' })`, mostra o QR
     code (`data.totp.qr_code`, já uma data URL de imagem) e a chave
     manual (`data.totp.secret`), depois confirma com
     `challengeAndVerify`.
   - **Já tem um factor verificado, mas esta sessão está em aal1** →
     `MfaChallenge.tsx` — pede só o código de 6 dígitos.
   - **aal2 confirmado** → consola normal.
3. **Revalidação periódica** (`AuthContext.tsx`, a cada 5 min e ao
   voltar o separador a ficar visível) — reconfirma que a linha em
   `owners` ainda existe; se um outro dono removeu este acesso
   entretanto, força `signOut()` em vez de deixar a consola aberta com
   autorização já perdida.

## Aplicação real no servidor (não só na UI)

`is_owner()` (Postgres) passa a exigir `auth.jwt()->>'aal' = 'aal2'`
sempre que a conta **tem** um factor TOTP verificado
(`auth.mfa_factors`, status `'verified'`) — uma conta sem nenhum factor
continua a passar em aal1 (nunca tranca ninguém fora sem aviso), mas a
partir do momento em que activa o MFA, todas as RPCs/policies que
chamam `is_owner()` recusam uma sessão aal1 para sempre nessa conta,
mesmo que alguém contorne esta UI e chame a API directamente.
`owner_mfa_status()` (RPC) expõe esse mesmo estado ao cliente para a UI
decidir qual ecrã mostrar, sem depender de nenhuma lógica duplicada.

## Rollout para donos já existentes

Contas de dono criadas antes desta alteração não têm nenhum factor
TOTP — continuam a entrar normalmente (aal1) até à primeira vez que
abrirem a consola depois deste deploy, altura em que `MfaEnroll`
aparece e passam a ficar mesmo protegidos por MFA a partir daí. Não há
nenhuma forma de reabrir a consola sem completar a inscrição depois
dessa primeira vez.

## Testes

`fila-certa-staff/scripts/test-owner-mfa-enforcement.mjs` confirma, ao
nível da base de dados: (1) uma conta sem MFA continua a funcionar em
aal1; (2) assim que existe um factor `verified` em `auth.mfa_factors`,
uma RPC de dono chamada em aal1 passa a ser recusada. Não cobre o
fluxo de UI (`MfaEnroll`/`MfaChallenge`) nem o QR code em si — isso
precisa de um teste manual: activar MFA numa conta de teste, fechar a
sessão, voltar a entrar e confirmar que `MfaChallenge` aparece e pede o
código antes da consola.
