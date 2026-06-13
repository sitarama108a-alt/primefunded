
// This handles email triggering via Resend
// VITE_RESEND_API_KEY should be set in environment variables

export async function sendCredentialEmail(email: string, details: any) {
  console.log(`Sending credentials to ${email}`, details);
}

export async function sendBreachEmail(email: string, breachDetails: string) {
  console.log(`Sending breach alert to ${email}`, breachDetails);
}

export async function sendKycApprovalEmail(email: string) {
  console.log(`✅ KYC Approved: Sending notification to ${email}`);
  // In a real app:
  /*
  await resend.emails.send({
    from: 'PrimeFunded <support@primefunded.com>',
    to: [email],
    subject: '✅ KYC Verified - Payouts Unlocked!',
    html: `
      <h1>Identity Verified!</h1>
      <p>Congratulations! Your KYC verification is complete.</p>
      <p>You can now request payouts from your PrimeFunded account. Login to get started.</p>
    `,
  });
  */
}

export async function sendKycRejectionEmail(email: string, reason: string) {
  console.log(`❌ KYC Rejected: Sending notification to ${email}. Reason: ${reason}`);
  /*
  await resend.emails.send({
    from: 'PrimeFunded <support@primefunded.com>',
    to: [email],
    subject: '❌ KYC Verification Failed',
    html: `
      <h1>Verification Required</h1>
      <p>Your KYC was rejected.</p>
      <p><strong>Reason:</strong> ${reason}</p>
      <p>Please login and resubmit your documents.</p>
    `,
  });
  */
}

export async function sendFreeAccountGrantEmail(email: string, plan: string, size: string) {
  console.log(`🎁 Free Account Granted: Sending notification to ${email}`);
}
