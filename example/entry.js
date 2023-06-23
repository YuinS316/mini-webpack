import { foo } from "./foo.js";
import { bar } from "./bar.js";

function entry() {
  foo();
  bar();
  console.log("entry!");
}

entry();
