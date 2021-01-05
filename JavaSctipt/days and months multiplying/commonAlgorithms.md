# 常见算法
## 洗牌算法
利用while循环遍历数组，每次都产生一个数组长度内的随机整数，与当前下标交换位置，打乱数组很有效
```Javascript
function shuffle(arr) {
    let len = arr.length;
    while(len > 0) {
        let index = Math.floor(Math.random() * len);
        len --;
        // 随机下标与len交换位置
        [arr[len], arr[index]] = [arr[index], arr[len]];
    }

    return arr;
}
```