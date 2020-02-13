var fontGenerate = require('webfonts-generator');
var path = require('path');
var fileSave = require('file-save');
var chalk = require('chalk');
var crypto = require('crypto');
var fs = require('fs');
const Logger = console.log;
const  upperCamelCase = require('uppercamelcase');


/**
 *
 * @param svgFiles | Array 字体文件的
 * @param dist | String 字体图标的基础目录
 * @param options
 * @returns {Promise<any>}
 */
function generateFonts(fontname, svgFiles,dist,options){
    if(!fontname){
        let cssFileName = (/(.*\/)?(.*).css$/.exec(options.style))[2];
        fontname = _upperCaseFirstLetter(cssFileName)
    }
    //校验文件名
    verifyNames(svgFiles);
    //生成字体图标
    return new Promise(function(resolve,reject){
        fontGenerate({
            fontName: fontname,
            css:true,
            // cssDest: path.join(dist, options.style),
            cssTemplate:path.join(__dirname,'../hbs/css.hbs'),
            cssFontsUrl : './',
            fontHeight : 512,
            writeFiles: false,
            types : ['ttf','woff'],
            templateOptions : {
                baseTag:"i",
                classPrefix:"ct-font-"
            },
            dest: dist,
            files: svgFiles
        },function(err, result){
            if(err){
                reject(err)
            }else{
                let genFiles = ['字体图标创建成功！'];
                genFiles = genFiles.concat(genFonts(result));
                genFiles = genFiles.concat(genStyle(result));
                stdout(genFiles, 'green');
            }
        })
    })

    /**
     * 通过字体图标文件流创建字体图标的css样式表
     * @param result : webfonts-generator 文件流
     * @returns {string[]} 返回创建的文件
     */
    function genStyle(result){
        let cssPath = (/.+\//.exec(options.style))[0];
        let relativeFontUrl = path.relative(cssPath,options.fontPath);
        relativeFontUrl = relativeFontUrl.replace(/\\/g,'/');
        let cssFile = path.resolve(dist,options.style);
        const hash = calcHash([result.ttf, result.woff]);
        var scssContent = result.generateCss({ttf:genFontUrl(relativeFontUrl, 'ttf', hash),woff:genFontUrl(relativeFontUrl, 'woff', hash)});
        fileSave(cssFile).write(scssContent);
        return [cssFile];
    }

    /**
     * make 字体相对scss的文件链接
     * @param relativeFontUrl  字体相对路径
     * @param type 字体后缀名
     * @param hash hash
     * @returns {string}
     */
    function genFontUrl(relativeFontUrl, type, hash){
        if(relativeFontUrl === ''){
            return `${fontname}.${type}?${hash}`
        } else {
            return `${relativeFontUrl}/${fontname}.${type}?${hash}`
        }
    }

    /**
     * 通过字体图标文件流创建字体文件
     * @param result : webfonts-generator 文件流
     * @returns {string[]} 返回创建的文件
     */
    function genFonts(result){
        let fontDestfolder = path.resolve(dist,options.fontPath);
        let ttfFile = `${fontDestfolder}/${fontname}.ttf`;
        let woffFile = `${fontDestfolder}/${fontname}.woff`;
        fileSave(ttfFile).write(result.ttf);
        fileSave(woffFile).write(result.woff);
        return [ttfFile,woffFile]
    }

    /**
     * 计算文件的hash值
     * @param files : Array
     * @returns {PromiseLike<ArrayBuffer>}
     */
    function calcHash(bufferArray) {
        var hash = crypto.createHash('md5')
        bufferArray.forEach(function(buffer) {
            hash.update(buffer)
        })
        return hash.digest('hex')
    }
}


/**
 *
 * @param logsArray
 */
function stdout(logsArray = [], color = 'green'){
    logsArray.forEach(log => {
        Logger(chalk[color](log))
    })
}


/**
 * 校验文件名格式是否正确
 * @param svgFiles | Array
 */
function verifyNames(svgFiles){
    const NAMING_SPECIFICATION = /^[a-z1-9\-]+$/ ;
    svgFiles.forEach(function (file) {
        var filename = path.parse(file).name
        if(!NAMING_SPECIFICATION.test(filename)){
            throw new Error(`文件：${file}，字体文件命名不规范，只能由小写字母、数字和中划线组成`)
        }
    })
}

/**
 * 大驼峰解构
 * @param words
 * @returns {string}
 * @private
 */
function _upperCaseFirstLetter(words){
    let lowerCaseWords = upperCamelCase(words).toLowerCase();
    return lowerCaseWords.charAt(0).toUpperCase() + lowerCaseWords.slice(1)
}

module.exports = generateFonts
