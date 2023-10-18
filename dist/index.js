"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cancellable_1 = require("./cancellable");
const [cancel, promise] = (0, cancellable_1.cancellable)((function* () {
    return 42;
})());
setTimeout(cancel, 100);
promise.then(console.log); // 在 t=0ms 解析为 42
