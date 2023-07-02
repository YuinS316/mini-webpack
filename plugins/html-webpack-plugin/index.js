import ejs from "ejs";
import * as fs from "fs";

export class HtmlWebapckPlugin {
  constructor(options = {}) {
    this.fileName = options.filename || "index.html";
  }

  apply(hooks) {
    hooks.afterEmit.tap("HtmlWebpackPlugin", (outputDir, output) => {
      console.log("call webpack plugin");

      const template = fs.readFileSync(
        "./plugins/html-webpack-plugin/html.ejs",
        {
          encoding: "utf-8",
        }
      );

      const render = ejs.render(template, {
        path: output,
      });

      const filePath = outputDir + "/" + this.fileName;

      fs.writeFileSync(filePath, render);
    });
  }
}
