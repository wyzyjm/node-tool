const ejsExcel=require('ejsexcel');
const fs = require('fs');
const {promises: {readFile,writeFile,readdir,stat}} = require('fs');
const moment = require('moment');
const path = require('path');
const ELE_PATH=path.join(__dirname, '../elements/');

module.exports={
    //初始化
    init(){
        this.testgetXls()
    },
    //读取现有中文词条文件生成待翻译文件
    async test(data){
        var _=this
        //调用文件遍历方法
        let comps = await readdir(ELE_PATH);
        let i18nList=[]
        await Promise.all(comps.map(async (comp)=>{
            let dirpath=ELE_PATH+comp;
            let stats=await stat(dirpath);
            if(stats.isDirectory()){
                let mockPath=dirpath+"/mockData.json",mockJson;
                try{
                    mockJson=JSON.parse(await readFile(mockPath));
                }catch(e){
                    mockJson={}
                }
                for(var i in mockJson.i18n){
                    var tmp = mockJson.i18n[i].trim()
                    if(i18nList.indexOf(tmp)==-1 && data.indexOf(tmp)==-1){
                        i18nList.push(tmp)
                    }
                }
            }
        }));
        let pcPath=path.join(__dirname, './vue/pc/');
        fs.readFile(pcPath+'zh_CN.js', "utf-8", function(error, response) {
            let res = response.replace("module.exports =","")
            res = JSON.parse(res)
            for(var i in res){
                if(i18nList.indexOf(res[i])==-1 && data.indexOf(res[i])==-1){
                    i18nList.push(res[i])
                }
            }
        });
        let moPath=path.join(__dirname, './vue/mo/');
        fs.readFile(moPath+'zh_CN.js', "utf-8", function(error, response) {
            let res = response.replace("module.exports =","")
            res = JSON.parse(res)
            for(var i in res){
                if(i18nList.indexOf(res[i])==-1 && data.indexOf(res[i])==-1){
                    i18nList.push(res[i])
                }
            }
        });
        _.testWright(i18nList)
    },
    //写入文件
    testWright(content){
        var fileName = moment().format('YYYY-MM-DD')
        var __dirname = path.resolve('./i18n/dist/'+fileName+'.xlsx');
        var __template = path.resolve('./i18n/template');
        const exlBuf = fs.readFileSync(__template + "/template1.xlsx");
        ejsExcel.renderExcel(exlBuf, content).then(function(exlBuf2) {
            fs.writeFileSync(__dirname,exlBuf2);
        }).catch(function(err) {
            console.error(err);
        });
    },
    //获取需要过滤的词条
    testgetXls(){
        let _=this;
        let data = []
        var filePath = path.resolve('./i18n/xls');
        try{
            let exBuf=fs.readFileSync(filePath+'/i18n.xlsx');
            ejsExcel.getExcelArr(exBuf).then(exlJson=>{
                let workBook=exlJson;
                let workSheets=workBook[0];
                if(workSheets){
                    workSheets.forEach((item,index)=>{
                        item.forEach((e,i)=>{
                            if(index!=0 && i==0){
                                data.push(e)
                            }
                        })
                    })
                }
                _.test(data)  
            }).catch(error=>{
                _.test(data)  
            });
        }catch(e){
            _.test(data)  
        }
    },
}