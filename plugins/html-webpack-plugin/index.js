import ejs from "ejs";
import * as fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class HtmlWebapckPlugin {
  constructor(options = {}) {
    this.fileName = options.filename || "index.html";
  }

  apply(compiler) {
    compiler.hooks.afterEmit.tap("HtmlWebpackPlugin", (compiler) => {
      console.log("call webpack plugin");

      const { filename: outputName, path: outputDir } = compiler.output;

      const templatePath = path.join(__dirname, "./html.ejs");

      const template = fs.readFileSync(templatePath, {
        encoding: "utf-8",
      });

      const render = ejs.render(template, {
        path: outputName,
      });

      const filePath = outputDir + "/" + this.fileName;

      fs.writeFileSync(filePath, render);
    });
  }
}
