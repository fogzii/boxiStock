"use server";

import { GoogleGenerativeAI, Schema, SchemaType } from "@google/generative-ai";
import { auth } from "@clerk/nextjs/server";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { cleanRequiredString, MAX_AI_PROMPT_LENGTH } from "@/lib/validation";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const MODEL_NAME = "gemini-2.5-flash"; // A fast and capable model supporting structured output

async function enforceAiRateLimit(userId: string, kind: "stock" | "sales") {
  await enforceRateLimit(
    `ai:${kind}:${userId}`,
    RATE_LIMITS.ai,
    "AI import request",
  );
}

const stockSchema: Schema = {
  type: SchemaType.ARRAY,
  description: "A list of stock lots purchased.",
  items: {
    type: SchemaType.OBJECT,
    properties: {
      name: {
        type: SchemaType.STRING,
        description: "Name of the product. E.g. Ergonomic Chair.",
      },
      initialQuantity: {
        type: SchemaType.INTEGER,
        description: "Number of units purchased.",
      },
      buyPrice: {
        type: SchemaType.NUMBER,
        description: "Price per unit. Must be a number.",
      },
      isStocked: {
        type: SchemaType.BOOLEAN,
        description: "Whether the product is currently accessible in stock.",
      },
      lotIdentity: {
        type: SchemaType.STRING,
        description:
          "Optional lot identity, identifier, or condition (e.g. '1st edition', 'mint', 'batch A')",
      },
      dateAcquired: {
        type: SchemaType.STRING,
        description:
          "Acquisition or received date (YYYY-MM-DD). If not mentioned, ALWAYS default to the current date provided in the prompt.",
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
};

const salesSchema: Schema = {
  type: SchemaType.ARRAY,
  description: "A list of sales histories.",
  items: {
    type: SchemaType.OBJECT,
    properties: {
      productName: {
        type: SchemaType.STRING,
        description: "Name of the product sold.",
      },
      quantitySold: {
        type: SchemaType.INTEGER,
        description: "Number of units sold.",
      },
      salePricePerUnit: {
        type: SchemaType.NUMBER,
        description: "Sale price per unit.",
      },
      buyPrice: {
        type: SchemaType.NUMBER,
        description: "Buy price per unit. Optional, can be empty.",
      },
    },
    required: ["productName", "quantitySold", "salePricePerUnit"],
  },
};

export async function parseInventoryWithAI(prompt: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const cleanPrompt = cleanRequiredString(prompt, "prompt", {
    maxLength: MAX_AI_PROMPT_LENGTH,
  });
  await enforceAiRateLimit(userId, "stock");

  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: stockSchema,
    },
  });

  const today = new Date().toISOString().split("T")[0];

  const finalPrompt = `
Extract the stock purchases from the following text and return a JSON array according to the schema.
Extract as much information as possible.
CRITICAL: You MUST extract the number of items purchased and map it to 'initialQuantity'. If words like "a", "an", "one" are used, map it to 1. If not specified at all, default to 1.
CRITICAL: If an acquisition or received date is not explicitly mentioned by the user, you MUST default to today's date, which is: ${today}.
If some info is missing, deduce it or leave empty if not required. Default isStocked to true if not specified.

TEXT:
${cleanPrompt}
`;

  try {
    const result = await model.generateContent(finalPrompt);
    const text = result.response.text();
    return JSON.parse(text);
  } catch (error: any) {
    console.error("AI Stock Parsing Error:", error);
    throw new Error(error.message);
  }
}

export async function parseSalesWithAI(prompt: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const cleanPrompt = cleanRequiredString(prompt, "prompt", {
    maxLength: MAX_AI_PROMPT_LENGTH,
  });
  await enforceAiRateLimit(userId, "sales");

  const model = genAI.getGenerativeModel({
    model: MODEL_NAME,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: salesSchema,
    },
  });

  const finalPrompt = `
Extract the sales records from the following text and return a JSON array according to the schema.
CRITICAL: You MUST extract the number of items sold and map it to 'quantitySold'. If words like "a", "an", "one" are used, map it to 1. If not specified at all, default to 1.

TEXT:
${cleanPrompt}
`;

  try {
    const result = await model.generateContent(finalPrompt);
    const text = result.response.text();
    return JSON.parse(text);
  } catch (error: any) {
    console.error("AI Sales Parsing Error:", error);
    throw new Error(error.message);
  }
}
