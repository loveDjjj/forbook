/* 节流函数封装 */
function throttle(fn, gapTime) {
    if (gapTime == null || gapTime == undefined) {
        gapTime = 1500
    }
    let _lastTime = null
    return function () {
        let _nowTime = +new Date()
        if (_nowTime - _lastTime > gapTime || !_lastTime) {
            fn.apply(this, arguments) //将this和参数传给原函数
            _lastTime = _nowTime
        }
    }
}
/* 防抖函数封装 */
function debounce(fn, interval) {
    let timer;
    let delay = interval || 1000;
    return function () {
        let that = this;
        let args = arguments;
        if (timer) {
            clearTimeout(timer);
        }
        timer = setTimeout(function () {
            fn.apply(that, args);
        }, delay);
    };
}
// 将写好的方法抛出
module.exports = {
    throttle,
    debounce
}
