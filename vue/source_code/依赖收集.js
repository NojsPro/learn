
let globalObj = {
    text1: 'text1'
};

class Dep {
    constructor (){
        // 用来存放Watcher对象的数组
        this.subs = [];
    }
    // 再subs中添加一个Watcher对象
    addSub (sub){
        this.subs.push(sub);
    }
    // 通知所有Watcher对象更新视图
    notify () {
        console.log("通知")
        this.subs.forEach(sub => {
            sub.update();
        })
    }
}

class Watcher {
    constructor () {
        // 在new一个watcher对象时将该对象赋值给Dep.target，在get中会用到
        Dep.target = this;
    }
    // 更新视图
    update () {
        console.log("watcher 视图更新");
    }
}

Dep.target = null;

function cb(val){
    console.log("更新视图");
}

function defineReactive (obj, key, val) {
    // Dep类对象
    const dep = new Dep();

    Object.defineProperty(obj, key, {
        enumerable: true, /* 属性可以枚举 */
        configurable: true, /* 属性可以被修改或者删除 */
        get: function reactiveGetter () {/* 收集依赖 */
            dep.addSub(Dep.target);
            return val; 
        },
        set: function reactiveSetter (newVal) {
            console.log("设置新的值", newVal, val)
            if(newVal === val) return;
            // cb(newVal);
            val = newVal;
            dep.notify();
        }
    })
}

function observer (value) {
    if (!value || (typeof value !== 'object')){
        return;
    }

    Object.keys(value).forEach(key => {
        defineReactive(value, key, value[key]);
    })
}

class Vue {
    constructor(options) {
        this._data = options.data;
        observer(this._data);
        // 新建一个Watcher观察者对象，这时候Dep.target会指向这个Watcher对象
        new Watcher();
        // 模拟render的过程，为了触发test属性的get函数
        console.log('reader~', this._data.test)
    }
}

let o = new Vue({
    data: {
        test: "I am test.",
        check: null
    }
})

/* let o1 = new Vue({
    template: 
        `<div>
            <span>{{text1}}</span>
        </div>`,
    data: globalObj
})
let o2 = new Vue({
    template: 
        `<div>
            <span>{{text1}}</span>
        </div>`,
    data: globalObj
}) */


o._data.test = "hello world";
o._data.check = "js";

console.log(o._data.test, o)