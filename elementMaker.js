const fs=require('fs');
const path=require('path');
const minimist=require('minimist');
const logger = require('./logger');
const sd = require('silly-datetime');
const {promises: {readdir, writeFile,readFile,stat}} = require('fs');
const gta = require('google-translate-api-cn');
const COMP_PATH=path.join(__dirname, './elements');//组件基础路径
const DESIGNlIB_pATH=path.join(__dirname, '../ndesignlib/elem/');//组件基础路径
const NPUBLIC_pATH=path.join(__dirname, '../publics/');//组件基础路径
const defaultJson={
    "cname": "",
    "styleId": "",
    "styleClass": "",
    "tmpl": "",
    "css": [
        {
            "media":"",
            "cssText":""
        },
        {
            "media":"screen and (max-width:768px)",
            "cssText":""
        },
        {
            "media":"screen and (min-width: 769px)",
            "cssText":""
        },
        {
            "media":"screen and (max-width: 1024px) and (min-width: 769px)",
            "cssText":""
        }   
    ],
    "prop": {
        
    },
    "i18n": {
    },
    "datasource": "prop"
};
const panelJson={
    "panelConfig": [
        {
            "compName": "setting-animate"
        }
    ]
}
let mockData={
  "prop":{},       
  "i18n":{}
};


//新增组件
async function addElement(body){
    let obj = body.obj;
    let compId = obj.eleId
    let compPath=`${COMP_PATH}/${compId}/`;
    let compJsonFilePath=`${compPath+compId}.json`;
    //   let compPanelFilePath=`${compPath+compId.split('-')[0]}.json`
    let mockFilePath=compPath+'mockData.json';
    let tmplPath=compPath+'tmpl.hbs';
    let emptyFilePath=[compPath+'base.css',compPath+'S.css',compPath+'L.css',compPath+'M.css'];
    if(fs.existsSync(compPath)){
        logger.warn(`The component "${compId}" already exists`);
        return;
    }
    createDir(compPath);
    defaultJson.cname=obj.cname;
    defaultJson.styleId=compId;
    if(obj.container=='true'){
        defaultJson.container=true
    }
    if(obj.scope=='true'){
        defaultJson.scope=true
    }
    // if(obj.bindData=='true'){
    //     defaultJson.dataFields={}
    // }
    if(obj.adminData=='true'){
        defaultJson.dataManage={}
    }
    
    
    let allElePath=path.join(__dirname, './allEle.json');
    let allEleJson=JSON.parse(await readFile(allElePath));
    let ele={
        name:obj.cname,
        code:obj.eleId
    }
    if(obj.eleCate=='1'){
        allEleJson.base.push(ele)
    }else if(obj.eleCate=='2'){
        allEleJson.complex.push(ele)
    }else if(obj.eleCate=='3'){
        allEleJson.form.push(ele)
        defaultJson.type="form"
    }
    await writeFile(allElePath,JSON.stringify(allEleJson,null,2),'utf8');

    //   await writeFile(compPanelFilePath,JSON.stringify(panelJson,null,2),'utf8');
    await writeFile(compJsonFilePath,JSON.stringify(defaultJson,null,2),'utf8');
    await writeFile(mockFilePath,JSON.stringify(mockData,null,2),'utf8');
    await writeFile(tmplPath,``,'utf8');
    emptyFilePath.forEach(async (path,i)=>{
        await writeFile(path,i==0?`.${compId}{\n\n}\n`:'','utf8');
    })


    logger.info(`Component "${compId}" initialization is complete`)
}

//同步文件
async function copyFile(compId){
    let compPath=`${COMP_PATH}/${compId}/`;
    let compJsonFilePath=`${compPath + compId}.json`;
    let compPanelFilePath=`${compPath + compId}-panel.json`;
    let compDataFilePath=`${compPath + compId}-data.json`;
    let compJson,compPanelJson,compDataJson
    try{
        compJson=JSON.parse(await readFile(compJsonFilePath));
    }catch(e){}
    try{
        compPanelJson=JSON.parse(await readFile(compPanelFilePath));
    }catch(e){}
    try{
        compDataJson=JSON.parse(await readFile(compDataFilePath));
    }catch(e){}
    let desginLibComp = `${DESIGNlIB_pATH + compId}/`;
    if(!fs.existsSync(desginLibComp)){
        createDir(desginLibComp);
    }
    if(compJson){
        let dsignCompPath = `${desginLibComp + compId}.json`;
        await writeFile(dsignCompPath,JSON.stringify(compJson,null,2),'utf8');
    }
    if(compPanelJson){
        let dsignCompPannelPath = `${desginLibComp + compId}-panel.json`;
        await writeFile(dsignCompPannelPath,JSON.stringify(compPanelJson,null,2),'utf8');
    }
    if(compDataJson){
        let dsignCompDataPath = `${desginLibComp + compId}-data.json`;
        await writeFile(dsignCompDataPath,JSON.stringify(compDataJson,null,2),'utf8');
    }
}

//同步文件
async function asyncJsI18n(compId){
    const jsI18n_path=path.join(__dirname, './i18n/compJs/');
    const npublicI18n_path = path.join(NPUBLIC_pATH, './libs/widget/language/');
    console.log(npublicI18n_path)
    let files = await readdir(jsI18n_path);
    await Promise.all(files.map(async (file)=>{
        let fileStr = await readFile(jsI18n_path + file)
        await writeFile(npublicI18n_path+file,fileStr,'utf8');
    }));
}

//一键同步词条
async function asyncI18n(){
    let comps = await readdir(COMP_PATH);
    await Promise.all(comps.map(async (comp)=>{
        asyncCompI18n(comp)
    }));
}

//同步词条
async function asyncCompI18n(compId){
    let compPath=`${COMP_PATH}/${compId}/`;
    let compJsonFilePath=`${compPath + compId}.json`;
    let compJson
    try{
        compJson=JSON.parse(await readFile(compJsonFilePath));
    }catch(e){}
    if(compJson){
        let desginLibComp = `${DESIGNlIB_pATH + compId}/`;
        let dsignCompPath = `${desginLibComp + compId}.json`;
        let desginLibCompJson
        try{
            desginLibCompJson=JSON.parse(await readFile(dsignCompPath));
        }catch(e){}
        if(desginLibCompJson){
            desginLibCompJson.i18n = compJson.i18n
            await writeFile(dsignCompPath,JSON.stringify(desginLibCompJson,null,2),'utf8');
        }
    }
}

//自动修改json
async function compJsonBuilder(compId) {
  let compPath=`${COMP_PATH}/${compId}/`;
  let compJsonFilePath=`${compPath + compId}.json`;
  let compMockPath=`${compPath}mockData.json`;
  let cssPath=[compPath+'base.css',compPath+'S.css',compPath+'L.css',compPath+'M.css'];
  let tmplStr=(await readFile(compPath+'tmpl.hbs')).toString();
  let compJson=JSON.parse(await readFile(compJsonFilePath));
  let mockJson=JSON.parse(await readFile(compMockPath));
  
  compJson.i18n.zh_CN=mockJson.i18n;
  compJson.prop=mockJson.prop;
  if(compJson.dataFields){
    for(var i in compJson.prop){
        compJson.dataFields[i]=i
        // if(Array.isArray(compJson.prop[i])){
        //     for(var j in compJson.prop[i][0]){
        //         let tk=i+"$"+j
        //         compJson.dataFields[tk]=j
        //     }
        // }
    }
  }
  
  let tmpArr = handleStr(tmplStr,compJson.dataFields,compId)
  compJson.tmpl=tmpArr.str;
  compJson.styleClass=tmpArr.style;
  await Promise.all(cssPath.map(async (path,i)=>{
      compJson.css[i].cssText=(await readFile(path)).toString();
  }));
  await writeFile(compJsonFilePath,JSON.stringify(compJson,null,2),'utf8');
  logger.info(`补全组件 "${compId}" 的JSON完成`)
}

function isArray(o) {
　　return Object.prototype.toString.call(o) == "[object Array]";
}

//处理模板字符串
function handleStr(str,dataFields,compId){
    let dataReg = /prop\.[a-zA-Z0-9_]*/g
    let matchArr = str.match(dataReg)
    if(matchArr){
        matchArr.forEach(e=>{
            tmpStr = e.trim()
         
            let k = tmpStr.split(".")
            // if(dataFields[k[1]]!=undefined){
            let f="${"+k[1]+"}"
            str=str.replace(e,f)
            // }
        })
    }
    str = str.replace(/datasource/ig, "${datasource}")
 
    //数据替换
    let dataReg2 = /(\{\{#[\w\W]*?\}\}[\w\W]*?{{\/[\w\W]*?\}\})/g
    let matchArr2 = str.match(dataReg2)
    if(matchArr2){
        matchArr2.forEach(e=>{
            let te = e,tp='';
            let tpA=e.match(/{{#[\w\W]*?}}/g)
            if(tpA){
                tp = tpA[0].replace(/{{#/g,'').replace(/\${/g,'').replace(/}/g,'')
            }
            let tkA=e.match(/{{[a-zA-Z0-9]*?}}/g)
            if(tkA){
                tkA.forEach(el=>{
                    let noArr = ["noDataPrompt","this","if","children","eq ","each ","options","dataList","attributeList","keywords","specList","list","gt","previewList","i18n"]
                    let teo = el.replace(/{/g,'').replace(/}/g,'')
                    let flag = true
                    noArr.forEach(e=>{
                        if(teo.includes(e) || tp.includes(e)){
                            flag = false
                        }
                    })
                    if(flag){
                        let nel = el.replace(teo,"${"+tp+"$"+teo+"}")
                        te = te.replace(el,nel)
                    }
                })
            }
            str=str.replace(e,te)
        })
    }

    //词条替换
    let i18nReg = /i18n\..*?}}/g
    let i18nMatch = str.match(i18nReg)
    let tmp = []
    if(i18nMatch){
        i18nMatch.forEach(e=>{
            if(tmp.indexOf(e)==-1){
                tmp.push(e)
                let ne = e.replace(/}/g,'')
                str=str.replace(new RegExp(ne,'g'),'${'+ne+'}')
            }
        })
    }    

    //样式替换
    let classReg = new RegExp(compId+'.*?\\"');
    let classStr
    if(str.match(classReg)){
        classStr = str.match(classReg)[0];
    }
    let styleClass = "";
    if(classStr){
        let handleStr = classStr.replace(/\/\"/,"").replace(/\"/,"").trim()

        if(handleStr){
            let classArr = handleStr.split(/\s+/),nClassArr=[]
            classArr.forEach(e=>{
                if(e==compId){
                    nClassArr.push("${elemId}")
                    nClassArr.push("${styleClass}")
                }else if(/^s_/.test(e)){
                    styleClass = e
                }else{
                    nClassArr.push(e)
                }
            })
            let nClassStr = nClassArr.join(" ")
            str=str.replace(classStr,nClassStr+'\"')
        }
    }
    
    return {
        str:str,
        style:styleClass
    }
}

//创建文件夹
function createDir(dir){
  if(!fs.existsSync(dir)){
      fs.mkdirSync(dir,{recursive : true});
  }
}

module.exports={
  compJsonBuilder,
  addElement,
  copyFile,
  asyncI18n,
  asyncJsI18n
}