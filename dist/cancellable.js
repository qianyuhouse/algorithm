"use strict";
// 有时候你会有一个长时间运行的任务，并且你可能希望在它完成之前取消它。为了实现这个目标，请你编写一个名为 cancellable 的函数，它接收一个生成器对象，并返回一个包含两个值的数组：一个 取消函数 和一个 promise 对象。
Object.defineProperty(exports, "__esModule", { value: true });
exports.cancellable = void 0;
// 你可以假设生成器函数只会生成 promise 对象。你的函数负责将 promise 对象解析的值传回生成器。如果 promise 被拒绝，你的函数应将该错误抛回给生成器。
// 如果在生成器完成之前调用了取消回调函数，则你的函数应该将错误抛回给生成器。该错误应该是字符串 "Cancelled"（而不是一个 Error 对象）。如果错误被捕获，则返回的 promise 应该解析为下一个生成或返回的值。否则，promise 应该被拒绝并抛出该错误。不应执行任何其他代码。
// 当生成器完成时，您的函数返回的 promise 应该解析为生成器返回的值。但是，如果生成器抛出错误，则返回的 promise 应该拒绝并抛出该错误。
// 下面的示例展示了你的代码会如何被使用：
// function* tasks() {
//   const val = yield new Promise(resolve => resolve(2 + 2));
//   yield new Promise(resolve => setTimeout(resolve, 100));
//   return val + 1; // calculation shouldn't be done.
// }
// const [cancel, promise] = cancellable(tasks());
// setTimeout(cancel, 50);
// promise.catch(console.log); // logs "Cancelled" at t=50ms
// 相反，如果 cancel() 没有被调用或者在 t=100ms 之后才被调用，那么 promise 应被解析为 5 。
/**
 * @param {Generator} generator
 * @return {[Function, Promise]}
 */
function cancellable(generator) {
    let cancel = () => { };
    let promise = new Promise((resolve, reject) => {
        // resolve
        function onFulfilled(value) {
            let ret;
            try {
                ret = generator.next(value);
            }
            catch (e) {
                return reject(e);
            }
            next(ret);
        }
        // reject
        function onRejected(err) {
            let ret;
            try {
                ret = generator.throw(err);
            }
            catch (e) {
                return reject(e);
            }
            next(ret);
        }
        // next
        function next(ret) {
            if (ret.done)
                return resolve(ret.value);
            if (ret.value.then)
                ret.value.then(onFulfilled, onRejected);
            else
                onFulfilled(ret.value);
        }
        cancel = () => onRejected("Cancelled");
    });
    return [cancel, promise];
}
exports.cancellable = cancellable;
// function* tasks(): any {
//   const val = yield new Promise((resolve) => resolve(2 + 2));
//   yield new Promise((resolve) => setTimeout(resolve, 100));
//   return val + 1;
// }
// const [cancel, promise] = cancellable(tasks());
// setTimeout(cancel, 50);
// promise.catch(console.log); // logs "Cancelled" at t=50ms
