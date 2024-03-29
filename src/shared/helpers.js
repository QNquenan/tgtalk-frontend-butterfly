// 导入 Handlebars 模块和 marked 模块
import Handlebars from "handlebars";
import { marked } from "marked";

// 从文本中提取标签
export function tagExtractor(text) {
  const regex = /<a[^>]*>#(.*?)<\/a>/g;
  const result = [];
  let match;
  while ((match = regex.exec(text))) {
    result.push(match[1]);
  }
  return result;
}

// 将标签转换为安全的字符串
export function tagConverter(text) {
  const regex = /<a[^>]*>#(.*?)<\/a>/g;
  const result = text.replace(regex, "");
  return new Handlebars.SafeString(result);
}

// 标签渲染函数，将标签转换为 HTML 元素
export function tagChina(text, renderTagList) {
  const tags = tagExtractor(text);
  let result = "";
  if (renderTagList && tags.length > 0) {
    result += `<div class="tagList">`; // 添加 div 元素
    for (let tag of tags) {
      if (tag === "SFCN") {
        result += ``;
      } else {
        result += `<span class="tags">#${tag}</span>`;
      }
    }
    result += `</div>`; // 添加 div 元素
  }
  return new Handlebars.SafeString(result);
}

// 判断字符串是否包含子串
export function contains(str, sub) {
  return str.includes(sub);
}

// 对值进行取反操作
export function not(value) {
  return !value;
}

// 替换图片链接
export function replaceImage(originalLink) {
  const apiUrl = window.G_CONFIG.api.endsWith("/")
    ? window.G_CONFIG.api
    : window.G_CONFIG.api + "/";
  var newLink = apiUrl + `?proxy=${originalLink}`;
  return newLink;
}

// 替换时间戳为本地时间格式
export function replaceTime(timestamp) {
  return new Date(timestamp).toLocaleString("zh-CN");
}

// 对文本进行渲染，处理插件
export function maskRender(text) {
  text = tagConverter(text);
  if (text instanceof Handlebars.SafeString) {
    text = text.toString();
  }
  const regex = /<tg-spoiler>(.*?)<\/tg-spoiler>/g;
  const replace = function (match, p1) {
    return `<span class="plugin-heimu" id="heimu"><s>${p1}</s></span>`;
  };
  if (regex.test(text)) {
    return new Handlebars.SafeString(text.replace(regex, replace));
  } else {
    return new Handlebars.SafeString(text);
  }
}

// 将锚点链接转换为图片
export function convertAnchorsToImages(html) {
  const htmlImageRegex = /(?:<br\/>)*<a href="([^"]+)"[^>]*>\1<\/a>/g;
  return html.replace(htmlImageRegex, (match, href) => `![](${href})`);
}

// 自定义的 marked 渲染器，用于处理图片
const renderer = new marked.Renderer();
renderer.image = function (href, title, text) {
  const imageClass = "image";
  return `<img src="${href}" alt="${text}" class="${imageClass}"${title ? ` title="${title}"` : ""
    }>`;
};

// 渲染 Markdown 文本
export function mkRender(text) {
  const markdown = convertAnchorsToImages(text);
  return marked(markdown, { renderer });
}

// 综合渲染函数，处理多种渲染需求
export function compoundRender(text) {
  var result = maskRender(text);
  // 转义HTML实体
  result = String(result)
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#33;/g, "!");
  var target = mkRender(result);
  // 替换 markdown 图片链接为包裹 div 的方式
  target = target.replace(
    /<img src="!\[\]\((.*?)\)" alt="(.*?)" class="image">/g,
    '<div class="image"><img src="$1" alt="$2" data-fancybox="gallery"></div>'
  );
  return target;
}