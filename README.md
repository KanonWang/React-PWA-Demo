- [诞生](#诞生)
- [核心](#核心)
  - [App Shell](#App-Shell)
  - [Service Worker](#Service-Worker)
  - [Notification API](#Notification-API)
  - [Web App Manifest](#Web-App-Manifest)
- [现状](#现状)
  - [小程序](#小程序)
  - [快应用](#快应用)


# 诞生
Native App 作为现在最主流的移动端应用，它的安全、性能、用户体验等，明显领先于其它互联网载体。但 Native App 始终存在一些缺点：
1. 开发成本昂贵，需要支持多个平台
2. 软件上线、版本更新都需要发布到不同商店，并通过审核
3. 即使是使用频率很低的应用，用户仍不得不去应用商店下载庞大的安装包，或者可能一段时间不使用以后，随着版本更新，仍不得不更新并安装

而 Web 的优势在于开放与去中心化。PWA 由此而生。PWA(Progressive Web App) 渐进式增强应用，是在移动端，利用提供的标准化框架，实现和 Native App 相近用户体验的 Web App。

# 核心
将 Web App 通过一系列 Web 技术优化，在保留其灵魂的基础上渐进增强，提升其安全性、性能、用户体验等各个方面，从而达到就像在使用 Native App 一样的感觉。
1. 可靠 - 离线和弱网环境也能瞬间加载并展现。Service Worker 是一个浏览器在后台独立于网页运行的脚本。Service Worker 能够代理请求，操作浏览器缓存。通过将缓存内容直接返回，让请求瞬间完成。开发者可以预存储关键文件，给用户可靠的体验。
2. 体验 - 快速响应，平滑操作。App "shell" 是 App 所需最小资源，包括 UI 的主干和应用起步的核心代码等。如果离线缓存，可确保在用户重复访问时提供即时、可靠的良好性能。
3. 粘性 - 可安装、添加到桌面及发送离线通知，吸引用户回流。Web App Manifest 允许开发者控制 PWA 添加到桌面，允许定制桌面图标、URL 等等。推送通知依赖 Notification API 和 Push API。 Service Worker 的后台计算能力结合 Push API 对推送事件进行响应，并通过 Notification API 实现通知的发出与处理

## App Shell
App Shell 模型是构建PWA的一种方式，它将应用的"shell"和动态内容分离。配合Service Worker离线缓存shell后，在弱网甚至离线环境，仍能给予用户可靠的浏览体验。

App Shell 架构具有相对不变的导航以及一直变化的内容。大量现代 JavaScript 框架和内容库已经鼓励拆分应用逻辑及其内容，从而使这种架构更能直接应用。

## Service Worker
### Web Worker
Js语言采用单线程模型，所有任务都在一个线程上完成，一次只能做一件事。前面的任务没做完，后面的任务只能等着。

Web Worker的作用，就是为Js创造多线程环境，允许主线程创建 worker 线程，将一些任务分配给后者运行。在主线程运行的同时，worker 线程在后台运行，两者互不干扰。等到 worker 线程完成任务，再把结果返回给主线程。这样做的好处是，一些计算密集或者高延迟的任务，交给 worker 线程负担，主线程负责ui交互就会很流畅，不会被阻塞或拖慢。

但 Web Worker 是临时的，每次做的事情的结果还不能被持久存下来，如果下次有同样的复杂操作，还得费时间的重新来一遍。

### Service Worker
Service Worker 在 Web Worker 的基础上加上了持久离线缓存能力。Service Worker 是一直持久存在的，随时准备接受主线程的命令。需要的时候可以直接唤醒，不用的时候自动睡眠。

Service Worker 让缓存做到优雅和极致，使站点可以在离线情况下秒开，极大的提升了用户体验，使 Web App 相对于 Native App 的缺点更加弱化。

#### Service Worker使用需注意：
1. 必须在 HTTPS 环境下才能工作（允许调试时为`localhost`）
2. 同源限制：分配给worker线程运行的脚本文件，必须与主线程的脚本文件同源
2. Dom限制：worker线程所在全局对象，与主线程不一样，无法读取主线程所在网页的dom对象，也无法使用document、window、parent这些对象。但是，可以使用navigator和location对象
3. 通信联系：worker线程和主线程不在同一个上下文环境，它们不能直接通信，必须通过消息完成。worker 线程通过 postMessage 方法告诉主线程，而主线程通过 onMessage 方法得到结果反馈。
4. 异步实现：内部大都是通过 Promise 实现
5. 一旦被 install，就永远存在，除非被手动 unregister 

#### Service Worker 生命周期
Service Worker 的生命周期完全独立于网页。

1. 注册：在主线程中注册位于`/sw.js`的 Service Worker。浏览器会在后台下载所需文件，解析并执行 Service Worker。如果这期间出现任何错误，Service Worker 就不会被安装，下一次会进行重试。
```javascript
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js', {scope: './'}).then(function(registration) {
            // Registration was successful
            console.log('ServiceWorker registration successful with scope: ', registration.scope);
        }, function(err) {
            // registration failed :(
            console.log('ServiceWorker registration failed: ', err);
        });
    });
}
```
如果注册成功，Service Worker 就在`ServiceWorkerGlobalScope`环境中运行，这是一个特殊类型的worker上下文环境。自此，Service Worker 可以处理事件了。

2. 安装：注册成功后，Service Worker 首先会收到安装事件。我们可以打开缓存，缓存文件，确认所需资源是否已经缓存。
```javascript
var CACHE_NAME = 'my-site-cache-v1';
var urlsToCache = [
    '/',
    '/styles/main.css',
    '/script/main.js'
];

self.addEventListener('install', function(event) {
    // Perform install steps
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function(cache) {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});
```
3. 激活：安装成功后，Service Worker 会收到激活事件。一般在此对旧缓存进行清理。
```javascript
self.addEventListener('activate', function(event) {
    // New caches
    var cacheWhitelist = ['pages-cache-v1', 'blog-posts-cache-v1'];
    //Delete old caches 
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.map(function(cacheName) {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
```

4. 重新加载`redundant`：Service Worker 现在可以对其作用域内所有页面进行控制，但仅注册成功后的打开的页面。也就是说，页面起始于有没有 Service Worker，且在页面的接下来生命周期内维持这个状态。所以，页面不得不重新加载以让 Service Worker 获得完全的控制。

#### Service Worker浏览器支持：
[Can I use service worker?](https://caniuse.com/#search=service%20worker)

### Workbox
Google Chrome 团队推出的一套 Web App 静态资源和请求结果的本地存储的解决方案，包含一些 Js 库和构建工具。

#### workbox-webpack-plugin 插件

## Notification API
Notifications API 是用来向用户展示通知消息的接口，需要获取用户同意，即使Web App并没有在浏览器打开。

### Service Worker给用户推送通知的🌰
```javascript
window.addEventListener('load', () => {
    if (!('PushManager' in window)) {
        // Push isn't supported on this browser, disable or hide UI.
        return;
    }

    let promiseChain = new Promise((resolve, reject) => {
        // Requests permission from the user to display notifications.
        const permissionPromise = Notification.requestPermission(result => {
            resolve(result);
        });

        if (permissionPromise) {
            permissionPromise.then(resolve);
        }
    })
    .then(result => {
        if (result === 'granted') {
            execute();
        }
        else {
            console.log('no permission');
        }
    });
});
```
注册位于`/sw.js`的 Service Worker
```javascript
function registerServiceWorker() {
    return navigator.serviceWorker.register('/sw.js')
    .then(registration => {
        console.log('Service worker successfully registered.');
        return registration;
    })
    .catch(err => {
        console.error('Unable to register service worker.', err);
    });
}

```
使用 `showNotification` 方法弹出通知。
```javascript
function execute() {
    registerServiceWorker().then(registration => {
        registration.showNotification('Hello World!');
    });
}
```

### Notifications浏览器支持：
[Can I use notifications?](https://caniuse.com/#search=notifications)

## Web App Manifest
当前 manifest.json 的标准仍属于草案阶段，Chrome 和 Firefox 已经实现了这个功能，微软正努力在 Edge 浏览器上实现，Apple 目前仍在考虑中。manifest.json 目前仍属于实验性技术，所以其部分属性和功能在未来有可能会发生改变。

### 使用
为了实现 PWA 应用添加至桌面的功能，除了要求站点支持 HTTPS 之外，还需要准备 manifest.json 文件去配置应用的图标、名称等信息。举个例子：
```json
{
    "short_name": "短名称",
    "name": "这是一个完整名称",
    "icon": [
        {
            "src": "icon.png",
            "type": "image/png",
            "sizes": "48x48"
        }
    ],
    "start_url": "index.html"
}
```
使用 `link` 标签将 manifest.json 部署到 PWA 站点 HTML 页面的头部：
```html
<link rel="manifest" href="path-to-manifest/manifest.json">
```

### manifest浏览器支持：
[Can I use manifest?](https://caniuse.com/#search=manifest)


# 现状
国内推广困难重重。苹果对 PWA 的支持力度远远低于安卓。PWA 在弱网环境下才更能体现优势，然而国内的网络环境非常不错。Chrome 浏览器在国内移动端占有率非常差。国内各大互联网公司各种黑科技大行其道。

### 小程序
### 快应用


## 参考资料

1. [LAVAS PWA文档](https://lavas.baidu.com/pwa)
2. [下一代 Web 应用模型 — Progressive Web App](https://zhuanlan.zhihu.com/p/25167289)
3. [Service Workers: an Introduction](https://developers.google.com/web/fundamentals/primers/service-workers?hl=zh-CN)
4. [使用 Service Workers](https://developer.mozilla.org/zh-CN/docs/Web/API/Service_Worker_API/Using_Service_Workers)
5. [What’s new on iOS 12.2 for Progressive Web Apps](https://medium.com/@firt/whats-new-on-ios-12-2-for-progressive-web-apps-75c348f8e945)
6. [Notifications API](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API)
7. [Displaying a Notification](https://developers.google.com/web/fundamentals/push-notifications/display-a-notification)
8. [Workbox guides](https://developers.google.com/web/tools/workbox/guides/get-started)
9. [Webpack - Progressive Web Application](https://webpack.js.org/guides/progressive-web-application/#root)
10. [Get Started With Workbox For Webpack](https://developers.google.com/web/tools/workbox/guides/codelabs/webpack)
