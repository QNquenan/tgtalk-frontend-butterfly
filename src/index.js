import Handlebars from "handlebars";
// import mediumZoom from "medium-zoom";  // 这是一个注释掉的导入语句
import "whatwg-fetch";  // 导入 fetch 函数的 polyfill

import * as helpers from "./shared/helpers";  // 导入自定义的辅助函数模块

import "./styles/index.css";  // 导入样式表
import "./styles/important.css";  // 导入样式表

// 注册所有辅助函数到 Handlebars
Object.keys(helpers).forEach((helperName) => {
  Handlebars.registerHelper(helperName, helpers[helperName]);
});

let templateSource = ``;  // 初始化模板源码
let startBeforeGlobal = 0;  // 初始化起始位置参数

// 处理数据加载和渲染逻辑
function loadDataAndRender(
  apiEndpoint,
  startBefore,
  refContainer,
  templateSource
) {
  fetch(apiEndpoint)  // 发起 HTTP 请求
    .then((response) => response.json())  // 解析 JSON 响应
    .then((data) => {
      // 将消息数据反转
      const reversedData = reverseChannelMessageData(data.ChannelMessageData);
      data.ChannelMessageData = reversedData;
      console.log(data);  // 输出数据到控制台
      const template = Handlebars.compile(templateSource);  // 编译 Handlebars 模板
      const html = template(data);  // 渲染数据到 HTML 字符串
      refContainer.innerHTML = "";  // 清空容器元素
      refContainer.insertAdjacentHTML("beforeend", html);  // 将 HTML 字符串插入到容器元素中
      // 添加“加载更多”按钮的事件监听器
      document
        .getElementById("load-more")
        .addEventListener("click", () => loadMore(apiEndpoint, refContainer));
      document.getElementById("load-more").style.display = "";  // 显示“加载更多”按钮
      if (data.nextBefore === 0) {  // 如果没有更多数据可加载
        const loadMoreButton = document.getElementById("load-more");
        loadMoreButton.remove();  // 移除“加载更多”按钮
      } else {  // 否则更新起始位置参数
        startBeforeGlobal = data.nextBefore;
        console.log(startBeforeGlobal);  // 输出新的起始位置参数到控制台
      }
    })
    .catch((error) => {  // 处理错误
      console.log(error);  // 输出错误到控制台
      refContainer.innerText = "我们遇到了一些错误，你可以刷新页面重试";  // 在容器元素中显示错误消息
    });
}

// 反转消息数据
function reverseChannelMessageData(data) {
  const keys = Object.keys(data);  // 获取数据对象的所有键
  const reversedKeys = keys.reverse();  // 反转键的顺序
  const reversedData = reversedKeys.map((key) => {
    const itemData = data[key];  // 获取每个键对应的数据项
    itemData.originalKey = key;  // 在数据项中添加原始键的属性
    return itemData;  // 返回修改后的数据项
  });
  return reversedData;  // 返回反转后的数据数组
}

// 检查 JSON 数据是否为空
function isEmptyObject(apiEndpoint, nextBefore) {
  return fetch(`${apiEndpoint}?startbefore=${nextBefore}`)  // 发起 HTTP 请求
    .then((response) => response.json())  // 解析 JSON 响应
    .then((data) => {
      return Object.keys(data.ChannelMessageData).length === 0;  // 判断数据对象是否为空
    })
    .catch((error) => {  // 处理错误
      console.error("There has been a problem with your fetch operation:", error);  // 输出错误到控制台
      return false;  // 返回 false
    });
}

// 处理“加载更多”的逻辑
function loadMore(apiEndpoint, refContainer) {
  const loadMoreButton = document.getElementById("load-more");
  loadMoreButton.disabled = true;  // 禁用“加载更多”按钮

  fetch(`${apiEndpoint}?startbefore=${startBeforeGlobal}`)  // 发起 HTTP 请求
    .then((response) => response.json())  // 解析 JSON 响应
    .then((data) => {
      const reversedData = reverseChannelMessageData(data.ChannelMessageData);  // 反转消息数据
      data.ChannelMessageData = reversedData;
      const template = Handlebars.compile(templateSource);  // 编译 Handlebars 模板
      const html = template(data);  // 渲染数据到 HTML 字符串
      refContainer.insertAdjacentHTML("beforeend", html);  // 将 HTML 字符串插入到容器元素中
      console.log(isEmptyObject(apiEndpoint, data.nextBefore));  // 输出数据是否为空到控制台
      isEmptyObject(apiEndpoint, data.nextBefore).then((isEmpty) => {
        if (isEmpty) {
          loadMoreButton.remove();  // 移除“加载更多”按钮
        } else {
          startBeforeGlobal = data.nextBefore;  // 更新起始位置参数
          console.log(startBeforeGlobal);  // 输出新的起始位置参数到控制台
        }
      });
      loadMoreButton.disabled = false;  // 启用“加载更多”按钮
    })
    .catch((error) => {  // 处理错误
      console.error(error);  // 输出错误到控制台
      refContainer.innerHTML = "我们遇到了一些错误，你可以刷新页面重试";  // 在容器元素中显示错误消息
    });
}

// 当 DOMContentLoaded 事件触发时执行以下代码
document.addEventListener("DOMContentLoaded", () => {
  const G_CONFIG = window.G_CONFIG || {};  // 从全局对象获取配置参数

  const apiEndpoint = G_CONFIG.api || "";  // 获取 API 端点
  const refContainer = document.getElementById(G_CONFIG.ref);  // 获取渲染容器元素
  if (G_CONFIG.template === "custom") {  // 如果使用自定义模板
    try {
      templateSource = document.getElementById("template").innerHTML;  // 获取自定义模板源码
    } catch (err) {
      document.getElementById("load-more").remove();  // 移除“加载更多”按钮
    }
  } else {  // 否则使用默认模板
    templateSource = getDefaultTemplate();  // 获取默认模板源码
  }
  // 加载数据并渲染页面
  loadDataAndRender(
    apiEndpoint,
    startBeforeGlobal,
    refContainer,
    templateSource
  );
});

// 获取默认的 Handlebars 模板源码
function getDefaultTemplate() {
  return `
    <div class="content-container">
    {{#each ChannelMessageData}} {{#if (not (contains text "Channel"))}}
    <div class="message">
      <div class="info-header"><p class="Tag"><span class="pageTag"><a class="point">#{{ originalKey }}</a></span> <span class="views">Views: {{views}}</span></p></div>
      <p class="text">{{{compoundRender text}}}</p>
      {{#if image}}
        <div class="imgList">
          {{#each image}} {{#unless (contains this "emoji")}}
            <div class="image">
              <img
                src="{{ replaceImage this}}"
                loading="lazy"
                alt="这是一张图片"
                data-fancybox="gallery"
              />
            </div>
          {{/unless}} {{/each}}
        </div>
      {{/if}}
      <span class="time"><span class="time-in">{{replaceTime time}}</span></span>
      {{tagChina text true}}
    </div>
    {{/if}} {{/each}}
  </div>
  `;
}