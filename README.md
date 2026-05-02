# AnimeStream - VIP com Asaas via Cloudflare Worker

Este projeto agora inclui checkout VIP via PIX com Asaas em `pages/vip.html` e backend serverless em `workers/payment.js`.

## O que foi implementado

- Worker Cloudflare com rotas:
  - `POST /api/payment/create`
  - `POST /api/payment/webhook`
  - `GET /api/payment/status/{paymentId}`
- Página de assinatura VIP em `pages/vip.html`:
  - Formulário de nome/e-mail/CPF-CNPJ
  - Geração de QR Code PIX + payload copia/cola
  - Polling automático a cada 5s para confirmar pagamento
- Integração de navegação:
  - Link VIP em `index.html`
  - Link VIP em `pages/admin.html`
- Revalidação de VIP no cliente:
  - `js/firebase.js` agora normaliza `vipExpiresAt`, removendo VIP expirado e ativando VIP válido.

## Estrutura adicionada

- `workers/payment.js`
- `pages/vip.html`
- `wrangler.toml`

## Variáveis e secrets do Worker

No `wrangler.toml`:

- `FIREBASE_PROJECT_ID`
- `FIREBASE_TOKEN_URI` (default OAuth Google)

Secrets obrigatórios (NÃO versionar):

- `ASAAS_API_KEY`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

## Deploy do Worker

1. Instale Wrangler:

```bash
npm i -g wrangler
```

2. Login Cloudflare:

```bash
wrangler login
```

3. Configure `wrangler.toml`:

- Ajuste `name`
- Ajuste `routes.pattern` e `routes.zone_name` para seu domínio real
- Ajuste `FIREBASE_PROJECT_ID`

4. Defina os secrets:

```bash
wrangler secret put ASAAS_API_KEY
wrangler secret put FIREBASE_CLIENT_EMAIL
wrangler secret put FIREBASE_PRIVATE_KEY
```

Para `FIREBASE_PRIVATE_KEY`, cole a chave completa (com BEGIN/END).

5. Deploy:

```bash
wrangler deploy
```

## Configuração do Webhook Asaas

No painel Asaas, configure o webhook para:

`https://SEU_DOMINIO/api/payment/webhook`

Eventos relevantes:

- `PAYMENT_CONFIRMED`
- `PAYMENT_RECEIVED`

## Fluxo de dados

1. Usuário logado acessa `pages/vip.html`.
2. Frontend envia `{ uid, email, name, cpfCnpj }` para `POST /api/payment/create`.
3. Worker cria/usa customer Asaas, gera cobrança PIX e retorna QR + payload.
4. Frontend exibe PIX e consulta `GET /api/payment/status/{paymentId}` até confirmar.
5. Webhook e/ou status confirmado atualizam Firestore `users/{uid}`:
   - `isVIP: true`
   - `plan: "vip"`
   - `vipExpiresAt: +30 dias`

## Observações

- O worker usa Firestore REST API com Service Account JWT (sem Firebase Admin SDK).
- O valor VIP está definido em `workers/payment.js` como `VIP_VALUE = 19.9`.
- O billing está como `UNDEFINED` para permitir PIX no Asaas conforme solicitado.