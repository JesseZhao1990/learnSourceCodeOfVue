class Watcher {
  constructor(vm,expOrFn,cb){
    this.cb = cb;
    this.vm = vm;
    this.expOrFn = expOrFn;
    this.depIds = {};

    if(typeof expOrFn === 'function') {
      this.getter = expOrFn;
    } else {
      this.getter = this.parseGetter(expOrFn);
    }

    this.value = this.get();
  }

  update(){
    this.run();
  }

  run(){
    const value = this.get();
    const oldVal = this.value;
    if(value !== oldVal){
      this.value = value;
      this.cb.call(this.vm,value,oldVal);
    }
  }

  get(){
    Dep.target = this;
    let value = this.getter.call(this.vm, this.vm);
    Dep.target = null;
    return value;
  }

  parseGetter(exp) {
    if(/[^\w.$]/.test(exp)) return;
    let exps = exp.split('.');

    return function(obj) {
      for(let i=0, len = exps.length; i<len; i++) {
        if(!obj) return;
        obj = obj[exps[i]];
      }
      return obj;
    }
  }
  /**
   * 1.每次调用update()的时候会触发相应属性的getter
   * getter里面会触发dep.depend(),继而触发这里的addDep
   * 2.加入相应属性的dep.id已经在当前的watcher的depIds里，说明不是一个新的属性，仅仅是改变了其值而已，
   * 则不需要将当前的watcher添加到该属性的dep里
   * 3.假如相应属性是新的属性，则将当前的watcher添加到新属性的dep里，
   * 如通过vm.child = {name:'a'} 改变了child.name的值，child.name 就是一个新属性
   * 则需要将当前的watcher(child.name)加入到新的child.name的dep里
   * 因为此时child.name是个新值，之前的setter、dep都已经失效，如果不把watcher加入到新的child.name的dep中
   * 则通过child.name ==XXX 赋值的时候，对应的watcher就收不到通知，等于失效了。
   * 4.每个子属性的watcher在添加到子属性的dep的同时，也会添加到父属性的dep
   * 监听子属性的同时监听父属性的变更，这样，父属性改变时，子属性的watcher也能收到通知进行update
   * 这一步是在this.get() ---> this.getVMVal()里面完成，forEach时会从父级开始取值，间接调用了它的getter
   * 触发了addDep(),在整个forEach过程，当前wacher都会加入到每个父级过程属性的dep
   * 例如：当前watcher的是'child.child.name',那么child，child.child, child.child.name这三个属性的dep都会加入当前的watcher
   * @param {*} dep 
   */
  addDep(dep){
    if(!this.depIds.hasOwnProperty(dep.id)){
      dep.addSub(this);
      this.depIds[dep.id] = dep;
    }
  }


}