Component({
  externalClasses: ['custom-class'],
  properties: {
    src: String,
    mode: {
      type: String,
      value: 'aspectFill'
    },
    placeholder: {
      type: String,
      value: '/images/lazy-image.png'
    },
    className: String,
    style: String
  },

  data: {
    showImage: false,
    currentSrc: ''
  },

  lifetimes: {
    attached() {
      this.setData({
        currentSrc: this.data.placeholder
      });
      this.observeVisibility();
    },
    detached() {
      if (this.observer) {
        this.observer.disconnect();
      }
    }
  },

  methods: {
    observeVisibility() {
      let timer = null;
      
      this.observer = this.createIntersectionObserver({
        thresholds: [0],
        observeAll: true,
        nativeMode: true
      });

      this.observer.relativeToViewport({
        top: 0,
        bottom: 400
      }).observe('.lazy-image', (res) => {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => {
          if (res.intersectionRatio > 0) {
            this.setData({ 
              showImage: true,
              currentSrc: this.data.src
            });
            this.observer.disconnect();
            this.observer = null;
          }
        }, 50);
      });
    },

    onImageLoad(e) {
      this.triggerEvent('load', e.detail);
    },

    onImageError(e) {
      console.log('图片加载失败');
      this.setData({
        currentSrc: '/images/error.png'
      });
      this.triggerEvent('error', e.detail);
    }
  }
}); 