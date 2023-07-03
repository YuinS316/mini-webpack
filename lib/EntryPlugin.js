import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class EntryPlugin {
  constructor({ entry }) {
    this.entry = entry;
  }

  apply(compiler) {
    compiler.hooks.make.tap("entry plugin", (compilation, callback) => {
      const mainAsset = compilation.buildModule(this.entry);

      const queue = [mainAsset];

      //  记录已经处理过的，避免循环依赖
      const visitedAsset = {};

      for (const asset of queue) {
        asset.deps.forEach((relativePath) => {
          //  因为用了path.resolve, 它会引入绝对路径，导致我们一开始使用的map对不上
          //  所以我们要转换思路，不要使用文件路径作为key，而是用id
          // const child = createAsset(resolve("./example", relativePath));
          // asset.mapping[child.filePath] = child.moduleId;

          //  绝对路径
          const childPath = path.resolve(
            path.dirname(this.entry),
            relativePath
          );

          if (!visitedAsset[childPath]) {
            const child = compilation.buildModule(childPath);
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

      compilation.graph = queue;
      callback();
    });
  }
}
