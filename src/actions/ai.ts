"use server";

import Anthropic from "@anthropic-ai/sdk";
import { jsonSchemaOutputFormat } from "@anthropic-ai/sdk/helpers/json-schema";
import { auth } from "@clerk/nextjs/server";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { cleanRequiredString, MAX_AI_PROMPT_LENGTH } from "@/lib/validation";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});
const MODEL = "claude-haiku-4-5-20251001" as const;

async function enforceAiRateLimit(userId: string, kind: "stock" | "sales") {
  await enforceRateLimit(
    `ai:${kind}:${userId}`,
    RATE_LIMITS.ai,
    "AI import request",
  );
}

function friendlyAiError(error: unknown): string {
  const msg =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "Unknown error";
  const lower = msg.toLowerCase();

  if (
    lower.includes("503") ||
    lower.includes("overloaded") ||
    lower.includes("high demand") ||
    lower.includes("service unavailable")
  ) {
    return "The AI service is currently busy. Please wait a moment and try again.";
  }
  if (
    lower.includes("429") ||
    lower.includes("quota") ||
    lower.includes("rate limit")
  ) {
    return "AI request limit reached. Please wait a moment and try again.";
  }
  if (
    lower.includes("401") ||
    lower.includes("403") ||
    lower.includes("api key")
  ) {
    return "AI service is misconfigured. Please contact support.";
  }
  if (lower.includes("400")) {
    return "Invalid request sent to AI. Please check your input and try again.";
  }
  return "Failed to parse with AI. Please try again.";
}

export type AIResult<T> = { ok: true; data: T } | { ok: false; error: string };

const stockOutputSchema = {
  type: "object",
  properties: {
    lots: {
      type: "array",
      description: "Stock lots extracted from the text.",
      items: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "Name of the product. E.g. Ergonomic Chair.",
          },
          initialQuantity: {
            type: "integer",
            description: "Number of units purchased.",
          },
          buyPrice: {
            type: "number",
            description: "Price per unit.",
          },
          isStocked: {
            type: "boolean",
            description:
              "Whether the product is currently accessible in stock.",
          },
          notes: {
            type: "string",
            description:
              "Optional notes, identifier, or condition (e.g. 1st edition, mint, batch A).",
          },
          dateAcquired: {
            type: "string",
            description:
              "Acquisition date (DD-MM-YYYY). If not mentioned, use the provided default date.",
          },
        },
        required: [
          "name",
          "initialQuantity",
          "buyPrice",
          "isStocked",
          "dateAcquired",
        ],
      },
    },
  },
  required: ["lots"],
} as const;

const salesOutputSchema = {
  type: "object",
  properties: {
    sales: {
      type: "array",
      description: "Sales records extracted from the text.",
      items: {
        type: "object",
        properties: {
          productName: {
            type: "string",
            description: "Name of the product sold.",
          },
          quantitySold: {
            type: "integer",
            description: "Number of units sold.",
          },
          salePricePerUnit: {
            type: "number",
            description: "Sale price per unit.",
          },
          buyPrice: {
            type: "number",
            description: "Buy cost per unit if known.",
          },
          dateSold: {
            type: "string",
            description:
              "Sale date (DD-MM-YYYY). If not mentioned, use the provided default date.",
          },
          notes: {
            type: "string",
            description:
              "Optional notes or additional context about the sale (e.g. condition, channel, batch).",
          },
        },
        required: [
          "productName",
          "quantitySold",
          "salePricePerUnit",
          "dateSold",
        ],
      },
    },
  },
  required: ["sales"],
} as const;

export async function parseInventoryWithAI(
  prompt: string,
): Promise<AIResult<unknown[]>> {
  try {
    const { userId } = await auth();
    if (!userId) return { ok: false, error: "Unauthorized." };

    if (!process.env.ANTHROPIC_API_KEY?.trim()) {
      return {
        ok: false,
        error: "AI service is misconfigured. Please contact support.",
      };
    }

    const cleanPrompt = cleanRequiredString(prompt, "prompt", {
      maxLength: MAX_AI_PROMPT_LENGTH,
    });
    await enforceAiRateLimit(userId, "stock");

    const _d = new Date();
    const today = `${String(_d.getDate()).padStart(2, "0")}-${String(_d.getMonth() + 1).padStart(2, "0")}-${_d.getFullYear()}`;

    const userContent = `
Extract the stock purchases from the following text. Fill the "lots" array in the required output shape.
CRITICAL: Map item counts to initialQuantity. If words like "a", "an", "one" are used, use 1. If not specified, use 1.
CRITICAL: If an acquisition or received date is not explicitly mentioned, set dateAcquired to: ${today}.
CRITICAL: All dates must be in DD-MM-YYYY format.
Default isStocked to true if not specified. Omit or leave notes empty if unknown.

TEXT:
${cleanPrompt}
`;

    const message = await anthropic.messages.parse({
      model: MODEL,
      max_tokens: 8192,
      messages: [{ role: "user", content: userContent }],
      output_config: {
        format: jsonSchemaOutputFormat(stockOutputSchema),
      },
    });

    const lots = message.parsed_output?.lots;
    if (!Array.isArray(lots)) {
      return { ok: false, error: "Failed to parse with AI. Please try again." };
    }
    return { ok: true, data: lots };
  } catch (error) {
    console.error("AI Stock Parsing Error:", error);
    return { ok: false, error: friendlyAiError(error) };
  }
}

export async function parseSalesWithAI(
  prompt: string,
): Promise<AIResult<unknown[]>> {
  try {
    const { userId } = await auth();
    if (!userId) return { ok: false, error: "Unauthorized." };

    if (!process.env.ANTHROPIC_API_KEY?.trim()) {
      return {
        ok: false,
        error: "AI service is misconfigured. Please contact support.",
      };
    }

    const cleanPrompt = cleanRequiredString(prompt, "prompt", {
      maxLength: MAX_AI_PROMPT_LENGTH,
    });
    await enforceAiRateLimit(userId, "sales");

    const _d = new Date();
    const today = `${String(_d.getDate()).padStart(2, "0")}-${String(_d.getMonth() + 1).padStart(2, "0")}-${_d.getFullYear()}`;

    const userContent = `
Extract the sales records from the following text. Fill the "sales" array in the required output shape.
CRITICAL: Map counts to quantitySold. If words like "a", "an", "one" are used, use 1. If not specified, use 1.
CRITICAL: If a sale date is not explicitly mentioned, set dateSold to: ${today}.
CRITICAL: All dates must be in DD-MM-YYYY format.
Include buyPrice when you can infer it from the text; otherwise omit it. Omit or leave notes empty if unknown.

TEXT:
${cleanPrompt}
`;

    const message = await anthropic.messages.parse({
      model: MODEL,
      max_tokens: 8192,
      messages: [{ role: "user", content: userContent }],
      output_config: {
        format: jsonSchemaOutputFormat(salesOutputSchema),
      },
    });

    const sales = message.parsed_output?.sales;
    if (!Array.isArray(sales)) {
      return { ok: false, error: "Failed to parse with AI. Please try again." };
    }
    return { ok: true, data: sales };
  } catch (error) {
    console.error("AI Sales Parsing Error:", error);
    return { ok: false, error: friendlyAiError(error) };
  }
}
