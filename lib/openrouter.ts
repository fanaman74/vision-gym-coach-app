import { GymSession } from '@/types/metrics'
import { buildVisionPrompt } from './prompts'

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'

function extractJson(content: string): string {
  const match = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
  return match ? match[1] : content.trim()
}

export async function parseConsoleImage(
  imageBase64: string,
  mimeType: string
): Promise<GymSession> {
  const model = process.env.OPENROUTER_MODEL ?? 'google/gemini-3.5-flash'

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://gymcoach.app',
      'X-Title': 'Vision Gym Coach',
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: buildVisionPrompt() },
            {
              type: 'image_url',
              image_url: { url: `data:${mimeType};base64,${imageBase64}` },
            },
          ],
        },
      ],
    }),
  })

  if (!response.ok) {
    const errBody = await response.text().catch(() => '')
    throw new Error(`OpenRouter ${response.status}: ${errBody.slice(0, 200)}`)
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content
  if (!content) {
    throw new Error('Unexpected response shape from OpenRouter')
  }
  const json = JSON.parse(extractJson(content))

  return { ...json, capturedAt: new Date().toISOString() }
}
