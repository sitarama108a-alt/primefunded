
// This handles email triggering via Resend
// In a real app, use the resend npm package

export async function sendCredentialEmail(email: string, details: any) {
  console.log(`📧 Sending credentials to ${email}`, details);
}

export async function sendBreachEmail(email: string, breachDetails: string) {
  console.log(`🚨 Sending breach alert to ${email}`, breachDetails);
}

export async function sendChallengePassEmail(email: string, name: string, challenge: string, size: string) {
  console.log(`🎉 Sending Challenge Pass email to ${email}`);
  const body = `
    Congratulations ${name}!
    You have successfully passed your ${challenge} - ${size} challenge.

    Your Performance:
    - Profit Achieved: Target Reached
    - Trading Days: Minimum Met
    - Daily Drawdown: Stayed within limits
    - Max Drawdown: Stayed within limits

    You have been promoted to the next stage/funded account.
    Login to your dashboard to continue.

    Best regards,
    PrimeFunded Team
  `;
  console.log('Email Body:', body);
}

export async function sendChallengeFailEmail(email: string, name: string, challenge: string, size: string, reason: string) {
  console.log(`❌ Sending Challenge Terminated email to ${email}`);
  const body = `
    Dear ${name},
    Unfortunately your ${challenge} - ${size} challenge has been terminated.

    Reason: ${reason}

    Your Statistics:
    - Account Size: ${size}
    - Challenge Type: ${challenge}
    - Termination Date: ${new Date().toLocaleDateString()}
    - Breach Type: ${reason}

    You can purchase a new challenge anytime.
    Login to try again.

    Best regards,
    PrimeFunded Team
  `;
  console.log('Email Body:', body);
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
  console.log(`🎁 Free Account Granted: Sending notification to ${email}`);
}

export async function sendReferralCommissionEmail(email: string, referralEmail: string, amount: number) {
  console.log(`👥 Referral Commission Earned: Sending notification to ${email}`);
}
