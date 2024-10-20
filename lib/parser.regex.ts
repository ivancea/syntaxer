import { MatcherError } from "./errors";
import { ParserState } from "./parser.types";

export function makeRegexMatcher<Context>(parserState: ParserState<Context>) {
  return (regex: RegExp) => {
    const { input, state } = parserState;
    const currentInputIndex = parserState.currentInputIndex();

    if (state[parserState.currentStateIndex]) {
      return state[parserState.currentStateIndex++]?.value as string;
    }

    const fixedRegex = new RegExp(regex, "y");
    fixedRegex.lastIndex = currentInputIndex;
    const match = fixedRegex.exec(input);

    if (!match) {
      throw new MatcherError(
        `Expected a string matching "${regex}" at index ${currentInputIndex}`,
      );
    }

    const value = match[0];

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
