import { parse } from "./parser";
import { Rule } from "./parser.types";

export function parseExpectValue<T>(
  rule: Rule<T, undefined>,
  input: string,
  context?: undefined,
): T;
export function parseExpectValue<T, Context>(
  rule: Rule<T, Context>,
  input: string,
  context: Context,
): T;
export function parseExpectValue<T, Context>(
  rule: Rule<T, Context>,
  input: string,
  context: Context,
): T {
  const result = parse(rule, input, context);

  if (result.isError) {
    throw new Error("Unexpected error: " + result.error);
  }

  return result.value;
}

export function parseExpectError(
  rule: Rule<unknown, undefined>,
  input: string,
  context?: undefined,
): string;
export function parseExpectError<Context>(
  rule: Rule<unknown, Context>,
  input: string,
  context: Context,
): string;
export function parseExpectError<Context>(
  rule: Rule<unknown, Context>,
  input: string,
  context: Context,
): string {
  const result = parse(rule, input, context);

  if (!result.isError) {
    throw new Error("Unexpected value: " + String(result.value));
  }

  return result.error;
}
