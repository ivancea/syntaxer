import { Parser } from "../lib/parser.types";
import { Example } from "./examples.types";

export const examples: Example[] = [
  {
    name: "unit",
    input: `
class A {
  prop x: number;
  prop y: string;
}
class B {}
`,
    rule: unitRule,
    expected: {
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
        {
          astType: "class",
          name: "B",
          properties: [],
        },
      ],
    },
  },

  {
    name: "class",
    input: `
class A {
  prop x: number;
  prop y: string;
}
`.trim(),
    rule: classRule,
    expected: {
      astType: "class",
      name: "A",
      properties: [
        { astType: "property", name: "x", type: "number" },
        { astType: "property", name: "y", type: "string" },
      ],
    },
  },

  {
    name: "property",
    input: `prop x: number;`,
    rule: propertyRule,
    expected: {
      astType: "property",
      name: "x",
      type: "number",
    },
  },
];

// AST

type UnitAST = {
  astType: "unit";
  classes: ClassAST[];
};

type ClassAST = {
  astType: "class";
  name: string;
  properties: PropertyAST[];
};

type PropertyAST = {
  astType: "property";
  name: string;
  type: string;
};

// Rules

export function unitRule(parser: Parser): UnitAST {
  const classes = parser.many((p) => {
    p.regex(/\s*/);
    return p.use(classRule);
  });

  // Consume everything until EOF
  parser.regex(/\s*/);

  return {
    astType: "unit",
    classes,
  };
}

export function classRule(parser: Parser): ClassAST {
  parser.string("class");
  parser.regex(/\s*/);
  const name = parser.regex(/[a-zA-Z0-9_]+/);

  parser.regex(/\s*/);
  parser.string("{");
  parser.regex(/\s*/);

  const properties = parser.many((p) => {
    p.regex(/\s*/);
    return p.use(propertyRule);
  });

  parser.regex(/\s*/);
  parser.string("}");

  return {
    astType: "class",
    name,
    properties,
  };
}

export function propertyRule(parser: Parser): PropertyAST {
  parser.string("prop");
  parser.regex(/\s*/);
  const name = parser.regex(/[a-zA-Z0-9_]+/);
  parser.regex(/\s*/);
  parser.string(":");
  parser.regex(/\s*/);
  const type = parser.regex(/[a-zA-Z0-9_]+/);
  parser.regex(/\s*/);
  parser.string(";");

  return {
    astType: "property",
    name,
    type,
  };
}
