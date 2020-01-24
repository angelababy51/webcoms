//================================================================================//
// 模仿jquery的封装库.由于jsAPI大多比较长,为了简洁封装一些常用的js函数.如dom操作,数组操作等等
// 主要定义函数 "jslib" ,window上的引用名字 "lib"
// jslib是一个类数组对象,用function定义的,和jquery类似,方法名也大多数使用jquery的方法名.
// 使用方法如: lib('#id').addClass('acitve')
//=================================================================================//
// 
((win) => {
    "use strict";
    /**
     * js自定义封装库的定义函数.(下述都称为jslib类数组对象,简称jslib)
     * @param {string|HTMLElement} selector 选择器或者dom对象或/^<[a-z]+?>$/,如'<div>'.表示新建元素.
     * @returns {jslib} 返回this
     */
    function jslib(selector) {
        // 选择器
        if (typeof selector === 'string') {
            if (/^<[a-z]+?>$/.test(selector)) {
                // 新建元素
                this.push(document.createElement(selector.substring(1, selector.length - 1)));
            }
            else {
                // 其它选择器
                let nodelist = document.querySelectorAll(selector);
                nodelist.forEach((item) => {
                    this.push(item);
                });
            }
        }
        else if (selector.nodeType) {
            // 是一个dom对象
            this.push(selector);
        }
        else if (selector.length) {
            // 是一个dom对象列表
            for (var i = 0, len = selector.length; i < len; i++) {
                if (selector[i].nodeType) {
                    this.push(selector[i]);
                }
            }
        } else {
            throw new Error("the selector invalid");
        }
        return this;
    }
    /**
     * 向jslib类数组添加元素
     * @param {any} item node节点
     * @returns {jslib} 返回this
     */
    jslib.prototype.push = function (item) {
        Array.prototype.push.call(this, item);
        return this;
    };
    /**
     * 清空jslib类数组
     * @returns {jslib} 返回this
     */
    jslib.prototype.reset = function () {
        Array.prototype.splice.call(this, 0);
        return this;
    };
    /**
     * 遍历jslib类数组元素.如果dom元素无效,不会执行函数
     * @param {Function} fn fn(item,index),fn返回false时,循环break,返回true时,循环continue
     */
    jslib.prototype.each = function (fn) {
        for (let i = 0, len = this.length; i < len; i++) {
            if (!this[i]) continue;
            let re = fn(this[i], i);
            if (re == true)
                continue;
            else if (re == false)
                break;
        }
    };

    ////////////////////////////////////////////////////////////////////////
    // 工厂函数factory,返回jslib对象
    // 其它静态方法都绑定在factory上
    ////////////////////////////////////////////////////////////////////////
    let factory = (selector) => {
        return new jslib(selector);
    };
    /**
     * 为jslib对象添加实例方法 prototype
     * @param {any} json 一个方法名和函数值的json对像.方法名要用""号包起来.
     */
    factory.extend = (json) => {
        for (var name in json) {
            jslib.prototype[name] = json[name];
        }
    };
    /**
     * 建立一个DocumentFragment文档片段对象,将传入的node或DocumentFragment()对象添加到其中.
     * @param {any[]} content node节点 | DOMString对象 | DocumentFragment对象
     * @returns {DocumentFragment} 返回这个DocumentFragment对象
     */
    factory.fragment = (...content) => {
        let fragm = document.createDocumentFragment();
        for (var i = 0, len = content.length; i < len; i++) {
            fragm.append(content[i]);
        }
        return fragm;
    };

// 实例方法
factory.extend({
    /**
     * 以已经匹配的元素为根,查找子元素.(原生: dom.querySelectorAll())
     * @param {string} selector css选择器.如果选择器错误,会报异常.
     * @returns {jslib} 返回this
     */
    'find': function (selector) {
        let tmplist = [];
        this.each((item) => {
            let nodelist = item.querySelectorAll(selector);
            nodelist.forEach((finditem) => {
                tmplist.push(finditem);
            });
        });
        // 重置已选元素
        this.reset();
        tmplist.forEach((item) => {
            this.push(item);
        });
        return this;
    },
    /**
     * 筛选取匹配元素的第n个元素(模拟jquery的eq()筛选方法)
     * @param {number} index 下标
     * @returns {jslib} 返回this
     */
    'eq': function (index) {
        this[0] = this[index];
        Array.prototype.splice.call(this, 1);
        return this;
    },
    /**
     * 设置每个匹配元素的属性或返回第一个元素的属性值.(原生: getAttribute(),setAttribute())
     * @param {string|object} key 属性名或属性名~值对的json对象
     * @param {string} val 属性值
     * @returns {jslib} 取属性时返回属性值.否则返回this
     */
    'prop': function (key, val) {
        if (typeof key === 'string') {
            // 获取第0个
            if (val === undefined) {
                if (!this[0]) return;
                return this[0].getAttribute(key);
            }
            // 设置单个
            this.each((dom) => {
                if (this[0]);
                dom.setAttribute(key, val);
            });
        } else if (typeof key === 'object') {
            // 设置多个
            this.each((dom) => {
                for (var k in key) {
                    dom.setAttribute(k, key[k]);
                }
            });
        }
        return this;
    },
    /**
     * 删除每个匹配的元素指定的属性
     * @param {string[]} key 属性名,一个或多个
     * @returns {jslib} return this
     */
    'removeProp': function (...key) {
        this.each((dom) => {
            for (var i = 0, len = key.length; i < len; i++) {
                dom.removeAttribute(key[i]);
            }
        });
        return this;
    },
    /**
     * 为每个匹配的元素添加指定的类名.(原生: classList.add())
     * @param {string[]} val 样式类名字,不定个数参数
     * @returns {jslib} return this
     */
    'addClass': function (...val) {
        let tmp = [];
        val.forEach((item) => {
            if (item)
                tmp.push(item);
        });
        this.each((item) => {
            item.classList.add(...tmp);
        });
        return this;
    },
    /**
     * 从所有匹配的元素中删除全部或者指定的类.(原生: classList.remove())
     * @param {string[]} val 样式类名字,不定个数参数.如果不传,删除所有样式
     * @returns {jslib} 返回this
     */
    'removeClass': function (...val) {
        if (val.length === 0) {
            this.each((item) => {
                item.setAttribute('class', '');
            });
        }
        let tmp = [];
        val.forEach((item) => {
            if (item)
                tmp.push(item);
        });
        this.each((item) => {
            item.classList.remove(...tmp);
        });
        return this;
    },
    /**
     * 检查第一个匹配的元素是否含有指定的类(原生: classList.contains)
     * @param {string} val  样式类名字
     * @returns {boolean} 第一个匹配含有类时返回true,其它情况返回false
     */
    'hasClass': function (val) {
        if (this.length > 0) {
            return this[0].classList.contains(val);
        }
        return false;
    },
    /**
     * 设置所有匹配的元素的innerTEXT.无参数时,返回第一个元素的innerText内容(原生: innerText)
     * @param {string} val 设置的文本
     * @returns {jslib} 取值时返回值.否则返回this
     */
    'text': function (val) {
        if (val === undefined) {
            if (!this[0]) return;
            return this[0].innerText;
        }
        this.each((dom) => {
            dom.innerText = val;
        });
        return this;
    },
    /**
     * 设置所有匹配的元素的innerHTML.无参数时,返回第一个元素的innerHTML内容(原生: innerHTML)
     * @param {string} val 设置的html标记
     * @returns {jslib} 取值时返回值.否则返回this
     */
    'html': function (val) {
        if (val === undefined) {
            if (!this[0]) return;
            return this[0].innerHTML;
        }
        this.each((dom) => {
            dom.innerHTML = val;
        });
        return this;
    },
    /**
     * 向每个匹配元素内部追加内容(原生: append())
     * @param {any[]} content node节点 | DOMString对象 | DocumentFragment对象
     * @returns {jslib} 返回this
     */
    'append': function (...content) {
        this.each((dom) => {
            dom.append(...content);
        });
        return this;
    },
    /**
     * 向每个匹配元素内部第一个子节点前面加入内容(原生: prepend())
     * @param {any[]} content node节点 | DOMString对象 | DocumentFragment对象
     * @returns {jslib} 返回this
     */
    'prepend': function (...content) {
        this.each((dom) => {
            dom.prepend(...content);
        });
        return this;
    },
    /**
     * 向每个匹配元素的前面加一个元素(原生: insertBefore())
     * @param {any[]} content node节点 | DOMString对象 | DocumentFragment对象
     * @returns {jslib} 返回this
     */
    'before': function (...content) {
        this.each((dom) => {
            dom.parentNode.insertBefore(factory.fragment(...content), dom);
        });
        return this;
    },
    /**
     * 向每个匹配元素的后面加一个元素(原生: insertBefore())
     * @param {any[]} content node节点 | DOMString对象 | DocumentFragment对象
     * @returns {jslib} 返回this
     */
    'after': function (...content) {
        this.each((dom) => {
            dom.parentNode.insertBefore(factory.fragment(...content), dom.nextSibling);
        });
        return this;
    },
    /**
     * 删除所有匹配的元素(原生: parentNode.removeChild())
     */
    'remove': function () {
        this.each((dom) => {
            dom.parentNode.removeChild(dom);
        });
        this.reset();
    },
    /**
     * 清空所有匹配的元素的全部子元素(原生: innerHTML='')
     * @returns {jslib} 返回this
     */
    'empty': function () {
        this.each((dom) => {
            dom.innerHTML = '';
        });
        return this;
    }
});
// ==================================
//           数组相关操作方法
// ==================================
// ==================================
//           字符串相关方法
// ==================================
/**
 * 格式化字符串,将字符串中的占位符替换为给定字符串{d},返回替换后字符串.例:("my name is {0} from {1}",mirror,china)
 * @param {string} str 要格式化的字符串,包含占位符{d}
 * @param {...any} repstrs 替换占位符的字符串数组
 * @returns {string} 返回替换后字符串
 */
factory.format = (str, ...repstrs) => {
    // 替换函数的参数m表示匹配到的字串,j表示正则中圆括号捕获的值(就是占位数字).用这数字当下标到填充值数组取值,作为替换串返回
    return str.replace(/\{(\d+)\}/g, function (m, j) { return repstrs[j]; });
};
/**
 * 格式化字符串,根据占位符${key},到json中找到json.key,然后替换掉${key}
 * @param {string} str 要格式化的字符串,包含占位符${key}
 * @param {any} json json对象,键为key
 * @returns {string} 返回替换后字符串
 */
factory.dataBind = (str, json) => {
    
    // 根据指定的key,到data中取值,然后替换掉${key}
    // 其中m表示找到的'${key}', key表示圆括号中的值(属性名)
    // 没找到的'${key}'时, ${key}替换为''(空值)
    return str.replace(/\${(.+?)\}/g, function (m, key) { return json.hasOwnProperty(key) ? json[key] : ''; });
};
/**
 * 去除字符串前后的空白字符
 * @param {string} str 字符串
 * @returns {string} 返回新字符串
 */
factory.trim = (str) => {
    return str.replace(/^\s*|\s*$/g, '');
};
// ====================================================================
// ajax (原生: fetch())
// fetch方法返回Promise对象.
// https://github.com/matthew-andrews/isomorphic-fetch
// (详细讲解)https://www.cnblogs.com/libin-1/p/6853677.html
// ====================================================================
/**
 * 简易post方式Ajax, 默认返回json对象
 * @param {string} url 请求url
 * @param {any|FormData} data json对象或者FormData对象,如果是json对象,会转化成FormData对象
 * @param {Function} callback 互调函数
 * @param {string} restype 返回值类型,默认'json',可选'html'
 */
factory.post = (url, data, callback, restype) => {
    let formData = new FormData();
    if (data instanceof FormData) {
        formData = data;
    } else {
        Object.keys(data).forEach((key) => {
            formData.append(key, data[key]);
        });
    }
    //
    let res = fetch(url, { method: "POST", body: formData });
    if (restype === 'html') {
        res.then(response => response.text())
            .then((html) => {
                callback(html);
            });
    } else {
        res.then(response => response.json())
            .then((json) => {
                callback(json);
            });
    }
};
/**
 * 简易 get方式Ajax, 默认返回html文本
 * @param {string} url 请求url
 * @param {Function} callback 互调函数
 * @param {string} restype 返回值类型,默认'html',可选'json'
 */
factory.get = (url, callback, restype) => {
    let res = fetch(url);
    if (restype === 'json') {
        res.then(response => response.json())
            .then((json) => {
                callback(json);
            });
    } else {
        res.then(response => response.text())
            .then((html) => {
                callback(html);
            });
    }
};
// ==================================
//           验证相关方法
// ==================================
/**
 * 指示一个字符串是否为空或者null.
 * @param {string} str 被检查字符串
 * @returns {boolean} t/f
 */
factory.isEmptyOrNull = (str) => {
    return !val || val.length === 0;
};
/**
 * 指示一个字符串是否为空或者null或者全是空白字符.
 * @param {string} str 被检查字符串
 * @returns {boolean} t/f
 */
factory.isNullOrWhiteSpace = (str) => {
    if (/^\s+$/.test(str)) return true; // 全部是空白字符
    return !val || val.length === 0;
};
/**
 * 指示一个字符串是否为数值
 * @param {string} str 被检查字符串
 * @returns {boolean} t/f
 */
factory.isNumber = (str) => {
    return /^(?:-?\d+|-?\d{1,3}(?:,\d{3})+)?(?:\.\d+)?$/.test(str);
};
/**
 * 指示一个字符串是否为email地址
 * @param {string} str 被检查字符串
 * @returns {boolean} t/f
 */
factory.isEmail = (str) => {
    return /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(str);
};
/**
 * 指示一个字符串是否为国内11位手机号
 * [可匹配"(+86)013800138000",()号可以省略，+号可以省略，(+86)可以省略,11位手机号前的0可以省略;11位手机号第二位数可以是3~9中的任意一个]
 * @param {string} str 被检查字符串
 * @returns {boolean} t/f
 */
factory.isMobile = (str) => {
    return /^(\((\+)?86\)|((\+)?86)?)0?1[^012]\d{9}$/.test(str);
};
/**
 * 指示一个字符串是否为26个英文字母组成,大小写不限.
 * @param {string} str 被检查字符串
 * @returns {boolean} t/f
 */
factory.isAbc = (str) => {
    return !/[^a-zA-Z]/.test(str);
};
/**
 * 指示一个字符串是否为0-9整数组成
 * @param {string} str 被检查字符串
 * @returns {boolean} t/f
 */
factory.isDigit = (str) => {
    return /^\d+$/.test(str);
};
/**
 * 指示一个字符串是否为26个英文字母和0-9整数(可选)组成,但必须是字母开头.
 * @param {string} str 被检查字符串
 * @returns {boolean} t/f
 */
factory.isAbcDigit = (str) => {
    return /^[a-zA-Z][a-zA-Z\d]*$/.test(str);
};
/**
 * 指示一个字符串是否为26个英文字母和0-9整数(可选)和_下划线(可选)组成,并且是字母或者下划线开头.
 * @param {string} str 被检查字符串
 * @returns {boolean} t/f
 */
factory.isAbcDigitUline = (str) => {
    return /^[a-zA-Z_][a-zA-Z\d_]*$/.test(str);
};
/**
 * 指示一个字符串是否为url
 * @param {string} str 被检查字符串
 * @returns {boolean} t/f
 */
factory.isUrl = (str) => {
    return /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})).?)(?::\d{2,5})?(?:[/?#]\S*)?$/i.test(str);
};
/**
 * 指示一个字符串长度是否超过maxlength.
 * @param {string} str 被检查字符串
 * @param {int} maxlen 最大长度
 * @returns {boolean} t/f
 */
factory.isMaxLength = (str, maxlen) => {
    return str.length > maxlen;
};
/**
 * 指示一个字符串长度是否小于minlength
 * @param {string} str 被检查字符串
 * @param {int} minlen 最小长度
 * @returns {boolean} t/f
 */
factory.isMinLength = (str, minlen) => {
    return str.length < minlen;
};

/**
 * 指示一个字符串是否为2位小数,或者正数 (d | d.dd),可用于金额
 * @param {string} str 被检查字符串
 * @returns {boolean} t/f
 */
factory.isMoney = (str) => {
    return /^[0-9]+([.]{1}[0-9]{1,2})?$/.test(str);
};
/**
 * 指示一个字符串是否为日期格式
 * @param {string} str 被检查字符串
 * @returns {boolean} t/f
 */
factory.isDate = (str) => {
    return !/Invalid|NaN/.test(new Date(str).toString());
};
// ==================================
//           随机数相关方法
// ==================================
/**
 * 生成一个非负随机整数
 * @param {number} intMin 起始值(>0整数,含)
 * @param {number} intMax intMax:结束值(大于起始值整数,不含)
 * @returns {number} 返回
 */
factory.nextInt = (intMin, intMax) => {
    let rand = Math.random() * (intMax - intMin);
    return Math.floor(rand) + intMin;
};
// ==================================
//           时间相关方法
// ==================================
/**
 * 格式化时间,
 * @param {Date} date 要格式化的Date对象
 * @param {string} fmtstr format string 格式化字符串 (默认:四位年份,24小时制: "yyyy/MM/dd HH:mm:ss").
 * 自定义格式时,年月日时分秒代号必须是: y(年)M(月)d(日)H(时)m(分)s(秒)
 * @returns {string} 返回格式化时间字符串
 */
factory.datefmt = (date, fmtstr) => {
    let format = fmtstr || 'yyyy/MM/dd HH:mm:ss';
    let json = {};
    // 替换时,先替换名字较长的属性,以避免如yyyy被分成两次yy替换,造成错误.故长名字属性在前.
    json.yyyy = date.getFullYear();
    json.yy = json.yyyy.toString().substr(2);
    //
    let m = date.getMonth() + 1;
    json.MM = m > 9 ? m : '0' + m;
    json.M = m;
    //
    let d = date.getDate();
    json.dd = d > 9 ? d : '0' + d;
    json.d = d;
    //
    let h = date.getHours();
    json.HH = h > 9 ? h : '0' + h;
    json.H = h;
    //
    let mi = date.getMinutes();
    json.mm = mi > 9 ? mi : '0' + mi;
    json.m = mi;
    //
    let s = date.getSeconds();
    json.ss = s > 9 ? s : '0' + s;
    json.s = s;
    for (let item in json) {
        format = format.replace(item, json[item]);
    }
    return format;
};
// window上的引用名 "lib",.在此修改
win.lib = factory;
// 用$更加简洁方便
if (!win.$)
    win.$ = win.lib;
}) (window);