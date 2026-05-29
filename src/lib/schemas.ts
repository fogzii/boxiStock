import { z } from "zod";

export const quantitySchema = z
  .number({ error: "Enter a valid number" })
  .int("Must be a whole number")
  .positive("Must be at least 1")
  .max(1_000_000, "Exceeds maximum");

export const buyPriceSchema = z
  .number({ error: "Enter a valid number" })
  .positive("Must be greater than 0")
  .max(1_000_000_000, "Exceeds maximum");

export const sellPriceSchema = z
  .number({ error: "Enter a valid number" })
  .min(0, "Must be 0 or greater")
  .max(1_000_000_000, "Exceeds maximum");

export const optionalDateSchema = z.date().optional();

export const lotIdentitySchema = z.string().optional();
