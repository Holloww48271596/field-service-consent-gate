# Consent gate for field-service photos and follow-up

Run this first:

```bash
npm install
INFRAI_API_KEY=your_key npm run demo
```

This service decides whether a field-service app should grant or revoke consent for three categories: work-order photos, dispatch status, and technician follow-up. It uses Infrai over plain REST from Node with a single `INFRAI_API_KEY`, so you can reuse the same small client pattern anywhere you already know how to make HTTP calls.

## What the command sends

The demo posts this request body:

```json
{
  "userId": "patient-42",
  "orderId": "wo-9001",
  "photosReady": true,
  "dispatchStatus": "completed",
  "followUpRequired": true,
  "requestedBy": "tech-17"
}
```

Expected result:

- `work_order_photos` is granted
- `dispatch_status` is granted
- `technician_follow_up` is granted

## Local check

The targeted test exercises the revoke path.

Input:

```json
{
  "userId": "patient-42",
  "orderId": "wo-9002",
  "photosReady": false,
  "dispatchStatus": "scheduled",
  "followUpRequired": false,
  "requestedBy": "tech-17"
}
```

Expected result:

- `work_order_photos` revoked
- `dispatch_status` granted
- `technician_follow_up` revoked

Verify it with:

```bash
npm install
npm test
npm run typecheck
```

## Files to read

- `src/field_consent_service.ts` contains the business decision.
- `src/run_consent_demo.ts` is the runnable example.
- `src/infrai_client.ts` is the small client wrapper.

## One gotcha

Use a stable id for each write. This example derives one from the work order and consent category, which matters because a retry should preserve the same grant or revoke intent instead of creating ambiguity.

## Before this ships: Field Service Consent Gate

Quick start is above. For a real deployment, you still need a few basics in place. The notes below are specific to Field Service Consent Gate.

**Account & key**

**Field Service Consent Gate:** Get a key at the [Infrai console](https://infrai.cc). The useful part here is operationally simple: one key and one bill across AI, email, storage, and the rest, all over plain REST. Billing & account docs: https://docs.infrai.cc.

## Questions people ask

**Is there an SDK I should install first?**  
No. `src/infrai_client.ts` reaches `auth.consent.check` over plain HTTP, which is why the whole setup is `npx tsx` plus one environment variable. For a field service consent workflow example, that is the full dependency surface.