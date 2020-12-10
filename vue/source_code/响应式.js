
function cb(val){
    console.log("更新视图");
}

function defineReactive (obj, key, val) {
    Object.defineProperty(obj, key, {
        enumerable: true, /* 属性可以枚举 */
        configurable: true, /* 属性可以被修改或者删除 */
        get: function reactiveGetter () {/* 收集依赖 */
            return val; 
        },
        set: function reactiveSetter (newVal) {
            if(newVal === val) return;
            cb(newVal);
            val = newVal;
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
        observer(this._data)
    }
}

let o = new Vue({
    data: {
        test: "I am test."
    }
})

o._data.test = "hello world";
o._data.test = "hello world";
o._data.test = "hello worlds";

console.log(o._data.test, o)