import { isNil } from "lodash-es";
import { MatcherError } from "./errors";
import { ManyStateElement, ParserState, Rule } from "./parser.types";

export function makeManyMatcher<Context>(parserState: ParserState<Context>) {
  return <R>(
    rule: Rule<R, Context>,
    min = 0,
    max: number | undefined = undefined,
    greedy: boolean = true,
  ): R[] => {
    const rawCurrentState = parserState.state[parserState.currentStateIndex];
    const currentState =
      rawCurrentState?.type === "many" ? rawCurrentState : undefined;

    if (currentState && currentState.valid) {
      parserState.currentStateIndex++;
      return currentState.value as R[];
    }

    if (currentState) {
      // State is invalid
      backtrack(rule, min, max, greedy, parserState, currentState);
    } else {
      matchMany(rule, min, max, greedy, parserState);
    }

    const value = parserState.state[parserState.currentStateIndex]
      ?.value as R[];
    parserState.currentStateIndex++;
    return value;
  };
}

function matchMany<R, Context>(
  rule: Rule<R, Context>,
  min: number,
  max: number | undefined,
  greedy: boolean,
  parserState: ParserState<Context>,
) {
  const matches: R[] = [];
  const lastInputIndexes: number[] = [];
  let lastInputIndex = parserState.currentInputIndex();

  if (greedy) {
    for (let i = 0; i < (max ?? parserState.maxIterationsPerRule + 1); i++) {
      const result = parserState.parse(
        rule,
        parserState.input,
        parserState.context,
        lastInputIndex,
        true,
        parserState.maxIterationsPerRule,
      );

      if (result.isError) {
        break;
      }

      matches.push(result.value);
      lastInputIndexes.push(result.lastInputIndex);
      lastInputIndex = result.lastInputIndex;
    }

    if (isNil(max) && matches.length > parserState.maxIterationsPerRule) {
      throw new MatcherError(
        `Reached security limit of ${parserState.maxIterationsPerRule} greedy matches at index ${parserState.currentInputIndex()}`,
      );
    }
  } else {
    for (let i = 0; i < min; i++) {
      const result = parserState.parse(
        rule,
        parserState.input,
        parserState.context,
        lastInputIndex,
        true,
        parserState.maxIterationsPerRule,
      );

      if (result.isError) {
        break;
      }

      matches.push(result.value);
      lastInputIndexes.push(result.lastInputIndex);
      lastInputIndex = result.lastInputIndex;
    }
  }

  if (matches.length < min) {
    throw new MatcherError(
      `Expected at least ${min} matches at index ${parserState.currentInputIndex()}`,
    );
  }

  parserState.state.push({
    type: "many",
    initialInputIndex: parserState.currentInputIndex(),
    lastInputIndex,
    value: matches,
    matches,
    lastInputIndexes,
    valid: true,
  });
}

function backtrack<R, Context>(
  rule: Rule<R, Context>,
  min: number,
  max: number | undefined,
  greedy: boolean,
  parserState: ParserState<Context>,
  currentState: ManyStateElement,
) {
  // State is invalid
  if (greedy) {
    // Backtrack by removing matches
    if (currentState.matches.length <= min) {
      throw new MatcherError(
        `Backtracking would not fulfill the minimum of ${min} matches at index ${parserState.currentInputIndex()}`,
      );
    }

    currentState.matches.pop();
    currentState.lastInputIndexes.pop();
    currentState.lastInputIndex =
      currentState.lastInputIndexes[currentState.lastInputIndexes.length - 1] ??
      currentState.initialInputIndex;
    currentState.valid = true;
  } else {
    // Backtrack by trying another match
    if (!isNil(max) && currentState.matches.length >= max) {
      throw new MatcherError(
        `Backtracking would surpass the maximum of ${max} matches at index ${parserState.currentInputIndex()}`,
      );
    }

    const result = parserState.parse(
      rule,
      parserState.input,
      parserState.context,
      currentState.lastInputIndexes[currentState.lastInputIndexes.length - 1] ??
        parserState.currentInputIndex(true),
      true,
      parserState.maxIterationsPerRule,
    );

    if (result.isError) {
      throw new MatcherError(
        `Expected another match at index ${parserState.currentInputIndex()}`,
      );
    }

    currentState.matches.push(result.value);
    currentState.lastInputIndexes.push(result.lastInputIndex);
    currentState.lastInputIndex = result.lastInputIndex;
    currentState.valid = true;
  }
}
