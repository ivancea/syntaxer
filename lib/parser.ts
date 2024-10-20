// Parser

import { MatcherError } from "./errors";
import { makeAnyMatcher } from "./parser.any";
import { makeManyMatcher } from "./parser.many";
import { makeRegexMatcher } from "./parser.regex";
import { makeStringMatcher } from "./parser.string";
import {
  Parser,
  ParserResult,
  ParserState,
  Rule,
  StateElement,
} from "./parser.types";
import { makeUseMatcher } from "./parser.use";

export function parse<T>(
  rule: Rule<T, undefined>,
  input: string,
  context?: never,
): ParserResult<T>;
export function parse<T, Context>(
  rule: Rule<T, Context>,
  input: string,
  context: Context,
  initialInputIndex?: number,
  partial?: boolean,
  maxIterationsPerRule?: number,
): ParserResult<T>;
export function parse<T, Context>(
  rule: Rule<T, Context>,
  input: string,
  context: Context,
  initialInputIndex = 0,
  partial = false,
  maxIterationsPerRule = 1_000,
): ParserResult<T> {
  const state: StateElement[] = [];

  for (let i = 0; i < maxIterationsPerRule; i++) {
    const currentInputIndex = (ignoreLast = false) =>
      state[state.length - (ignoreLast ? 2 : 1)]?.lastInputIndex ??
      initialInputIndex;

    const parser = makeParser({
      input,
      context,
      maxIterationsPerRule,
      state,
      // The state index always starts at 0,
      // as after every fail we call the rule from the start.
      currentStateIndex: 0,
      parse,
      currentInputIndex,
    });

    try {
      const result = rule(parser, context);

      if (!partial && currentInputIndex() < input.length) {
        throw new MatcherError(
          `Expected end of input at index ${currentInputIndex()}`,
        );
      }

      return {
        isError: false,
        value: result,
        lastInputIndex: currentInputIndex(),
      };
    } catch (error) {
      if (!(error instanceof MatcherError)) {
        throw error;
      }

      for (let j = state.length - 1; j >= 0; j--) {
        const stateElement = state[j];

        if (stateElement?.type === "value") {
          state.pop();
          continue;
        }
        if (stateElement?.type === "any" || stateElement?.type === "many") {
          if (stateElement.valid) {
            stateElement.valid = false;
            break;
          }
          state.pop();
          continue;
        }

        throw new Error("Invalid state element type");
      }

      if (state.length === 0) {
        return {
          isError: true,
          error: error.message,
        };
      }
    }
  }

  return {
    isError: true,
    error: "Max iterations reached",
  };
}

function makeParser<Context>(
  parserState: ParserState<Context>,
): Parser<Context> {
  return {
    string: makeStringMatcher(parserState),
    regex: makeRegexMatcher(parserState),
    use: makeUseMatcher(parserState),
    any: makeAnyMatcher(parserState),
    many: makeManyMatcher(parserState),
  };
}
