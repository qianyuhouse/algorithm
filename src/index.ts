import { cancellable } from "./cancellable";

const [cancel, promise] = cancellable(
  (function* () {
    return 42;
  })()
);
setTimeout(cancel, 100);
promise.then(console.log); // 在 t=0ms 解析为 42
