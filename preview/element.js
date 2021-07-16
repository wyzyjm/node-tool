$(function(){
    initElements()
    //添加元素
    $(".confirmnewElement").click(function(){
        let cname=$("#eleName").val();
        let eleId=$('#eleId').val();
        let eleCate=$('#eleCate').val();
        if(cname.trim() == ''){
            layer.msg('元素名称必填', {offset: '100px'});
            return
        }
        if(!/^e_[0-9a-zA-Z]+$/.test(eleId)){
            layer.msg('元素ID不符合规范', {offset: '100px'});
            return
        }
        if(eleCate.trim() == ''){
            layer.msg('请选择元素分类', {offset: '100px'});
            return
        }
        let obj = {
            cname:cname,
            eleId:eleId,
            container:$("input[name='isContainer']:checked").val(),
            scope:$("input[name='isScope']:checked").val(),
            bindData:$("input[name='bindData']:checked").val(),
            adminData:$("input[name='adminData']:checked").val(),
            eleCate:eleCate
        }
        addElement(obj)
    })
    //点击元素
    $('.elementlist').on('click','.p_name',function(){
        var _t=$(this).parents('.list-group-item')
        var comp=_t.attr('name')
        renderEelement(comp)
        _t.addClass('active').siblings().removeClass('active')
    })
    //补全
    $('.elementlist').on('click','.bq',function(e){
        e.stopPropagation();
        var _t=$(this)
        var comp=_t.parents('.list-group-item').attr('name')
        bq(comp)
    })
    $('.eleCateCon button').click(function(){
        if($(this).hasClass('active')){
            return
        }
        $('.elementlist .list-group').eq($(this).index()).addClass('show').siblings().removeClass('show')
        $(this).addClass('active').siblings().removeClass('active')
    })
})
//初始化元素列表
async function initElements() {
    let result=await (await fetch('/element/elementlist')).json();
    console.log(result)
    let base = result.base
    let complex = result.complex
    let form = result.form
    // let elementList=result.elementList
    // let nameObj=result.nameObj
    // elementList.sort();
    $('#baseList').empty()
    base.forEach(ele => {
        let li=`
        <li class="list-group-item p_item" name="${ele.code}">
            <div class="p_compItem">
                <div class="p_name">${ele.name}(${ele.code})</div>
                <div class="p_oper">
                    <button type="button" class="btn btn-success btn-sm bq">补全</button>
                </div>
            </div>
        </li>
        `;
        $('#baseList').append(li)
    });  
    $('#complexList').empty()
    complex.forEach(ele => {
        let li=`
        <li class="list-group-item p_item" name="${ele.code}">
            <div class="p_compItem">
                <div class="p_name">${ele.name}(${ele.code})</div>
                <div class="p_oper">
                    <button type="button" class="btn btn-success btn-sm bq">补全</button>
                </div>
            </div>
        </li>
        `;
        $('#complexList').append(li)
    });  
    $('#formList').empty()
    form.forEach(ele => {
        let li=`
        <li class="list-group-item p_item" name="${ele.code}">
            <div class="p_compItem">
                <div class="p_name">${ele.name}(${ele.code})</div>
                <div class="p_oper">
                    <button type="button" class="btn btn-success btn-sm bq">补全</button>
                </div>
            </div>
        </li>
        `;
        $('#formList').append(li)
    });  
}
//添加元素
async function addElement(obj){
    let result=await (await fetch('/element/addElement',{
        method:'POST',
        body:JSON.stringify({
            obj:obj
        }),
        headers: new Headers({
            'Content-Type': 'application/json'
        })
    })).json();

    if(result.success){
        layer.msg('添加成功', {offset: '100px'});
        $('#eleName').val('');
        $('#eleId').val('');
        $('#eleCate').val('');
        $("input[name='isContainer']").val('false')
        $("input[name='isScope']:checked").val('false')
        $("input[name='bindData']:checked").val('false')
        $('#newElement').modal('hide')
        initElements()
    }else{
        layer.msg(result.error, {offset: '100px'});
    }
}
//渲染元素
function renderEelement(compId){
    let iframe=document.querySelector('#compview');
    frames[0].location.reload();
    iframe.onload=async function(){
        let fwin=frames[0];
        let fdoc=fwin.document;
        let fbody=fdoc.body;
        let mockQuery='&mock=true';
        let compPath='/'+compId+'/';
        let tmplStr=await (await fetch(compPath+'tmpl.hbs')).text();
        let data=await (await fetch('/element/mockData?compId='+compId+mockQuery)).json();
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
            compData=data;
            let compDiv=fdoc.createElement('div');
            compDiv.id=compId;
            fbody.appendChild(compDiv);
            $(compDiv).html(tmpl(compData));
            // let compDiv=fdoc.createElement('div');
            // compDiv.id='c_prudtct_001-111111122334';
            // let childDiv=fdoc.createElement('div');
            // childDiv.setAttribute("needjs","true")
            // compDiv.appendChild(childDiv);
            // fbody.appendChild(compDiv);
            // $(childDiv).html(tmpl(compData));
        }catch(e){
            layer.msg('模板错误：'+e.toString(), {offset: '100px'});
        }
        
        
    }
}
//补全json
async function bq(comp){
    console.log(comp)
    let result=await (await fetch('/element/buildCompJson?compId='+comp)).json();
    if(result.success){
        layer.msg('操作成功', {offset: '100px'});
    }else{
        layer.msg(result.error, {offset: '100px'});
    }
}