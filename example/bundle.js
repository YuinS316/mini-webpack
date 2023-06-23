//  一开始将其铺平，可以发现到一些问题
//  首先是import只能在顶层使用，export要在最外层
(function () {
  // function entryjs() {
  //   import { foo } from "./foo.js";
  //   import { bar } from "./bar.js";
  //   export function entry() {
  //     foo();
  //     bar();
  //     console.log("entry!");
  //   }
  // }
  // function barjs() {
  //   export function bar() {
  //     console.log("bar");
  //   }
  // }
  // function foojs() {
  //   import { bar } from "./bar";
  //   export function foo() {
  //     console.log("foo");
  //     bar();
  //   }
  // }
})();

//  所以我们需要手动的处理掉import和export
//  在webpack中也是干了类似的事情，即模仿cjs的格式去处理
//  需要去构造一个map (即路径 -> 依赖) 和 自定义的导入导出方法
(function () {
  function entryjs(require, module, exports) {
    const { foo } = require("./foo.js");
    const { bar } = require("./bar.js");

    foo();
    bar();
    console.log("entry!");
  }

  function foojs(require, module, exports) {
    const { bar } = require("./bar.js");
    function foo() {
      console.log("foo");
      bar();
    }
    module.exports = {
      foo,
    };
  }

  function barjs(require, module, exports) {
    function bar() {
      console.log("bar");
    }
    module.exports = {
      bar,
    };
  }

  function require(filePath) {
    const map = {
      "./entry.js": entryjs,
      "./foo.js": foojs,
      "./bar.js": barjs,
    };

    const fn = map[filePath];

    const module = {
      exports: {},
    };

    fn(require, module, module.exports);

    return module.exports;
  }

  require("./entry.js");
})();

//  我们再重构一下，发现require是不需要变化的，只有依赖对应关系需要我们去生成
(function (modules) {
  function require(filePath) {
    const fn = modules[filePath];

    const module = {
      exports: {},
    };

    fn(require, module, module.exports);

    return module.exports;
  }

  require("./entry.js");
})({
  "./entry.js": function (require, module, exports) {
    const { foo } = require("./foo.js");
    const { bar } = require("./bar.js");

    foo();
    bar();
    console.log("entry!");
  },
  "./foo.js": function (require, module, exports) {
    const { bar } = require("./bar.js");
    function foo() {
      console.log("foo");
      bar();
    }
    module.exports = {
      foo,
    };
  },
  "./bar.js": function (require, module, exports) {
    function bar() {
      console.log("bar");
    }
    module.exports = {
      bar,
    };
  },
});

//  通过以上的思路我们实现了一下这个形式的代码
//  其中我们一眼就能观察的到，这代码有问题，关键点是路径对不上
//  另外还发现了一个问题，bar被重复引入了，我们需要对被引入的文件做一个记录
(function (modules) {
  function require(filePath) {
    const fn = modules[filePath];

    const module = {
      exports: {},
    };

    fn(require, module, module.exports);

    return module.exports;
  }

  require("./entry.js");
})({
  "./example/entry.js": function (require, module, exports) {
    "use strict";

    Object.defineProperty(exports, "__esModule", {
      value: true,
    });
    exports.entry = entry;

    var _foo = require("./foo.js");

    var _bar = require("./bar.js");

    function entry() {
      (0, _foo.foo)();
      (0, _bar.bar)();
      console.log("entry!");
    }
  },

  "/Users/guohaobin/project/node/mini-webpack/example/foo.js": function (
    require,
    module,
    exports
  ) {
    "use strict";

    Object.defineProperty(exports, "__esModule", {
      value: true,
    });
    exports.foo = foo;

    var _bar = require("./bar.js");

    function foo() {
      console.log("foo");
      (0, _bar.bar)();
    }
  },

  "/Users/guohaobin/project/node/mini-webpack/example/bar.js": function (
    require,
    module,
    exports
  ) {
    "use strict";

    Object.defineProperty(exports, "__esModule", {
      value: true,
    });
    exports.bar = bar;

    function bar() {
      console.log("bar");
    }
  },

  "/Users/guohaobin/project/node/mini-webpack/example/bar.js": function (
    require,
    module,
    exports
  ) {
    "use strict";

    Object.defineProperty(exports, "__esModule", {
      value: true,
    });
    exports.bar = bar;

    function bar() {
      console.log("bar");
    }
  },
});

//  我们需要将id与文件路径做一个映射
(function (modules) {
  //  换成了id
  function require(id) {
    const [fn, mapping] = modules[id];

    const module = {
      exports: {},
    };

    //  需要包装一下
    function transformRequire(filePath) {
      const id = mapping[filePath];
      return require(id);
    }

    fn(transformRequire, module, module.exports);

    return module.exports;
  }

  require(0);
})({
  0: [
    function (require, module, exports) {
      "use strict";

      Object.defineProperty(exports, "__esModule", {
        value: true,
      });
      exports.entry = entry;

      var _foo = require("./foo.js");

      var _bar = require("./bar.js");

      function entry() {
        (0, _foo.foo)();
        (0, _bar.bar)();
        console.log("entry!");
      }
    },
    {
      "./foo.js": 1,
      "./bar.js": 2,
    },
  ],

  1: [
    function (require, module, exports) {
      "use strict";

      Object.defineProperty(exports, "__esModule", {
        value: true,
      });
      exports.foo = foo;

      var _bar = require("./bar.js");

      function foo() {
        console.log("foo");
        (0, _bar.bar)();
      }
    },
    {
      "./bar.js": 2,
    },
  ],

  2: function (require, module, exports) {
    "use strict";

    Object.defineProperty(exports, "__esModule", {
      value: true,
    });
    exports.bar = bar;

    function bar() {
      console.log("bar");
    }
  },
});
