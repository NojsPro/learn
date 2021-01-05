/* 
    洗牌算法
*/

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