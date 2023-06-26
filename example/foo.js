import { bar } from "./bar.js";
import json from "./test.json";
export function foo() {
  console.log(json);
  console.log("foo");
  bar();
}
