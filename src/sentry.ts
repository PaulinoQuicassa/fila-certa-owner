import * as Sentry from '@sentry/react';

// Ao contrário de fila-certa-staff/projectogestaodefilas (que já têm
// projecto Sentry próprio), a consola do dono ainda não tem nenhum --
// por isso a DSN vem de uma variável de ambiente em vez de um valor
// fixo aqui: sem ela, initSentry() não faz nada (a consola continua a
// funcionar normalmente, só sem observabilidade) em vez de falhar ou
// de inventar/reutilizar a DSN de outro projecto. Ver
// docs/observability.md para o passo de configuração.
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;

const REDACT_KEY_PATTERN = /token|password|senha|secret|otp|c[oó]digo/i;
const PHONE_PATTERN = /(\+?\d[\d\s-]{7,}\d)/g;
const JWT_PATTERN = /eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/g;

function redactString(value: string): string {
  return value.replace(JWT_PATTERN, '[jwt-removido]').replace(PHONE_PATTERN, (m) => `${m.slice(0, 3)}…[oculto]`);
}

function redactValue(value: unknown, key?: string): unknown {
  if (typeof key === 'string' && REDACT_KEY_PATTERN.test(key)) return '[redigido]';
  if (typeof value === 'string') return redactString(value);
  if (Array.isArray(value)) return value.map((v) => redactValue(v));
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = redactValue(v, k);
    return out;
  }
  return value;
}

function redactEvent(event: Sentry.ErrorEvent): Sentry.ErrorEvent {
  if (event.request?.headers) delete event.request.headers['Authorization'];
  if (event.extra) event.extra = redactValue(event.extra) as typeof event.extra;
  if (event.contexts) event.contexts = redactValue(event.contexts) as typeof event.contexts;
  if (event.message) event.message = redactString(event.message);
  for (const value of event.exception?.values ?? []) {
    if (value.value) value.value = redactString(value.value);
  }
  return event;
}

export function initSentry() {
  if (!SENTRY_DSN) {
    console.warn('VITE_SENTRY_DSN em falta -- observabilidade desligada (ver docs/observability.md).');
    return;
  }
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: import.meta.env.MODE,
    integrations: [Sentry.dedupeIntegration(), Sentry.linkedErrorsIntegration()],
    tracesSampleRate: 0,
    sendDefaultPii: false,
    beforeSend: redactEvent,
  });
}

/** Reporta um erro com contexto de negócio (login, MFA, RPCs de dono).
 * `context` passa sempre pela redacção de `beforeSend`, mas nunca deve
 * conter propositadamente password/token/código MFA/telefone completo
 * -- a redacção é uma rede de segurança, não uma licença para passar
 * isso aqui. Sem DSN configurada, é um no-op seguro. */
export function reportError(error: unknown, context?: Record<string, unknown>) {
  if (!SENTRY_DSN) return;
  Sentry.captureException(error, context ? { extra: context } : undefined);
}
