import {
  classRule,
  EXAMPLE_CLASS_INPUT,
  EXAMPLE_PROPERTY_INPUT,
  EXAMPLE_UNIT_INPUT,
  propertyRule,
  unitRule,
} from "./example";
import { parse } from "./parser";
import { parseExpectError, parseExpectValue } from "./parser.test.helpers";
import { Parser } from "./parser.types";

describe("Parser", () => {
  describe("example parser", () => {
    it("should parse a property", () => {
      const result = parse(propertyRule, EXAMPLE_PROPERTY_INPUT);

      expect(result).toEqual({
        isError: false,
        lastInputIndex: EXAMPLE_PROPERTY_INPUT.length,
        value: { astType: "property", name: "x", type: "number" },
      });
    });

    it("should parse a class", () => {
      const result = parse(classRule, EXAMPLE_CLASS_INPUT);

      expect(result).toEqual({
        isError: false,
        lastInputIndex: EXAMPLE_CLASS_INPUT.length,
        value: {
          astType: "class",
          name: "A",
          properties: [
            { astType: "property", name: "x", type: "number" },
            { astType: "property", name: "y", type: "string" },
          ],
        },
      });
    });

    it("should parse a unit", () => {
      const result = parse(unitRule, EXAMPLE_UNIT_INPUT);

      expect(result).toEqual({
        isError: false,
        lastInputIndex: EXAMPLE_UNIT_INPUT.length,
        value: {
          astType: "unit",
          classes: [
            {
              astType: "class",
              name: "A",
              properties: [
                { astType: "property", name: "x", type: "number" },
                { astType: "property", name: "y", type: "string" },
              ],
            },
            { astType: "class", name: "B", properties: [] },
          ],
        },
      });
    });
  });

  describe("string", () => {
    it("should match a string", () => {
      expect(parseExpectValue((parser) => parser.string("x"), "x")).toBe("x");
    });

    it("should match multiple contiguous strings", () => {
      expect(
        parseExpectValue((parser) => {
          return [
            parser.string("x"),
            parser.string("y"),
            parser.string("z"),
          ].join("");
        }, "xyz"),
      ).toBe("xyz");
    });

    it("should match multiple separated strings", () => {
      expect(
        parseExpectValue((parser) => {
          const values: string[] = [];

          values.push(parser.string("x"));
          parser.string(" ");
          values.push(parser.string("y"));
          parser.string(" ");
          values.push(parser.string("z"));
          return values.join("");
        }, "x y z"),
      ).toBe("xyz");
    });

    it("should fail if it doesn't match on first matcher", () => {
      expect(
        parseExpectError((parser) => {
          parser.string("x");
        }, "a"),
      ).toBe(`Expected "x" at index 0`);
    });

    it("should fail if it doesn't match after multiple matchers", () => {
      expect(
        parseExpectError((parser) => {
          parser.string("a");
          parser.string("b");
          parser.string("c");
          parser.string("d");
          parser.string("e");
        }, "abcd-"),
      ).toBe(`Expected "e" at index 4`);
    });

    it("should fail if at end of input with non-empty string", () => {
      expect(
        parseExpectError((parser) => {
          parser.string("a");
          parser.string("b");
        }, "a"),
      ).toBe(`Expected "b" at index 1`);
    });
  });

  describe("regex", () => {
    it("should match a string", () => {
      expect(parseExpectValue((parser) => parser.regex(/x/), "x")).toBe("x");
    });

    it("should match multiple contiguous strings", () => {
      expect(
        parseExpectValue((parser) => {
          return [parser.regex(/x/), parser.regex(/y/), parser.regex(/z/)].join(
            "",
          );
        }, "xyz"),
      ).toBe("xyz");
    });

    it("should match multiple wildcarded regexes", () => {
      expect(
        parseExpectValue((parser) => {
          const values: string[] = [];

          values.push(parser.regex(/x+/));
          parser.regex(/\s*/);
          values.push(parser.regex(/y*z*?/));
          parser.regex(/\s*/);
          values.push(parser.regex(/zp?/));
          return values.join("");
        }, "xxx y z"),
      ).toBe("xxxyz");
    });

    it("should fail if it doesn't match on first matcher", () => {
      expect(
        parseExpectError((parser) => {
          parser.regex(/x/);
        }, "axx"),
      ).toBe(`Expected a string matching "/x/" at index 0`);
    });

    it("should fail if it doesn't match after multiple matchers", () => {
      expect(
        parseExpectError((parser) => {
          parser.regex(/a/);
          parser.regex(/b/);
          parser.regex(/c/);
          parser.regex(/d/);
          parser.regex(/e/);
        }, "abcd-e"),
      ).toBe(`Expected a string matching "/e/" at index 4`);
    });

    it("should fail if at end of input with non-empty-matching regex", () => {
      expect(
        parseExpectError((parser) => {
          parser.regex(/a/);
          parser.regex(/b/);
        }, "a"),
      ).toBe(`Expected a string matching "/b/" at index 1`);
    });
  });

  describe("use", () => {
    const countingRule = <T extends string>(parser: Parser<T>, context: T) => {
      return parser.string(context).length;
    };

    it("should match other rule and return its result", () => {
      expect(
        parseExpectValue((parser) => parser.use(countingRule), "xy", "xy"),
      ).toBe(2);
    });

    it("should match other rule after another", () => {
      expect(
        parseExpectValue(
          (parser) => {
            parser.string("---");
            return parser.use(countingRule);
          },
          "---xyz",
          "xyz",
        ),
      ).toBe(3);
    });

    it("should fail with the other rule error", () => {
      expect(
        parseExpectError(
          (parser) => {
            parser.string("-");
            return parser.use(countingRule);
          },
          "---xyz",
          "xyz",
        ),
      ).toBe(`Expected "xyz" at index 1`);
    });
  });

  describe("any", () => {
    it("should match any of the given rules", () => {
      expect(
        parseExpectValue((parser) => {
          return parser.any(
            (p) => p.string("x"),
            (p) => p.string("y"),
          );
        }, "x"),
      ).toBe("x");
      expect(
        parseExpectValue((parser) => {
          return parser.any(
            (p) => p.string("x"),
            (p) => p.string("y"),
          );
        }, "y"),
      ).toBe("y");
    });

    it("should match any after other rules", () => {
      expect(
        parseExpectValue((parser) => {
          return (
            parser.string("a") +
            parser.any(
              (p) => p.string("x"),
              (p) => p.string("y"),
            )
          );
        }, "ax"),
      ).toBe("ax");
      expect(
        parseExpectValue((parser) => {
          return (
            parser.string("a") +
            parser.any(
              (p) => p.string("x"),
              (p) => p.string("y"),
            )
          );
        }, "ay"),
      ).toBe("ay");
    });

    it("should match any and then match other rules", () => {
      expect(
        parseExpectValue((parser) => {
          return (
            parser.any(
              (p) => p.string("x"),
              (p) => p.string("y"),
            ) + parser.string("a")
          );
        }, "xa"),
      ).toBe("xa");
      expect(
        parseExpectValue((parser) => {
          return (
            parser.any(
              (p) => p.string("x"),
              (p) => p.string("y"),
            ) + parser.string("a")
          );
        }, "ya"),
      ).toBe("ya");
    });

    it("should match any and backtrack on subsequent failures", () => {
      expect(
        parseExpectValue((parser) => {
          return (
            parser.any(
              (p) => p.string("xy"),
              (p) => p.string("x"),
              (p) => p.string(""),
            ) + parser.string("y")
          );
        }, "xy"),
      ).toBe("xy");
    });

    it("should fail if none of the rules match", () => {
      expect(
        parseExpectError((parser) => {
          parser.any(
            (p) => p.string("x"),
            (p) => p.string("y"),
            (p) => p.string("z"),
          );
          parser.any(
            (p) => p.string("a"),
            (p) => p.string("b"),
          );
        }, "yz"),
      ).toBe(`Expected any of the rules at index 1`);
    });
  });
});
