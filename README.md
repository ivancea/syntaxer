# Syntaxer

Generic parsing library. Syntaxer gives an easy to write, programatical, pseudo-imperative way to build your own parsers.

## How to use

The parser is called with a root rule.

Rules are functions receiving the parser helper object, and an optional context parameter provided by you.

Inside of each rule, you can use the parser "hook-like" methods to build your rule expectations. Your rule will return whatever object you want to build with the parsed information.

## Example

Let's build a simple parser that will automatically evaluate any mathematical expression. For this example, we'll just accept integers and "+" operations:

```ts
function numberRule(parser: Parser): number {
  return Number(parser.regex(/\d+/));
}

function expressionRule(parser: Parser): number {
  return parser.any(numberRule, expressionRule);
}

function addExpressionRule(parser: Parser): number {
  const left = parser.use(expressionRule);
  parser.string("+");
  const right = parser.use(expressionRule);

  return left + right;
}
```

Here we're using multiple matchers from the `parser` object:

- `string`: Matches any fixed string, and return it.
- `regex`: Matches any given regex, and it returns the matched string.
- `use`: This matcher is the base for composition. It receives another rule, and will try to match it. Its return is the return value of the rule.
- `any`: This matcher is the core of any parser, as it enables your code to expect any of multiple provided rules. You will receive the matched rule return value.

There are more parsers, that are found and documented in the `Parser` object.

> Tip: You can also use a lambda inside `any` for simple matches.

## How does it work

The hook-like functions from the `Parser` object work with the `parser()` function to automatically fail and backtrack any match. The functionality is based on exceptions, so it's not recommended to try-catch matchers, as it could break the parser if not rethrown.

Every time a matcher fails, it throws an exception, that is caught by the parser. If it considers the rule as failed, it will return an error. Otherwise, it will call the rule again. Some state is kept to let matchers try other possibilities (Like the `any()` matcher, which will try to match the next rule instead).

To avoid executing everything from scratch within a rule, values are memoized. Take this into account when making your rules.

## Roadmap

- Better errors
- Verify that the correct Parser is called within each parse() function.
  For example, `parser.use(() => parser.string("A"))` is an error.
  - Send an unique ID (Incremental number within internal context object?), and check it?
- Memoization: Allow matchers to be changed without breaking the rule caches
- Memoization: Possibility to disable cache at either rule or matcher level
