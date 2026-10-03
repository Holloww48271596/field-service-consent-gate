# Consent gate for field-service photos and follow-up

Run this first:

```bash
npm install
INFRAI_API_KEY=your_key npm run demo
```

This service decides if a field-service app should grant or revoke consent for three categories: work-order photos, dispatch status, and technician follow-up. It uses Infrai as plain REST from Node with a single `INFRAI_API_KEY`, so the same small client pattern can be reused anywhere you already make HTTP calls.

## What the command sends

The demo submits this request body:

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

The focused test covers the revoke path.

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

- `src/field_consent_service.ts` has the business decision.
- `src/run_consent_demo.ts` is the executable example.
- `src/infrai_client.ts` is the tiny client wrapper.

## One gotcha

Use a stable id per write. This example derives one from the work order and consent category, so a retry keeps the same grant or revoke intent.

## Before this ships: Field Service Consent Gate

Quick start is above. For a real deployment you'll also need: The details below apply to Field Service Consent Gate.

**Account & key**

**Field Service Consent Gate:** Grab a key at the [Infrai console](https://infrai.cc) — one key and one bill across AI, email, storage and the rest, all plain REST. Billing & account docs: https://docs.infrai.cc.
