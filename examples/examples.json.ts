import { isNil } from "lodash-es";
import { Parser } from "../lib/parser.types";
import { Example } from "./examples.types";

const rawExamples: Example[] = [
  // Combined example
  {
    name: "object",
    input: `{
      "number": 123,
      "string": "abc",
      "array": [1, 2, 3],
      "object": {
          "nested": true
      },
      "false": false,
      "true": true,
      "null": null
    }`,
    rule: objectRule,
    expected: {
      number: 123,
      string: "abc",
      array: [1, 2, 3],
      object: {
        nested: true,
      },
      false: false,
      true: true,
      null: null,
    },
  },

  // Objects
  {
    name: "object",
    input: `{"a": 1, "1": "", "": {"x": {}}}`,
    rule: objectRule,
    expected: { a: 1, 1: "", "": { x: {} } },
  },

  // Arrays
  {
    name: "array",
    input: `[1, "", [null]]`,
    rule: arrayRule,
    expected: [1, "", [null]],
  },

  // Numbers
  {
    name: "number",
    input: `-123.52E-1`,
    rule: numberRule,
    expected: -123.52e-1,
  },

  // Strings
  {
    name: "string",
    input: `"abc\\"\\\\\\/\\b\\f\\n\\r\\t\\u1234abc"`,
    rule: stringRule,
    expected: `abc"\\/\b\f\n\r\t\u1234abc`,
  },

  // True
  {
    name: "true",
    input: `true`,
    rule: keywordRule,
    expected: true,
  },

  // False
  {
    name: "false",
    input: `false`,
    rule: keywordRule,
    expected: false,
  },

  // Null
  {
    name: "null",
    input: `null`,
    rule: keywordRule,
    expected: null,
  },
];

export const examples: Example[] = [
  ...rawExamples,

  // Add a duplicated case for each example using the generic "value" rule
  ...rawExamples.map((e) => ({
    ...e,
    name: `json ${e.name}`,
    rule: valueRule,
  })),
];

// Rules

export function valueRule(parser: Parser): unknown {
  return parser.any<unknown>(
    (p) => objectRule(p),
    (p) => arrayRule(p),
    (p) => stringRule(p),
    (p) => numberRule(p),
    (p) => keywordRule(p),
  );
}

export function objectRule(parser: Parser) {
  parser.regex(/\s*/);
  parser.string("{");
  parser.regex(/\s*/);

  const object = parser.any(
    () => {
      return {};
    },
    (p) => {
      const key = p.use(stringRule);
      p.regex(/\s*:/);
      const value = p.use(valueRule);
      return { [key]: value };
    },
    (p) => {
      const firstKey = p.use(stringRule);
      p.regex(/\s*:/);
      const firstValue = p.use(valueRule);

      const otherValues = p.many((p) => {
        p.regex(/\s*,\s*/);
        const key = p.use(stringRule);
        p.regex(/\s*:/);
        const value = p.use(valueRule);
        return { [key]: value };
      });

      return {
        [firstKey]: firstValue,
        ...otherValues.reduce((acc, v) => ({ ...acc, ...v }), {}),
      };
    },
  );

  parser.regex(/\s*/);
  parser.string("}");

  return object;
}

export function arrayRule(parser: Parser) {
  parser.regex(/\s*/);
  parser.string("[");
  parser.regex(/\s*/);

  const elements = parser.any(
    () => {
      return [];
    },
    (p) => {
      return [p.use(valueRule)];
    },
    (p) => {
      const firstValue = p.use(valueRule);
      const otherValues = p.many((p) => {
        p.regex(/\s*,\s*/);
        return p.use(valueRule);
      });

      return [firstValue, ...otherValues];
    },
  );

  parser.regex(/\s*/);
  parser.string("]");

  return elements;
}

const escapingCharactersMap: Record<string, string> = {
  '"': '"',
  "\\": "\\",
  "/": "/",
  b: "\b",
  f: "\f",
  n: "\n",
  r: "\r",
  t: "\t",
};

export function stringRule(parser: Parser) {
  parser.regex(/\s*/);
  parser.string('"');
  const value = parser.regex(/([^"\\]|\\.)*/);
  parser.string('"');

  // Unescape the string
  let newString = "";
  let remainingEscaped = 0;
  let unicode: string | undefined = undefined;
  for (const char of value) {
    if (remainingEscaped > 0) {
      remainingEscaped--;

      if (!isNil(unicode)) {
        unicode += char;
        if (unicode.length === 4) {
          newString += String.fromCharCode(parseInt(unicode, 16));
          unicode = undefined;
        }
        continue;
      }

      if (char === "u") {
        remainingEscaped = 4;
        unicode = "";
        continue;
      }

      const escapeCharacter = escapingCharactersMap[char];
      if (isNil(escapeCharacter)) {
        throw new Error(`Invalid escape character: ${char}`);
      }
      newString += escapeCharacter;
    } else if (char === "\\") {
      remainingEscaped = 1;
    } else {
      newString += char;
    }
  }

  return newString;
}

export function keywordRule(parser: Parser) {
  parser.regex(/\s*/);
  const value = parser.regex(/true|false|null/);

  if (value === "null") {
    return null;
  }

  return value === "true";
}

export function numberRule(parser: Parser) {
  parser.regex(/\s*/);

  const negativeSign = parser.regex(/-?/);
  const integerPart = parser.regex(/0|[1-9]\d*/);
  const fractionalPart = parser.regex(/(\.\d+)?/);
  const exponentPart = parser.regex(/([eE][+-]?\d+)?/);

  return parseFloat(negativeSign + integerPart + fractionalPart + exponentPart);
}
