// This handles email triggering via Resend
// VITE_RESEND_API_KEY should be set in environment variables

export async function sendCredentialEmail(email: string, details: any) {
  console.log(`Sending credentials to ${email}`, details);
  
  // In a real app:
  /*
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.VITE_RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: 'PrimeFunded <support@primefunded.com>',
      to: [email],
      subject: '🎉 Your PrimeFunded Account is Ready!',
      html: `
        <h1>Welcome to PrimeFunded!</h1>
        <p>Your MT5 account details:</p>
        <ul>
          <li>Login: ${details.login}</li>
          <li>Password: ${details.password}</li>
          <li>Server: ${details.server}</li>
        </ul>
        <p>Your challenge: ${details.plan} ${details.size}</p>
      `,
    }),
  });
  */
}

export async function sendBreachEmail(email: string, breachDetails: string) {
  console.log(`Sending breach alert to ${email}`, breachDetails);
}