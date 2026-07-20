# Billing (modular, disabled by default)

The app treats billing as an optional module. Core product code depends only on:

- `billing.getEntitlement(userId)` — server-side check
- `useEntitlement()` — client-side hook
- The `Entitlement` type

While billing is disabled the `dev-open` provider grants every authenticated
user full access. No credentials or webhooks are required.

## Adding a real provider later

1. Implement `BillingProvider` in `src/lib/billing/providers/<name>.ts`.
2. Register it in `src/lib/billing/index.ts` and select via
   `BILLING_PROVIDER=<name>` env var.
3. Add its webhook handler at `src/routes/api/public/billing/<name>.ts`
   (verify the provider signature before any DB write).
4. Persist subscription state on `profiles` (fields already exist:
   `subscription_status`, `trial_ends_at`, `subscription_ends_at`,
   `lemon_customer_id`, `lemon_subscription_id`) or add provider-specific
   columns via a migration.

## Placeholder environment variables

Nothing is required today. When a provider is added, expect variables like:

```
BILLING_PROVIDER=lemonsqueezy
LEMON_SQUEEZY_API_KEY=
LEMON_STORE_ID=
LEMON_VARIANT_ID=
LEMON_WEBHOOK_SIGNING_SECRET=
```

Add these through the secrets tool (never commit them).
