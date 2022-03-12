$(function () {
    initElements()
    //添加元素
    $(".confirmnewElement").click(function () {
        let cname = $("#eleName").val()
        let eleId = $("#eleId").val()
        let eleCate = $("#eleCate").val()
        if (cname.trim() == "") {
            layer.msg("元素名称必填", { offset: "100px" })
            return
        }
        if (!/^e_[0-9a-zA-Z]+(_[0-9a-zA-Z])?$/.test(eleId)) {
            layer.msg("元素ID不符合规范", { offset: "100px" })
            return
        }
        if (eleCate.trim() == "") {
            layer.msg("请选择元素分类", { offset: "100px" })
            return
        }
        let obj = {
            cname: cname,
            eleId: eleId,
            container: $("input[name='isContainer']:checked").val(),
            scope: $("input[name='isScope']:checked").val(),
            bindData: $("input[name='bindData']:checked").val(),
            adminData: $("input[name='adminData']:checked").val(),
            eleCate: eleCate
        }
        addElement(obj)
    })
    //点击元素
    $(".elementlist").on("click", ".p_name", function () {
        var _t = $(this).parents(".list-group-item")
        var _u = _t.parent()
        var comp = _t.attr("name")
        renderEelement(comp) // 渲染页面
        _t.addClass("active").siblings().removeClass("active")
        _u.siblings().find(".list-group-item").removeClass("active")
    })
    //补全
    $(".elementlist").on("click", ".bq", function (e) {
        e.stopPropagation()
        var _t = $(this)
        var comp = _t.parents(".list-group-item").attr("name")
        bq(comp)
    })
    //同步
    $(".elementlist").on("click", ".tb", function (e) {
        e.stopPropagation()
        var _t = $(this)
        var comp = _t.parents(".list-group-item").attr("name")
        tb(comp)
    })
    $(".eleCateCon button").click(function () {
        if ($(this).hasClass("active")) {
            return
        }
        $(".elementlist .list-group").eq($(this).index()).addClass("show").siblings().removeClass("show")
        $(this).addClass("active").siblings().removeClass("active")
    })
    //读取中文词条
    $(".getI18n").click(function () {
        getI18n()
    })
    // //设置词条
    $(".setCompI18n").click(function () {
        setI18n(1)
    })
    $(".asyncCompJson").click(function () {
        asyncI18n()
    })
    $(".setVueI18n").click(function () {
        setI18n(2)
    })
    $(".setJsI18n").click(function () {
        setI18n(3)
    })
    $(".asyncCompJs").click(function () {
        asyncJsI18n()
    })
})
async function asyncJsI18n() {
    let result = await (await fetch("/element/asyncJsI18n")).json()
    if (result.success) {
        layer.open({
            title: "设置翻译词条成功",
            content: "位置：" + result.success
        })
    }
}
async function asyncI18n() {
    let result = await (await fetch("/element/asyncI18n")).json()
    if (result.success) {
        layer.open({
            title: "设置翻译词条成功",
            content: "位置：" + result.success
        })
    }
}
async function setI18n(k) {
    let result = await (await fetch("/element/setI18n?k=" + k)).json()
    if (result.success) {
        layer.open({
            title: "设置翻译词条成功",
            content: "位置：" + result.success
        })
    }
}
async function getI18n() {
    let result = await (await fetch("/element/getI18n")).json()
    if (result.success) {
        layer.open({
            title: "生成词条成功",
            content: "位置：" + result.success
        })
    }
}
//初始化元素列表
async function initElements() {
    let result = await (await fetch("/element/elementlist")).json()
    console.log(result)
    let base = result.base // 基础元素
    let complex = result.complex // 复杂元素
    let form = result.form // 表单元素
    $("#baseList").empty() // 清空基础
    base.forEach(ele => {
        let li = getLi(ele)
        $("#baseList").append(li)
    })
    $("#complexList").empty()
    complex.forEach(ele => {
        let li = getLi(ele)
        $("#complexList").append(li)
    })
    $("#formList").empty()
    form.forEach(ele => {
        let li = getLi(ele)
        $("#formList").append(li)
    })
    function getLi(ele) {
        return `
        <li class="list-group-item p_item" name="${ele.code}">
            <div class="p_compItem">
                <div class="p_name">${ele.name}(${ele.code})</div>
                <div class="p_oper">
                    <button type="button" class="btn btn-success btn-sm bq">补全</button>
                    <button type="button" class="btn btn-primary btn-sm tb">同步</button>
                </div>
            </div>
        </li>
        `
    }
}
//添加元素
async function addElement(obj) {
    let result = await (
        await fetch("/element/addElement", {
            method: "POST",
            body: JSON.stringify({
                obj: obj
            }),
            headers: new Headers({
                "Content-Type": "application/json"
            })
        })
    ).json()

    if (result.success) {
        layer.msg("添加成功", { offset: "100px" })
        $("#eleName").val("")
        $("#eleId").val("")
        $("#eleCate").val("")
        $("input[name='isContainer']").val("false")
        $("input[name='isScope']:checked").val("false")
        $("input[name='bindData']:checked").val("false")
        $("#newElement").modal("hide")
        initElements()
    } else {
        layer.msg(result.error, { offset: "100px" })
    }
}
//渲染元素
function renderEelement(compId) {
    let iframe = document.querySelector("#compview")
    frames[0].location.reload()
    iframe.onload = async function () {
        let fwin = frames[0]
        let fdoc = fwin.document
        let fbody = fdoc.body
        let mockQuery = "&mock=true"
        let compPath = "/" + compId + "/"
        let tmplStr = await (await fetch(compPath + "tmpl.hbs")).text()
        let data = await (await fetch("/element/mockData?compId=" + compId + mockQuery)).json()
        if (data.error) {
            layer.msg("数据错误：" + data.error, { offset: "100px" })
        }
        injectCss(compPath + "base.css")
        injectCss(compPath + "S.css", "screen and (max-width:768px)")
        injectCss(compPath + "L.css", "screen and (min-width: 769px)")
        injectCss(compPath + "M.css", "screen and (max-width: 1024px) and (min-width: 769px)")
        try {
            let tmpl = Handlebars.compile(tmplStr)
            let compData = {}
            data.dataJson = JSON.stringify(data.data, null, 2)
            data.propJson = JSON.stringify(data.prop, null, 2)
            data.i18nJson = JSON.stringify(data.i18n, null, 2)
            compData = data
            let compDiv = fdoc.createElement("div")
            compDiv.id = "c_static_001"
            let input = fdoc.createElement("input")
            input.type = "hidden"
            input.name = "propJson"
            input.value = data.propJson
            let div = fdoc.createElement("div")
            div.id = "con"
            $(compDiv).append(div)
            $(compDiv).append(input)
            fbody.appendChild(compDiv)
            $(compDiv).find("#con").html(tmpl(compData))

            // let compDiv=fdoc.createElement('div');
            // compDiv.id='c_prudtct_001-111111122334';
            // let childDiv=fdoc.createElement('div');
            // childDiv.setAttribute("needjs","true")
            // compDiv.appendChild(childDiv);
            // fbody.appendChild(compDiv);
            // $(childDiv).html(tmpl(compData));
        } catch (e) {
            layer.msg("模板错误：" + e.toString(), { offset: "100px" })
        }
    }
}
//补全json
async function bq(comp) {
    console.log(comp)
    let result = await (await fetch("/element/buildCompJson?compId=" + comp)).json()
    if (result.success) {
        layer.msg("操作成功", { offset: "100px" })
    } else {
        layer.msg(result.error, { offset: "100px" })
    }
}
//同步
async function tb(comp) {
    let result = await (await fetch("/element/copyFile?compId=" + comp)).json()
    if (result.success) {
        layer.msg("同步成功", { offset: "100px" })
    } else {
        layer.msg(result.error, { offset: "100px" })
    }
}
