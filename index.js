import fs from "fs";
import parser from "@babel/parser";
import traverse from "@babel/traverse";
import path, { resolve } from "path";
import ejs from "ejs";
import { transformFromAst } from "babel-core";
import { SyncHook } from "tapable";

import { jsonLoader } from "./loaders/json-loader.js";
import { HtmlWebapckPlugin } from "./plugins/html-webpack-plugin/index.js";

//  全局的id
let moduleId = 0;

const webpackConfig = {
  module: {
    rules: [{ test: /\.json$/, use: jsonLoader }],
  },
  plugins: [new HtmlWebapckPlugin({})],
};

//  钩子的类型
const hooks = {
  afterEmit: new SyncHook(["outputDir", "output"]),
};

/**
 * 解析依赖
 *
 * @param {string} filePath 文件路径
 * @returns
 */
function createAsset(filePath) {
  // * 1、获取文件的内容

  let source = fs.readFileSync(filePath, {
    encoding: "utf-8",
  });

  //  * loader的处理
  const rules = webpackConfig?.module?.rules || [];
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

/**
 * 构建依赖图
 *
 * @param {string} entry
 */
function createGraph(entry) {
  const mainAsset = createAsset(entry);

  const queue = [mainAsset];

  //  记录已经处理过的，避免循环依赖
  const visitedAsset = {};

  for (const asset of queue) {
    asset.deps.forEach((relativePath) => {
      //  因为用了path.resolve, 它会引入绝对路径，导致我们一开始使用的map对不上
      //  所以我们要转换思路，不要使用文件路径作为key，而是用id
      // const child = createAsset(resolve("./example", relativePath));
      // asset.mapping[child.filePath] = child.moduleId;

      const childPath = resolve("./example", relativePath);
      if (!visitedAsset[childPath]) {
        const child = createAsset(childPath);
        asset.mapping[relativePath] = child.moduleId;
        visitedAsset[childPath] = child.moduleId;
        queue.push(child);
      } else {
        const sameAsset = queue.find(
          (item) =>
            item.filePath === relativePath || item.filePath === childPath
        );
        asset.mapping[relativePath] = sameAsset.moduleId;
      }
    });
  }

  console.log("queue==", queue);
  return queue;
}

/**
 * 注册插件
 */
function initPlugins() {
  const plugins = webpackConfig.plugins || [];

  plugins.forEach((plugin) => {
    plugin.apply(hooks);
  });
}

/**
 * 通过构建出来的图，然后将数据注入到对应ejs模板，生成最后的文件
 *
 * @param {*[]} graph
 */
function build(graph) {
  //  注册插件
  initPlugins();

  const template = fs.readFileSync("./bundle.ejs", {
    encoding: "utf-8",
  });

  const data = graph.map((asset) => {
    const { filePath, code, moduleId, mapping } = asset;
    return {
      filePath,
      code,
      moduleId,
      mapping,
    };
  });

  const render = ejs.render(template, {
    data,
  });

  const dirPath = path.resolve("./dist");
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath);
  }

  const filePath = dirPath + "/bundle.js";
  if (fs.existsSync(filePath)) {
    fs.rmSync(filePath);
  }
  fs.writeFileSync(filePath, render);

  //  在emit之后，触发hooks
  hooks.afterEmit.call(dirPath, "bundle.js");
}

const entryPath = "./example/entry.js";
const graph = createGraph(entryPath);
build(graph);
