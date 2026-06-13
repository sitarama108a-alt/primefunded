
// This handles email triggering via Resend / SMTP placeholders
// In a real app, use the resend npm package or similar

export async function sendCredentialEmail(email: string, details: any) {
  console.log(`📧 Sending credentials to ${email}`, details);
}

export async function sendBreachEmail(email: string, breachDetails: string) {
  console.log(`🚨 Sending breach alert to ${email}`, breachDetails);
}

export async function sendChallengePassEmail(email: string, name: string, challenge: string, size: string) {
  console.log(`🎉 Sending Challenge Pass email to ${email}`);
}

export async function sendChallengeFailEmail(email: string, name: string, challenge: string, size: string, reason: string) {
  console.log(`❌ Sending Challenge Terminated email to ${email}`);
}

export async function sendBroadcastEmail(email: string, title: string, body: string, name: string) {
  console.log(`📢 Sending Broadcast Email to ${email}: ${title}`);
}

export async function sendKycApprovalEmail(email: string) {
  console.log(`✅ KYC Approved: Sending notification to ${email}`);
}

export async function sendKycRejectionEmail(email: string, reason: string) {
  console.log(`❌ KYC Rejected: Sending notification to ${email}. Reason: ${reason}`);
}

export async function sendFreeAccountGrantEmail(email: string, plan: string, size: string) {
  console.log(`🎁 Free Account Granted: Sending notification to ${email}. Plan: ${plan} ${size}`);
}

export async function sendReferralCommissionEmail(email: string, amount: number, referredEmail: string) {
  console.log(`👥 Referral Commission Earned: Sending notification to ${email}. Amount: $${amount} from ${referredEmail}`);
}

export async function sendPayoutRequestedEmail(email: string, amount: string) {
  console.log(`💸 Payout Requested: Sending confirmation to ${email}. Amount: ${amount}`);
}

export async function sendPayoutProcessedEmail(email: string, amount: string) {
  console.log(`✅ Payout Processed: Sending notification to ${email}. Amount: ${amount}`);
}
