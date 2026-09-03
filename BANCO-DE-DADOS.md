# Especificação do banco de dados do TudoZap

Este documento pode ser enviado integralmente a outra IA para implementar o banco e substituir os dados locais de demonstração. O painel atual usa React 19, TypeScript, TanStack Start/Router e Vite. A implementação deve preservar o visual, as rotas e os componentes existentes.

## Objetivo

Transformar o painel TudoZap em uma aplicação multiusuário com autenticação, persistência real, isolamento total dos dados por conta, saldo de créditos transacional e integração segura com o Mercado Pago.

O primeiro usuário deve ser criado assim:

- Nome: `José Augusto Monteiro Neto`
- Saldo inicial: `0` créditos
- Plano: `inicial`
- Sem instâncias, grupos, contatos, regras, automações ou atividades de demonstração
- E-mail: usar o e-mail informado no cadastro ou definir por variável de ambiente no seed inicial

## Tecnologia recomendada

Use PostgreSQL. Pode ser Supabase, Neon, Railway ou PostgreSQL próprio. Para autenticação, prefira o serviço de autenticação da plataforma escolhida; se não houver, use sessões seguras com cookies `HttpOnly`, `Secure` e `SameSite=Lax`.

Use UUID em todas as chaves primárias, `timestamptz` em datas e migrations versionadas. Valores monetários devem ser armazenados em centavos inteiros; nunca use ponto flutuante para dinheiro.

## Modelo de dados

### `users`

- `id uuid primary key`
- `auth_user_id uuid unique not null` — referência ao provedor de autenticação
- `full_name text not null`
- `email citext unique not null`
- `role text not null default 'owner'` — `owner`, `admin`, `member`
- `plan text not null default 'initial'`
- `credits_balance bigint not null default 0 check (credits_balance >= 0)`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

### `credit_ledger`

Livro-razão imutável. Nunca edite ou apague lançamentos; correções devem ser novos lançamentos inversos.

- `id uuid primary key`
- `user_id uuid not null references users(id)`
- `direction text not null` — `credit` ou `debit`
- `amount bigint not null check (amount > 0)`
- `balance_after bigint not null check (balance_after >= 0)`
- `reason text not null` — `pix_recharge`, `reaction_usage`, `refund`, `manual_adjustment`
- `payment_transaction_id uuid null references payment_transactions(id)`
- `metadata jsonb not null default '{}'`
- `created_at timestamptz not null default now()`

Índices: `(user_id, created_at desc)` e índice único parcial em `payment_transaction_id` quando não nulo.

### `payment_transactions`

- `id uuid primary key`
- `user_id uuid not null references users(id)`
- `provider text not null default 'mercadopago'`
- `provider_payment_id text unique`
- `idempotency_key uuid unique not null`
- `credits bigint not null check (credits > 0)`
- `amount_cents bigint not null check (amount_cents > 0)`
- `status text not null` — `pending`, `approved`, `rejected`, `cancelled`, `refunded`, `expired`
- `payer_name text not null`
- `document_type text not null` — `CPF` ou `CNPJ`
- `document_last4 text not null`
- `provider_payload jsonb not null default '{}'` — guardar somente campos necessários e sem segredos
- `expires_at timestamptz`
- `approved_at timestamptz`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Não guardar CPF/CNPJ completo sem necessidade jurídica. Envie ao provedor, mantenha apenas os quatro últimos dígitos e, se o documento integral for indispensável, criptografe-o com uma chave fora do banco.

### `instances`

- `id uuid primary key`
- `user_id uuid not null references users(id)`
- `name text not null`
- `phone_e164 text`
- `profile_photo_url text`
- `status text not null default 'offline'` — `connecting`, `connected`, `offline`
- `provider_instance_id text`
- `credentials_secret_ref text` — referência a segredo criptografado; nunca credencial em texto puro
- `last_seen_at timestamptz`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Restrição única: `(user_id, provider_instance_id)`. Índice: `(user_id, status)`.

### `groups`

- `id uuid primary key`
- `user_id uuid not null references users(id)`
- `instance_id uuid not null references instances(id) on delete cascade`
- `provider_group_id text not null`
- `name text not null`
- `photo_url text`
- `participants_count integer not null default 0`
- `is_admin boolean not null default false`
- `monitoring_enabled boolean not null default false`
- `last_synced_at timestamptz`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Restrição única: `(instance_id, provider_group_id)`. Índice: `(user_id, name)`.

### `reaction_rules`

- `id uuid primary key`
- `user_id uuid not null references users(id)`
- `name text not null`
- `enabled boolean not null default true`
- `bot_min integer not null check (bot_min > 0)`
- `bot_max integer not null check (bot_max >= bot_min)`
- `delay_min_minutes integer not null check (delay_min_minutes between 1 and 1440)`
- `delay_max_minutes integer not null check (delay_max_minutes between delay_min_minutes and 1440)`
- `admins_only boolean not null default true`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

### `reaction_rule_groups`

- `reaction_rule_id uuid references reaction_rules(id) on delete cascade`
- `group_id uuid references groups(id) on delete cascade`
- Chave primária composta: `(reaction_rule_id, group_id)`

### `reaction_rule_keywords`

- `id uuid primary key`
- `reaction_rule_id uuid references reaction_rules(id) on delete cascade`
- `keyword text not null`
- Restrição única: `(reaction_rule_id, keyword)`

### `reaction_rule_emojis`

- `id uuid primary key`
- `reaction_rule_id uuid references reaction_rules(id) on delete cascade`
- `emoji text not null`
- Restrição única: `(reaction_rule_id, emoji)`

### `reaction_events`

- `id uuid primary key`
- `user_id uuid not null references users(id)`
- `rule_id uuid references reaction_rules(id) on delete set null`
- `group_id uuid references groups(id) on delete set null`
- `instance_id uuid references instances(id) on delete set null`
- `provider_message_id text not null`
- `emoji text not null`
- `status text not null` — `scheduled`, `completed`, `failed`, `cancelled`
- `scheduled_for timestamptz not null`
- `completed_at timestamptz`
- `error_code text`
- `created_at timestamptz not null default now()`

Índices: `(user_id, created_at desc)`, `(rule_id, status)` e `(scheduled_for)` para o worker.

### `contacts`

- `id uuid primary key`
- `user_id uuid not null references users(id)`
- `instance_id uuid references instances(id) on delete set null`
- `phone_e164 text not null`
- `name text`
- `source_group_id uuid references groups(id) on delete set null`
- `tags text[] not null default '{}'`
- `last_interaction_at timestamptz`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Restrição única: `(user_id, phone_e164)`.

### `automation_rules`

- `id uuid primary key`
- `user_id uuid not null references users(id)`
- `name text not null`
- `enabled boolean not null default true`
- `trigger_type text not null`
- `definition jsonb not null`
- `execution_count bigint not null default 0`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

### `webhook_events`

- `id uuid primary key`
- `provider text not null`
- `provider_event_id text not null`
- `event_type text not null`
- `payload jsonb not null`
- `processing_status text not null default 'pending'`
- `processed_at timestamptz`
- `created_at timestamptz not null default now()`

Restrição única: `(provider, provider_event_id)`. Essa tabela garante idempotência dos webhooks.

### `audit_logs`

- `id uuid primary key`
- `user_id uuid references users(id)`
- `actor_user_id uuid references users(id)`
- `action text not null`
- `entity_type text not null`
- `entity_id uuid`
- `metadata jsonb not null default '{}'`
- `created_at timestamptz not null default now()`

## Segurança e isolamento

- Toda consulta de dados do painel deve usar o `user_id` da sessão autenticada, nunca um ID enviado livremente pelo navegador.
- Ative Row Level Security quando usar Supabase. Cada política deve permitir acesso somente quando `user_id` pertence ao usuário autenticado.
- O token do Mercado Pago, segredo do webhook e credenciais de instâncias ficam exclusivamente no servidor.
- Não exponha segredos em respostas JSON, logs, bundle do navegador ou tabelas públicas.
- Valide todos os payloads com Zod no servidor.
- Aplique rate limit na criação de Pix, login, sincronização e webhooks.
- Registre alterações sensíveis em `audit_logs`.

## Fluxo correto de créditos via Mercado Pago

1. O navegador envia quantidade de créditos, nome e documento para `POST /api/credits/pix`.
2. O servidor obtém o usuário pela sessão, calcula o preço usando a tabela oficial do servidor e cria `payment_transactions` com status `pending` e uma `idempotency_key` única.
3. O servidor cria o pagamento Pix no Mercado Pago usando o access token de produção somente no backend.
4. O servidor salva `provider_payment_id`, valor e expiração e retorna apenas QR Code, código copia e cola, expiração e ID interno.
5. O webhook valida obrigatoriamente a assinatura do Mercado Pago. Depois consulta o pagamento diretamente na API do Mercado Pago; nunca confia apenas no payload recebido.
6. Dentro de uma transação do banco, bloqueia a linha do pagamento, verifica se ainda não foi creditado, muda o status para `approved`, cria um único lançamento em `credit_ledger` e incrementa `users.credits_balance`.
7. A restrição única por `provider_payment_id`/`payment_transaction_id` impede crédito duplicado mesmo com webhooks repetidos.
8. `GET /api/credits/status/:id` retorna o status do pagamento pertencente ao usuário autenticado. O navegador atualiza a tela, mas nunca altera o saldo localmente.

O saldo exibido no topo deve vir de `GET /api/me` ou `GET /api/credits/balance`. `localStorage` pode ser usado apenas como cache visual descartável, nunca como fonte oficial.

## APIs necessárias

- `GET /api/me` — perfil, plano e saldo
- `GET/POST/PATCH/DELETE /api/instances`
- `POST /api/instances/:id/connect` — inicia conexão/QR Code
- `POST /api/instances/:id/sync`
- `GET/PATCH /api/groups`
- `GET/POST/PATCH/DELETE /api/reaction-rules`
- `GET /api/reaction-stats?from=&to=`
- `GET/POST/PATCH/DELETE /api/contacts`
- `GET/POST/PATCH/DELETE /api/automations`
- `POST /api/credits/pix`
- `GET /api/credits/status/:id`
- `GET /api/credits/ledger`
- `POST /api/webhooks/mercadopago`

Todas as listas devem ter paginação, filtro, ordenação e autorização no servidor.

## Variáveis de ambiente

Crie `.env.example` sem valores reais:

```env
DATABASE_URL=
AUTH_SECRET=
APP_URL=
MERCADOPAGO_ACCESS_TOKEN=
MERCADOPAGO_WEBHOOK_SECRET=
INITIAL_ADMIN_EMAIL=
```

Nunca envie o arquivo `.env` real ao Git.

## Migração do frontend

- Manter as rotas e a aparência atuais.
- Remover gradualmente os arrays estáticos e o uso de `localStorage` em saldo, instâncias e regras.
- Criar uma camada de serviços tipada em `src/lib/api/`.
- Usar TanStack Query para consultas, estados de carregamento, invalidação e mutations.
- Exibir estados vazios existentes quando as APIs retornarem listas vazias.
- Em erro, mostrar mensagem útil sem dados internos do servidor.
- Só habilitar criação de regra de reação quando existir pelo menos um grupo sincronizado.

## Seed inicial

O seed deve criar apenas o usuário José Augusto Monteiro Neto, com saldo zero, se ele ainda não existir. Não criar dados fictícios. O seed precisa ser idempotente e nunca zerar dados de produção ao ser executado novamente.

## Testes de aceitação

- Um usuário não consegue ler ou alterar dados de outro usuário.
- Uma conta nova abre com todos os contadores em zero e listas vazias.
- O usuário inicial aparece como José Augusto Monteiro Neto.
- Criar, editar e excluir instâncias e regras persiste após atualizar a página.
- `admins_only` nasce ligado em novas regras.
- Os ranges de bots e delay rejeitam máximo menor que mínimo.
- Um Pix aprovado credita exatamente uma vez, mesmo recebendo o mesmo webhook várias vezes.
- Pix rejeitado, expirado ou de valor divergente não credita saldo.
- Saldo insuficiente impede consumo e não permite saldo negativo.
- Token do Mercado Pago não aparece no bundle, HTML, logs do cliente ou resposta da API.
- Exclusões usam confirmação e respeitam relações/cascatas planejadas.

## Prompt pronto para enviar a outra IA

> Implemente um banco PostgreSQL e a camada de backend para este projeto TudoZap seguindo integralmente o arquivo `BANCO-DE-DADOS.md`. Preserve a interface, as rotas e a integração visual existentes. Faça migrations versionadas, autenticação segura, isolamento de dados por usuário, APIs tipadas e integração idempotente com Mercado Pago. Substitua os mocks e o `localStorage` por dados reais em etapas pequenas. Crie apenas o usuário inicial “José Augusto Monteiro Neto”, com plano inicial e saldo zero; não adicione nenhum dado fictício. Não exponha nem sobrescreva segredos. Antes de alterar arquivos, inspecione o projeto e apresente um plano curto. Ao final de cada etapa, execute build, testes e migrations em um banco de desenvolvimento. Não rode migrations destrutivas em produção sem aprovação explícita.
