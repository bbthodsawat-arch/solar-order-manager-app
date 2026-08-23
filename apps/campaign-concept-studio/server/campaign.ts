import OpenAI from 'openai';

export type CampaignInput = {
  brief: string;
  audience: string;
  product: string;
  tone: string;
  channels: string[];
};

export type CampaignResult = {
  concept: {
    name: string;
    oneLiner: string;
    strategicIdea: string;
    keyMessage: string;
  };
  variants: Array<{ headline: string; body: string; angle: string }>;
  checklist: Array<{ task: string; owner: string; timing: string }>;
  imagePrompts: string[];
  images: Array<{ prompt: string; dataUrl: string }>;
};

const textModel = process.env.OPENAI_TEXT_MODEL || 'gpt-5.6-luna';
const imageModel = process.env.OPENAI_IMAGE_MODEL || 'gpt-5.6-luna';

const schema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    concept: {
      type: 'object',
      additionalProperties: false,
      properties: {
        name: { type: 'string' },
        oneLiner: { type: 'string' },
        strategicIdea: { type: 'string' },
        keyMessage: { type: 'string' },
      },
      required: ['name', 'oneLiner', 'strategicIdea', 'keyMessage'],
    },
    variants: {
      type: 'array',
      minItems: 3,
      maxItems: 3,
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          headline: { type: 'string' },
          body: { type: 'string' },
          angle: { type: 'string' },
        },
        required: ['headline', 'body', 'angle'],
      },
    },
    checklist: {
      type: 'array',
      minItems: 5,
      maxItems: 8,
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          task: { type: 'string' },
          owner: { type: 'string' },
          timing: { type: 'string' },
        },
        required: ['task', 'owner', 'timing'],
      },
    },
    imagePrompts: {
      type: 'array',
      minItems: 3,
      maxItems: 3,
      items: { type: 'string' },
    },
  },
  required: ['concept', 'variants', 'checklist', 'imagePrompts'],
};

function client() {
  if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is not configured on the server.');
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

function clean(value: unknown, max: number) {
  return String(value ?? '').trim().slice(0, max);
}

export function validateInput(input: Partial<CampaignInput>): CampaignInput {
  const result: CampaignInput = {
    brief: clean(input.brief, 2400),
    audience: clean(input.audience, 1200),
    product: clean(input.product, 1600),
    tone: clean(input.tone, 500),
    channels: Array.isArray(input.channels) ? input.channels.map((x) => clean(x, 80)).filter(Boolean).slice(0, 8) : [],
  };
  if (!result.brief || !result.audience || !result.product || !result.tone || result.channels.length === 0) {
    throw new Error('Please complete the brief, audience, product, tone, and at least one channel.');
  }
  return result;
}

export async function generateCampaign(raw: Partial<CampaignInput>): Promise<CampaignResult> {
  const input = validateInput(raw);
  const openai = client();
  const context = JSON.stringify(input, null, 2);

  const response = await openai.responses.create({
    model: textModel,
    reasoning: { effort: 'low' },
    store: false,
    instructions: [
      'You are a senior integrated marketing strategist and copywriter.',
      'Turn the supplied brief into one coherent campaign platform, not disconnected ideas.',
      'Be specific, commercially useful, concise, and channel-aware.',
      'Write in the same language as the user input when practical.',
      'Do not invent product claims, certifications, prices, performance numbers, or proof points that were not supplied.',
      'Image prompts should describe composition, subject, art direction, lighting, palette, and negative constraints. Avoid placing readable copy inside the image.',
    ].join(' '),
    input: `Campaign brief:\n${context}`,
    text: {
      format: {
        type: 'json_schema',
        name: 'campaign_concept',
        strict: true,
        schema,
      },
    },
  });

  const plan = JSON.parse(response.output_text) as Omit<CampaignResult, 'images'>;
  const imagePrompts = plan.imagePrompts.slice(0, 2);

  const imageResults = await Promise.allSettled(
    imagePrompts.map(async (prompt) => {
      const imageResponse = await openai.responses.create({
        model: imageModel,
        store: false,
        input: `Create a polished campaign key visual. ${prompt}`,
        tools: [
          {
            type: 'image_generation',
            quality: 'medium',
            size: '1024x1024',
            background: 'opaque',
          },
        ],
      });
      const call = (imageResponse.output as Array<{ type?: string; result?: string }>).find(
        (item) => item.type === 'image_generation_call' && item.result,
      );
      if (!call?.result) throw new Error('Image generation returned no image data.');
      return { prompt, dataUrl: `data:image/png;base64,${call.result}` };
    }),
  );

  return {
    ...plan,
    images: imageResults.flatMap((result) => (result.status === 'fulfilled' ? [result.value] : [])),
  };
}
