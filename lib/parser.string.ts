import { MatcherError } from "./errors";
import { ParserState } from "./parser.types";

export function makeStringMatcher<Context>(parserState: ParserState<Context>) {
  return <S extends string>(value: S): S => {
    const { input, state } = parserState;
    const currentInputIndex = parserState.currentInputIndex();

    if (state[parserState.currentStateIndex]?.value === value) {
      return state[parserState.currentStateIndex++]?.value as S;
    }

    if (!input.startsWith(value, currentInputIndex)) {
      throw new MatcherError(
        `Expected "${value}" at index ${currentInputIndex}`,
      );
    }

    state.push({
      type: "value",
      initialInputIndex: currentInputIndex,
      lastInputIndex: currentInputIndex + value.length,
      value,
    });
    parserState.currentStateIndex++;

    return value;
  };
}
