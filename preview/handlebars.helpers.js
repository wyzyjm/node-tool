Handlebars.registerHelper("each", function (context, options) {
    if (!options) {
        throw new Exception("Must pass iterator to #each")
    }

    let fn = options.fn,
        inverse = options.inverse,
        i = 0,
        ret = "",
        data

    if (Handlebars.Utils.isFunction(context)) {
        context = context.call(this)
    }

    if (options.data) {
        data = Handlebars.Utils.createFrame(options.data)
    }

    function execIteration(field, index, last) {
        if (data) {
            data.key = field
            data.index = index
            data.first = index === 0
            data.last = !!last
        }

        ret =
            ret +
            fn(context[field], {
                data: data,
                blockParams: [context[field], field]
            })
    }

    if (context && typeof context === "object") {
        if (Handlebars.Utils.isArray(context)) {
            for (let j = context.length; i < j; i++) {
                if (i in context) {
                    execIteration(i, i, i === context.length - 1)
                }
            }
        } else if (global.Symbol && context[global.Symbol.iterator]) {
            const newContext = []
            const iterator = context[global.Symbol.iterator]()
            for (let it = iterator.next(); !it.done; it = iterator.next()) {
                newContext.push(it.value)
            }
            context = newContext
            for (let j = context.length; i < j; i++) {
                execIteration(i, i, i === context.length - 1)
            }
        } else {
            let priorKey

            Object.keys(context).forEach(key => {
                // We're running the iterations one step out of sync so we can detect
                // the last iteration without have to scan the object twice and create
                // an itermediate keys array.
                if (priorKey !== undefined) {
                    execIteration(priorKey, i - 1)
                }
                priorKey = key
                i++
            })
            if (priorKey !== undefined) {
                execIteration(priorKey, i - 1, true)
            }
        }
    }
    if (context && typeof context === "number") {
        for (let j = context; i < j; i++) {
            execIteration(i, i, i === context - 1)
        }
    }

    if (i === 0) {
        ret = inverse(this)
    }

    return ret
})

Handlebars.registerHelper("lonely", function (context, options) {
    if (typeof context === "number" && context <= 1) {
        return options.fn(this)
    } else if (typeof context === "string" && parseFloat(context) <= 1) {
        return options.fn(this)
    } else if (typeof context === "object" && context instanceof Array && context.length <= 1) {
        return options.fn(this)
    }
})
Handlebars.registerHelper("$jumpLink", function () {
    return "javascript: void(0)"
})

Handlebars.registerHelper("$transferLink", function (linkOption) {
    if (!linkOption) {
        return
    }
    let { type = "", value = "", params = "" } = linkOption
    let link = value
    switch (type) {
        case "none":
            break
        case "page":
            break
        case "link":
            break
        case "email":
            link = "mailto:" + value
            break
        case "tel":
            link = "tel:" + value
            break
        case "file":
            break
        case "field":
            break
        default:
            break
    }
    return link
})
Handlebars.registerHelper("$toJson", function (data) {
    return JSON.stringify(data)
})

// 数组控制
Handlebars.registerHelper("arrControl", function (arr, status, option) {
    if (status && Array.isArray(arr) && arr.length !== 0) {
        return option.fn(this)
    } else {
        return option.inverse(this)
    }
})
