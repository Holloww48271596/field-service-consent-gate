import { z } from 'zod';
import { infrai } from './infrai_client';

export const fieldConsentRequestSchema = z.object({
  userId: z.string().min(1),
  orderId: z.string().min(1),
  photosReady: z.boolean(),
  dispatchStatus: z.enum(['scheduled', 'en_route', 'completed', 'cancelled']),
  followUpRequired: z.boolean(),
  requestedBy: z.string().min(1)
});

export type FieldConsentRequest = z.infer<typeof fieldConsentRequestSchema>;

export type ConsentDecision = {
  category: 'work_order_photos' | 'dispatch_status' | 'technician_follow_up';
  shouldGrant: boolean;
  reason: string;
};

export type ConsentChange = {
  category: ConsentDecision['category'];
  action: 'granted' | 'revoked' | 'unchanged';
  reason: string;
};

export function decideConsentChanges(input: FieldConsentRequest): ConsentDecision[] {
  return [
    {
      category: 'work_order_photos',
      shouldGrant: input.photosReady,
      reason: input.photosReady ? 'photos attached to work order' : 'no photos attached'
    },
    {
      category: 'dispatch_status',
      shouldGrant: input.dispatchStatus !== 'cancelled',
      reason: input.dispatchStatus === 'cancelled' ? 'dispatch cancelled' : `dispatch ${input.dispatchStatus}`
    },
    {
      category: 'technician_follow_up',
      shouldGrant: input.followUpRequired,
      reason: input.followUpRequired ? 'follow-up required' : 'no follow-up required'
    }
  ];
}

function consentKey(orderId: string, category: string, action: 'grant' | 'revoke'): string {
  return `${orderId}:${category}:${action}`;
}

export async function applyFieldServiceConsent(rawInput: unknown): Promise<ConsentChange[]> {
  const input = fieldConsentRequestSchema.parse(rawInput);
  const decisions = decideConsentChanges(input);
  const changes: ConsentChange[] = [];

  for (const decision of decisions) {
    const current = await infrai.auth.consent.check(input.userId, decision.category);
    const isGranted = current.granted === true;

    if (decision.shouldGrant && !isGranted) {
      await infrai.auth.consent.grant(input.userId, {
        category: decision.category,
        idempotency_key: consentKey(input.orderId, decision.category, 'grant')
      });
      changes.push({ category: decision.category, action: 'granted', reason: decision.reason });
      continue;
    }

    if (!decision.shouldGrant && isGranted) {
      await infrai.auth.consent.revoke(input.userId, {
        category: decision.category,
        idempotency_key: consentKey(input.orderId, decision.category, 'revoke')
      });
      changes.push({ category: decision.category, action: 'revoked', reason: decision.reason });
      continue;
    }

    changes.push({ category: decision.category, action: 'unchanged', reason: decision.reason });
  }

  return changes;
}
