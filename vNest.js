import "https://cdn.jsdelivr.net/npm/markdown-it@14.1.0/dist/markdown-it.min.js";
const md = markdownit();

function setUpStyles() {
  let sheet = document.styleSheets[0];
  if (!sheet) {
    const style = document.createElement("style");
    document.head.appendChild(style);
    sheet = style.sheet;
  }
  return sheet;
}

function getRule(selector) {
  const sheet = setUpStyles();
  for (let i = 0; i < sheet.cssRules.length; i++) {
    if (sheet.cssRules[i].selectorText === selector) {
      return sheet.cssRules[i];
    }
  }
  sheet.insertRule(`${selector} {}`, sheet.cssRules.length);
  return sheet.cssRules[sheet.cssRules.length - 1];
}

function updateProps(dom, newProps = {}, oldProps = {}) {
  for (const key in newProps) {
    if (key === "textContent") {
      const newHTML = md.render(newProps[key]);
      if (dom.innerHTML !== newHTML) dom.innerHTML = newHTML;
    } else if (key === "className") {
      if (dom.className !== newProps[key]) dom.className = newProps[key];
    } else if (key === "clickAction") {
      if (oldProps[key]) dom.removeEventListener("click", oldProps[key]);
      dom.addEventListener("click", newProps[key]);
    } else if (key === "style") {
      for (const styleKey in newProps.style) {
        dom.style[styleKey] = newProps.style[styleKey];
      }
    } else {
      dom.setAttribute(key, newProps[key]);
    }
  }
  for (const key in oldProps) {
    if (!(key in newProps)) {
      if (key === "className") dom.className = "";
      else if (key === "clickAction")
        dom.removeEventListener("click", oldProps[key]);
      else if (key === "style") {
        for (const styleKey in oldProps.style) {
          dom.style[styleKey] = "";
        }
      } else {
        dom.removeAttribute(key);
      }
    }
  }
}

function createRealElement(vNode) {
  const el = document.createElement(vNode.element);

  for (const key in vNode.properties) {
    if (key === "className") {
      el.className = vNode.properties[key];
    } else if (key === "textContent") {
      el.innerHTML = md.render(vNode.properties[key]);
    } else if (key === "clickAction") {
      el.addEventListener("click", vNode.properties[key]);
    } else if (key === "style") {
      const styleObj = vNode.properties[key];
      for (const styleKey in styleObj) {
        el.style[styleKey] = styleObj[styleKey];
      }
    } else {
      el.setAttribute(key, vNode.properties[key]);
    }
  }

  if (vNode.children) {
    vNode.children.forEach((child) => {
      el.appendChild(createRealElement(child));
    });
  }

  return el;
}

function updateElement(parent, newVNode, oldVNode, index = 0) {
  const existingDom = parent.childNodes[index];
  if (!oldVNode) {
    parent.appendChild(createRealElement(newVNode));
    return;
  }
  if (!newVNode) {
    parent.removeChild(existingDom);
    return;
  }
  if (newVNode.element !== oldVNode.element) {
    parent.replaceChild(createRealElement(newVNode), existingDom);
    return;
  }
  updateProps(existingDom, newVNode.properties, oldVNode.properties);
  const newLength = newVNode.children ? newVNode.children.length : 0;
  const oldLength = oldVNode.children ? oldVNode.children.length : 0;
  const max = Math.max(newLength, oldLength);

  for (let i = 0; i < max; i++) {
    updateElement(existingDom, newVNode.children[i], oldVNode.children[i], i);
  }
}

const vNest = {
  createPage() {
    const page = document.createElement("div");
    page.className = "vNestPage";

    let oldVDOM = null;

    function render(newVDOM) {
      if (!oldVDOM) {
        page.appendChild(createRealElement(newVDOM));
      } else {
        updateElement(page, newVDOM, oldVDOM);
      }
      oldVDOM = newVDOM;
    }

    const newVDOM = [];

    return {
      page,
      createElement(element, properties = {}, children = []) {
        const vNode = {
          element,
          properties,
          children,
        };
        newVDOM.push(vNode);

        const i = newVDOM.length - 1;
        const existingDOMNode = page.childNodes[i];

        if (!existingDOMNode) {
          page.appendChild(createRealElement(vNode));
        } else if (existingDOMNode.tagName.toLowerCase() !== vNode.element) {
          page.replaceChild(createRealElement(vNode), existingDOMNode);
        } else {
          if (vNode.properties.textContent) {
            const newHTML = md.render(vNode.properties.textContent);
            if (existingDOMNode.innerHTML !== newHTML) {
              existingDOMNode.innerHTML = newHTML;
            }
          }
        }
        oldVDOM = [...newVDOM];
        return page.childNodes[i];
      },
      modifyProperty(id, property = {}) {
        let element = document.getElementById(id);
        if (!element) return;
        for (let key in property) {
          if (property[key] === null || property[key] === undefined) {
            element[key] = "";
          } else {
            element[key] = property[key];
          }
        }
      },
      idStyle(id, style = {}) {
        let element = document.getElementById(id);
        if (!element) return;
        for (let key in style) {
          if (style[key] === null || style[key] === undefined) {
            element.style[key] = "";
          } else {
            element.style[key] = style[key];
          }
        }
      },
      classStyle(className, style = {}) {
        let rule = getRule(`.${className}`);
        for (let key in style) {
          if (style[key] === null || style[key] === undefined) {
            rule.style[key] = "";
          } else {
            rule.style[key] = style[key];
          }
        }
      },
      pageStyle(style = {}) {
        let rule = getRule(`.vNestPage`);
        for (let key in style) {
          if (style[key] === null || style[key] === undefined) {
            rule.style[key] = "";
          } else {
            rule.style[key] = style[key];
          }
        }
      },
      customStyle(custom, style = {}) {
        let rule = getRule(custom);
        for (let key in style) {
          if (style[key] === null || style[key] === undefined) {
            rule.style[key] = "";
          } else {
            rule.style[key] = style[key];
          }
        }
      },
      docStyle(style = {}) {
        let rule = getRule("body");
        for (let key in style) {
          if (style[key] === null || style[key] === undefined) {
            rule.style[key] = "";
          } else {
            rule.style[key] = style[key];
          }
        }
      },
      modifyHead(properties = {}) {
        if (!document.head) {
          const head = document.createElement("head");
          const body = document.body;
          if (body) {
            document.documentElement.insertBefore(head, body);
          } else {
            document.documentElement.appendChild(head);
          }
        }

        if ("title" in properties) {
          document.title = properties.title || "";
        }

        if (Array.isArray(properties.meta)) {
          properties.meta.forEach(
            ({ name, content, property, charset, httpEquiv }) => {
              let selector = "";
              if (name) selector = `meta[name="${name}"]`;
              else if (property) selector = `meta[property="${property}"]`;
              else if (charset) selector = `meta[charset]`;
              else if (httpEquiv) selector = `meta[http-equiv="${httpEquiv}"]`;

              let meta = selector
                ? document.head.querySelector(selector)
                : null;

              if (!meta) {
                meta = document.createElement("meta");
                document.head.appendChild(meta);
              }

              if (name) meta.setAttribute("name", name);
              if (property) meta.setAttribute("property", property);
              if (charset) meta.setAttribute("charset", charset);
              if (httpEquiv) meta.setAttribute("http-equiv", httpEquiv);
              meta.setAttribute("content", content || "");
            },
          );
        }

        if (Array.isArray(properties.link)) {
          properties.link.forEach((attrs) => {
            const link = document.createElement("link");
            Object.entries(attrs).forEach(([k, v]) => {
              if (v !== null && v !== undefined) link.setAttribute(k, v);
            });
            document.head.appendChild(link);
          });
        }

        if (Array.isArray(properties.script)) {
          properties.script.forEach((attrs) => {
            const script = document.createElement("script");
            Object.entries(attrs).forEach(([k, v]) => {
              if (v !== null && v !== undefined) script.setAttribute(k, v);
            });
            document.head.appendChild(script);
          });
        }

        Object.entries(properties).forEach(([key, val]) => {
          if (
            key === "title" ||
            key === "meta" ||
            key === "link" ||
            key === "script"
          )
            return;
          if (val === null || val === undefined) {
            document.documentElement.removeAttribute(key);
          } else {
            document.documentElement.setAttribute(key, val);
          }
        });
      },
    };
  },
};

export default vNest;