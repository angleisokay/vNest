import "https://cdn.jsdelivr.net/npm/markdown-it@14.1.0/dist/markdown-it.min.js";
const md = markdownit();

// SIGNALS BABY - reactive juice
function createSignal(init) {
  let val = init;
  const subs = new Set();
  return {
    get() { return val },
    set(v) {
      if (v !== val) {
        val = v;
        subs.forEach(fn => fn(val));
      }
    },
    subscribe(fn) { subs.add(fn); return () => subs.delete(fn) }
  }
}

// BINDING HELPERS for signals
function bindText(node, signal) {
  node.textContent = signal.get();
  signal.subscribe(v => node.textContent = v);
}

function bindMarkdown(node, signal) {
  node.innerHTML = md.render(signal.get());
  signal.subscribe(v => node.innerHTML = md.render(v));
}

// HELPER to set up stylesheets (your OG code vibes)
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

// MAIN vNest factory
const vNest = {
  createPage() {
    const page = document.createElement("div");
    page.className = "vNestPage";

    function createElement(element, properties = {}, children = []) {
      const el = document.createElement(element);

      for (const [key, val] of Object.entries(properties)) {
        if (val && typeof val.get === "function" && typeof val.subscribe === "function") {
          // it’s a signal, bind it!
          if (key === "textContent" || key === "innerHTML") bindMarkdown(el, val);
          else if (key === "style") {
            for (const [styleKey, styleVal] of Object.entries(val)) {
              if (
                styleVal &&
                typeof styleVal.get === "function" &&
                typeof styleVal.subscribe === "function"
              ) {
                el.style[styleKey] = styleVal.get();
                styleVal.subscribe(v => (el.style[styleKey] = v));
              } else {
                el.style[styleKey] = styleVal;
              }
            }
          } else {
            el[key] = val.get();
            val.subscribe(v => (el[key] = v));
          }
        } else if (key === "clickAction") {
          el.addEventListener("click", val);
        } else if (key === "style") {
          Object.assign(el.style, val);
        } else if (key === "className") {
          el.className = val;
        } else {
          el.setAttribute(key, val);
        }
      }

      children.forEach(child => {
        if (typeof child === "string") el.appendChild(document.createTextNode(child));
        else el.appendChild(child);
      });

      return el;
    }

    // Styles stuff from your original API (kept clean)
    function modifyProperty(id, property = {}) {
      const element = document.getElementById(id);
      if (!element) return;
      for (const key in property) {
        element[key] = property[key] ?? "";
      }
    }

    function idStyle(id, style = {}) {
      const element = document.getElementById(id);
      if (!element) return;
      for (const key in style) {
        element.style[key] = style[key] ?? "";
      }
    }

    function classStyle(className, style = {}) {
      const rule = getRule(`.${className}`);
      for (const key in style) {
        rule.style[key] = style[key] ?? "";
      }
    }

    function pageStyle(style = {}) {
      const rule = getRule(`.vNestPage`);
      for (const key in style) {
        rule.style[key] = style[key] ?? "";
      }
    }

    function customStyle(selector, style = {}) {
      const rule = getRule(selector);
      for (const key in style) {
        rule.style[key] = style[key] ?? "";
      }
    }

    function docStyle(style = {}) {
      const rule = getRule("body");
      for (const key in style) {
        rule.style[key] = style[key] ?? "";
      }
    }

    function modifyHead(properties = {}) {
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
        properties.meta.forEach(({ name, content, property, charset, httpEquiv }) => {
          let selector = "";
          if (name) selector = `meta[name="${name}"]`;
          else if (property) selector = `meta[property="${property}"]`;
          else if (charset) selector = `meta[charset]`;
          else if (httpEquiv) selector = `meta[http-equiv="${httpEquiv}"]`;

          let meta = selector ? document.head.querySelector(selector) : null;

          if (!meta) {
            meta = document.createElement("meta");
            document.head.appendChild(meta);
          }

          if (name) meta.setAttribute("name", name);
          if (property) meta.setAttribute("property", property);
          if (charset) meta.setAttribute("charset", charset);
          if (httpEquiv) meta.setAttribute("http-equiv", httpEquiv);
          meta.setAttribute("content", content || "");
        });
      }

      if (Array.isArray(properties.link)) {
        properties.link.forEach(attrs => {
          const link = document.createElement("link");
          Object.entries(attrs).forEach(([k, v]) => {
            if (v != null) link.setAttribute(k, v);
          });
          document.head.appendChild(link);
        });
      }

      if (Array.isArray(properties.script)) {
        properties.script.forEach(attrs => {
          const script = document.createElement("script");
          Object.entries(attrs).forEach(([k, v]) => {
            if (v != null) script.setAttribute(k, v);
          });
          document.head.appendChild(script);
        });
      }

      Object.entries(properties).forEach(([key, val]) => {
        if (["title", "meta", "link", "script"].includes(key)) return;
        if (val == null) document.documentElement.removeAttribute(key);
        else document.documentElement.setAttribute(key, val);
      });
    }

    return {
      page,
      createElement,
      modifyProperty,
      idStyle,
      classStyle,
      pageStyle,
      customStyle,
      docStyle,
      modifyHead,
      createSignal,
    };
  },
};

export default vNest;
