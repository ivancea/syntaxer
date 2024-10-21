import { Rule } from "../lib/parser.types";

type BaseExample<Context> = {
  name: string;
  input: string;
  rule: Rule<unknown, Context>;
  context?: Context;
  expected: unknown;
};

export type Example<Context = undefined> = Context extends undefined
  ? BaseExample<Context>
  : BaseExample<Context> & { context: Context };
