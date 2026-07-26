const MinimizerPlugin = require("minimizer-webpack-plugin");

module.exports = (env) => {
  const options = {
    entry: {
      varstor: "./src/index.js",
      "varstor-webextension": "./src/webextension.js",
    },
    output: {
      filename: ({ chunk }) => `./${chunk.name}.js`,
      library: "Varstor",
      libraryTarget: "umd",
      libraryExport: "default",
      globalObject: "this",
    },
    mode: "development",
    watch: true,

    stats: {
      colors: true,
    },

    devtool: false,
  };

  if(env.production) {
    options.optimization = {
      minimize: true,
      minimizer: [new MinimizerPlugin()],
    };
    options.output.filename = ({ chunk }) => `./${chunk.name}.min.js`;
  }

  return options;

};
