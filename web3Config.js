// require( 'db.js' );
var etherUnits = require("./lib/etherUnits.js");
var BigNumber = require('bignumber.js');
var Web3 = require('web3');
var _web3;
var _eth;
// var mongoose = require( 'mongoose' );
// var Block     = mongoose.model( 'Block' );

//----------------------config--------------------
var contractBytes = "0x69010f0cf064dd592000006002908155600060055561050060409081526001608090815260a092909252600460c052600860e052601061010090815260206101205261014091909152610160829052610180526102006101a08190526104006101c08190526108006101e0526110009091526120006102205261400061024052618000610260526201000061028052620200006102a052620400006102c052620800006102e052621000006103005262200000610320526240000061034052628000006103605263010000006103805263020000006103a05263040000006103c05263080000006103e05263100000009052632000000061042052634000000061044052638000000061046052640100000000610480526402000000006104a0526404000000006104c0526408000000006104e0526200014490600790602462000240565b503480156200015257600080fd5b506000805433600160a060020a03199182168117835560098054600181019091557f6e1540171b6c0c960b71a7020d9f60077f6af931a8bbf590da0223dacf75c7af018054909216179055600460205260027f91da3fd0782e51c6b3986e9e672fd566868e71f3dbc2d6c2cd6fbb3e361af2a755603e7fc59312466997bb42aaaf719ece141047820e6b34531e1670dc1852a453648f0f55640ffffffffe7f724ad3d24f57aae4bebead5383879105ce62b9d5fa67d4343ae412b59bd7971d556064905260617f083fc81be30b6287dea23aa60f8ffaf268f507cdeac82ed9644e506b59c54ff055620002b9565b82805482825590600052602060002090810192821562000287579160200282015b8281111562000287578251829064ffffffffff1690559160200191906001019062000261565b506200029592915062000299565b5090565b620002b691905b80821115620002955760008155600101620002a0565b90565b611d8780620002c96000396000f3006080604052600436106100fb5763ffffffff7c01000000000000000000000000000000000000000000000000000000006000350416630340752f81146100fd5780630d2cbe131461011e57806341c0e1b51461013957806357246d231461014e5780636e911f931461017f5780637cee9ee8146101a95780637e0b9eea146101c9578063898aab43146101de5780638da5cb5b1461020857806394279f0214610239578063b539cd551461024e578063d06c54fb14610263578063d579fd4414610278578063d6d30a5114610299578063d9747f58146102b1578063df88126f146102c9578063e1fdb4b4146102de578063fbd668a9146102f6575b005b34801561010957600080fd5b506100fb600160a060020a036004351661030e565b34801561012a57600080fd5b506100fb6004356024356103e4565b34801561014557600080fd5b506100fb6105f1565b34801561015a57600080fd5b50610163610715565b604080516001608060020a039092168252519081900360200190f35b34801561018b57600080fd5b50610197600435610724565b60408051918252519081900360200190f35b6100fb60043560243560443560643560ff6084351660a43560c435610743565b3480156101d557600080fd5b50610197610e39565b3480156101ea57600080fd5b506100fb600160a060020a036004351660243560ff60443516610e3f565b34801561021457600080fd5b5061021d610fc5565b60408051600160a060020a039092168252519081900360200190f35b34801561024557600080fd5b50610197610fd4565b34801561025a57600080fd5b50610197610fdb565b34801561026f57600080fd5b506100fb610fe1565b34801561028457600080fd5b506100fb600160a060020a03600435166110c0565b3480156102a557600080fd5b506100fb6004356111b7565b3480156102bd57600080fd5b5061021d600435611340565b3480156102d557600080fd5b50610163611368565b3480156102ea57600080fd5b506100fb60043561137e565b34801561030257600080fd5b506100fb6004356115d5565b600054600160a060020a03163314610370576040805160e560020a62461bcd0281526020600482015260266024820152600080516020611d3c833981519152604482015260d160020a6537bbb732b91702606482015290519081900360840190fd5b600160a060020a038116151561038557600080fd5b600980546001810182556000919091527f6e1540171b6c0c960b71a7020d9f60077f6af931a8bbf590da0223dacf75c7af01805473ffffffffffffffffffffffffffffffffffffffff1916600160a060020a0392909216919091179055565b6000808080805b60095481101561043057600980548290811061040357fe5b600091825260209091200154600160a060020a03163314156104285760019150610430565b6001016103eb565b81151561043c57600080fd5b86604051602001808281526020019150506040516020818303038152906040526040518082805190602001908083835b6020831061048b5780518252601f19909201916020918201910161046c565b51815160001960209485036101000a019081169019919091161790526040805194909201849003909320600081815260089094529220600281015492995097509095505050438410905061054f576040805160e560020a62461bcd02815260206004820152603360248201527f736574746c6542657420696e207468652073616d6520626c6f636b206173207060448201527f6c6163654265742c206f72206265666f72652e00000000000000000000000000606482015290519081900360840190fd5b607883014311156105d0576040805160e560020a62461bcd02815260206004820152602260248201527f426c6f636b686173682063616e2774206265207175657269656420627920455660448201527f4d2e000000000000000000000000000000000000000000000000000000000000606482015290519081900360840190fd5b8286146105dc57600080fd5b6105e8858589896116c4565b50505050505050565b600054600160a060020a03163314610653576040805160e560020a62461bcd0281526020600482015260266024820152600080516020611d3c833981519152604482015260d160020a6537bbb732b91702606482015290519081900360840190fd5b600354608060020a90046001608060020a031615610707576040805160e560020a62461bcd02815260206004820152604860248201527f416c6c20626574732073686f756c642062652070726f6365737365642028736560448201527f74746c6564206f7220726566756e64656429206265666f72652073656c662d6460648201527f657374727563742e000000000000000000000000000000000000000000000000608482015290519081900360a40190fd5b600054600160a060020a0316ff5b6003546001608060020a031681565b600680548290811061073257fe5b600091825260209091200154905081565b60008481526008602052604081206003810154909190819081908190650100000000009004600160a060020a0316156107ec576040805160e560020a62461bcd02815260206004820152602160248201527f4265742073686f756c6420626520696e20612027636c65616e2720737461746560448201527f2e00000000000000000000000000000000000000000000000000000000000000606482015290519081900360840190fd5b34935060018b118015610800575060648b11155b1515610856576040805160e560020a62461bcd02815260206004820152601e60248201527f4d6f64756c6f2073686f756c642062652077697468696e2072616e67652e0000604482015290519081900360640190fd5b678ac7230489e800008410158015610878575069010f0cf064dd592000008411155b15156108ce576040805160e560020a62461bcd02815260206004820152601e60248201527f416d6f756e742073686f756c642062652077697468696e2072616e67652e0000604482015290519081900360640190fd5b60008c1180156108ec575060008b8152600460205260409020548c11155b1515610942576040805160e560020a62461bcd02815260206004820152601c60248201527f4d61736b2073686f756c642062652077697468696e2072616e67652e00000000604482015290519081900360640190fd5b438a101561099a576040805160e560020a62461bcd02815260206004820152601360248201527f436f6d6d69742068617320657870697265642e00000000000000000000000000604482015290519081900360640190fd5b60016040805190810160405280601c81526020017f19457468657265756d205369676e6564204d6573736167653a0a3332000000008152508b8b60405160200180838152602001828152602001925050506040516020818303038152906040526040518082805190602001908083835b60208310610a295780518252601f199092019160209182019101610a0a565b51815160209384036101000a6000190180199092169116179052604051919093018190038120865190955090830193508392860191508083835b60208310610a825780518252601f199092019160209182019101610a63565b51815160209384036101000a600019018019909216911617905292019384525060408051808503815293820190819052835193945092839250908401908083835b60208310610ae25780518252601f199092019160209182019101610ac3565b6001836020036101000a0380198251168184511680821785525050505050509050019150506040518091039020898989604051600081526020016040526040518085600019166000191681526020018460ff1660ff1681526020018360001916600019168152602001826000191660001916815260200194505050505060206040516020810390808403906000865af1158015610b83573d6000803e3d6000fd5b505050602060405103519250610b9883611a26565b1515610bee576040805160e560020a62461bcd02815260206004820152601d60248201527f4543445341207369676e6174757265206973206e6f742076616c69642e000000604482015290519081900360640190fd5b610bf9848c8e611a7a565b60025491935091508401821115610c5a576040805160e560020a62461bcd02815260206004820152601a60248201527f6d617850726f666974206c696d69742076696f6c6174696f6e2e000000000000604482015290519081900360640190fd5b600380546001608060020a03608060020a808304821686018216810292821692909217808216850182166fffffffffffffffffffffffffffffffff19919091161792839055303183821692909304811691909101161115610d05576040805160e560020a62461bcd02815260206004820152601f60248201527f43616e6e6f74206166666f726420746f206c6f73652074686973206265742e00604482015290519081900360640190fd5b8385600001819055508a8560010160006101000a81548160ff021916908360ff1602179055504385600201819055508b8560030160006101000a81548164ffffffffff021916908364ffffffffff160217905550338560030160056101000a815481600160a060020a030219169083600160a060020a031602179055508185600401819055506005600081548092919060010191905055508460010160009054906101000a900460ff1660ff1633600160a060020a03168a7fcd3f64138f645ba9a63e71a378025bfda5a3d31f1e25bb744fc90e7cf6fdc7a88860030160009054906101000a900464ffffffffff16888a60020154604051808464ffffffffff1664ffffffffff168152602001838152602001828152602001935050505060405180910390a4505050505050505050505050565b60055481565b600054600160a060020a03163314610ea1576040805160e560020a62461bcd0281526020600482015260266024820152600080516020611d3c833981519152604482015260d160020a6537bbb732b91702606482015290519081900360840190fd5b60ff81161515610ebc57610eb6838384611c35565b50610fc0565b3031821115610f3a576040805160e560020a62461bcd028152602060048201526024808201527f496e63726561736520616d6f756e74206c6172676572207468616e2062616c6160448201527f6e63652e00000000000000000000000000000000000000000000000000000000606482015290519081900360840190fd5b60035430316001608060020a03808316608060020a90930481169290920190911683011115610fb3576040805160e560020a62461bcd02815260206004820152601160248201527f4e6f7420656e6f7567682066756e64732e000000000000000000000000000000604482015290519081900360640190fd5b610fbe838384611c35565b505b505050565b600054600160a060020a031681565b6006545b90565b60025481565b600154600160a060020a03163314611055576040805160e560020a62461bcd02815260206004820152602660248201527f43616e206f6e6c792061636365707420707265617070726f766564206e657720604482015260d160020a6537bbb732b91702606482015290519081900360840190fd5b600180546000805473ffffffffffffffffffffffffffffffffffffffff19908116600160a060020a0390931692831782556009805494850181559091527f6e1540171b6c0c960b71a7020d9f60077f6af931a8bbf590da0223dacf75c7af9092018054909216179055565b600054600160a060020a03163314611122576040805160e560020a62461bcd0281526020600482015260266024820152600080516020611d3c833981519152604482015260d160020a6537bbb732b91702606482015290519081900360840190fd5b600054600160a060020a0382811691161415611188576040805160e560020a62461bcd02815260206004820152601d60248201527f43616e6e6f7420617070726f76652063757272656e74206f776e65722e000000604482015290519081900360640190fd5b6001805473ffffffffffffffffffffffffffffffffffffffff1916600160a060020a0392909216919091179055565b600054600160a060020a03163314611219576040805160e560020a62461bcd0281526020600482015260266024820152600080516020611d3c833981519152604482015260d160020a6537bbb732b91702606482015290519081900360840190fd5b3031811115611297576040805160e560020a62461bcd028152602060048201526024808201527f496e63726561736520616d6f756e74206c6172676572207468616e2062616c6160448201527f6e63652e00000000000000000000000000000000000000000000000000000000606482015290519081900360840190fd5b60035430316001608060020a03808316608060020a90930481169290920190911682011115611310576040805160e560020a62461bcd02815260206004820152601160248201527f4e6f7420656e6f7567682066756e64732e000000000000000000000000000000604482015290519081900360640190fd5b600380546fffffffffffffffffffffffffffffffff1981166001608060020a039182169390930116919091179055565b600980548290811061134e57fe5b600091825260209091200154600160a060020a0316905081565b600354608060020a90046001608060020a031681565b6000818152600860205260408120600281015490919081908190819081908190607801431161141d576040805160e560020a62461bcd02815260206004820152602260248201527f426c6f636b686173682063616e2774206265207175657269656420627920455660448201527f4d2e000000000000000000000000000000000000000000000000000000000000606482015290519081900360840190fd5b8654955085151561149e576040805160e560020a62461bcd02815260206004820152602260248201527f4265742073686f756c6420626520696e20616e2027616374697665272073746160448201527f7465000000000000000000000000000000000000000000000000000000000000606482015290519081900360840190fd5b60008755600487015494508415156114b4578594505b60038701546114d690650100000000009004600160a060020a03168680611c35565b935083156115c7575050600380546001608060020a03608060020a80830482168790038216029116179055506006546000805b8281101561158a57600680548290811061151f57fe5b906000526020600020015488141561153657600191505b81801561154557506001830381105b1561158257600680546001830190811061155b57fe5b906000526020600020015460068281548110151561157557fe5b6000918252602090912001555b600101611509565b81156115c2576006805460001985019081106115a257fe5b600091825260208220015560068054906115c0906000198301611cfe565b505b6115cb565b8587555b5050505050505050565b600054600160a060020a03163314611637576040805160e560020a62461bcd0281526020600482015260266024820152600080516020611d3c833981519152604482015260d160020a6537bbb732b91702606482015290519081900360840190fd5b69010f0cf064dd592000008111156116bf576040805160e560020a62461bcd02815260206004820152602260248201527f6d617850726f6669742073686f756c6420626520612073616e65206e756d626560448201527f722e000000000000000000000000000000000000000000000000000000000000606482015290519081900360840190fd5b600255565b6001830154835460ff909116906000908190819081908190819081908190151561175e576040805160e560020a62461bcd02815260206004820152602260248201527f4265742073686f756c6420626520696e20616e2027616374697665272073746160448201527f7465000000000000000000000000000000000000000000000000000000000000606482015290519081900360840190fd5b6040805160208082018e90528c4082840152825180830384018152606090920192839052815191929182918401908083835b602083106117af5780518252601f199092019160209182019101611790565b5181516020939093036101000a600019018019909116921691909117905260405192018290039091209a508b92508a9150508115156117ea57fe5b8d5460038f0154929091069850611809918b9064ffffffffff16611a7a565b9096509450600093508392506028891161183d5760038c0154600288900a1664ffffffffff1615611838578593505b611854565b60038c015464ffffffffff16871015611854578593505b8b5468056bc75e2d63100000116118b1576103e8898981151561187357fe5b0481151561187d57fe5b0691506103788214156118b157600380546fffffffffffffffffffffffffffffffff1981169091556001608060020a031692505b838301156118c1578284016118c4565b60015b60038d0154604051919250650100000000009004600160a060020a0316906108fc8315029083906000818181858888f19350505050156119be5760008c6000018190555085600360108282829054906101000a90046001608060020a03160392506101000a8154816001608060020a0302191690836001608060020a03160217905550808c60030160059054906101000a9004600160a060020a0316600160a060020a03168e7f6e73056f04e59b9775a04fe9801a805fbf3172ed588c7168fcc021c00ea75f79878f8d8d6040518085815260200184815260200183815260200182815260200194505050505060405180910390a4611a0d565b6001811115611a085760048c01819055600680546001810182556000919091527ff652222313e28459528d920b65115c16c04f3efc82aaedc97be59f3f377c0d3f018d9055611a0d565b60008c555b5050600580546000190190555050505050505050505050565b600080805b600954811015611a73576009805482908110611a4357fe5b600091825260209091200154600160a060020a0385811691161415611a6b5760019150611a73565b600101611a2b565b5092915050565b60008060008060008086118015611a9f57506000878152600460205260409020548611155b1515611af5576040805160e560020a62461bcd02815260206004820152601d60248201527f57696e2070726f626162696c697479206f7574206f662072616e67652e000000604482015290519081900360640190fd5b68056bc75e2d63100000881015611b0d576000611b17565b670de0b6b3a76400005b93506000925060288711611b8f57600091505b60075460ff83161015611b8a576007805460ff8416908110611b4857fe5b90600052602060002001548660078460ff16815481101515611b6657fe5b9060005260206000200154161415611b7f576001909201915b600190910190611b2a565b611b93565b8592505b506000680340aad21b3b700000881015611bcb57606483888a02811515611bb657fe5b04600202811515611bc357fe5b049050611c16565b68056bc75e2d63100000881015611bf557606483888a02811515611beb57fe5b04811515611bc357fe5b6103e883888a02811515611c0557fe5b04600502811515611c1257fe5b0490505b838184898b02811515611c2557fe5b0403039450505050935093915050565b6040516000908190600160a060020a0386169085156108fc0290869084818181858888f1935050505015611cb6575060408051600160a060020a03861681526020810185905280820184905290516001917f9643c1b5b172b26d5f028be7fe646349bd5e3cd9367bb18f9e825afa828b7d93919081900360600190a1611cf6565b604080518581529051600160a060020a038716917fac464fe4d3a86b9121261ac0a01dd981bfe0777c7c9d9c8f4473d31a9c0f9d2d919081900360200190a25b949350505050565b815481835581811115610fc057600083815260209020610fc0918101908301610fd891905b80821115611d375760008155600101611d23565b509056004f6e6c794f776e6572206d6574686f64732063616c6c6564206279206e6f6e2da165627a7a723058204a270e59e5be67e8f129d072654e26ddc50842bfd3e4daad2edb153abe669a2f0029";

var petContractABI = [{"constant":false,"inputs":[],"name":"acceptNextOwner","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_newCOO","type":"address"}],"name":"addCOO","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_nextOwner","type":"address"}],"name":"approveNextOwner","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"increaseAmount","type":"uint256"}],"name":"increaseJackpot","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[],"name":"kill","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"betMask","type":"uint256"},{"name":"modulo","type":"uint256"},{"name":"commitLastBlock","type":"uint256"},{"name":"commit","type":"uint256"},{"name":"v","type":"uint8"},{"name":"r","type":"bytes32"},{"name":"s","type":"bytes32"}],"name":"placeBet","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"constant":false,"inputs":[{"name":"commit","type":"uint256"}],"name":"refundBet","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_maxProfit","type":"uint256"}],"name":"setMaxProfit","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"reveal","type":"uint256"},{"name":"placeBlockNum","type":"uint256"}],"name":"settleBet","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"beneficiary","type":"address"},{"name":"withdrawAmount","type":"uint256"},{"name":"safe","type":"uint8"}],"name":"withdrawFunds","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"inputs":[],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"payable":true,"stateMutability":"payable","type":"fallback"},{"anonymous":false,"inputs":[{"indexed":true,"name":"commit","type":"uint256"},{"indexed":true,"name":"gambler","type":"address"},{"indexed":true,"name":"modulo","type":"uint8"},{"indexed":false,"name":"mask","type":"uint40"},{"indexed":false,"name":"amount","type":"uint256"},{"indexed":false,"name":"playceBlock","type":"uint256"}],"name":"OnPlaceBet","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"beneficiary","type":"address"},{"indexed":false,"name":"amount","type":"uint256"}],"name":"FailedPayment","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"beneficiary","type":"address"},{"indexed":false,"name":"totalAmount","type":"uint256"},{"indexed":false,"name":"amount","type":"uint256"}],"name":"Payment","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"commit","type":"uint256"},{"indexed":true,"name":"gambler","type":"address"},{"indexed":true,"name":"totalAmount","type":"uint256"},{"indexed":false,"name":"amount","type":"uint256"},{"indexed":false,"name":"reveal","type":"uint256"},{"indexed":false,"name":"entropy","type":"uint256"},{"indexed":false,"name":"dice","type":"uint256"}],"name":"SettleBetPayment","type":"event"},{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"cooAddress","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"dealFailList","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"dealFailNum","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"jackpotSize","outputs":[{"name":"","type":"uint128"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"lockedInBets","outputs":[{"name":"","type":"uint128"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"maxProfit","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"undealBetNum","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"}];

var debugMode = true;//是否为调试模式，调试模式将强制使用本地节点

var MaxEstimateGas = 3700000;//通过多次交易测试后选最大的gas
var contractAddress = null;//;//为null时可以通过deployContract请求来部署
var SecretSigner = "0xeb0e5b3c177c72235d07d8daa6e7ad8fe701e24a";
// var Croupier = "0xeb0e5b3c177c72235d07d8daa6e7ad8fe701e24a";//相当于COO
//代理商信息，第一个代理商同时也是合约发布者
var delegates = [];
// delegates.push({"account":"0xeb0e5b3c177c72235d07d8daa6e7ad8fe701e24a", "latestNonce":-1, "privateKey":new Buffer('a6abcae8af8089b782b90ee864da0912320d31a83306b740d1a843108e8cfa9f', 'hex'), privateKeyStr:'0xa6abcae8af8089b782b90ee864da0912320d31a83306b740d1a843108e8cfa9f'});
// delegates.push({"account":"0xc17f762282149f36f2b26bfee54aa8678b70c3a4", "latestNonce":-1, "privateKey":new Buffer('ef28d75985db54e454ae37882aeb0f8850f35f15c5d42f2c82e8cde277a1f5f0', 'hex'), privateKeyStr:'0xef28d75985db54e454ae37882aeb0f8850f35f15c5d42f2c82e8cde277a1f5f0'});
// delegates.push({"account":"0x5b1b048bac797bd17d5c9eb04e575960ec25ed02", "latestNonce":-1, "privateKey":new Buffer('69a5f349e11d11ca0bc15c53a3b87443d20347daf7ca4ff7d7c286c3e8750391', 'hex'), privateKeyStr:'0x69a5f349e11d11ca0bc15c53a3b87443d20347daf7ca4ff7d7c286c3e8750391'});
delegates.push({"account":"0x235fea5ea4b0ce72b97430972ef77a8d93956a73", "latestNonce":-1, "privateKey":new Buffer('1F8CAE4D8604D6FE204789EB7430646D59B0BCD8E5C15D801D88273E39AD4978', 'hex'), privateKeyStr:'0x1F8CAE4D8604D6FE204789EB7430646D59B0BCD8E5C15D801D88273E39AD4978'});
delegates.push({"account":"0xd944e7a9f9bfcf28410e3de204d5cbbab58bac37", "latestNonce":-1, "privateKey":new Buffer('23F6C27FA7E4FBCD8C971B17E6F7FAD9F1A64A3BF06E0588B604C1BA1D2A5E14', 'hex'), privateKeyStr:'0x23F6C27FA7E4FBCD8C971B17E6F7FAD9F1A64A3BF06E0588B604C1BA1D2A5E14'});
delegates.push({"account":"0x1ccb0a84e2ea1fe3f096a0aa395dce19b00e5f7a", "latestNonce":-1, "privateKey":new Buffer('B38B46DF7AEB71E4879365D3FA2ECE64DEA3F39DF4A809BF908EB70EEF1623EA', 'hex'), privateKeyStr:'0xB38B46DF7AEB71E4879365D3FA2ECE64DEA3F39DF4A809BF908EB70EEF1623EA'});

//-----------------------------------------------
var petContract;
var subContract;

var startWeb3 = async function(cb) {
    var rpcURL;
    //为调试与发布模式强制设置一些值方便测试与提高安全性
    if(debugMode){
      contractAddress = "0x740b88316c6a3b2738de91cf046c48da746ff0fe";
      // contractAddress="0xcb826cb2e45215fdd57552ceecd7369307af6d74"
        // contractAddress="0x1B8356E2EA33aEb90eA80439630E5a07C1678542";
        rpcURL = 'http://localhost:9646';
        // contractAddress="0x5d478631823cef55441bc71e4365a1836d1e4cbd";//t
        // rpcURL = 'http://etzrpc.org:80';//t
    }else{
        contractAddress="0x5137814e854fa10ee6d8ac3ad836d345db6ed44e";
        rpcURL = 'http://localhost:9646';
        // contractAddress="0x5d478631823cef55441bc71e4365a1836d1e4cbd";//t
        // rpcURL = 'http://etzrpc.org:80';//t
    }
    var  _web3 = new Web3(new Web3.providers.HttpProvider(rpcURL));
    // var _web3WS = new Web3(new Web3.providers.WebsocketProvider(_wsProvider));
    eth = _web3.eth;

    //有合约地址则获取合约实例，没有则通过deployContract接口部署，或者setContractAddr接口设置已有合约
    if(contractAddress!=null){
        petContract = new eth.Contract(petContractABI, contractAddress);
        try{
            var maxProfit = await petContract.methods.maxProfit().call();
            console.log(maxProfit);
        }catch(err){
            petContract = null;
            contractAddress = null;
        }
    }
    module.exports.contractAddress = contractAddress;

    //读取区块链上的nonce
    for(var i=0; i<delegates.length; i++){
        delegates[i].latestNonce = await eth.getTransactionCount(delegates[i].account)-1;
        console.log(delegates[i].account,' latestNonce:'+delegates[i].latestNonce);
    }


    module.exports.web3 = _web3;
    module.exports.petContract = petContract;
    module.exports.delegates = delegates;
    console.log('web3 start!');

    cb();
}

module.exports.startWeb3 = startWeb3;
module.exports.debugMode = debugMode;
module.exports.petContractABI = petContractABI;
module.exports.contractBytes = contractBytes;
module.exports.SecretSigner = SecretSigner;
// module.exports.Croupier = Croupier;
module.exports.MaxEstimateGas = MaxEstimateGas;
