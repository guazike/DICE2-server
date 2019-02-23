
var Web3 = require('web3');
var web3;
var eth;

var providerURL = 'http://localhost:9646';
// var providerURL = 'http://35.183.62.96:9646';
var zeroStr64 = "0000000000000000000000000000000000000000000000000000000000000000";

var startTest = async function() {
    web3 = new Web3(new Web3.providers.HttpProvider(providerURL));
    console.log("web3 version", web3.version);
    eth = web3.eth;

        var commitLastBlock = 1196;//t 正式版改成+60
        var randNum = 542454872110;//Number(String(Math.random()).substr(2));//截取小数点后面的数字
        var commit = hash(encodePacked(randNum));
        var dataEncode = encodePacked(commitLastBlock, commit)
        var dataToSign = hash(dataEncode);
        //用私钥签名，对应的公钥是0xeB0E5B3c177c72235d07D8Daa6E7Ad8fE701E24a
        var signObj = web3.eth.accounts.sign(dataToSign, '0xa6abcae8af8089b782b90ee864da0912320d31a83306b740d1a843108e8cfa9f');
        var recoverAddr = await web3.eth.accounts.recover(dataToSign, '0x1b', signObj.r, signObj.s);
        var recoverAddr3 = await web3.eth.personal.ecRecover(dataToSign, signObj.signature);
        console.log("dataEncode:",dataEncode);
        console.log("dataToSign:",dataToSign);
        console.log("r:", signObj.r);
        console.log("s:", signObj.s);
        console.log("signature:",signObj.signature);

        console.log("recoverAddr:", recoverAddr);
        console.log("recoverAddr3:", recoverAddr3);

        var contractParams = "1,36,"+commitLastBlock+",\""+commit+"\","+parseInt(signObj.v)+",\""+signObj.r+"\",\""+signObj.s+"\"";
        console.log("contractParams:");
        console.log(contractParams);

        

}

function encodePacked(...params){
    var resultHash = "0x";
    for(var i=0; i<params.length; i++){
        var param16Str = params[i].toString(16);
        if(param16Str.indexOf("0x")==0)
            param16Str=param16Str.substr(2);
        param16Str = zeroStr64.substr(0,64-param16Str.length)+param16Str;//t 注释，使用紧凑压缩
        resultHash += param16Str
    }
    //console.log("encodePacked:",resultHash);
    return resultHash;
}

function hash(resultHash){
    // resultHash = web3.utils.sha3(resultHash, {encoding: 'hex'});
    resultHash = web3.utils.keccak256(resultHash, {encoding: 'hex'});
    return resultHash;
}

startTest();