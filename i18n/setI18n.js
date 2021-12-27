const ejsExcel=require('ejsexcel');
const fs = require('fs');
const path = require('path');
const {promises: {readFile,writeFile,readdir,stat}} = require('fs');
const ELE_PATH=path.join(__dirname, '../elements/');
module.exports={
    //读取xls文件
    getXls(k){
        let _=this;
        let filePath = path.resolve('./i18n/xls');
        let exBuf=fs.readFileSync(filePath+'/i18n.xlsx');
        ejsExcel.getExcelArr(exBuf).then(exlJson=>{
            let workBook=exlJson;
            let workSheets=workBook[0];
            let data = {}
            let keyArr = []
            workSheets.forEach((item,index)=>{
                if(index==0){
                    keyArr = item
                    item.forEach(e=>{
                        data[e]=[]
                    })
                }else{
                    item.forEach((e,i)=>{
                        data[keyArr[i]].push(e.trim())
                    })
                }
            })
            if(k==1){
                _.setElemI18n(data,keyArr)  
            }else if(k==2){
                _.setVueI18n(data,keyArr)  
            }else if(k==3){
                _.setJsI18n(data,keyArr)
            }
        }).catch(error=>{
            console.log(error);
        });

    },
    //设置元素词条
    async setElemI18n(data,keyArr){
        let comps = await readdir(ELE_PATH);
        let i18nList={}
        await Promise.all(comps.map(async (comp)=>{
            let dirpath=ELE_PATH+comp;
            let stats=await stat(dirpath);
            if(stats.isDirectory()){
                let jsonPath=dirpath+"/"+comp+".json";
                try{
                    let cnData = data.zh_CN
                    let compJson=JSON.parse(await readFile(jsonPath));
                    keyArr.forEach((e,i)=>{
                        if(!compJson.i18n[e]){
                            compJson.i18n[e] = {}
                        }
                        if(e!="zh_CN"){
                            for(let j in compJson.i18n.zh_CN){
                                let v = compJson.i18n.zh_CN[j]
                                let ind = cnData.findIndex(n=>n==v)
                                if(ind>-1){
                                    compJson.i18n[e][j]=data[e][ind]
                                }else{
                                    if(!i18nList[comp]){
                                        i18nList[comp]={}
                                    }
                                    i18nList[comp][j] = v
                                }
                            }
                        }
                    })
                    await writeFile(jsonPath,JSON.stringify(compJson,null,2),'utf8');
                    
                }catch(e){}
            }
        }));
        console.log(i18nList)
    },
    //设置vue词条
    async setVueI18n(data,keyArr){
        let _=this;
        let pcPath=path.join(__dirname, './vue/pc/');
        fs.readFile(pcPath+'zh_CN.js', "utf-8", function(error, response) {
            let res = response.replace("module.exports =","")
            res = JSON.parse(res)
            let cnData = data.zh_CN
            keyArr.forEach(e=>{
                if(e!='zh_CN'){
                    let nObj = {}
                    for(let i in res){
                        let ind = cnData.findIndex(n=>n==res[i])
                        if(ind>-1){
                            nObj[i] = data[e][ind]
                        }else{
                            nObj[i] = res[i]
                        }
                    }
                    let nStr = "module.exports = "+ JSON.stringify(nObj,null,2)
                    let nPath = pcPath + e + '.js'
                    _.setFile(nPath,nStr)
                }
            })
        });
        let moPath=path.join(__dirname, './vue/mo/');
        fs.readFile(moPath+'zh_CN.js', "utf-8", function(error, response) {
            let res = response.replace("module.exports =","")
            res = JSON.parse(res)
            let cnData = data.zh_CN
            keyArr.forEach(e=>{
                if(e!='zh_CN'){
                    let nObj = {}
                    for(let i in res){
                        let ind = cnData.findIndex(n=>n==res[i])
                        if(ind>-1){
                            nObj[i] = data[e][ind]
                        }else{
                            nObj[i] = res[i]
                        }
                    }
                    let nStr = "module.exports = "+ JSON.stringify(nObj,null,2)
                    let nPath = moPath + e + '.js'
                    _.setFile(nPath,nStr)
                }
            })
        });
    },
    //设置js词条
    async setJsI18n(data,keyArr){
        let _=this;
        let pcPath=path.join(__dirname, './compJs/');
        fs.readFile(pcPath+'zh_CN.js', "utf-8", function(error, response) {
            let res = response.replace("window.i18n = ","")
            res = JSON.parse(res)
            let cnData = data.zh_CN
            keyArr.forEach(e=>{
                if(e!='zh_CN'){
                    let nObj = {}
                    for(let i in res){
                        let ind = cnData.findIndex(n=>n.trim()==res[i].trim())
                        if(ind>-1){
                            nObj[i] = data[e][ind]
                        }else{
                            nObj[i] = res[i]
                        }
                    }
                    let nStr = "window.i18n = "+ JSON.stringify(nObj,null,2)
                    let nPath = pcPath + e + '.js'
                    _.setFile(nPath,nStr)
                }
            })
        });
    },
    async setFile(nPath,nStr){
        await writeFile(nPath,nStr,'utf8');
    },
    //中文转unicode
    encodeUnicode(str) {  
        if(!str){
            return ''
        }
        var res = [];  
        for ( var i=0; i<str.length; i++ ) {  
        res[i] = ( "00" + str.charCodeAt(i).toString(16) ).slice(-4);  
        }  
        return "\\u" + res.join("\\u");  
    },
    //unicode转中文
    decodeUnicode(str) {  
        str = str.replace(/\\u/g, "%u");  
        return unescape(str);  

        str = eval("'" + str + "'"); // "我是unicode编码" 
        str = unescape(str.replace(/\\u/g, "%u"));
        return str
    },
    //初始化
    init(k){
        this.getXls(k)
    },
}