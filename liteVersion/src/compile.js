class Compile {
  constructor(el, vm){
    this.$vm = vm;
    this.$el = this.isElementNode(el) ? el : document.querySelector(el);

    if(this.$el) {
      this.$fragment = this.node2Fragment(this.$el);
      this.init();
      this.$el.appendChild(this.$fragment);
    }
  }

  node2Fragment(el){
    const fragment = document.createDocumentFragment();
    let child;

    // 将原生节点拷贝到fragment
    while (child = el.firstChild) {
      fragment.appendChild(child);
    }

    return fragment;
  }

  init(){
    this.compileElement(this.$fragment);
  }

  compileElement(el){
    let childNodes = el.childNodes;
    [].slice.call(childNodes).forEach((node)=>{
      const text = node.textContent;
      const reg = /\{\{.*\}\}/;
      if(this.isElementNode(node)){
          this.compileNode(node);
      }else if(this.isTextNode(node) && reg.test(text)){
        this.compileText(node,RegExp.$1);
      }

      if(node.childNodes && node.childNodes.length){
        this.compileElement(node);
      }
    })
  }

  compile(node){
    const nodeAttrs = node.attributes;
    [].slice.call(nodeAttrs).forEach((attr)=>{
      const attrName = attr.name;
      if(this.isDirective(attrName)){
        const exp = attr.value;
        const dir = attrName.subString(2);
        // 事件指令
        if(this.isEventDirective(dir)) {
          compileUtil.eventHandler(node,this.$vm,exp,dir);
        } else {
        // 普通指令
          compileUtil[dir] && compileUtil[dir](node,this.$vm,exp);
        }
        node.removeAttribute(attrName);
      }
    })
  }

  compileText(node,exp) {
    compileUtil.text(node,this.$vm,exp);
  }

  isDirective(attr) {
    return attr.indexOf('v-') === 0;
  }

  isEventDirective(dir){
    return dir.indexOf('on') === 0;
  }

  isElementNode(node) {
    return node.nodeType === 1;
  }

  isTextNode(node) {
    return node.nodeType === 3;
  }

}

const compileUtil = {
  text: function(node,vm,exp){
    this.bind(node,vm,exp,'text');
  },
  html: function(node, vm, exp){
    this.bind(node,vm,exp,'html');
  },
  model: function(node,vm,exp){
    this.bind(node,vm,exp,'model');
    const me = this;
    const val = this._getVMVal(vm, exp);
    node.addEventListener('input',function(e){
      const newValue = e.target.value;
      if(val=== newValue) {
        return;
      }

      me._setVMVal(vm,exp,newValue);
      val = newValue;
    })
  },
  class: function(node,vm,exp){
    this.bind(node,vm,exp,'class');
  },
  bind:function(node,vm,exp,dir){
    const updaterFn = updater[dir + 'Updater'];
    updaterFn && updaterFn(node, this._getVMVal(vm,exp));
    new Watcher(vm, exp, function(value,oldValue){
      updaterFn && updaterFn(node,value,oldValue);
    })
  },
  // 事件处理
  eventHandler: function(node,vm,exp,dir) {
    const eventType = dir.split(':')[1];
    const fn = vm.$options.methods && vm.$options.methods[exp];
    if(eventType && fn) {
      node.addeventListener(eventType, fn.bind(vm), false);
    }
  },

  _getVMVal: function(vm,exp) {
    let val = vm;
    exp = exp.split('.');
    exp.forEach(function(k){
      val = val[k];
    })
    return val;
  },

  _setVMVal: function(vm,exp,value){
    let val = vm;
    exp = exp.split('.');
    exp.forEach(function(k,i){
      // 非最后一个key，更新val的值
      if(i<exp.length-1){
        val = val[k];
      } else {
        val[k] = value
      }      
    })
  },
}

const updater = {
  textUpdater: function(node, value){
      node.textContent = typeof value === 'undefined' ? '' :value;
  },
  htmlUpdater: function(node,value) {
    node.innerHTML = typeof value === 'undefined'? '' : value;
  },
  classUpdater: function(node,value,oldValue) {
    let className = node.className;
    className = className.replace('oldValue','').replace(/\s$/,'');
    const space = className && String(value) ? ' ' : '';
    node.className = className + space + value;
  },
  modelUpdater: function(node,value,oldValue){
    node.value = typeof value === 'undefined' ? '' : value;
  }
}