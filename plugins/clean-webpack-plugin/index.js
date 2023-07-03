import * as fs from "fs";

export class CleanWebapckPlugin {
  apply(compiler) {
    compiler.hooks.emit.tap("clean webpack plugin", (compiler) => {
      const outputDirPath = compiler.output.path;

      this.deleteFolder(outputDirPath);
    });
  }

  /**
   * 删除文件夹下的所有文件
   *
   * @param {string} path
   */
  deleteFolder(path) {
    let files = [];
    if (fs.existsSync(path)) {
      files = fs.readdirSync(path);

      files.forEach((file) => {
        const filePath = `${path}/${file}`;

        //  访问文件，确实是否是文件夹
        if (fs.statSync(filePath).isDirectory()) {
          this.deleteFolder(filePath);
        } else {
          //  删除文件夹
          fs.unlinkSync(filePath);
        }
      });

      //  删除空文件夹
      fs.rmdirSync(path);
    }
  }
}
