"use strict";
// 2677. 分块数组
// 给定一个数组 arr 和一个块大小 size ，返回一个 分块 的数组。分块 的数组包含了 arr 中的原始元素，但是每个子数组的长度都是 size 。如果 arr.length 不能被 size 整除，那么最后一个子数组的长度可能小于 size 。
Object.defineProperty(exports, "__esModule", { value: true });
exports.chunk = void 0;
function chunk(arr, size) {
    return arr.reduce((result, item) => {
        if (!result.length) {
            result.push([item]);
            return result;
        }
        if (result[result.length - 1].length < size) {
            result[result.length - 1].push(item);
        }
        else {
            result.push([item]);
        }
        return result;
    }, []);
}
exports.chunk = chunk;
