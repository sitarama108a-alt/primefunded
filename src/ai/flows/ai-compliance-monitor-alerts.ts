'use server';
/**
 * @fileOverview This file implements a Genkit flow for the AI Compliance Monitor, providing real-time insights
 * and warnings to traders about their activity relative to challenge rules.
 *
 * - aiComplianceMonitorAlerts - The main function to get compliance alerts.
 * - AiComplianceMonitorAlertsInput - The input type for the aiComplianceMonitorAlerts function.
 * - AiComplianceMonitorAlertsOutput - The return type for the aiComplianceMonitorAlerts function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AiComplianceMonitorAlertsInputSchema = z.object({
  plan: z.enum(["1-Step Pro", "2-Step Classic", "Instant Funding"]).describe("The current trading plan (e.g., '1-Step Pro', '2-Step Classic', 'Instant Funding')."),
  dailyLoss: z.number().min(0).describe("Current daily loss percentage (e.g., 2.5 for 2.5%)."),
  totalLoss: z.number().min(0).describe("Current total loss percentage (e.g., 5.8 for 5.8%)."),
  profit: z.number().describe("Current total profit percentage (e.g., 7.0 for 7.0%)."),
  tradingDays: z.number().min(0).int().describe("Number of trading days elapsed."),
  phase: z.enum(["none", "phase1", "phase2"]).optional().describe("Current phase for 2-Step Classic plan. 'none' if not a 2-Step Classic plan."),
  singlePairLoss: z.number().min(0).optional().describe("Current single pair loss percentage for 2-Step Classic plan."),
  hasOpenTrades: z.boolean().describe("Whether there are currently open trades that could impact metrics."),
});
export type AiComplianceMonitorAlertsInput = z.infer<typeof AiComplianceMonitorAlertsInputSchema>;

const AiComplianceMonitorAlertsOutputSchema = z.object({
  status: z.enum(["compliant", "at-risk", "breached", "passed"]).describe("Overall compliance status: 'compliant', 'at-risk', 'breached', or 'passed'."),
  message: z.string().describe("A plain-language summary of your compliance status and key insights."),
  warnings: z.array(z.string()).describe("Specific warnings or potential rule breaches."),
  recommendations: z.array(z.string()).describe("Actionable recommendations to maintain compliance or improve performance."),
});
export type AiComplianceMonitorAlertsOutput = z.infer<typeof AiComplianceMonitorAlertsOutputSchema>;

export async function aiComplianceMonitorAlerts(input: AiComplianceMonitorAlertsInput): Promise<AiComplianceMonitorAlertsOutput> {
  return aiComplianceMonitorAlertsFlow(input);
}

const complianceMonitorPrompt = ai.definePrompt({
  name: 'aiComplianceMonitorAlertsPrompt',
  input: { schema: AiComplianceMonitorAlertsInputSchema },
  output: { schema: AiComplianceMonitorAlertsOutputSchema },
  prompt: `You are an AI Compliance Monitor for PrimeFunded traders. Your goal is to analyze trading activity against specific challenge rules and provide clear, plain-language insights, warnings, and recommendations to help traders avoid breaches.

Here are the trading metrics:
- Plan: {{{plan}}}
- Daily Loss: {{{dailyLoss}}}%
- Total Loss: {{{totalLoss}}}%
- Current Profit: {{{profit}}}%
- Trading Days: {{{tradingDays}}}
{{#if phase}}
- Phase: {{{phase}}}
{{/if}}
{{#if singlePairLoss}}
- Single Pair Loss: {{{singlePairLoss}}}%
{{/if}}
- Has Open Trades: {{#if hasOpenTrades}}Yes{{else}}No{{/if}}

Here are the rules for each challenge plan:

1.  **1-Step Pro Plan Rules:**
    *   If Daily Loss > 3%: FAILED
    *   If Total Loss > 6%: FAILED
    *   If Profit >= 10%: PASSED
    *   Minimum 3 trading days for payout.

2.  **2-Step Classic Plan Rules:**
    *   **Phase 1:** If Profit >= 8%: Advance to Phase 2
    *   **Phase 2:** If Profit >= 5%: PASSED
    *   If Daily Loss > 5%: FAILED
    *   If Single Pair Loss > 3%: FAILED

3.  **Instant Funding Plan Rules:**
    *   If Daily Loss > 4%: FAILED
    *   If Total Loss > 8%: FAILED

Based on the provided trading metrics and the specific rules for the "{{{plan}}}" plan, determine the 
` + '`status` (compliant, at-risk, breached, passed), provide a detailed `message`, list any `warnings`, and offer `recommendations`.
Focus on actionable advice and clear explanations. If there are open trades, mention the potential impact. Prioritize reporting breaches, then 'at-risk' situations, then 'passed' status, and finally 'compliant'.
`,
});

const aiComplianceMonitorAlertsFlow = ai.defineFlow(
  {
    name: 'aiComplianceMonitorAlertsFlow',
    inputSchema: AiComplianceMonitorAlertsInputSchema,
    outputSchema: AiComplianceMonitorAlertsOutputSchema,
  },
  async (input) => {
    const { output } = await complianceMonitorPrompt(input);
    if (!output) {
      throw new Error('Failed to get compliance monitor alerts from the model.');
    }
    return output;
  }
);
