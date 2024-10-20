export type Parser<Context = undefined> = {
  regex: (regex: RegExp) => string;
  string: <S extends string>(value: S) => S;
  use: <T>(rule: Rule<T, Context>) => T;
  any: <R>(...rules: [Rule<R, Context>, ...Rule<R, Context>[]]) => R;
  many: <R>(
    rule: Rule<R, Context>,
    min?: number,
    max?: number,
    greedy?: boolean,
  ) => R[];
};

export type Rule<T, Context> = (parser: Parser<Context>, context: Context) => T;

export type ParseFunction = <T, Context>(
  rule: Rule<T, Context>,
  input: string,
  context: Context,
  initialInputIndex?: number,
  partial?: boolean,
  maxIterationsPerRule?: number,
) => ParserResult<T>;

export type ParserResult<T> =
  | {
      isError: false;
      value: T;
      lastInputIndex: number;
    }
  | {
      isError: true;
      error: string;
    };

export type ParserState<Context> = {
  // Fixed properties
  input: string;
  context: Context;
  maxIterationsPerRule: number;

  // Mutable state
  state: StateElement[];
  currentStateIndex: number;

  // Helpers
  parse: ParseFunction;
  currentInputIndex: (ignoreLast?: boolean) => number;
};

export type StateElement =
  | ValueStateElement
  | AnyStateElement
  | ManyStateElement;

type StateElementBase = {
  type: string;

  initialInputIndex: number;
  lastInputIndex: number;

  value: unknown;
};

/**
 * State element representing a match without extra state.
 */
export type ValueStateElement = StateElementBase & {
  type: "value";
};

export type AnyStateElement = StateElementBase & {
  type: "any";

  /**
   * The index of the rule from the any() rules array that worked.
   */
  currentRuleIndex: number;
  /**
   * Temporary value to let a rule be invalidated.
   *
   * If false, it will be discarded on the next iteration.
   */
  valid: boolean;
};

export type ManyStateElement = StateElementBase & {
  type: "many";

  matches: unknown[];
  /**
   * Similar to lastInputIndex, but for each match.
   */
  lastInputIndexes: number[];
  /**
   * Temporary value to let a rule be invalidated.
   *
   * If false, it will be discarded on the next iteration.
   */
  valid: boolean;
};
