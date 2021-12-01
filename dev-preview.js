const Koa = require('koa');
const static = require('koa-static');
const {promises: {readFile,writeFile,readdir,stat}} = require('fs');
const maker=require('./maker.js');
const elementMaker=require('./elementMaker.js');
const getI18nFun=require('./i18n/getI18n.js');
const path=require('path');
const mockJs = require('mockjs');
const moment = require('moment');
const logger = require('./logger');
const app = new Koa();
const {exec} = require("child_process");
const COMP_PATH=path.join(__dirname, './components/');
const ELE_PATH=path.join(__dirname, './elements/');
const placeFilePath=path.join(__dirname, './placeFile.json');
const allElePath=path.join(__dirname, './allEle.json');
const bodyparser = require('koa-bodyparser');
//静态资源路由
app.use(static(path.join( __dirname,  './preview')))
app.use(static(path.join( __dirname,  './components')))
app.use(static(path.join( __dirname,  './elements')))
app.use(bodyparser())

app.use(async function (ctx,next) {
    const pathReg=/^\/api\/(.*)/;
    const elementReg=/^\/element\/(.*)/;
    if(pathReg.test(ctx.path)){
        let match=ctx.path.match(pathReg)
        let api=match[1];
        let result='',compJson;
        try{
            compJson=JSON.parse(await readFile(placeFilePath));
        }catch(e){
            await writeFile(placeFilePath,JSON.stringify([],null,2),'utf8');
            compJson=[]
        }
        if(api=='complist'){//获取组件列表
            let comps = await readdir(COMP_PATH);
            let complist=[],versionObj={}
            await Promise.all(comps.map(async (comp)=>{
                let dirpath=COMP_PATH+comp;
                let stats=await stat(dirpath);
                if(stats.isDirectory() && !compJson.includes(comp)){
                    let jsonPpath=dirpath+"/"+comp+".json",compJson;
                    try{
                        compJson=JSON.parse(await readFile(jsonPpath));
                    }catch(e){
                        compJson={}
                    }
                    complist.push(comp);
                    versionObj[comp]=compJson.version
                }
            }));
            result=JSON.stringify({complist:complist,versionObj:versionObj});
        }else if(api=='placeFileList'){//归档组件列表
            let compJson;
            try{
                compJson=JSON.parse(await readFile(placeFilePath));
            }catch(e){
                await writeFile(placeFilePath,JSON.stringify([],null,2),'utf8');
                compJson=[]
            }
            result=JSON.stringify(compJson);
        }else if(api=='initcomp'){//初始化组件
            let compId=ctx.query.compId;
            if(compId){
                try{
                    maker.initComp(compId);
                    result=JSON.stringify({success:true});
                }catch(e){
                    result=JSON.stringify({error:e.toString()});
                }
            }else{
                result=JSON.stringify({error:'缺少参数 compId'})
            }
        }else if(api=='placeFile'){//归档
            let compId=ctx.query.compId;
            if(compId){
                try{
                    maker.placeFile(compId);
                    result=JSON.stringify({success:true});
                }catch(e){
                    result=JSON.stringify({error:e.toString()});
                }
            }else{
                result=JSON.stringify({error:'缺少参数 compId'})
            }
        }else if(api=='copyFile'){//同步
            let compId=ctx.query.compId;
            if(compId){
                try{
                    maker.copyFile(compId);
                    result=JSON.stringify({success:true});
                }catch(e){
                    result=JSON.stringify({error:e.toString()});
                }
            }else{
                result=JSON.stringify({error:'缺少参数 compId'})
            }
        }else if(api=='upVersion'){//升版
            let compId=ctx.query.compId;
            if(compId){
                try{
                    maker.upVersion(compId,ctx.request.body);
                    result=JSON.stringify({success:true});
                }catch(e){
                    result=JSON.stringify({error:e.toString()});
                }
            }else{
                result=JSON.stringify({error:'缺少参数 compId'})
            }
        }else if(api=='buildCompJson'){//单个json补全
            let compId=ctx.query.compId;
            let tans=ctx.query.translate;
            if(compId){
                try{
                    maker.compJsonBuilder(compId,tans);
                    result=JSON.stringify({success:true});
                }catch(e){
                    result=JSON.stringify({error:e.toString()});
                }
            }else{
                result=JSON.stringify({error:'缺少参数 compId'})
            }
        }else if(api=='takeFileToEdit'){//取回组件
            try{
                maker.takeFileToEdit(ctx.request.body);
                result=JSON.stringify({success:true});
            }catch(e){
                result=JSON.stringify({error:e.toString()});
            }
        }else if(api=='buildCompProp'){//单个创建动态prop
            let compId=ctx.query.compId;
            if(compId){
                try{
                    maker.compPropBuilder(compId,ctx.request.body);
                    result=JSON.stringify({success:true});
                }catch(e){
                    result=JSON.stringify({error:e.toString()});
                }
            }else{
                result=JSON.stringify({error:'缺少参数 compId'})
            }
        }else if(api=='buildAll'){//全部补全
            let tans=ctx.query.translate;
            try{
                maker.buildAll(tans);
                result=JSON.stringify({success:true});
            }catch(e){
                result=JSON.stringify({error:e.toString()});
            }               

        }else if(api=='mockData'){//获取组件假数据
            let compId=ctx.query.compId;
            let isMock=ctx.query.mock;
            if(compId){
                try{
                    let mockJsonath=COMP_PATH+compId+'/mockData.json';
                    let mockData=JSON.parse(await readFile(mockJsonath));
                    if(isMock){
                        mockData=mockJs.mock(mockData);
                    }
                    result=JSON.stringify(mockData);
                }catch(e){
                    result=JSON.stringify({error:e.toString()});
                }
            }else{
                result=JSON.stringify({error:'缺少参数 compId'})
            }
        }
        ctx.body=result;
        ctx.set('content-type','application/json;charset=utf-8');
    }else if(elementReg.test(ctx.path)){
        let match=ctx.path.match(elementReg)
        let api=match[1];
        let result='';
        if(api=='elementlist'){//获取元素列表
            let eleJson=JSON.parse(await readFile(allElePath));
            // let comps = await readdir(ELE_PATH);
            // let elementList=[],nameObj={}
            // await Promise.all(comps.map(async (comp)=>{
            //     let dirpath=ELE_PATH+comp;
            //     let stats=await stat(dirpath);
            //     if(stats.isDirectory()){
            //         let jsonPpath=dirpath+"/"+comp+".json",compJson;
            //         try{
            //             compJson=JSON.parse(await readFile(jsonPpath));
            //         }catch(e){
            //             compJson={}
            //         }
            //         elementList.push(comp);
            //         nameObj[comp]=compJson.cname
            //     }
            // }));
            result=JSON.stringify(eleJson);
        }else if(api=='addElement'){//添加元素
            try{
                elementMaker.addElement(ctx.request.body);
                result=JSON.stringify({success:true});
            }catch(e){
                result=JSON.stringify({error:e.toString()});
            }
        }else if(api=='mockData'){//获取元素假数据
            let compId=ctx.query.compId;
            let isMock=ctx.query.mock;
            if(compId){
                try{
                    let mockJsonath=ELE_PATH+compId+'/mockData.json';
                    let mockData=JSON.parse(await readFile(mockJsonath));
                    if(isMock){
                        mockData=mockJs.mock(mockData);
                    }
                    result=JSON.stringify(mockData);
                }catch(e){
                    result=JSON.stringify({error:e.toString()});
                }
            }else{
                result=JSON.stringify({error:'缺少参数 compId'})
            }
        }else if(api=='buildCompJson'){//单个json补全
            let compId=ctx.query.compId;
            if(compId){
                try{
                    elementMaker.compJsonBuilder(compId);
                    result=JSON.stringify({success:true});
                }catch(e){
                    result=JSON.stringify({error:e.toString()});
                }
            }else{
                result=JSON.stringify({error:'缺少参数 compId'})
            }
        }else if(api=='copyFile'){//同步
            let compId=ctx.query.compId;
            if(compId){
                try{
                    elementMaker.copyFile(compId);
                    result=JSON.stringify({success:true});
                }catch(e){
                    result=JSON.stringify({error:e.toString()});
                }
            }else{
                result=JSON.stringify({error:'缺少参数 compId'})
            }
        }else if(api=='getI18n'){//读取中文词条
            try{
                getI18nFun.init()
                var fileName = moment().format('YYYY-MM-DD')
                var filePath = path.resolve('./i18n/dist/'+fileName+'.xlsx');
                result=JSON.stringify({success:filePath});
            }catch(e){
                result=JSON.stringify({error:e.toString()});
            }
        }
        ctx.body=result;
        ctx.set('content-type','application/json;charset=utf-8');
    }else{
        await next();
    }
});
app.listen(8800);
openUrl('http://127.0.0.1:8800/index.html');
//浏览器打开
function openUrl(url) {
    // 拿到当前系统的参数
    switch (process.platform) {
        //mac系统使用 一下命令打开url在浏览器
        case "darwin":
            exec(`open ${url}`);
            break;
        //win系统使用 一下命令打开url在浏览器
        case "win32":
            exec(`start ${url}`);
            break;
            // 默认mac系统
        default:
            exec(`open ${url}`);
            break;
    }
}