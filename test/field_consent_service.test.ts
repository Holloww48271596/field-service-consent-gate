import { describe, expect, it } from 'vitest';
import { decideConsentChanges } from '../src/field_consent_service';

describe('decideConsentChanges', () => {
  it('revokes photos and follow-up while keeping dispatch status granted for a scheduled visit', () => {
    const input = {
      userId: 'patient-42',
      orderId: 'wo-9002',
      photosReady: false,
      dispatchStatus: 'scheduled',
      followUpRequired: false,
      requestedBy: 'tech-17'
    } as const;

    expect(decideConsentChanges(input)).toEqual([
      {
        category: 'work_order_photos',
        shouldGrant: false,
        reason: 'no photos attached'
      },
      {
        category: 'dispatch_status',
        shouldGrant: true,
        reason: 'dispatch scheduled'
      },
      {
        category: 'technician_follow_up',
        shouldGrant: false,
        reason: 'no follow-up required'
      }
    ]);
  });
});
