import b from "benny";
import { examples } from "../examples/examples.json";
import { parse } from "../lib/parser";

b.suite(
  "JSON parser",

  ...examples.flatMap(({ name, rule, input, context }) => [
    b.add(`JSON.parse(): ${name}`, () => JSON.parse(input) as unknown),
    b.add(`parse(): ${name}`, () => parse(rule, input, context)),
  ]),

  b.cycle(),
  b.complete(),

  b.save({
    folder: "benchmark-results",
    file: "detailed",
    format: "json",
    details: true,
  }),
  b.save({
    folder: "benchmark-results",
    file: "non-detailed",
    format: "json",
    details: false,
  }),
  b.save({
    folder: "benchmark-results",
    file: "detailed",
    format: "table.html",
    details: true,
  }),
  b.save({
    folder: "benchmark-results",
    file: "non-detailed",
    format: "table.html",
    details: false,
  }),
  b.save({
    folder: "benchmark-results",
    file: "detailed",
    format: "chart.html",
    details: true,
  }),
  b.save({
    folder: "benchmark-results",
    file: "non-detailed",
    format: "chart.html",
    details: false,
  }),
).catch((e: unknown) => {
  console.error(e);
});
