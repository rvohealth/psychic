module.exports = {
  presets: [
    // [
    //   "@babel/preset-env",
    //   {
    //     targets: {
    //       node: 'current'
    //     }
    //   }
    // ],

    "@babel/preset-env",
    "@babel/preset-react"
  ],
  plugins: [
    "@babel/plugin-transform-runtime",
    "@babel/plugin-proposal-do-expressions",
    "@babel/plugin-proposal-async-do-expressions",
    "@babel/plugin-proposal-class-static-block",
    "@babel/plugin-syntax-jsx",
    ["@babel/plugin-proposal-class-properties"],
    ["@babel/plugin-proposal-private-methods"],
    "require-context-hook",
    [
      "module-resolver",
      {
        "root": ["."],
        "extensions": [".js"]
      }
    ]
  ],
  "sourceMaps": "inline"
}
