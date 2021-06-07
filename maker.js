const fs=require('fs');
const path=require('path');
const minimist=require('minimist');
const logger = require('./logger');
const sd = require('silly-datetime');
const {promises: {readdir, writeFile,readFile,stat}} = require('fs');
const gta = require('google-translate-api-cn');
const COMP_PATH=path.join(__dirname, './components/');//组件基础路径
const DESIGNlIB_pATH=path.join(__dirname, '../../designlib/comp/');//组件基础路径

const defaultJson={
  "compId":"c_productList-1",//组件id 在加入到页面时替换为实际id号
  "template":"",//组件模板
  "dataApi":"",//获取数据的接口地址
  "prop":{},//组件属性 
  "data":{},//组件数据 通过dataApi获取的数据扩展此数据
  "i18n":{//词条
      "zh_CN":{//词条格式示例 

      }
  },
  "css":[//组件css 按响应式分段存储
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
  "data":{},       
  "i18n":{}
};


(async () => {
	try{
    if(require.main !== module)return;//不是直接调用 不执行默认操作
    //接收调用参数
    let args=minimist(process.argv.slice(2));
    
    /**
     * 支持传入参数 
     *        --comp=     *必要参数 组件名 all为所有组件 
     *        --init      初始化
     *        --translate 翻译
     */
    let {comp,init,translate}=args;
    if(!comp){
      logger.warn('Missing required parameter: --comp');
      return;
    }
    if(init){
      if(comp=='all'){
        logger.error('The initialization component name cannot be "all"!');
        return;
      }
      await initComp(comp);
      return;
    }
    if(comp=='all'){
      await buildAll(translate);
    }else{
      compJsonBuilder(comp,translate);
    }
  }catch(err){
    logger.error(err);
  }
})();

async function buildAll(translate) {
  let comps = await readdir(COMP_PATH);
  await Promise.all(comps.map(async (comp)=>{
    let dirpath=COMP_PATH+comp;
    let stats=await stat(dirpath);
    if(stats.isDirectory()){
      await compJsonBuilder(comp,translate);
    }
  }));
}

//自动修改json
async function compJsonBuilder(compId,translate) {
  let compPath=`${COMP_PATH}/${compId}/`;
  let compJsonFilePath=`${compPath + compId}.json`;
  let compMockPath=`${compPath}mockData.json`;
  let cssPath=[compPath+'base.css',compPath+'S.css',compPath+'L.css',compPath+'M.css',];
  let tmplStr=(await readFile(compPath+'tmpl.hbs')).toString();
  let compJson=JSON.parse(await readFile(compJsonFilePath));
  let mockJson=JSON.parse(await readFile(compMockPath));
  compJson.template=tmplStr;
  compJson.i18n.zh_CN=mockJson.i18n;
  await Promise.all(cssPath.map(async (path,i)=>{
    compJson.css[i].cssText=(await readFile(path)).toString();
  }));
  if(translate){
    await transI18n(compJson.i18n);
  }
  await writeFile(compJsonFilePath,JSON.stringify(compJson,null,2),'utf8');
  logger.info(`补全组件 "${compId}" 的JSON完成`)
}
//取回归档组件
async function takeFileToEdit(body){
    let placeFilePath=path.join(__dirname, './placeFile.json');
    let compJson=JSON.parse(await readFile(placeFilePath));
    let arr = body.comp
    arr.forEach(e=>{
        let index = compJson.findIndex(n=>n==e)
        if(index>-1){
            compJson.splice(index,1)
        }
    })
    await writeFile(placeFilePath,JSON.stringify(compJson,null,2),'utf8');
}
//自动修改prop
async function compPropBuilder(compId,body) {
  let compPath=`${COMP_PATH}/${compId}/`;
  let compJsonFilePath=`${compPath + compId}.json`;
  let compMockPath=`${compPath}mockData.json`;
  let compPanelFilePath=`${compPath + compId.split('-')[0]}.json`;
  let compJson=JSON.parse(await readFile(compJsonFilePath));
  let mockJson=JSON.parse(await readFile(compMockPath));
  // let panelJson=JSON.parse(await readFile(compPanelFilePath));
  let tmplStr=(await readFile(compPath+'tmpl.hbs')).toString();
  //修改panel
  let panelJson = {
      panelConfig:body.panel
  }
  //修改prop
  compJson.prop=mockJson.prop;
  //修改tmpl
  for(let i in body.prop){
      let k=i.split('_')[0]
      logger.info(k+'="'+body.prop[i]+'"')
      if(body.prop[i]){
        if(k=='text' || k=='html'){
            tmplStr = tmplStr.replace(body.prop[i],'{{{prop.'+i+'}}}')
        }else if(k!='linkType'){
            tmplStr = tmplStr.replace(k+'="'+body.prop[i]+'"',k+'="'+'{{{prop.'+i+'}}}'+'"')
        }
      }
  }
  compJson.template=tmplStr;
  await writeFile(compJsonFilePath,JSON.stringify(compJson,null,2),'utf8');
  await writeFile(compPanelFilePath,JSON.stringify(panelJson,null,2),'utf8');
  logger.info(`生成组件 "${compId}" 的panel面板完成`)
}
//组件升版
async function upVersion(compId,body) {
  let compPath=`${COMP_PATH}/${compId}/`;
  let compJsonFilePath=`${compPath + compId}.json`;
  let compJson=JSON.parse(await readFile(compJsonFilePath));
  let version=parseInt(compJson.version)||1
  compJson.version=version+1
    let versionMessagePath=`${compPath}version.json`,versionJson;
    try{
        versionJson=JSON.parse(await readFile(versionMessagePath));
    }catch(e){
        await writeFile(versionMessagePath,JSON.stringify([],null,2),'utf8');
        versionJson=[]
    }
    versionJson.push({
        version:compJson.version,
        time:sd.format(new Date(), 'YYYY-MM-DD HH:mm:ss'),
        msg:body.msg
    })
    await writeFile(versionMessagePath,JSON.stringify(versionJson,null,2),'utf8');
    await writeFile(compJsonFilePath,JSON.stringify(compJson,null,2),'utf8');
    logger.info(`组件 "${compId}" 的版本升级完成`)
}
//新增组件
async function initComp(compId){
  let compPath=`${COMP_PATH}/${compId}/`;
  let compJsonFilePath=`${compPath+compId}.json`;
  let compPanelFilePath=`${compPath+compId.split('-')[0]}.json`
  let mockFilePath=compPath+'mockData.json';
  let tmplPath=compPath+'tmpl.hbs';
  let emptyFilePath=[compPath+'base.css',compPath+'S.css',compPath+'L.css',compPath+'M.css'];
  if(fs.existsSync(compPath)){
    logger.warn(`The component "${compId}" already exists`);
    return;
  }
  createDir(compPath);
  defaultJson.compId=compId;
  await writeFile(compPanelFilePath,JSON.stringify(panelJson,null,2),'utf8');
  await writeFile(compJsonFilePath,JSON.stringify(defaultJson,null,2),'utf8');
  await writeFile(mockFilePath,JSON.stringify(mockData,null,2),'utf8');
  await writeFile(tmplPath,`{{#with ${compId}}}\n\n{{/with}}`,'utf8');
  emptyFilePath.forEach(async (path,i)=>{
    await writeFile(path,i==0?`#${compId}>div{\n\n}\n`:'','utf8');
  })
  logger.info(`Component "${compId}" initialization is complete`)
}
//组件归档
async function placeFile(compId){
    let placeFilePath=path.join(__dirname, './placeFile.json');
    let compJson=JSON.parse(await readFile(placeFilePath));
    if(!compJson.includes(compId)){
        compJson.push(compId)
    }
    await writeFile(placeFilePath,JSON.stringify(compJson,null,2),'utf8');
}
//同步文件
async function copyFile(compId){
    let compPath=`${COMP_PATH}/${compId}/`;
    let compJsonFilePath=`${compPath + compId}.json`;
    let compPanelFilePath=`${compPath + compId.split('-')[0]}.json`;
    let compJson,compPanelJson
    try{
        compJson=JSON.parse(await readFile(compJsonFilePath));
    }catch(e){
        compJson=[]
    }
    try{
        compPanelJson=JSON.parse(await readFile(compPanelFilePath));
    }catch(e){
        compPanelJson=[]
    }
    let desginLibComp = `${DESIGNlIB_pATH + compId.split('-')[0]}/`;
    let desginLibCompTruth = `${desginLibComp + compId}/`;

    if(!fs.existsSync(desginLibComp)){
        createDir(desginLibComp);
    }
    if(!fs.existsSync(desginLibCompTruth)){
        createDir(desginLibCompTruth);
    }
  
    let dsignCompPath = `${desginLibCompTruth + compId}.json`;
    let dsignCompPannelPath = `${desginLibComp + compId.split('-')[0]}.json`;
    
    await writeFile(dsignCompPath,JSON.stringify(compJson,null,2),'utf8');
    await writeFile(dsignCompPannelPath,JSON.stringify(compPanelJson,null,2),'utf8');
}

async function transI18n(i18n){
  let languages=['af','en','nl','ja','de'];
  let zhEntrys=i18n&&i18n['zh_CN'];
  let keys=Object.keys(zhEntrys);
  for(let i=0;i<languages.length;i++){
    let lang=languages[i];
    let newEntrys={};    
    await Promise.all(keys.map(async (key)=>{
      let transStr=(await gta(zhEntrys[key],{from:'zh_CN',to: lang})).text;
      newEntrys[key]=transStr;
    }));
    i18n[lang]=newEntrys;
  };
}

function createDir(dir){
  if(!fs.existsSync(dir)){
      fs.mkdirSync(dir,{recursive : true});
  }
}

module.exports={
  compJsonBuilder,
  compPropBuilder,
  buildAll,
  initComp,
  placeFile,
  takeFileToEdit,
  upVersion,
  copyFile
}