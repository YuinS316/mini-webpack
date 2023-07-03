import path from "path";
import { SyncHook } from "tapable";
import ejs from "ejs";
import * as fs from "fs";
import { EntryPlugin } from "./EntryPlugin.js";
import { Compilation } from "./Compilation.js";

import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class Compiler {
  constructor(config) {
    this.entry = config.entry;
    this.output = config.output;

    this.module = config.module;
    this.plugins = config.plugins;

    this.hooks = {
      //  构建的时候调用的钩子
      make: new SyncHook(["compilation", "callback"]),
      emit: new SyncHook(["compiler"]),
      afterEmit: new SyncHook(["compiler"]),
    };

    this.initPlugins();
  }

  //  初始化插件系统
  initPlugins() {
    const compiler = this;

    const plugins = Array.isArray(this.plugins) ? this.plugins : [this.plugins];

    plugins.forEach((plugin) => {
      plugin.apply(compiler);
    });

    const entryPlugin = new EntryPlugin({
      entry: this.entry,
    });

    //  注册打包事件
    entryPlugin.apply(compiler);
  }

  //  执行的入口
  run() {
    const compilation = new Compilation({
      module: this.module,
      output: this.output,
    });

    this.hooks.make.call(compilation, () => {
      console.log("make finished ===== ");
    });

    this.hooks.emit.call(this);
    this.emitAssets(compilation);
    this.hooks.afterEmit.call(this);
  }

  //  输出打包后的文件
  emitAssets(compilation) {
    const { graph } = compilation;

    const data = graph.map((asset) => {
      const { filePath, code, moduleId, mapping } = asset;
      return {
        filePath,
        code,
        moduleId,
        mapping,
      };
    });

    const templatePath = path.resolve(__dirname, "./template.ejs");

    const template = fs.readFileSync(templatePath, {
      encoding: "utf-8",
    });

    const render = ejs.render(template, {
      data,
    });

    //  bundle的输出实际路径
    const outputPath = path.join(this.output.path, this.output.filename);

    //  先确认输出的文件夹是否存在
    const outputDirPath = this.output.path;
    if (!fs.existsSync(outputDirPath)) {
      fs.mkdirSync(outputDirPath);
    }

    fs.writeFileSync(outputPath, render);
  }
}

export default Compiler;
