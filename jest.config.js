/** @type {import('ts-jest').JestConfigWithTsJest} **/
export default {
  testEnvironment: "node",
  extensionsToTreatAsEsm: [".ts"],
  transform: {
    "^.+.ts$": [
      "ts-jest",
      {
        useESM: true,
      },
    ],
  },
};
