# MTN MoMo integration (sandbox first)

LipaClip now takes brand campaign deposits and pays out influencer
withdrawals through the **MTN Mobile Money Open API**, instead of Pesapal.

- **Deposits** (brand -> platform): Collections product, "Request to Pay" —
  pushes an approval prompt to the brand's phone.
- **Withdrawals** (platform -> influencer): Disbursements product, "Transfer" —
  pushes money straight to the influencer's phone, triggered by an admin.

## 1. Get sandbox credentials

1. Create an account at https://momodeveloper.mtn.com
2. Subscribe to the **Collections** product -> copy the Primary Key
   (this is `MOMO_COLLECTION_SUBSCRIPTION_KEY`).
3. Subscribe to the **Disbursements** product -> copy its Primary Key
   (this is `MOMO_DISBURSEMENT_SUBSCRIPTION_KEY`).

## 2. Set the subscription-key secrets

```bash
supabase secrets set \
  MOMO_ENV=sandbox \
  MOMO_COLLECTION_SUBSCRIPTION_KEY=xxxx \
  MOMO_DISBURSEMENT_SUBSCRIPTION_KEY=xxxx \
  MOMO_CALLBACK_HOST=your-project-ref.supabase.co
```

## 3. Deploy the functions

```bash
supabase functions deploy momo-provision-sandbox
supabase functions deploy momo-request-to-pay
supabase functions deploy momo-check-deposit-status
supabase functions deploy momo-disburse
supabase functions deploy momo-check-withdrawal-status
```

## 4. Create the sandbox API user/key (one-time, per product)

```bash
supabase functions invoke momo-provision-sandbox --data '{"product":"collection"}'
supabase functions invoke momo-provision-sandbox --data '{"product":"disbursement"}'
```

Each call returns an `apiUser` and `apiKey`. Save them:

```bash
supabase secrets set \
  MOMO_COLLECTION_API_USER=<from collection call> \
  MOMO_COLLECTION_API_KEY=<from collection call> \
  MOMO_DISBURSEMENT_API_USER=<from disbursement call> \
  MOMO_DISBURSEMENT_API_KEY=<from disbursement call>
```

Note: MTN sandbox only ever settles requests in **EUR** — the code already
defaults `MOMO_CURRENCY` to `EUR` when `MOMO_ENV=sandbox`, so you don't need
to set it. Amounts entered in the app stay in UGX for display; only the
value sent to MTN uses the sandbox currency.

## 5. Run the database migration

Apply `supabase/migrations/20260904_mtn_momo.sql` (via `supabase db push`,
or paste it into the SQL editor). It adds `phone`, `momo_reference_id`,
`momo_external_id`, `momo_status` columns to `deposits` and `withdrawals`,
and introduces a `processing` withdrawal status for "payout sent, waiting
on MTN's confirmation." If `withdrawals.status` has a check constraint,
the migration file has a commented-out snippet to extend it.

## 6. Test in sandbox

MTN's sandbox uses **EUR test MSISDNs** that simulate specific outcomes —
check the "Testing" section of the MoMo developer docs for the current
list of numbers that resolve as SUCCESSFUL/FAILED/PENDING. Use one of
those numbers when depositing/withdrawing to see the full flow:

1. Brand: New Campaign -> fill details -> Complete Payment -> enter a
   sandbox test number -> "Pay with MTN MoMo". The page shows "Check your
   phone" and polls automatically; on success the campaign goes live.
2. Admin: Withdrawals tab -> pending withdrawal -> "Disburse via MTN
   MoMo" -> status flips to `processing`, then `approved` once MTN
   confirms.

## 6. Going live later

Set `MOMO_ENV=production`, request your production subscription keys and
API user/key from MTN for your market, set `MOMO_CURRENCY` to the real
settlement currency (e.g. `UGX`), and update the `MOMO_BASE` production
URL in `supabase/functions/_shared/momo.ts` to the base URL MTN issues you.
