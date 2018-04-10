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
      
    }
  }

}