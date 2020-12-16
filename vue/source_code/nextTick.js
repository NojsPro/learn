let callbacks = [];
let pending = false;

/* 
    函数加入callback队列
    通过pending设置等待

    如果正在等待执行的时候调用nexttick会cb添加到callbacks，
    下次执行的时候在执行
*/
function nextTick(cb) {
    callbacks.push(cb);

    if (!pending) {
        pending = true;
        setTimeout(flushCallbacks, 0)
    }
}
/* 
    逐个执行callbacks里的函数
    结束等待状态
    重置callbacks
*/
function flushCallbacks() {
    pending = false;
    const copies = callbacks.slice(0);
    callbacks.length = 0;
    for (let i = 0; i < copies.length; i++) {
        copies[i]();
    }
}

let has = {};
let queue = [];
let waiting = false;
/* 
 获取watcher的id
 判断id是否存在
 不存在加入queue队列

 通过waiting判断是否函数是否在执行，如果不在执行就执行nextTick
 且改变waiting为在执行
*/
function queueWatcher(watcher) {
    const id = watcher.id;
    if (has[id] == null) {
        has[id] = true;
        queue.push(watcher);

        if (!waiting) {
            waiting = true;
            nextTick(flushSchedulerQueue);
        }
    }
}
/* 
遍历queue，
获取里面的watcher
执行对应的更新
重置has[id]
结束waiting
*/
function flushSchedulerQueue() {
    let watcher, id;

    for (let index = 0; index < queue.length; index++) {
        watcher = queue[index];
        id = watcher.id;
        has[id] = null;
        watcher.run();
    }

    waiting = false;
}

let uid = 0;
class Watcher {
    constructor() {
        this.id = ++uid;
    }

    update() {
        console.log('watch ' + this.id + ' update');
        queueWatcher(this)
    }

    run() {
        console.log(`watch ${this.id} 视图更新`)
    }
}

let watch1 = new Watcher();
let watch2 = new Watcher();

watch1.update();
watch1.update();
watch1.update();
watch2.update();