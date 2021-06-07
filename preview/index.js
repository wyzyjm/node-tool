window.onload=async function(){
    //初始化组件列表
    initCompList()
    //初始化归档组件列表
    placeFileList()
    //添加组件
    $('#add').click(function(){
        let compId=$('#iptCompId').val();
        if(/^c_\w+-[1-9]+\d*$/.test(compId)){
            addComp(compId)
        }else{
            layer.msg('组件名不符合规范', {offset: '100px'});
        }
    })
    //取回在编辑
    $('.takeToEdit').click(function(){
        takeToEdit()
    })
    //生成静态面板
    $("#createPanel").click(function(){
        createPanel()
    })
    //点击组件
    $('#compList').on('click','.p_name',function(){
        var _t=$(this).parents('.list-group-item')
        var comp=_t.attr('name')
        renderComp(comp)
        _t.addClass('active').siblings().removeClass('active')
    })
    //补全
    $('#compList').on('click','.bq',function(e){
        e.stopPropagation();
        var _t=$(this)
        var comp=_t.parents('.list-group-item').attr('name')
        bq(comp)
    })
    //同步
    $('#compList').on('click','.tb',function(e){
        e.stopPropagation();
        var _t=$(this)
        var comp=_t.parents('.list-group-item').attr('name')
        tb(comp)
    })
    //归档
    $('#compList').on('click','.gd',function(e){
        e.stopPropagation();
        var _t=$(this)
        var comp=_t.parents('.list-group-item').attr('name')
        gd(comp)
    })
    //升版
    $('#compList').on('click','.sb',function(e){
        e.stopPropagation();
        var _t=$(this)
        var comp=_t.parents('.list-group-item').attr('name')
        $('.compName').html(comp)
        $('#upVersion').attr('name',comp)
        $('#upVersion').modal('show')
    })
    //确认升版
    $(".confirmUpVersion").click(function(){
        var message = $("#upMessage").val().trim()
        if(!message){
            layer.msg('请填写升级说明再确定', {offset: '100px'});
            return
        }
        var compId = $("#upVersion").attr('name')
        confirmUpVersion(message,compId)
    })
    $('#upVersion').on('hide.bs.modal', function () {
        $("#upMessage").val('')
    })
    $(".viewport_button").on('click','a',function(){
        $(this).addClass('active').siblings().removeClass('active')
        var index=$(this).index()
        
        var arr = ['768px','1024px','100%','1366px','414px']
        $('.iframe_con').css({'width':arr[index]})
        console.log(index,arr[index])
    })

    $('.tabswitch button').click(function(){
        if($(this).hasClass('active')){
            return
        }
        $('.tabcontent .tabitem').eq($(this).index()).addClass('show').siblings().removeClass('show')
        $(this).addClass('active').siblings().removeClass('active')
    })
}
//补全json
async function bq(comp){
    console.log(comp)
    let result=await (await fetch('/api/buildCompJson?compId='+comp)).json();
    if(result.success){
        layer.msg('操作成功', {offset: '100px'});
    }else{
        layer.msg(result.error, {offset: '100px'});
    }
}
//同步
async function tb(comp){
    let result=await (await fetch('/api/copyFile?compId='+comp)).json();
    if(result.success){
        layer.msg('同步成功', {offset: '100px'});
    }else{
        layer.msg(result.error, {offset: '100px'});
    }
}
//归档
async function gd(comp){
    let result=await (await fetch('/api/placeFile?compId='+comp)).json();
    if(result.success){
        layer.msg('归档成功', {offset: '100px'});
        initCompList()
        placeFileList()
    }else{
        layer.msg(result.error, {offset: '100px'});
    }
}
//确认升版
async function confirmUpVersion(msg,id){
    console.log(msg,id)
    $('#upVersion').modal('hide')
    let result=await (await fetch('/api/upVersion?compId='+id,{
        method:'POST',
        body:JSON.stringify({
            msg:msg
        }),
        headers: new Headers({
            'Content-Type': 'application/json'
        })
    })).json();
    if(result.success){
        layer.msg('升版成功', {offset: '100px'});
        initCompList()
    }else{
        layer.msg(result.error, {offset: '100px'});
    }
}
//归档组件取回
async function takeToEdit(){
    let arr = []
    $("#placeFileList input:checked").each(function(){
        arr.push($(this).attr('id'))
    })
    if(!arr.length){
        layer.msg('未选择组件', {offset: '100px'});
        return
    }
    let result=await (await fetch('/api/takeFileToEdit',{
        method:'POST',
        body:JSON.stringify({
            comp:arr
        }),
        headers: new Headers({
            'Content-Type': 'application/json'
        })
    })).json();
    if(result.success){
        layer.msg('取回成功', {offset: '100px'});
        $('#staticBackdrop').modal('hide')
        initCompList()
        placeFileList()
    }else{
        layer.msg(result.error, {offset: '100px'});
    }
}
//添加组件
async function addComp(compId){
    let result=await (await fetch('/api/initcomp?compId='+compId)).json();
    if(result.success){
        layer.msg('添加成功', {offset: '100px'});
        $('#iptCompId').val('')
        initCompList()
    }else{
        layer.msg(result.error, {offset: '100px'});
    }
}
//初始化归档组件列表
async function placeFileList(){
    let compList=await (await fetch('/api/placeFileList')).json();
    compList.sort();
    $("#placeFileList").empty()
    compList.forEach(e=>{
        let item =`
            <div class="form-check form-check-inline placeItem">
                <input class="form-check-input" type="checkbox" id="${e}" value="${e}">
                <label class="form-check-label p_label" for="${e}">${e}</label>
            </div>
        `
        $("#placeFileList").append(item)
    })
}
//静态面板
async function createPanel(){
    let iframeBody = $("#compview")[0].contentDocument.body
    let compDom = $(iframeBody).find("div[id^='c_']")
    if(!compDom.length){
        layer.msg('请先选中组件', {offset: '100px'});
        return
    }
    let panelConfig = [],prop = {},group=0
    compDom.find('[panel]').each(function (i, e) {
        let _this = $(this);
        let value = _this.attr('panel')
        let valueArr = value.split('|')
        valueArr.forEach((e,k)=>{
            let name = _this.attr('data-ename')
            let tmpPanel = e.split("-")
            if(tmpPanel[0] == 'dataList'){
                let params={
                    "compName":"setting-dataList",
                    "name":name,
                    "bind-value":"prop."+tmpPanel[1],
                    "compList":{}
                }
                let tmpComp = {
                    link:[],
                    text:[],
                    icon:[],
                    img:[],
                    video:[],
                    check:[],
                    btn:[]
                }
                let item;
                _this.children().each(function(){
                    if($(this).find('[panelItem]').length>0){
                        item = $(this);
                        return false;
                    }
                })
                item.find('[panelItem]').each(function(j,el){
                    let _t = $(this);
                    let panelVue = _t.attr('panelItem')
                    let title = _t.attr('data-ename')
                    let type = panelVue.split("-")[0]
                    let key = panelVue.split("-")[1]
                    if(tmpComp[type]){
                        tmpComp[type].push({
                            key:key,
                            title:title
                        })
                    }
                })
                for(let i in tmpComp){
                    if(tmpComp[i].length>0){
                        params.compList[i]=tmpComp[i]
                    }
                }
                panelConfig.push(params)
            }else{
                changePanel(name,tmpPanel[1],tmpPanel[0])
            }
        })
        panelConfig.push({
            "compName": "line"
        })
    })
    panelConfig.push({
        "compName": "setting-animate"
    })
    function changePanel(name,value,type){
        let params;
        if(type=='text'){//文本
            params = {
                "compName":"setting-input",
                "title":name,
                "bind-value":"prop."+value,
                "showCheckbox":false
            }
        }else if(type=='img'){//图片
            params = {
                "compName":"setting-selectImage",
                "title":name,
                "bind-src":"prop."+value,
                "showCheckbox":false
            }
        }else if(type=='icon'){//图标
            params = {
                "compName":"setting-selectIcon",
                "title":name,
                "bind-src":"prop."+value,
                "showCheckbox":false
            }
        }else if(type=='link'){
            params = {
                "compName":"setting-link",
                "cName":name,
                "bind-url":"prop."+value+"Url",
                "bind-openType":"prop."+value+"Target",
                "bind-linkType":"prop."+value+"Type",
                "showCheckbox":false
            }
        }else if(type=='video'){
            params = {
                "compName":"setting-selectVideo",
                "title":name,
                "bind-src":"prop."+value
            }
        }else if(type=='check'){
            params = {
                "compName":"setting-checkbox",
                "name":name,
                "bind-value":"prop."+value
            }
        }else if(type=='btn'){
            panelConfig.push({
                "compName":"setting-input",
                "title":name+"标题",
                "bind-value":"prop."+value+"Title",
                "showCheckbox":false
            })
            params = {
                "compName":"setting-link",
                "cName":name+"链接",
                "bind-url":"prop."+value+"Url",
                "bind-openType":"prop."+value+"Target",
                "bind-linkType":"prop."+value+"Type",
                "showCheckbox":false
            }
        }
        panelConfig.push(params)
    }
    let compId=compDom.attr('id');
    let result=await (await fetch('/api/buildCompProp?compId='+compId,{
        method:'POST',
        body:JSON.stringify({
            prop:prop,
            panel:panelConfig
        }),
        headers: new Headers({
            'Content-Type': 'application/json'
        })
    })).json();
    if(result.success){
        layer.msg('生成'+compId+'面板成功', {offset: '100px'});
    }else{
        layer.msg(result.error, {offset: '100px'});
    }
}
//初始化组件列表
async function initCompList(){
    let result=await (await fetch('/api/complist')).json();
    let compList=result.complist
    let versionObj=result.versionObj
    compList.sort();
    $('#compList').empty()
    compList.forEach(comp => {
        let li=`
        <li class="list-group-item p_item" name="${comp}">
            <div class="p_compItem">
                <div class="p_name">${comp}<div class="p_mark"><mark class="badge badge-warning">v:${versionObj[comp] || 1}</mark></div></div>
                <div class="p_oper">
                    <button type="button" class="btn btn-success btn-sm bq">补全</button>
                    <button type="button" class="btn btn-primary btn-sm tb">同步</button>
                    <button type="button" class="btn btn-warning btn-sm sb">升版</button>
                    <button type="button" class="btn btn-secondary btn-sm gd">归档</button>
                    <button type="button" class="btn btn-danger btn-sm zj">质检</button>
                </div>
            </div>
        </li>
        `;
        $('#compList').append(li)
    });  
}
function renderComp(compId){
    let iframe=document.querySelector('#compview');
    frames[0].location.reload();
    iframe.onload=async function(){
        let fwin=frames[0];
        let fdoc=fwin.document;
        let fbody=fdoc.body;
        let mockQuery='&mock=true';
        let compPath='/'+compId+'/';
        let tmplStr=await (await fetch(compPath+'tmpl.hbs')).text();
        let data=await (await fetch('/api/mockData?compId='+compId+mockQuery)).json();
        if(data.error){
            layer.msg('数据错误：'+data.error, {offset: '100px'});
        }
        injectCss(compPath+'base.css');
        injectCss(compPath+'S.css','screen and (max-width:768px)');
        injectCss(compPath+'L.css','screen and (min-width: 769px)');
        injectCss(compPath+'M.css','screen and (max-width: 1024px) and (min-width: 769px)');
        try{
            let tmpl=Handlebars.compile(tmplStr);
            let compData={};
            data.dataJson=JSON.stringify(data.data,null,2);
            data.propJson=JSON.stringify(data.prop,null,2);
            data.i18nJson=JSON.stringify(data.i18n,null,2);
            compData[compId]=data;
            let compDiv=fdoc.createElement('div');
            compDiv.id=compId;
            fbody.appendChild(compDiv);
            $(compDiv).html(tmpl(compData));
            fwin.doJs()
        }catch(e){
            layer.msg('模板错误：'+e.toString(), {offset: '100px'});
        }
        
        
    }
}
function injectCss(url,media){
    let fwin=frames[0];
    let fdoc=fwin.document;
    let link=fdoc.createElement('link');
    if(media){
        link.media=media;
    }
    link.rel='stylesheet';
    link.href=url;
    let head=fdoc.head;
    head.appendChild(link);
}