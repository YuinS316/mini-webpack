import parser from "@babel/parser";
import traverse from "@babel/traverse";
import { transformFromAst } from "babel-core";
import * as fs from "fs";

//  模块的id
let moduleId = 0;

export class Compilation {
  constructor({ module, output }) {
    this.loaders = module.rules;
    this.output = output;
    this.graph = [];
  }

  buildModule(filePath) {
    // * 1、获取文件的内容

    let source = fs.readFileSync(filePath, {
      encoding: "utf-8",
    });

    //  * loader的处理
    const rules = this.loaders || [];
    rules.forEach((rule) => {
      const { test, use } = rule;

      //  use可以是一个数组，注意是从右往左执行
      const useArray = Array.isArray(use) ? use.reverse() : [use];

      if (test.test(filePath)) {
        useArray.forEach((loader) => {
          source = loader(source);
        });
      }
    });

    //  * 2、获取依赖关系

    const deps = [];

    const ast = parser.parse(source, {
      sourceType: "module",
    });
    // console.log("ast--", ast);

    //  获取文件中的依赖
    traverse.default(ast, {
      ImportDeclaration(path) {
        const { value } = path.node.source;
        console.log(value);
        deps.push(value);
      },
    });

    //  通过babel-core,将esm转换成cjs
    const { code } = transformFromAst(ast, null, {
      presets: ["env"],
    });

    return {
      filePath,
      code,
      deps,
      moduleId: moduleId++,
      mapping: {},
    };
  }
}
