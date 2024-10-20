import { parseExpectError, parseExpectValue } from "./parser.test.helpers";

describe("Parser", () => {
  describe("many", () => {
    describe("greedy", () => {
      it("should have greedy, 0-undefined as defaults", () => {
        expect(
          parseExpectValue((parser) => {
            parser.many((p) => p.regex(/./));
            return parser.string("xyyy");
          }, "xxyyy"),
        ).toBe("xyyy");
        expect(
          parseExpectError((parser) => {
            return parser.many((p) => p.string(""));
          }, "x"),
        ).toBe("Reached security limit of 1000 greedy matches at index 0");
      });

      it("should match none", () => {
        expect(
          parseExpectValue((parser) => {
            parser.many((p) => p.string("x"), 0, 0, true);
            return parser.regex(/.*/);
          }, "xyz"),
        ).toBe("xyz");
      });

      it("should match as much as possible", () => {
        expect(
          parseExpectValue((parser) => {
            return parser
              .many((p) => p.string("x"), 2, undefined, true)
              .join("");
          }, "xxxx"),
        ).toBe("xxxx");
        expect(
          parseExpectValue((parser) => {
            return parser.many((p) => p.string("x"), 2, 10, true).join("");
          }, "xxxx"),
        ).toBe("xxxx");
      });

      it("should not surpass the max limit", () => {
        expect(
          parseExpectError((parser) => {
            return parser.many((p) => p.string("x"), 2, 3, true).join("");
          }, "xxxx"),
        ).toBe(
          "Backtracking would not fulfill the minimum of 2 matches at index 2",
        );
      });

      it("should backtrack by matching less", () => {
        expect(
          parseExpectValue((parser) => {
            parser.many((p) => p.string("x"), 0, 10, true);
            return parser.string("xxyz");
          }, "xxxxyz"),
        ).toBe("xxyz");
      });
    });

    describe("non-greedy", () => {
      it("should match none", () => {
        expect(
          parseExpectValue((parser) => {
            parser.many((p) => p.string("x"), 0, 0, false);
            return parser.regex(/.*/);
          }, "xxyz"),
        ).toBe("xxyz");
        expect(
          parseExpectValue((parser) => {
            parser.many((p) => p.string("x"), 0, undefined, false);
            return parser.regex(/.*/);
          }, "xxyz"),
        ).toBe("xxyz");
      });

      it("should match the minimum", () => {
        expect(
          parseExpectValue((parser) => {
            parser.many((p) => p.string("x"), 2, 10, false);
            return parser.regex(/.*/);
          }, "xxxyz"),
        ).toBe("xyz");
      });

      it("should backtrack by matching more", () => {
        expect(
          parseExpectValue((parser) => {
            parser.many((p) => p.string("x"), 2, 10, false);
            return parser.string("yz");
          }, "xxxxyz"),
        ).toBe("yz");
      });
    });
  });
});
