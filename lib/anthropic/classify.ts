import Anthropic from '@anthropic-ai/sdk'

export type EmailClassification = 'rejected' | 'offer' | 'interview' | 'update'

let client: Anthropic | null = null

function getClient(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) return null
  if (!client) client = new Anthropic()
  return client
}

const SCHEMA = {
  type: 'object',
  properties: {
    detected_type: {
      type: 'string',
      enum: ['rejected', 'offer', 'interview', 'update'],
      description: 'What kind of job-application status update this email represents.',
    },
  },
  required: ['detected_type'],
  additionalProperties: false,
} as const

/**
 * Classifies a job-application-status email with Claude instead of keyword
 * matching, so phrasing Anthropic didn't anticipate (e.g. "we've made the
 * decision not to move forward") still gets caught correctly. Returns null
 * if ANTHROPIC_API_KEY isn't configured or the call fails — callers should
 * fall back to the keyword-based classifier in that case, never hard-fail
 * the sync over a classification miss.
 */
export async function classifyEmailWithAI(subject: string, snippet: string): Promise<EmailClassification | null> {
  const anthropic = getClient()
  if (!anthropic) return null

  try {
    const response = await anthropic.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 200,
      output_config: {
        format: { type: 'json_schema', schema: SCHEMA },
      },
      messages: [
        {
          role: 'user',
          content: `Classify this email about a job application into exactly one category:
- "rejected": the company is declining to move forward with the candidate, in any phrasing
- "offer": the company is extending a job offer
- "interview": the company wants to schedule an interview, phone screen, or next step
- "update": anything else related to the application (acknowledgment, generic status update, etc.)

Subject: ${subject}
Preview: ${snippet}`,
        },
      ],
    })

    const textBlock = response.content.find((b) => b.type === 'text')
    if (!textBlock || textBlock.type !== 'text') return null
    const parsed = JSON.parse(textBlock.text) as { detected_type: EmailClassification }
    return parsed.detected_type
  } catch {
    return null
  }
}
