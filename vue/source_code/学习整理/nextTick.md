## NextTick 是什么

官方的定义

> 将回调延迟到下次 DOM 更新循环之后执行。在修改数据之后立即使用它，然后等待 DOM 更新。

这句话说的比较简洁，我们可以理解成，`Vue`在更新`DOM`的时候是进行异步操作的。当数据发生变化时，`Vue`不会马上更新视图，而是会开启一个异步更新队列，数据的变化会加入此队列，视图需要等待队列中所有数据变化完成后再统一进行更新。

假设我们有这样一个例子

```vue
<template>
    <div>
    	<div>{{number}}</div>
		<div @click="handleClick">click</div>
	</div>
</template>
export default {
    data() {
        return {
            number: 0
        }
    },
    methods: {
        handleClick() {
            for(let i = 0; i < 1000; i++) {
                this.number++;
            }
        }
    }
}
```

当我们触发`handleClick()`的时候，`number`会被循环增加1000次。

假设我们没有`NextTick`，那么`number`每次增加1的时候，视图都会更新一次，那么这个过程中，DOM将会更行1000次，这样会浪费大量的客户端性能。

所以`Vue`采用了更高效的`NextTick`来处理，`Vue.js` 在默认情况下，每次触发某个数据的 setter 方法后，对应的 `Watcher` 对象其实会被 `push` 进一个队列 `queue` 中，在下一个 `tick` 的时候将这个队列 `queue` 全部拿出来 `run`（ `Watcher` 对象的一个方法，用来触发 `patch` 操作） 一遍。  简单来说就是如果我们一直修改相同数据，异步操作队列还会进行去重，等待同一事件循环中的所有数据变化完成之后，会将队列中的事件拿来进行处理，进行`DOM`的更新。

如果没有 `nextTick` 更新机制，那么 `number` 每次更新值都会触发视图更新(上面这段代码也就是会更新1000次视图)，有了`nextTick`机制，只需要更新一次，所以`nextTick`本质是一种优化策略。

## 使用场景

如果想要在修改数据后立刻得到更新后的`DOM`结构，可以使用`Vue.nextTick()`

第一个参数为：回调函数（可以获取最近的`DOM`结构）

第二个参数为：执行函数上下文

```javascript
// 修改数据
vm.message = '修改后的值'
// DOM 还没有更新
console.log(vm.$el.textContent) // 原始的值
Vue.nextTick(function () {
  // DOM 更新了
  console.log(vm.$el.textContent) // 修改后的值
})
```

组件内使用 `vm.$nextTick()` 实例方法只需要通过`this.$nextTick()`，并且回调函数中的 `this` 将自动绑定到当前的 `Vue` 实例上

```javascript
this.message = '修改后的值'
console.log(this.$el.textContent) // => '原始的值'
this.$nextTick(function () {
    console.log(this.$el.textContent) // => '修改后的值'
})
```

`$nextTick()` 会返回一个 `Promise` 对象，可以是用`async/await`完成相同作用的事情

```javascript
this.message = '修改后的值'
console.log(this.$el.textContent) // => '原始的值'
await this.$nextTick()
console.log(this.$el.textContent) // => '修改后的值'
```

## 实现原理

`Vue` 源码中分别使用了`Promise`、`setTimeout`、`setImmediate`等方式在`microtask`（或者task）中创建一个时间，目的在于当前调用栈执行完毕后（不一定是立即）才会执行这个事件。

所以这里用`setTimeout`来模拟简单模拟`NextTick`方法。

首先定义一个`callbacks`数组来储存`nextTick`，在下一个tick处理这些回调函数之前，所有的`cb`都会被储存在这个`callbacks`数组中。pending是用来标识同一个时间方法只能执行一次。

```javascript
let callbacks = [];
let pending = false;
function nextTick(cb) {
    callbacks.push(cb);

    if (!pending) {
        pending = true;
        setTimeout(flushCallbacks, 0)
    }
}
```

`setTimeout`会在task中创建一个事件`flushCallbacks`，`flushCallbacks`则会在执行时将`callbacks`中的`cb`依次执行。

```javascript
function flushCallbacks() {
    pending = false;
    const copies = callbacks.slice(0);
    callbacks.length = 0;
    for (let i = 0; i < copies.length; i++) {
        copies[i]();
    }
}
```

简单实现`Watcher`，给每一个`Watcher`加一个id作为唯一标识，实现`update`方法，在修改数据后由`Dep`来调用，而run方法才是真正促发`patch`更新视图的方法。

```javascript
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
```

`Watcher`对象把自己传递给`queueWatcher`方法，创建一个叫做has的map，里面存放 id --> true(false)的形式来判断是否已经存在相同的`Watcher`对象。

如果队列`queue`中，没有这个`Watcher`对象，则会把该对象添加到`queue`队列中。`waiting`是一个标记位，标记是否已经向`nextTick`传递了`flushSchedulerQueue`方法

```javascript
let has = {};
let queue = [];
let waiting = false;

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
```
在下一个tick的时候执行`flushSchedulerQueue`方法来遍历队列`queue`，依次执行里面`Watcher`对象的`run`方法
```javascript
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
```

下面是执行更新

```javascript
let watch1 = new Watcher();
let watch2 = new Watcher();

watch1.update();
watch1.update();
watch1.update();
watch2.update();
```

通过运行结果可以看到，`watch1.update`执行了三次但是`watch1`的视图只进行了一次刷新，这样就达到了我们预期的效果

```
watch 1 update                                                                 watch 1 update                                                                 watch 1 update                                                                 watch 2 update                                                                 watch 1 视图更新                                                                 watch 2 视图更新 
```

`nextTick`小结：

- 把回调函数放入`callbacks`等待执行
- 将执行函数刚到异步任务中
- 事件循环到异步任务，执行函数依次执行`cb`回调函数