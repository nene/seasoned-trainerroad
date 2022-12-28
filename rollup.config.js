import { nodeResolve } from "@rollup/plugin-node-resolve";

export default {
  input: "src/tr-background.js",
  output: {
    dir: "out",
    format: "cjs",
  },
  plugins: [nodeResolve()],
};
