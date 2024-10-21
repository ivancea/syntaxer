import { parse } from "../lib/parser";
import { examples } from "./examples";

describe("Examples", () => {
  for (const [exampleName, example] of Object.entries(examples)) {
    // eslint-disable-next-line jest/valid-title
    describe(exampleName, () => {
      for (const { name, input, rule, context, expected } of example) {
        // eslint-disable-next-line jest/valid-title
        it(name, () => {
          const result = parse(rule, input, context);

          expect(result).toEqual({
            isError: false,
            lastInputIndex: input.length,
            value: expected,
          });
        });
      }
    });
  }
});
