// promise 有三个状态：pending，fulfilled，or rejected；「规范 Promise/A+ 2.1」
// new promise时， 需要传递一个executor()执行器，执行器立即执行；
// executor接受两个参数，分别是resolve和reject；
// promise 的默认状态是 pending；
// promise 有一个value保存成功状态的值，可以是undefined/thenable/promise；「规范 Promise/A+ 1.3」
// promise 有一个reason保存失败状态的值；「规范 Promise/A+ 1.5」
// promise 只能从pending到rejected, 或者从pending到fulfilled，状态一旦确认，就不会再改变；
// promise 必须有一个then方法，then 接收两个参数，分别是 promise 成功的回调 onFulfilled, 和 promise 失败的回调 onRejected；「规范 Promise/A+ 2.2」
// 如果调用 then 时，promise 已经成功，则执行onFulfilled，参数是promise的value；
// 如果调用 then 时，promise 已经失败，那么执行onRejected, 参数是promise的reason；
// 如果 then 中抛出了异常，那么就会把这个异常作为参数，传递给下一个 then 的失败的回调onRejected；
// https://juejin.cn/post/6850037281206566919

export enum CustomPromiseStatus {
  Pending = "PENDING",
  Fulfilled = "FULFILLED",
  Rejected = "REJECTED",
}

export type CustomPromiseResolve<T> = (res?: T) => void;
export type CustomPromiseReject = (err?: unknown) => void;
export type CustomPromiseExecutor<T> = (
  resolve: CustomPromiseResolve<T>,
  reject: CustomPromiseReject
) => void;

const customResolve = (
  promise: CustomPromise<any>,
  x: any,
  resolve: CustomPromiseResolve<any>,
  reject: CustomPromiseReject
) => {
  if (promise === x) {
    return reject(
      new TypeError("Chaining cycle detected for promise #<Promise>")
    );
  }
  let called = false;
  let then =
    (typeof x === "object" && x !== null) || typeof x === "function"
      ? x.then
      : undefined;
  if (typeof then === "function") {
    try {
      then.call(
        x,
        (y: any) => {
          if (called) return;
          called = true;
          customResolve(promise, y, resolve, reject);
        },
        (r: unknown) => {
          if (called) return;
          called = true;
          reject(r);
        }
      );
    } catch (e) {
      if (called) return;
      called = true;
      reject(e);
    }
  } else {
    resolve(x);
  }
};

// use Promise.race to stop another promise
// function wrap(promise) {
//   let abort;
//   let newPromise = new Promise((resolve, reject) => { // defer
//       abort = reject;
//   });
//   let p = Promise.race([promise, newPromise]);
//   p.abort = abort;
//   return p;
// }

export class CustomPromise<T> {
  status: CustomPromiseStatus = CustomPromiseStatus.Pending;
  value?: T;
  reason?: unknown;
  onResolvedCallbacks: CustomPromiseResolve<T>[] = [];
  onRejectedCallbacks: CustomPromiseReject[] = [];

  static resolve(data?: any) {
    return new CustomPromise((resolve) => {
      resolve(data);
    });
  }

  static reject(reason?: unknown) {
    return new Promise((resolve, reject) => {
      reject(reason);
    });
  }

  static all(promises: CustomPromise<any>[]) {
    if (!Array.isArray(promises)) {
      const type = typeof promises;
      return new TypeError(`TypeError: ${type} ${promises} is not iterable`);
    }

    return new Promise((resolve, reject) => {
      let resultArr: any[] = [];
      let orderIndex = 0;
      const processResultByKey = (value: any, index: number) => {
        resultArr[index] = value;
        if (++orderIndex === promises.length) {
          resolve(resultArr);
        }
      };
      for (let i = 0; i < promises.length; i++) {
        let value = promises[i];
        if (value && typeof value.then === "function") {
          value.then((value) => {
            processResultByKey(value, i);
          }, reject);
        } else {
          processResultByKey(value, i);
        }
      }
    });
  }

  static race(promises: CustomPromise<any>[]) {
    return new CustomPromise((resolve, reject) => {
      // 一起执行就是for循环
      for (let i = 0; i < promises.length; i++) {
        let val = promises[i];
        if (val && typeof val.then === "function") {
          val.then(resolve, reject);
        } else {
          // 普通值
          resolve(val);
        }
      }
    });
  }

  constructor(executor: CustomPromiseExecutor<T>) {
    this.status = CustomPromiseStatus.Pending;
    this.value = undefined;
    this.reason = undefined;
    this.onResolvedCallbacks = [];
    this.onRejectedCallbacks = [];

    // make a resolve function
    let resolve = (value?: T): any => {
      if (value instanceof Promise) {
        // continue execute
        return value.then(resolve, reject);
      }
      if (this.status === CustomPromiseStatus.Pending) {
        this.status = CustomPromiseStatus.Fulfilled;
        this.value = value;
        this.onResolvedCallbacks.forEach((fn) => fn());
      }
    };

    // make a reject funciton
    let reject = (reason?: unknown) => {
      if (this.status === CustomPromiseStatus.Pending) {
        this.status = CustomPromiseStatus.Rejected;
        this.reason = reason;
        this.onRejectedCallbacks.forEach((fn) => fn());
      }
    };

    try {
      // execute
      executor(resolve, reject);
    } catch (e) {
      reject(e);
    }
  }

  then(
    onFulfilled?: CustomPromiseResolve<T>,
    onRejected?: CustomPromiseReject
  ) {
    // set default resolve
    const _onFulfilled: CustomPromiseResolve<T> =
      typeof onFulfilled === "function" ? onFulfilled : (v) => v;
    // set default reject
    const _onRejected: CustomPromiseReject =
      typeof onRejected === "function"
        ? onRejected
        : (err) => {
            throw err;
          };

    // each then called will return a new promise
    let promise = new CustomPromise((resolve, reject) => {
      if (this.status === CustomPromiseStatus.Fulfilled) {
        setTimeout(() => {
          try {
            customResolve(promise, _onFulfilled(this.value), resolve, reject);
          } catch (e) {
            reject(e);
          }
        }, 0);
      }

      if (this.status === CustomPromiseStatus.Rejected) {
        setTimeout(() => {
          try {
            customResolve(promise, _onRejected(this.reason), resolve, reject);
          } catch (e) {
            reject(e);
          }
        }, 0);
      }

      // if resolve is an async function, push to tasks
      if (this.status === CustomPromiseStatus.Pending) {
        this.onResolvedCallbacks.push(() => {
          setTimeout(() => {
            try {
              customResolve(promise, _onFulfilled(this.value), resolve, reject);
            } catch (e) {
              reject(e);
            }
          }, 0);
        });

        this.onRejectedCallbacks.push(() => {
          setTimeout(() => {
            try {
              customResolve(promise, _onRejected(this.reason), resolve, reject);
            } catch (e) {
              reject(e);
            }
          }, 0);
        });
      }
    });
    return promise;
  }

  catch(onRejected?: CustomPromiseReject) {
    return this.then(undefined, onRejected);
  }

  finally(callback: CustomPromiseResolve<T>) {
    return this.then(
      (value) => {
        return CustomPromise.resolve(callback()).then(() => value);
      },
      (reason) => {
        return CustomPromise.resolve(callback()).then(() => {
          throw reason;
        });
      }
    );
  }
}
