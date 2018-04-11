class MVVM {
  constructor(options){
    this.$options = options || {};
    const data = this._data = this.$options.data;
    const me = this;

    // 数据代理
    // 实现 vm.xxx -> vm._data.xxx
    Object.keys(data).forEach(function(key){
      me._proxyData(key);
    })

    this._initComputed();

    observe(data,this);

    this.$compile = new Compile(options.el || document.body, this)
  }

  $watch(key,cb,options){
    new Watcher(this,key,cb);
  }

  _proxyData(key,setter,getter){
    let me = this;
    setter = setter || 
    Object.defineProperty(me,key,{
      configurable: false,
      enumerable: true,
      get: function(){
        return me._data[key];
      },
      set: function(newVal){
        me._data[key] = newVal;
      }
    })
  }

  _initComputed(){
    const me = this;
    const computed = this.$options.computed;
    if(typeof computed === 'object'){
      Object.keys(computed).forEach((key)=>{
        Object.defineProperty(me,key,{
          get: function(){
                  if(typeof computed[key] === 'function'){
                    return computed[key].call(me)
                  }else{
                    return computed[key].get.call(me)
                  }
                },
          set: function(){}
        })
      })
    }
  }

}