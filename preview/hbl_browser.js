

// compare
// eq
// gt
// gte
// lt
// lte
// ceil
// floor
// ellipsis
//dateFormat

let util = {};

util.formatDate = function (date, fmt) {
    var o = {
        "M+": date.getMonth() + 1,                 //月份 
        "d+": date.getDate(),                    //日 
        "h+": date.getHours(),                   //小时 
        "m+": date.getMinutes(),                 //分 
        "s+": date.getSeconds(),                 //秒 
        "q+": Math.floor((date.getMonth() + 3) / 3), //季度 
        "S": date.getMilliseconds()             //毫秒 
    };
    if (/(y+)/.test(fmt)) {
        fmt = fmt.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
    }
    for (var k in o) {
        if (new RegExp("(" + k + ")").test(fmt)) {
            fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
        }
    }
    return fmt;
}
util.isObject = function (val) {
    return typeof (val) === 'object';
};
util.isOptions = function (val) {
    return util.isObject(val) && util.isObject(val.hash);
};
util.isBlock = function (options) {
    return util.isOptions(options)
        && typeof options.fn === 'function'
        && typeof options.inverse === 'function';
};
util.isString = function (val) {
    return typeof val === 'string' && val !== '';
};
util.value = function (val, context, options) {
    if (util.isOptions(val)) {
        return util.value(null, val, options);
    }
    if (util.isOptions(context)) {
        return util.value(val, {}, context);
    }
    if (util.isBlock(options)) {
        return !!val ? options.fn(context) : options.inverse(context);
    }
    return val;
};

let helpers = {};
helpers.eq = function (a, b, options) {
    if (arguments.length === 2) {
        options = b;
        b = options.hash.compare;
    }
    return util.value(a === b, this, options);
};
helpers.gt = function (a, b, options) {
    if (arguments.length === 2) {
        options = b;
        b = options.hash.compare;
    }
    return util.value(a > b, this, options);
};
helpers.gte = function (a, b, options) {
    if (arguments.length === 2) {
        options = b;
        b = options.hash.compare;
    }
    return util.value(a >= b, this, options);
};
helpers.lt = function (a, b, options) {
    if (arguments.length === 2) {
        options = b;
        b = options.hash.compare;
    }
    return util.value(a < b, this, options);
};
helpers.lte = function (a, b, options) {
    if (arguments.length === 2) {
        options = b;
        b = options.hash.compare;
    }
    return util.value(a <= b, this, options);
};
helpers.truncate = function (str, limit, suffix) {
    if (util.isString(str)) {
        if (typeof suffix !== 'string') {
            suffix = '';
        }
        if (str.length > limit) {
            return str.slice(0, limit - suffix.length) + suffix;
        }
        return str;
    }
};

helpers.ellipsis = function (str, limit) {
    if (util.isString(str)) {
        if (str.length <= limit) {
            return str;
        }
        return helpers.truncate(str, limit) + '…';
    }
};
helpers.compare = function (a, operator, b, options) {
    /*eslint eqeqeq: 0*/

    // if (arguments.length < 4) {
    //   throw new Error('handlebars Helper {{compare}} expects 4 arguments');
    // }
    if (arguments.length < 4) {
        return 'handlebars Helper {{compare}} expects 4 arguments';
    }

    var result;
    switch (operator) {
        case '==':
            result = a == b;
            break;
        case '===':
            result = a === b;
            break;
        case '!=':
            result = a != b;
            break;
        case '!==':
            result = a !== b;
            break;
        case '<':
            result = a < b;
            break;
        case '>':
            result = a > b;
            break;
        case '<=':
            result = a <= b;
            break;
        case '>=':
            result = a >= b;
            break;
        case 'typeof':
            result = typeof a === b;
            break;
        default: {
            return 'helper {{compare}}: invalid operator: `' + operator + '`';
        }
    }

    return util.value(result, this, options);
}
helpers.dateFormat = function (date, options) {
    return util.formatDate(new Date(Number(date)), 'yyyy-MM-dd');
}
helpers.lazyImage = function (url,attr,isLazy) {
    let resultStr='';
    if (isLazy) {
        resultStr= `
            <img src="/public/img/s.png" lazy="${url}" ${attr} />
        `
    } else {
        resultStr= `
            <img src="${url}" ${attr} />
        `
    }
    return new Handlebars.SafeString(Handlebars.compile(resultStr)(this))
};
helpers.lazySource = function (url,attr,isLazy) {
    let resultStr= `
    <source srcset="${url}" ${attr} />
`
    return new Handlebars.SafeString(Handlebars.compile(resultStr)(this))
};



helpers.paging = function (context,pageType) {
    if(!context){
        return
    }
    let { pageSize, currentPage, totalCount, totalPage } = context;
    currentPage = Number(currentPage)
    let pageNums = Math.ceil(totalCount / pageSize);
    let resultStr = '';
    if ('turnPage' == pageType) {
        let strArr = [],
            prevDisabled = currentPage == 1 ? 'disabled' : '',
            nextDisabled = currentPage == pageNums ? 'disabled' : '',
            pageUrl = '';
            
        if (pageNums < 8) {
            for (let i = 1; i <= pageNums; i++) {
                if (i == currentPage) {
                    strArr.push(`<a class="page_a page_num current" href="javascript:;">${currentPage}</a>`);
                } else {
                    strArr.push(`<a class="page_a page_num" href="${pageUrl}-${i}.html">${i}</a>`);
                }
            }
        } else {
            if (currentPage <= 3) {
                for (let i = 1; i <= 4; i++) {
                    if (i == currentPage) {
                        strArr.push(`<a class="page_a page_num current" href="javascript:;">${currentPage}</a>`);
                    } else {
                        strArr.push(`<a class="page_a page_num" href="${pageUrl}-${i}.html">${i}</a>`);
                    }
                }
                strArr.push('<span class="page_a page_ellipsis">...</span>');
                strArr.push(`<a class="page_a page_num" href="${pageUrl}-${pageNums}.html">${pageNums}</a>`);
            } else if (currentPage >= (pageNums - 2)) {
                strArr.push(`<a class="page_a page_num" href="${pageUrl}-1.html">1</a >`);
                strArr.push('<span class="page_a page_ellipsis">...</span>');
                for (let i = (pageNums - 3); i <= pageNums; i++) {
                    if (i == currentPage) {
                        strArr.push(`<a class="page_a page_num current" href="javascript:;">${currentPage}</a >`);
                    } else {
                        strArr.push(`<a class="page_a page_num" href="${pageUrl}-${i}.html">${i}</a >`);
                    }
                }
            } else {
                strArr.push(`<a class="page_a page_num" href="${pageUrl}-1.html">1</a >`);
                strArr.push('<span class="page_a page_ellipsis">...</span>');
                strArr.push(`<a class="page_a page_num" href="${pageUrl}-${currentPage - 1}.html">${currentPage - 1}</a >`);
                strArr.push(`<a class="page_a page_num current" href="javascript:;">${currentPage}</a >`);
                strArr.push(`<a class="page_a page_num" href="${pageUrl}-${currentPage + 1}.html">${currentPage + 1}</a >`);
                strArr.push('<span class="page_a page_ellipsis">...</span>');
                strArr.push(`<a class="page_a page_num" href="${pageUrl}-${pageNums}.html">${pageNums}</a >`);
            }
        }
        resultStr = `
        <div class="page_con">
            <a href="${pageUrl}-${currentPage > 1 ? (currentPage - 1) : 1}.html" class="page_a page_prev ${prevDisabled}">&lt;</a >
            ${strArr.join('')}
            <a href="${pageUrl}-${currentPage < pageNums ? (currentPage + 1) : pageNums}.html" class="page_a page_next ${nextDisabled}">&gt;</a >
            {{#prop.showJump}}
            <span class="page_jump">
                {{i18n.pageJump}} <input type="text" class="page_input" > {{i18n.pageUnit}}
            </span>
            {{/prop.showJump}}
        </div>
        `
    } else if ('click' == pageType) {
        resultStr = `
            <div class="page_con">
                <button class="btn btn-primary btn-sm e_button page_clickLoad">{{i18n.loadMore}}</button>
            </div>
        `
    } else {
        resultStr = `
            <div class="page_con"></div>
        `
    }
  return new Handlebars.SafeString(Handlebars.compile(resultStr)(this));
};

helpers.noDataPrompt = function (prompt) {
    let resultStr= `
        <div class="pl_empty">
            <div>
                <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFAAAAA8CAYAAADxJz2MAAABQmlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSCwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAxSDAwMnAxsCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsisDwt+Tc/Paps5Y+PTC6JmkwIw1aMArpTU4mQg/QeIk5ILikoYGBgTgGzl8pICELsFyBYpAjoKyJ4BYqdD2GtA7CQI+wBYTUiQM5B9BcgWSM5ITAGynwDZOklI4ulIbKi9IMARaGRiaRBuSMCppIOS1IoSEO2cX1BZlJmeUaLgCAyhVAXPvGQ9HQUjAyMDBgZQeENUf74BDkdGMQ6EWFYMA4OZJgMDkypCLC2CgWFfEdDLuggxNSUGBu5UBoY9twsSixLhDmD8xlKcZmwEYXNvZ2Bgnfb//+dwBgZ2oJl/r////3v7//9/lzEwMN9iYDjwDQCGJ141dN9+JQAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAUKADAAQAAAABAAAAPAAAAABO6vQ5AAAECElEQVR4Ae2aW0/rMAyAMxiwcduQEAhWHnjh//8eXngAAUMINjHul3P4IuWomkqSzk7HdGKpalljx/7iJqlL68+3mCwzE1iaWTMrWgIZoDARMsAMUEhAqJ4zMAMUEhCq5wzMAIUEhOo5AzNAIQGhes7ADFBIQKjeFurXVh+NRubt7a22XozC2tqa6fV6MU3V2rSarMZcXl6a9/d3s7GxoRZA2dDj46NZWVkxh4eH5Z+TXjcG8Pb21jw9PZmjoyPTarWSBEVl7vz83Kyvr5vd3d0kfUwbbWQRub+/Nzy6BwcHyeARGANDH/TF0YQkB/jw8GCGw6EpisI+XqmD4hEuBoW5vr429J1akgJ8fn42FxcXFl6n00kdyz/7nW7H9knf+JBSkgFksSAAHqnNzc2UMVTapk/6xgd8SSVJAH59fVnHd3Z2TL/fT+V70C594wMQU336SQIQh5tcCX0kWY3xhdU5hagDZK+3vLxs9vf3U/g7k018wSd80xZVgDc3N3a+GQwG2n6K7eETcyE+aooawLu7u+9tw8SufpoOatpiK8XWBl+1RAXgeDw2vGkUxcA+KlrOadvhMQYivuKzhqi8yp2enlpflpbC4/H5+WlXZu05ks06bx9ACgm7BOTk5CTUNHhfpRrz8fER/Y7LPDSZTMzV1ZXdpwU9jGiALXzY29uLettx26wI08EmKgDphVeomAxcXV013W7XnJ2d2YBjMsYXBRlN5h0fH0f1jy2XgT67sffCz1yspRrtAA04jaoMNrAVM3g1XIxuOheAeEfGUt6SCjawNS9Re4TrBrC1tWX3ZDxOsxYaXl5e7Iq6vb1dt3u19nMDSNDAY/WUCCX8/xIg0HjZn2exQTJwTnduc6BzYNHPKgA1VtOmQWr5nAEKR04FoNCHhVbPAIXDlwFmgEICQnVRBrIRTvnFSxhbUB3fpYWF2m8idEjpiCoIB5Lqi1eQgLDB6+urtUAxgqPdbtcuSkQDBBbgOBYV2E+8XTKQkUDkAGiMRAHEMP+S5gPnuxfjSJNt8LXKX34jVpKEumVMlSc4BzI6GK3q0AVNR7RZFMFXHxwH0k1RvriCADHmg4dxKsxaH2l8zmrdG43G1mefvZi40Y/6qMRkG8owylKMKpXhWet7voA07lE/dHN56KMWsfAfryGJAli18lYZ5psr84d0a1BlW+M3BpcFgmLuT1J3RY4C6Dojrd1KHDM/OL1FOLttDIDrVGpqAXQgAEmWcQDSXbv7i3AmGzkA567rgHMxzgTQKZfPDuL0udxmXtcO0PRZwx81gFXOuJXMd0aP++Xz9DV/l7PDXZfPXPsObKSQpABTOPzbbAb3gb/N4d/mTwYoHJEMMAMUEhCq5wzMAIUEhOp/AaxH8Lm1PiS6AAAAAElFTkSuQmCC" alt="{{i18n.noData}}">
                <p>{{i18n.noData}}</p>
            </div>
        </div>
    `
    return new Handlebars.SafeString(Handlebars.compile(resultStr)(this))
};

//Handlebars  browser
Handlebars.registerHelper("noDataPrompt", helpers.noDataPrompt);
Handlebars.registerHelper("paging", helpers.paging);
Handlebars.registerHelper("lazyImage", helpers.lazyImage);
Handlebars.registerHelper("lazySource", helpers.lazySource);
Handlebars.registerHelper("compare", helpers.compare);
Handlebars.registerHelper("eq", helpers.eq);
Handlebars.registerHelper("gt", helpers.gt);
Handlebars.registerHelper("gte", helpers.gte);
Handlebars.registerHelper("lt", helpers.lt);
Handlebars.registerHelper("lte", helpers.lte);
Handlebars.registerHelper("ellipsis", helpers.ellipsis);
Handlebars.registerHelper("dateFormat", helpers.dateFormat);//日期格式化
