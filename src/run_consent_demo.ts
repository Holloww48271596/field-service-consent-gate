import { applyFieldServiceConsent } from './field_consent_service';

const demoRequest = {
  userId: 'patient-42',
  orderId: 'wo-9001',
  photosReady: true,
  dispatchStatus: 'completed',
  followUpRequired: true,
  requestedBy: 'tech-17'
} as const;

async function main() {
  const result = await applyFieldServiceConsent(demoRequest);
  console.log(JSON.stringify({ input: demoRequest, result }, null, 2));
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
