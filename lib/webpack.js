import Compiler from "./Compiler.js";

export function webpack(config) {
  const compiler = new Compiler(config);

  compiler.run();
}
