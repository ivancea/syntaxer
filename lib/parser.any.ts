import { MatcherError } from "./errors";
import { ParserState, Rule } from "./parser.types";

export function makeAnyMatcher<Context>(parserState: ParserState<Context>) {
  return <R>(...rules: [Rule<R, Context>, ...Rule<R, Context>[]]): R => {
    const { input, state, context, maxIterationsPerRule, parse } = parserState;

    const rawCurrentState = state[parserState.currentStateIndex];
    const currentState =
      rawCurrentState?.type === "any" ? rawCurrentState : undefined;

    if (currentState && currentState.valid) {
      parserState.currentStateIndex++;
      return currentState.value as R;
    }

    const nextRuleIndex = currentState ? currentState.currentRuleIndex + 1 : 0;

    for (let j = nextRuleIndex; j < rules.length; j++) {
      const rule = rules[j];
      if (!rule) {
        continue;
      }

      const ruleResult = parse(
        rule,
        input,
        context,
        parserState.currentInputIndex(!!currentState),
        true,
        maxIterationsPerRule,
      );

      if (!ruleResult.isError) {
        if (currentState) {
          state.pop();
        }
        state.push({
          type: "any",
          initialInputIndex: parserState.currentInputIndex(!!currentState),
          lastInputIndex: ruleResult.lastInputIndex,
          value: ruleResult.value,
          currentRuleIndex: j,
          valid: true,
        });
        parserState.currentStateIndex++;

        return ruleResult.value;
      }
    }

    throw new MatcherError(
      `Expected any of the rules at index ${parserState.currentInputIndex()}`,
    );
  };
}
