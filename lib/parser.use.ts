import { MatcherError } from "./errors";
import { ParserState, Rule } from "./parser.types";

export function makeUseMatcher<Context>(parserState: ParserState<Context>) {
  return <T>(rule: Rule<T, Context>): T => {
    const { input, state, context, maxIterationsPerRule, parse } = parserState;
    const currentInputIndex = parserState.currentInputIndex();

    if (state[parserState.currentStateIndex]) {
      return state[parserState.currentStateIndex++]?.value as T;
    }

    const ruleResult = parse(
      rule,
      input,
      context,
      currentInputIndex,
      true,
      maxIterationsPerRule,
    );

    if (ruleResult.isError) {
      throw new MatcherError(ruleResult.error);
    }

    state.push({
      type: "value",
      initialInputIndex: currentInputIndex,
      lastInputIndex: ruleResult.lastInputIndex,
      value: ruleResult.value,
    });
    parserState.currentStateIndex++;

    return ruleResult.value;
  };
}
