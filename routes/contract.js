// require( 'db.js' );
var etherUnits = require("../lib/etherUnits.js");
var BigNumber = require('bignumber.js');
var Tx = require('ethereumjs-tx');
var http = require("http");
// var mongoose = require( 'mongoose' );
// var Schema   = mongoose.Schema;

var web3Conf;
var web3;
var debugMode;
var petContractABI;
var contractBytes;
var petContract;//合约实例
var contractAddress;

var delegates;
var MaxEstimateGas;
var SecretSigner;
// var Croupier;
var delegateIndex = 0;//代理商轮流发交易
var zeroStr64 = "0000000000000000000000000000000000000000000000000000000000000000";
var fStr64 = "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
var Wei = 1*10**18;
var refreshTime = 5000;

var contractBlock = 16521575;//t g默认0，合约发布时的区块，部署完成后写死
// const eventLogHost = "http://192.168.199.214/";//t g
const eventLogHost = "http://localhost/";
// const eventLogHost = "http://etzscan.com/";//t

const ABI_OnPlaceBet = "0xcd3f64138f645ba9a63e71a378025bfda5a3d31f1e25bb744fc90e7cf6fdc7a8";
const ABI_SettleBetPayment = "0x6e73056f04e59b9775a04fe9801a805fbf3172ed588c7168fcc021c00ea75f79";
const ABI_LogRefundBet = "0x83798b5c761afdb819ea1f3ccab12f29f98ed03b67b599c0570c03d36259a07e";
const MAX_HISTORY_ITEM_NUM = 50;//开奖记录列表的最大长度
const moduloIndexDic = {
    "0x0000000000000000000000000000000000000000000000000000000000000002":0,//投硬币
    "0x0000000000000000000000000000000000000000000000000000000000000006":1,//投单色子
    "0x0000000000000000000000000000000000000000000000000000000000000024":2,//投双色子
    "0x0000000000000000000000000000000000000000000000000000000000000064":3//过山车
}
var commitDic = {};//记录开奖随机数和blockNumber

//缓存
//押注中奖历史列表，最多50条
var historyList = [];
historyList[0] = [];//投硬币
historyList[1] = [];//投单色子
historyList[2] = [];//投双色子
historyList[3] = [];//过山车

var historyStartBlock = 0;//缓存中日志的最小blockNumber，用于服务重启时还原交易记录
var waitSettleBetList = [];//下注后等待开奖列表

// mongoose.connect('mongodb://etzscan:etz123@localhost:39462/BetDB');
// mongoose.set('debug', false);
// var DiceHistory = new Schema(
//     {
//         "address": {type: String, index: true},
//         "txHash": {type: String, index: true},
//         "blockNumber": {type: Number, index: true},
//         "timestamp": Number,
//         "gambler": String,
//         "modulo": Number,
//         "mask": String,
//         "amount": Number,

//         "topics": Array,
//         "data": String,

//         "gasUsed":Number,
//         "gasPrice": Number
//     });
// mongoose.model('DiceHistory', DiceHistory);

//初始化web3
module.exports.onWeb3 = async function(){
    web3Conf = require("../web3Config");
    web3 = web3Conf.web3;
    debugMode = web3Conf.debugMode;
    MaxEstimateGas = web3Conf.MaxEstimateGas;//所有交易中最大估算gas
    delegates = web3Conf.delegates;
    SecretSigner = web3Conf.SecretSigner;
    // Croupier = web3Conf.Croupier;

    petContractABI = web3Conf.petContractABI;
    contractBytes = web3Conf.contractBytes;
    contractAddress = web3Conf.contractAddress;
    petContract = web3Conf.petContract;//合约实例

    //设置coo
    if(petContract){
        petContract.methods.cooAddress(0).call((err, addr)=>{
            if(err){
                var _res = {};
                _res.end=function(msg){}
                setCOO(_res);
            }
        });

    }

    initLastSettleBlock();
}

//对应solidity中的encodePacked(num)
function encodePacked(...params){
    var resultHash = "0x";
    for(var i=0; i<params.length; i++){
        var param16Str = params[i].toString(16);
        if(param16Str.indexOf("0x")==0)
            param16Str=param16Str.substr(2);
        param16Str = zeroStr64.substr(0,64-param16Str.length)+param16Str;//注释掉，使用紧凑压缩
        resultHash += param16Str
    }
    // console.log("encodePacked:",resultHash);
    return resultHash;
}

//对应solidity中的keccak256(bytes)
function hash(encode16Str){
    hashStr = web3.utils.keccak256(encode16Str, {encoding: 'hex'});
    // hashStr = web3.utils.sha3(encode16Str, {encoding: 'hex'});
    return hashStr;
}

//获取主合约方法调用的sha3
function encodeABI(methodName, ...param){
    var funcObj;
    for(var i=0; i<petContractABI.length; i++){
        funcObj = petContractABI[i];
        if(funcObj.name == methodName && funcObj.type=="function"){
            break;
        }
    }
    return encodeSha3(funcObj, ...param);
}

//获取调用合约方法所需要的inputData.
//param必须都是字符串类型(数字类型的转成字符串再传入)
function encodeSha3(funcObj, ...param){
    if(!funcObj)
        return "";

    //系列化方法名
    var methodStr = funcObj.name+"(";
    if(funcObj.inputs){
        for(var j=0; j<funcObj.inputs.length; j++){
            methodStr = methodStr+funcObj.inputs[j].type
            if(j<funcObj.inputs.length-1){
                methodStr = methodStr+",";
            }
        }
    }
    methodStr = methodStr+")";
    var methodCode = web3.utils.sha3(methodStr);
    methodCode = methodCode.substr(0,10);
    var inputData = methodCode;
    var paramType;
    var preStr;
    //追加参数
    var dynamicData = "";
    for(var k=0; k<param.length; k++){
        //console.log("typeof(param[k]):"+typeof(param[k]));
        paramType = typeof(param[k]);
        if(paramType=="number"){//转成16进制字符串
            if(param[k]>=0){
                param[k] = param[k].toString(16);
                preStr = zeroStr64.substr(0,64-param[k].length);
            }else{
                negativeVHx = (-param[k]).toString(16);
                carryV = "0x1";//negativeVHx的十六进制进位值
                for(var i=0; i<negativeVHx.length; i++){
                    carryV = carryV+"0";
                }
                param[k] = (parseInt(carryV)+param[k]).toString(16);
                //param[k] = "f";
                preStr = fStr64.substr(0,64-param[k].length);
            }
        }else if(paramType=="string"){//最长32个字符
            if(param[k].indexOf("0x")==0){
                param[k] = param[k].substr(2);
                preStr = zeroStr64.substr(0,64-param[k].length);
            }else{
                var elemData = "";
                for(var n=0; n<param[k].length; n++){
                    var elem = param[k].charCodeAt(n).toString(16);
                    elemData += elem;
                }

                //系列化偏移量
                param[k]=(funcObj.inputs.length*32+dynamicData.length/2).toString(16);
                preStr = zeroStr64.substr(0,64-param[k].length);

                elemData += zeroStr64.substr(0,64-elemData.length);
                //系列化数组长度
                var elemNum = param[k].length.toString(16);
                dynamicData = dynamicData + zeroStr64.substr(0,64-elemNum.length)+elemNum;
                //系列化数组元素
                dynamicData = dynamicData + elemData;

            }

        }else if(paramType=="boolean"){
            preStr = "";//t待补充
        }else if(paramType=="object"){
            if(Array.isArray(param[k])){//数组类型只记偏移量，具体元素值通过dynamicData追加到inputData后面
                var elemData = "";
                if(funcObj.inputs[k].type.indexOf("int")!=-1){//整型
                    for(var n=0; n<param[k].length; n++){
                        var elem = parseInt(param[k][n]).toString(16);
                        elemData += (zeroStr64.substr(0,64-elem.length)+elem);
                    }
                }else if(funcObj.inputs[k].type=="address[]"){
                    for(var n=0; n<param[k].length; n++){
                        var elem = String(param[k][n]);
                        if(elem.indexOf("0x")==0){
                            elem = elem.substr(2);
                        }
                        elemData += (zeroStr64.substr(0,64-elem.length)+elem);
                    }
                }else{
                    elemData = "";//t待补充
                }
                //系列化偏移量
                param[k]=(funcObj.inputs.length*32+dynamicData.length/2).toString(16);
                preStr = zeroStr64.substr(0,64-param[k].length);

                //系列化数组长度
                var elemNum = param[k].length.toString(16);
                dynamicData = dynamicData + zeroStr64.substr(0,64-elemNum.length)+elemNum;
                //系列化数组元素
                dynamicData = dynamicData + elemData;

            }else{
                preStr = "";//t待补充
            }
        }else{
            preStr = "";//t待补充
        }
        inputData = inputData+preStr+param[k];
    }
    inputData = inputData+dynamicData;
    // console.log("input:", inputData);
    return inputData;
}

//单位转出ether,保留三位小数
function restrictValue(bigNumberValue){
    // var returnValue = bigNumberValue.div(etherUnits.getValueOfUnit('ether'));
	// return Number(returnValue.toString(10));
    if(typeof(bigNumberValue)=="string")
        bigNumberValue = Number(bigNumberValue);
    return bigNumberValue/1000000000000000000;
}

//同步返回的数据参数
function makeResult(params, data){
    var result = {};
    result.params = params;
    result.data = data;
    return JSON.stringify(result);
}

function toArray(arrayInput){
    if(!arrayInput){
        return null;
    }
    if(arrayInput.indexOf("[")==0){
        arrayInput = arrayInput.substr(1);
        if(arrayInput.indexOf("]")==arrayInput.length-1)
            arrayInput = arrayInput.substr(0, arrayInput.length-1);
        else{
            return null;
        }
    }
    if(arrayInput == "")
        return [];
    else
        return arrayInput.split(",");
}


//=========================================调用合约===========================================
//返回 uint commitLastBlock, uint commit, bytes32 r, bytes32 s
module.exports.getSign = function(req, res){
    web3.eth.getBlockNumber(async (err, latestBlock)=>{
        if(err){
            res.end("");
            return;
        }

        var commitLastBlock = latestBlock+60;
        // var randNum = Number(String(Math.random()).substr(2));//542454872110//截取小数点后面的数字
        var randNum = Number(String(Math.random()).substr(3)).toString() + String(Math.random()).substr(3) + String(Math.random()).substr(3);
        var commit = hash(encodePacked(dec2hex(randNum)));
        commitDic[commit] = {"reveal":randNum}
        var dataToSign = hash(encodePacked(commitLastBlock, commit));
        var signObj = web3.eth.accounts.sign(dataToSign, delegates[delegateIndex].privateKeyStr);
        var result = {"commitLastBlock":commitLastBlock, "commit":commit, "v":parseInt(signObj.v), "r":signObj.r, "s":signObj.s};
        res.end(JSON.stringify(result));
    })
}

module.exports.jackpot = async function(req, res){
    if(!checkRequest("", req, res))
        return;

    var params = req.query.params;
    var tokens = await petContract.methods.jackpotSize().call();
    // console.log("txHash:",txHash);
    res.end(makeResult(params, restrictValue(Number(tokens))));
}

/*余额查询
*/
module.exports.contractBalance = function(req, res){
    if(!checkRequest("", req, res))
        return;

    var params = req.query.params;
    var tokens = petContract.contractBalance();
    // console.log("txHash:",txHash);
    res.end(makeResult(params, restrictValue(tokens)));
}

module.exports.secretSigner = function(req, res){
    if(!checkRequest("", req, res))
        return;
    var params = req.query.params;
    res.end(makeResult(params, petContract.secretSigner()));
}

//手动开奖
module.exports.refundBet = async function(req, res){
    if(!checkRequest("", req, res))
        return;
    var commit = req.query.commit;
    var inputData = encodeABI("refundBet", commit);
    await sendRawTransaction(null, "", null, inputData);
}

/*提现
Account//交易发起人地址
Amount//提现额度
*/
module.exports.withdrawFunds = function(req, res){
    var methodName = "withdrawDirect";
    if(!checkRequest(methodName, req, res))
        return;
    var params = req.query.params;
    var Address = delegates[0].account//SecretSigner;//地址 写死 req.query.Address
    var Amount = Number(req.query.Amount)*Wei//提现额度
    var safe = parseInt(req.query.safe);
    var inputData = encodeABI("withdrawFunds", Address, Amount, safe);
    delegateIndex = 0;//强制使用合约Owner
    sendRawTransaction(res, methodName, params, inputData);
}

module.exports.addCOO = function(req, res){
    setCOO(res);
}

module.exports.approveNextOwner = function(req, res){
    if(!checkRequest("", req, res))
        return;
    var address = req.query.address;
    var inputData = encodeABI("approveNextOwner", address);
    sendRawTransaction(null, "", null, inputData);
}
module.exports.acceptNextOwner = function(req, res){
    if(!checkRequest("", req, res))
        return;
    var inputData = encodeABI("acceptNextOwner");
    sendRawTransaction(null, "", null, inputData);
}

//========================================日志查询==============================
//定时查询下注日志，并对新下注开奖
module.exports.historyLog = function(req, res){
    var params = req.query.params;
    var gameIndex = req.query.gameIndex;
    var lastCommit = req.query.lastCommit;
    var address = req.query.address;

    var logList = historyList[gameIndex];
    var newLogList = [];
    for(var i=0; i<logList.length; i++){
        if(logList[i].commit == lastCommit)
            break;

        if(address){
            if(address==logList[i].gambler){
                newLogList.push(logList[i]);
            }
        }else{
            newLogList.push(logList[i]);
        }
    }
    res.end(makeResult(params, newLogList));
}

//服务启动时初始historyStartBlock
function initLastSettleBlock(){
    historyStartBlock = contractBlock;
    console.log("start historyStartBlock:",historyStartBlock);
    httpReq(eventLogHost+"publicAPI?module=logs&action=getLogs&address="+contractAddress+"&fromBlock="+historyStartBlock+1+"&topics="+ABI_SettleBetPayment+"&limit=15&returnFilters=blockNumber,-_id",
    (eventLogList)=>{
        eventLogList = JSON.parse(eventLogList);
        if(!eventLogList || eventLogList.status!=1){
                if(eventLogList)
                    console.log("initLastSettleBlock getLogs message:", eventLogList.message);
                return;
            }
            if(eventLogList.result.length>0){
                historyStartBlock = eventLogList.result[eventLogList.result.length-1].blockNumber;
            }
            startRefreshLog();
        })
}

//每5秒更新一次缓存
var refreshLogHandle = -1;
function startRefreshLog(){
    if(refreshLogHandle!=-1)
        clearInterval(refreshLogHandle);
    var newItemDic=[];
    newItemDic[0]=[];
    newItemDic[1]=[];
    newItemDic[2]=[];
    newItemDic[3]=[];

    refreshLogHandle = setInterval(function(){
    httpReq(eventLogHost+"publicAPI?module=logs&action=getLogs&address="+contractAddress+"&fromBlock="+(historyStartBlock+1)+"&returnFilters=txHash,blockNumber,topics,data,-_id",
    async (eventLogList)=>{
        eventLogList = JSON.parse(eventLogList);
        if(!eventLogList || eventLogList.status!=1){
            if(eventLogList)
                console.log("startRefreshLog getLogs message:", eventLogList.message);
            return;
        }
        //更新最后开奖区块
        if(eventLogList.result.length>0){
            historyStartBlock = eventLogList.result[0].blockNumber;
            // console.log(eventLogList.result);
        }
        //从所有相关log中提取下注和开奖log
        var placeBet = [];//下注列表
        var settleBetList = [];//开奖列表
        for(var i=0; i<eventLogList.result.length; i++){
            if(eventLogList.result[i].topics[0]==ABI_OnPlaceBet){//下注事件
                placeBet.push(eventLogList.result[i]);
            }else if(eventLogList.result[i].topics[0]==ABI_SettleBetPayment || eventLogList.result[i].topics[0]==ABI_LogRefundBet){//开奖事件
                settleBetList.push(eventLogList.result[i]);
            }
        }
        //合成最终开奖列表和待押注列表
        waitSettleBetList = placeBet.concat(waitSettleBetList);
        var newHistoryItems = [];
        for(var j=0; j<settleBetList.length; j++){
            var settleBetItem = settleBetList[j];
            for(var k=0; k<waitSettleBetList.length; k++){
                var waitSettleBetItem = waitSettleBetList[k];
                if(settleBetItem.topics[1] == waitSettleBetItem.topics[1]){//commit
                    if(settleBetItem.topics[2] != waitSettleBetItem.topics[2]){
                        console.log("相同的commit，gambler却不同：", settleBetItem.topics[2]," ", waitSettleBetItem.topics[2]);
                        continue;
                    }
                    //根据游戏列表转移到最终开奖列表
                    if (settleBetItem.topics[0]==ABI_SettleBetPayment) {
                      var modulo = waitSettleBetItem.topics[3];
                      var betMask = Number(waitSettleBetItem.data.substr(0,66));//topic[4]押注对象
                      var commitLastBlock = Number("0x"+waitSettleBetItem.data.substr(130,64))+120;//topic[6] 120是开奖最大有效延迟区块
                      var totalWin = Number(settleBetItem.topics[3])/Wei;
                      var betWin = Number(settleBetItem.data.substr(0,66))/Wei;//topic[4]
                      var secretNumber = Number("0x"+settleBetItem.data.substr(66,64));//topics[5]
                      var entropy = "0x"+settleBetItem.data.substr(130,64);//topic[6]
                      var jeckpot = totalWin-betWin;
                      if(jeckpot < 0.00001)//默认没中奖会给1wei
                          jeckpot = 0;
                      var historyItem = {};
                      historyItem.commit = waitSettleBetItem.topics[1];
                      historyItem.gambler = "0x"+waitSettleBetItem.topics[2].substring(26,66);
                      historyItem.mask = betMask;
                      historyItem.betAmount = (Number("0x"+waitSettleBetItem.data.substr(66,64))/Wei).toFixed(2);//topics[5]//押注金额
                      historyItem.totalWin= totalWin.toFixed(2);//包括大奖
                      historyItem.betWin= betWin.toFixed(2);
                      historyItem.betTX = waitSettleBetItem.txHash;
                      historyItem.settleTX = settleBetItem.txHash;
                      historyItem.secretNumber = secretNumber;
                      historyItem.sha3_secretNumber = hash(encodePacked(secretNumber));
                      // historyItem.sha3_betBlock = hash(encodePacked(commitLastBlock));
                      historyItem.commitLastBlock = commitLastBlock;
                      historyItem.sha3_betBlockHash_secretNumber = entropy;
                      historyItem.diceResultIndex = Number("0x"+settleBetItem.data.substr(194,64));//topics[7];
                      historyItem.jeckpot = jeckpot.toFixed(3);
                      // historyList[moduloIndexDic[modulo]].unshift(historyItem);
                      newItemDic[moduloIndexDic[modulo]].push(historyItem);
                    }
                    //删除waitSettleBetList第k个元素
                    var tempArr = [];
                    if(k>0){
                        tempArr = tempArr.concat(waitSettleBetList.slice(0,k));
                    }
                    if(k<waitSettleBetList.length-1){
                        tempArr = tempArr.concat(waitSettleBetList.slice(k+1));
                    }
                    waitSettleBetList = tempArr;
                    break;
                }
            }
        }
        //将新item加入缓存
        for(var e=0; e<newItemDic.length; e++){
            if(newItemDic[e].length>0){
                historyList[e] = newItemDic[e].concat(historyList[e]);
                newItemDic[e] = [];
            }
        }

        //删除超出长度的记录
        for(var n=0; n<historyList.length; n++){
            if(historyList[n].length>MAX_HISTORY_ITEM_NUM)
                historyList[n].length = MAX_HISTORY_ITEM_NUM;
        }

        //t对latestBlock>=commitLastBlock的未开奖的押注开奖

        // var latestBlock = await web3.eth.getBlockNumber();
        for(var m=0; m<waitSettleBetList.length; m++){
            if(waitSettleBetList[m].hasDeal)
                continue;
            waitSettleBetList[m].hasDeal = true;
            var commit = waitSettleBetList[m].topics[1];//commit
            var commitDicObj = commitDic[commit];
            var inputData;
            let methodName;
            if(commitDicObj){
                // inputData = encodeABI("settleBet", commitDicObj.reveal, waitSettleBetList[m].blockNumber);
                inputData = petContract.methods["settleBet"](commitDicObj.reveal, waitSettleBetList[m].blockNumber).encodeABI();
                methodName = "settleBet";
            }else{
                console.log("服务器重启前未开奖的押注，取消押注，m:",m, " commit:",commit);
                //删除waitSettleBetList第m个元素
                var tempArr = [];
                if(m>0){
                    tempArr = tempArr.concat(waitSettleBetList.slice(0,m));
                }
                if(m<waitSettleBetList.length-1){
                    tempArr = tempArr.concat(waitSettleBetList.slice(m+1));
                }
                waitSettleBetList = tempArr;
                inputData = encodeABI("refundBet", commit);
                console.log("settle commit:",commit);
                methodName = "refundBet";
            }
            await sendRawTransaction(null, methodName, null, inputData);
        }

        // //更新最后开奖区块
        // if(settleBetList.length>0){
        //     historyStartBlock = settleBetList[0].blockNumber;
        // }

    })

  }, refreshTime);
}

//调整log更新速度
var lowSpeedTime = 0;
setInterval(async () => {
    if(!petContract)
        return;
    var undealBetNum = await petContract.methods.undealBetNum().call();
        if(undealBetNum<1)
        {
            lowSpeedTime++;
            if(lowSpeedTime>3){//连续3次没人下注，则降低更新速度
                refreshTime = 3000;
                startRefreshLog();
            }
        }else{
            if(refreshTime!=2000){
                lowSpeedTime = 0;
                refreshTime = 1000;
                startRefreshLog();
            }
        }
}, 10000);

//设置已经部署的合约地址，如果以前没部署过请使用deployContract请求来部署
//@param addr：主合约地址
//@param subAddr：比赛合约地址
module.exports.setContractAddr = function(req, res){
    var addr = req.query.addr;
    if(addr=="" || addr==null){
        res.end("addr不能为空");
        return;
    }
    contractAddress = addr;
    //获取合约实例
    petContract = new web3.eth.Contract(petContractABI, contractAddress);
    res.end("addr setting finish !");
}

//客户端主动查询交易是否已经完成（因区块链繁忙导致的超时交易）
//0表示交易成功，1表示失败，2表示超时需要延后通过接口checkTX主动查询
module.exports.checkTX = async function(req, res){
    var txHash = req.query.txHash;
    var txReceipt = await web3.eth.getTransactionReceipt(txHash);
    if(txReceipt==null)
    {
        res.end("2");
    }else{
        if(!txReceipt.root){
            res.end("0");
        }else{
            res.end("1");
        }
    }
}

//更新nonce
//如果合约创建者账号被用于游戏外操作会导致nonce与游戏内不同步，需要重新从节点获取nonce
module.exports.updateNonce = async function(req, res){
    for(var i=0; i<delegates.length; i++){
        delegates[i].latestNonce = await web3.eth.getTransactionCount(delegates[i].account)-1;
        console.log(delegates[i].account, " : ", delegates[i].latestNonce);
        if(res)
            res.write(delegates[i].account + " : " + delegates[i].latestNonce);
    }
    if(res)
        res.end("");
}

//在线部署合约
module.exports.deployContract = function(req, res){
    if(contractAddress!=null){
        res.end("contract address exist. ");
        return;
    }
    if(contractBytes=="" || contractBytes==null)
    {
        res.end("contractBytes 不能为空");//需要在web3Config.js中写死
        return;
    }

    sendDeployTx(res, "mainContract");
}

//申请coin
module.exports.require_coin = function(req, res){
    var num = Number(req.query.num);//单位eth
    if(num==0 || isNaN(num)){
        res.end("num为大于0的数字");
        return;
    }
    num = num*1000000000000000000;//转成wei
    var address = req.query.address;
    address = address.replace(/(^\s*)|(\s*$)/g, "");
    address = address.replace(/\"/g, "");
    if(address.indexOf("0x")!=0)
        address = "0x"+address;
    // sendRawTransaction(res, "", null, "0x0", num, 0, address);
    delegateIndex = 0;//强制使用第一个代理
    sendRawTransaction(res, "", null, null, num, 0, address);
}


async function sendDeployTx(res, conctractFlag){
    var rawTx;
    var tx;
    var serializedTx;
    var _contractBytes;
    if(conctractFlag=="mainContract"){
        _contractBytes = contractBytes;
    }
    try{
        delegateIndex = 0;//强制使用第一个代理商账号
        rawTx = await makeRawTx(_contractBytes, 1000000000, 0, null);
        tx = new Tx(rawTx);

        tx.sign(delegates[delegateIndex].privateKey);
        serializedTx = tx.serialize();
    }catch(e){
        console.error("异常：",e);
        res.end("exception："+e.toString());
        return;
    }
    var rawData = "0x"+serializedTx.toString('hex');
    web3.eth.sendSignedTransaction(rawData, function(errMsg, txHash){
        if(errMsg==null){
            console.log("sendSignedTransaction txHash:",txHash);
            var txQuereyObj = makeTxQueryObj(conctractFlag, txHash, res, "");
            setTimeout(() => {
                tryGetDeployReceipt(txQuereyObj);
            }, 1000);
        }else{
            console.log(" errMsg:", errMsg);
            res.end(" errMsg:"+errMsg.toString());
        }
    })
}

var tryGetDeployReceipt = async function(txQuereyObj){
    txQuereyObj.tryNum++;
    if(txQuereyObj.tryNum>120)//最大尝试120次(两分钟)
    {
        txQuereyObj.res.end(txQuereyObj.methodName+"deploy time out!");
        txQuereyObj.res = null;
        txQuereyObj = null;
        return;
    }

    var txReceipt = await web3.eth.getTransactionReceipt(txQuereyObj.txHash);
            if(txReceipt==null)
            {
                setTimeout(() => {
                    tryGetDeployReceipt(txQuereyObj);
                }, 1000);
            }
            else if(txReceipt.hasOwnProperty("status") && txReceipt.status==0){
                txQuereyObj.res.end(txQuereyObj.methodName+" deploy fail !");
                txQuereyObj.res = null;
                txQuereyObj = null;
            }else if(txReceipt.hasOwnProperty("root") || txReceipt.hasOwnProperty("status") && txReceipt.status==1){//部署成功，获取合约对象
                    contractAddress = txReceipt.contractAddress;
                    contractBlock = txReceipt.blockNumber;
                    petContract = new web3.eth.Contract(petContractABI, contractAddress);
                    console.log("部署合约"+txQuereyObj.methodName+"成功!\n合约地址："+contractAddress);
                    txQuereyObj.res.write("deploy '"+txQuereyObj.methodName+"' ok!\n contract addres:"+contractAddress, encoding="utf-8");
                    //合约部署完成
                    //设置主合约中的分支合约地址
                    // var inputData = encodeABI("setSubContractAddress",subAddress);
                    // delegateIndex = 0;//强制使用第一个代理商账号
                    // await sendRawTransaction(txQuereyObj.res, "", null, inputData);
                    //添加其它COO角色
                    setCOO(txQuereyObj.res);
                    //设置CFO
                    // setSecretSigner(txQuereyObj.res);

                    console.log("\ndeploy finish !");
                    txQuereyObj.res = null;
                    txQuereyObj = null;
            }else{
                setTimeout(() => {
                    tryGetDeployReceipt(txQuereyObj);
                }, 2500);
            }
}

var checkRequest = function(asynCallBackName, req, res){
    if(!petContract){
        console.log("正等待合约实例化，请稍后...");
        res.end("waiting for contract init...");
        var params = req.query.params;
        return false;
    }
    //t方便测试临时关闭
    // if(req.referer!="wanlege"){
    //     res.setEncoding('utf-8');
    //     console.log("Referer不正确：", req.originalUrl);
    //     res.end("x");
    //     var params = req.query.params;
    //     callBusinessServer(asynCallBackName, params, "0x0", 1);//确认交易失败
    //     return false;
    // }
    return true;
}


//设置COO，需要确保主合约已经部署
var setCOO = async function(res){
    if(!petContract)
        return;
    //设置COO
    for(var j=1; j<delegates.length; j++){
        inputData = encodeABI("addCOO",delegates[j].account);
        delegateIndex = 0;//强制使用第一个代理商账号
        await sendRawTransaction(res, "", null, inputData);
    }
}

//设置SecretSigner，需要确保主合约已经部署
var setSecretSigner = function(res){
    if(!petContract)
        return;

    var inputData = encodeABI("setSecretSigner",SecretSigner);
    delegateIndex = 0;//强制使用第一个代理商账号
    sendRawTransaction(res, "", null, inputData);
}

//------------------------------------------------------------------------------------------

var makeTxQueryObj = function(methodName, txHash, res, params){
    var txQueryObj = {"methodName":methodName, "txHash":txHash, "tryNum":0, "res":res, "params":params, "msg":""};
    return txQueryObj;
}


var makeRawTx = async function(inputData, _gasPrice, _value, _to){
    // console.log("from:"+delegates[delegateIndex].account);
    _gasPrice = Number(_gasPrice);
    var _gas = 20000000;
    var _gasLimit;
    // _gas = MaxEstimateGas;//estimateGas(inputData, _to);//
    try{
        var estimateObj = {nonce: delegates[delegateIndex].latestNonce+1, from:delegates[delegateIndex].account, to: _to, chainId:90};
        if(inputData)
            estimateObj.data=inputData;
        _gas = await web3.eth.estimateGas(estimateObj);
    }catch(e){
        // _gas = 20000000;
        console.log("estimateGas err: ",e);
        throw e
    }
    _gasLimit = parseInt(_gas*1.5);//增加0.5倍的额度避免估算不准
    // web3.eth.estimateGas({nonce: delegates[delegateIndex].latestNonce+1, from:delegates[delegateIndex].account, to: _to, data:"0x00", chainId:9527}).then(gas=>{
    //     _gas = gas;
    //     console.log("_gas:", gas);
    // })
    console.log("_gas:", _gas);
    if(_gasPrice<=0)
        _gasPrice = 1;
    if(_value<0)
        _value = 0;
    var _nonce = delegates[delegateIndex].latestNonce+1;
    var _chainID = 90;
    var rawTx = {
        nonce: "0x"+_nonce.toString(16),
        gas: "0x"+_gas.toString(16),
        gasLimit: "0x"+_gasLimit.toString(16),
        gasPrice: _gasPrice,
        from: delegates[delegateIndex].account,
        to: _to,
        value: "0x"+_value.toString(16),
        chainId:"0x"+_chainID.toString(16)
    }
    if(inputData){
        rawTx.data = inputData;
    }
    delegates[delegateIndex].latestNonce++;
    console.log("_gasPrice:", _gasPrice);
    // console.log("latestNonce:",delegates[delegateIndex].latestNonce);
    return rawTx;
}
var willSendTX = [];
/*
用私钥发送交易
@param inputData: 以0x开头，第一个参数是方法名，4位16进制(8字节)；其它参数分别转成64位16进制(去掉0x)
*/
var sendRawTransaction = async(res, methodName, params, inputData, value, gasPrice, to) => {
    if(res)
        res.end("");
    gasPrice = 1000000000;
    // if(!gasPrice)
        // gasPrice = await web3.eth.getGasPrice();//18000000000

    if(!value)
        value = 0;
    var rawTx;
    var tx;
    var serializedTx;
    try{
        if(to == undefined){
            to = contractAddress;
        }
        rawTx = await makeRawTx(inputData, gasPrice, value, to);
        tx = new Tx(rawTx);

        tx.sign(delegates[delegateIndex].privateKey);
        serializedTx = tx.serialize();
        //更新代理商
        delegateIndex++;//t 注释暂时只用一个代理商
        if(delegateIndex>=delegates.length)
        {
            delegateIndex = 0;
        }
    }catch(e){
        console.error("异常：",e);
        return;
    }
    var rawData = "0x"+serializedTx.toString('hex');
    willSendTX.push({rawData: rawData, methodName: methodName});
    // web3.eth.sendSignedTransaction(rawData, function(errMsg, txHash){
    //     if(errMsg==null){
    //         console.log("sendSignedTransaction methodName:"+methodName+" txHash:",txHash);
    //     }else{
    //         console.log(methodName+" errMsg:", errMsg);
    //         if(errMsg.toString().toLowerCase().indexOf("nonce too low")!=-1){
    //             //更新nonce
    //             exports.updateNonce(null, null);
    //         }
    //     }
    // })
    // web3.eth.sendSignedTransaction(rawData).on('receipt', console.log);
}

var intervalMakeTX = () => {
  if (willSendTX.length>0) {
    let data = willSendTX.shift();
    web3.eth.sendSignedTransaction(data.rawData, function(errMsg, txHash){
        if(errMsg==null){
            console.log("sendSignedTransaction methodName:"+data.methodName+" txHash:",txHash);
        }else{
            console.log(data.methodName+" errMsg:", errMsg);
            if(errMsg.toString().toLowerCase().indexOf("nonce too low")!=-1){
                //更新nonce
                exports.updateNonce(null, null);
            }
        }
    })
  }
}
setInterval(intervalMakeTX, 1000)

function httpReq(url, cb){
    req = http.request(url, function(res) {
            var respData="";
            res.setEncoding('utf8');
            res.on('data', function(chunk) {
                if(cb)
                    respData+=chunk;
              //数据拼接
            }).on('end', function() {
              //数据处理
              if(cb){
                  cb(respData);
              }
            }).on('error', function(err) {
              //访问的错误处理，注意，这里是无法得到类似于无法连接的错误
              console.log(err.toString());
            });
    });
    req.on('error', function(err){
            //错误处理，处理res无法处理到的错误
            console.log(err.toString());
    });
    req.end();
}

function dec2hex(str){ // .toString(16) only works up to 2^53
    var dec = str.toString().split(''), sum = [], hex = [], i, s
    while(dec.length){
        s = 1 * dec.shift()
        for(i = 0; s || i < sum.length; i++){
            s += (sum[i] || 0) * 10
            sum[i] = s % 16
            s = (s - sum[i]) / 16
        }
    }
    while(sum.length){
        hex.push(sum.pop().toString(16))
    }
    return hex.join('')
}
