import { webpack } from "../lib/webpack.js";
import { jsonLoader } from "../loaders/json-loader.js";
import { CleanWebapckPlugin } from "../plugins/clean-webpack-plugin/index.js";
import { HtmlWebapckPlugin } from "../plugins/html-webpack-plugin/index.js";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const config = {
  entry: path.resolve(__dirname, "./entry.js"),
  output: {
    path: path.resolve(__dirname, "./dist"),
    filename: "bundle.js",
  },
  module: {
    rules: [
      {
        test: /\.json$/,
        use: jsonLoader,
      },
    ],
  },
  plugins: [new CleanWebapckPlugin(), new HtmlWebapckPlugin()],
};

webpack(config);
