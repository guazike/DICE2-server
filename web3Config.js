// require( 'db.js' );
var etherUnits = require("./lib/etherUnits.js");
var BigNumber = require('bignumber.js');
var Web3 = require('web3');
var _web3;
var _eth;
// var mongoose = require( 'mongoose' );
// var Block     = mongoose.model( 'Block' );

//----------------------config--------------------
var contractBytes = "0x69010f0cf064dd592000006002908155600060055561050060409081526001608090815260a092909252600460c052600860e052601061010090815260206101205261014091909152610160829052610180526102006101a08190526104006101c08190526108006101e0526110009091526120006102205261400061024052618000610260526201000061028052620200006102a052620400006102c052620800006102e052621000006103005262200000610320526240000061034052628000006103605263010000006103805263020000006103a05263040000006103c05263080000006103e05263100000009052632000000061042052634000000061044052638000000061046052640100000000610480526402000000006104a0526404000000006104c0526408000000006104e0526200014490600790602462000240565b503480156200015257600080fd5b506000805433600160a060020a03199182168117835560098054600181019091557f6e1540171b6c0c960b71a7020d9f60077f6af931a8bbf590da0223dacf75c7af018054909216179055600460205260027f91da3fd0782e51c6b3986e9e672fd566868e71f3dbc2d6c2cd6fbb3e361af2a755603e7fc59312466997bb42aaaf719ece141047820e6b34531e1670dc1852a453648f0f55640ffffffffe7f724ad3d24f57aae4bebead5383879105ce62b9d5fa67d4343ae412b59bd7971d556064905260617f083fc81be30b6287dea23aa60f8ffaf268f507cdeac82ed9644e506b59c54ff055620002b9565b82805482825590600052602060002090810192821562000287579160200282015b8281111562000287578251829064ffffffffff1690559160200191906001019062000261565b506200029592915062000299565b5090565b620002b691905b80821115620002955760008155600101620002a0565b90565b611e9780620002c96000396000f3006080604052600436106101065763ffffffff7c01000000000000000000000000000000000000000000000000000000006000350416630340752f81146101085780630d2cbe131461012957806322af00fa1461014457806341c0e1b5146101a057806357246d23146101b55780636e911f93146101e65780637cee9ee8146102105780637e0b9eea14610230578063898aab43146102455780638da5cb5b1461026f57806394279f02146102a0578063b539cd55146102b5578063d06c54fb146102ca578063d579fd44146102df578063d6d30a5114610300578063d9747f5814610318578063df88126f14610330578063e1fdb4b414610345578063fbd668a91461035d575b005b34801561011457600080fd5b50610106600160a060020a0360043516610375565b34801561013557600080fd5b5061010660043560243561044b565b34801561015057600080fd5b5061015c600435610658565b6040805196875260ff90951660208701528585019390935264ffffffffff9091166060850152600160a060020a0316608084015260a0830152519081900360c00190f35b3480156101ac57600080fd5b506101066106a7565b3480156101c157600080fd5b506101ca6107cb565b604080516001608060020a039092168252519081900360200190f35b3480156101f257600080fd5b506101fe6004356107da565b60408051918252519081900360200190f35b61010660043560243560443560643560ff6084351660a43560c4356107f9565b34801561023c57600080fd5b506101fe610eef565b34801561025157600080fd5b50610106600160a060020a036004351660243560ff60443516610ef5565b34801561027b57600080fd5b5061028461107b565b60408051600160a060020a039092168252519081900360200190f35b3480156102ac57600080fd5b506101fe61108a565b3480156102c157600080fd5b506101fe611091565b3480156102d657600080fd5b50610106611097565b3480156102eb57600080fd5b50610106600160a060020a0360043516611176565b34801561030c57600080fd5b5061010660043561126d565b34801561032457600080fd5b506102846004356113f6565b34801561033c57600080fd5b506101ca61141e565b34801561035157600080fd5b50610106600435611434565b34801561036957600080fd5b506101066004356116e5565b600054600160a060020a031633146103d7576040805160e560020a62461bcd0281526020600482015260266024820152600080516020611e4c833981519152604482015260d160020a6537bbb732b91702606482015290519081900360840190fd5b600160a060020a03811615156103ec57600080fd5b600980546001810182556000919091527f6e1540171b6c0c960b71a7020d9f60077f6af931a8bbf590da0223dacf75c7af01805473ffffffffffffffffffffffffffffffffffffffff1916600160a060020a0392909216919091179055565b6000808080805b60095481101561049757600980548290811061046a57fe5b600091825260209091200154600160a060020a031633141561048f5760019150610497565b600101610452565b8115156104a357600080fd5b86604051602001808281526020019150506040516020818303038152906040526040518082805190602001908083835b602083106104f25780518252601f1990920191602091820191016104d3565b51815160001960209485036101000a01908116901991909116179052604080519490920184900390932060008181526008909452922060028101549299509750909550505043841090506105b6576040805160e560020a62461bcd02815260206004820152603360248201527f736574746c6542657420696e207468652073616d6520626c6f636b206173207060448201527f6c6163654265742c206f72206265666f72652e00000000000000000000000000606482015290519081900360840190fd5b60788301431115610637576040805160e560020a62461bcd02815260206004820152602260248201527f426c6f636b686173682063616e2774206265207175657269656420627920455660448201527f4d2e000000000000000000000000000000000000000000000000000000000000606482015290519081900360840190fd5b82861461064357600080fd5b61064f858589896117d4565b50505050505050565b60086020526000908152604090208054600182015460028301546003840154600490940154929360ff90921692909164ffffffffff81169165010000000000909104600160a060020a03169086565b600054600160a060020a03163314610709576040805160e560020a62461bcd0281526020600482015260266024820152600080516020611e4c833981519152604482015260d160020a6537bbb732b91702606482015290519081900360840190fd5b600354608060020a90046001608060020a0316156107bd576040805160e560020a62461bcd02815260206004820152604860248201527f416c6c20626574732073686f756c642062652070726f6365737365642028736560448201527f74746c6564206f7220726566756e64656429206265666f72652073656c662d6460648201527f657374727563742e000000000000000000000000000000000000000000000000608482015290519081900360a40190fd5b600054600160a060020a0316ff5b6003546001608060020a031681565b60068054829081106107e857fe5b600091825260209091200154905081565b60008481526008602052604081206003810154909190819081908190650100000000009004600160a060020a0316156108a2576040805160e560020a62461bcd02815260206004820152602160248201527f4265742073686f756c6420626520696e20612027636c65616e2720737461746560448201527f2e00000000000000000000000000000000000000000000000000000000000000606482015290519081900360840190fd5b34935060018b1180156108b6575060648b11155b151561090c576040805160e560020a62461bcd02815260206004820152601e60248201527f4d6f64756c6f2073686f756c642062652077697468696e2072616e67652e0000604482015290519081900360640190fd5b678ac7230489e80000841015801561092e575069010f0cf064dd592000008411155b1515610984576040805160e560020a62461bcd02815260206004820152601e60248201527f416d6f756e742073686f756c642062652077697468696e2072616e67652e0000604482015290519081900360640190fd5b60008c1180156109a2575060008b8152600460205260409020548c11155b15156109f8576040805160e560020a62461bcd02815260206004820152601c60248201527f4d61736b2073686f756c642062652077697468696e2072616e67652e00000000604482015290519081900360640190fd5b438a1015610a50576040805160e560020a62461bcd02815260206004820152601360248201527f436f6d6d69742068617320657870697265642e00000000000000000000000000604482015290519081900360640190fd5b60016040805190810160405280601c81526020017f19457468657265756d205369676e6564204d6573736167653a0a3332000000008152508b8b60405160200180838152602001828152602001925050506040516020818303038152906040526040518082805190602001908083835b60208310610adf5780518252601f199092019160209182019101610ac0565b51815160209384036101000a6000190180199092169116179052604051919093018190038120865190955090830193508392860191508083835b60208310610b385780518252601f199092019160209182019101610b19565b51815160209384036101000a600019018019909216911617905292019384525060408051808503815293820190819052835193945092839250908401908083835b60208310610b985780518252601f199092019160209182019101610b79565b6001836020036101000a0380198251168184511680821785525050505050509050019150506040518091039020898989604051600081526020016040526040518085600019166000191681526020018460ff1660ff1681526020018360001916600019168152602001826000191660001916815260200194505050505060206040516020810390808403906000865af1158015610c39573d6000803e3d6000fd5b505050602060405103519250610c4e83611b36565b1515610ca4576040805160e560020a62461bcd02815260206004820152601d60248201527f4543445341207369676e6174757265206973206e6f742076616c69642e000000604482015290519081900360640190fd5b610caf848c8e611b8a565b60025491935091508401821115610d10576040805160e560020a62461bcd02815260206004820152601a60248201527f6d617850726f666974206c696d69742076696f6c6174696f6e2e000000000000604482015290519081900360640190fd5b600380546001608060020a03608060020a808304821686018216810292821692909217808216850182166fffffffffffffffffffffffffffffffff19919091161792839055303183821692909304811691909101161115610dbb576040805160e560020a62461bcd02815260206004820152601f60248201527f43616e6e6f74206166666f726420746f206c6f73652074686973206265742e00604482015290519081900360640190fd5b8385600001819055508a8560010160006101000a81548160ff021916908360ff1602179055504385600201819055508b8560030160006101000a81548164ffffffffff021916908364ffffffffff160217905550338560030160056101000a815481600160a060020a030219169083600160a060020a031602179055508185600401819055506005600081548092919060010191905055508460010160009054906101000a900460ff1660ff1633600160a060020a03168a7fcd3f64138f645ba9a63e71a378025bfda5a3d31f1e25bb744fc90e7cf6fdc7a88860030160009054906101000a900464ffffffffff16888a60020154604051808464ffffffffff1664ffffffffff168152602001838152602001828152602001935050505060405180910390a4505050505050505050505050565b60055481565b600054600160a060020a03163314610f57576040805160e560020a62461bcd0281526020600482015260266024820152600080516020611e4c833981519152604482015260d160020a6537bbb732b91702606482015290519081900360840190fd5b60ff81161515610f7257610f6c838384611d45565b50611076565b3031821115610ff0576040805160e560020a62461bcd028152602060048201526024808201527f496e63726561736520616d6f756e74206c6172676572207468616e2062616c6160448201527f6e63652e00000000000000000000000000000000000000000000000000000000606482015290519081900360840190fd5b60035430316001608060020a03808316608060020a90930481169290920190911683011115611069576040805160e560020a62461bcd02815260206004820152601160248201527f4e6f7420656e6f7567682066756e64732e000000000000000000000000000000604482015290519081900360640190fd5b611074838384611d45565b505b505050565b600054600160a060020a031681565b6006545b90565b60025481565b600154600160a060020a0316331461110b576040805160e560020a62461bcd02815260206004820152602660248201527f43616e206f6e6c792061636365707420707265617070726f766564206e657720604482015260d160020a6537bbb732b91702606482015290519081900360840190fd5b600180546000805473ffffffffffffffffffffffffffffffffffffffff19908116600160a060020a0390931692831782556009805494850181559091527f6e1540171b6c0c960b71a7020d9f60077f6af931a8bbf590da0223dacf75c7af9092018054909216179055565b600054600160a060020a031633146111d8576040805160e560020a62461bcd0281526020600482015260266024820152600080516020611e4c833981519152604482015260d160020a6537bbb732b91702606482015290519081900360840190fd5b600054600160a060020a038281169116141561123e576040805160e560020a62461bcd02815260206004820152601d60248201527f43616e6e6f7420617070726f76652063757272656e74206f776e65722e000000604482015290519081900360640190fd5b6001805473ffffffffffffffffffffffffffffffffffffffff1916600160a060020a0392909216919091179055565b600054600160a060020a031633146112cf576040805160e560020a62461bcd0281526020600482015260266024820152600080516020611e4c833981519152604482015260d160020a6537bbb732b91702606482015290519081900360840190fd5b303181111561134d576040805160e560020a62461bcd028152602060048201526024808201527f496e63726561736520616d6f756e74206c6172676572207468616e2062616c6160448201527f6e63652e00000000000000000000000000000000000000000000000000000000606482015290519081900360840190fd5b60035430316001608060020a03808316608060020a909304811692909201909116820111156113c6576040805160e560020a62461bcd02815260206004820152601160248201527f4e6f7420656e6f7567682066756e64732e000000000000000000000000000000604482015290519081900360640190fd5b600380546fffffffffffffffffffffffffffffffff1981166001608060020a039182169390930116919091179055565b600980548290811061140457fe5b600091825260209091200154600160a060020a0316905081565b600354608060020a90046001608060020a031681565b600081815260086020526040812060028101549091908190819081908190819060780143116114d3576040805160e560020a62461bcd02815260206004820152602260248201527f426c6f636b686173682063616e2774206265207175657269656420627920455660448201527f4d2e000000000000000000000000000000000000000000000000000000000000606482015290519081900360840190fd5b86549550851515611554576040805160e560020a62461bcd02815260206004820152602260248201527f4265742073686f756c6420626520696e20616e2027616374697665272073746160448201527f7465000000000000000000000000000000000000000000000000000000000000606482015290519081900360840190fd5b600087556004870154945084151561156a578594505b600387015461158c90650100000000009004600160a060020a03168780611d45565b935083156116d7575050600380546001608060020a03608060020a80830482168790038216029116179055506006546000805b828110156116405760068054829081106115d557fe5b90600052602060002001548814156115ec57600191505b8180156115fb57506001830381105b1561163857600680546001830190811061161157fe5b906000526020600020015460068281548110151561162b57fe5b6000918252602090912001555b6001016115bf565b81156116785760068054600019850190811061165857fe5b60009182526020822001556006805490611676906000198301611e0e565b505b60038701546040805187815290518892600160a060020a036501000000000090910416918b917f83798b5c761afdb819ea1f3ccab12f29f98ed03b67b599c0570c03d36259a07e9181900360200190a4600580546000190190556116db565b8587555b5050505050505050565b600054600160a060020a03163314611747576040805160e560020a62461bcd0281526020600482015260266024820152600080516020611e4c833981519152604482015260d160020a6537bbb732b91702606482015290519081900360840190fd5b69010f0cf064dd592000008111156117cf576040805160e560020a62461bcd02815260206004820152602260248201527f6d617850726f6669742073686f756c6420626520612073616e65206e756d626560448201527f722e000000000000000000000000000000000000000000000000000000000000606482015290519081900360840190fd5b600255565b6001830154835460ff909116906000908190819081908190819081908190151561186e576040805160e560020a62461bcd02815260206004820152602260248201527f4265742073686f756c6420626520696e20616e2027616374697665272073746160448201527f7465000000000000000000000000000000000000000000000000000000000000606482015290519081900360840190fd5b6040805160208082018e90528c4082840152825180830384018152606090920192839052815191929182918401908083835b602083106118bf5780518252601f1990920191602091820191016118a0565b5181516020939093036101000a600019018019909116921691909117905260405192018290039091209a508b92508a9150508115156118fa57fe5b8d5460038f0154929091069850611919918b9064ffffffffff16611b8a565b9096509450600093508392506028891161194d5760038c0154600288900a1664ffffffffff1615611948578593505b611964565b60038c015464ffffffffff16871015611964578593505b8b5468056bc75e2d63100000116119c1576103e8898981151561198357fe5b0481151561198d57fe5b0691506103788214156119c157600380546fffffffffffffffffffffffffffffffff1981169091556001608060020a031692505b838301156119d1578284016119d4565b60015b60038d0154604051919250650100000000009004600160a060020a0316906108fc8315029083906000818181858888f1935050505015611ace5760008c6000018190555085600360108282829054906101000a90046001608060020a03160392506101000a8154816001608060020a0302191690836001608060020a03160217905550808c60030160059054906101000a9004600160a060020a0316600160a060020a03168e7f6e73056f04e59b9775a04fe9801a805fbf3172ed588c7168fcc021c00ea75f79878f8d8d6040518085815260200184815260200183815260200182815260200194505050505060405180910390a4611b1d565b6001811115611b185760048c01819055600680546001810182556000919091527ff652222313e28459528d920b65115c16c04f3efc82aaedc97be59f3f377c0d3f018d9055611b1d565b60008c555b5050600580546000190190555050505050505050505050565b600080805b600954811015611b83576009805482908110611b5357fe5b600091825260209091200154600160a060020a0385811691161415611b7b5760019150611b83565b600101611b3b565b5092915050565b60008060008060008086118015611baf57506000878152600460205260409020548611155b1515611c05576040805160e560020a62461bcd02815260206004820152601d60248201527f57696e2070726f626162696c697479206f7574206f662072616e67652e000000604482015290519081900360640190fd5b68056bc75e2d63100000881015611c1d576000611c27565b670de0b6b3a76400005b93506000925060288711611c9f57600091505b60075460ff83161015611c9a576007805460ff8416908110611c5857fe5b90600052602060002001548660078460ff16815481101515611c7657fe5b9060005260206000200154161415611c8f576001909201915b600190910190611c3a565b611ca3565b8592505b506000680340aad21b3b700000881015611cdb57606483888a02811515611cc657fe5b04600202811515611cd357fe5b049050611d26565b68056bc75e2d63100000881015611d0557606483888a02811515611cfb57fe5b04811515611cd357fe5b6103e883888a02811515611d1557fe5b04600502811515611d2257fe5b0490505b838184898b02811515611d3557fe5b0403039450505050935093915050565b6040516000908190600160a060020a0386169085156108fc0290869084818181858888f1935050505015611dc6575060408051600160a060020a03861681526020810185905280820184905290516001917f9643c1b5b172b26d5f028be7fe646349bd5e3cd9367bb18f9e825afa828b7d93919081900360600190a1611e06565b604080518581529051600160a060020a038716917fac464fe4d3a86b9121261ac0a01dd981bfe0777c7c9d9c8f4473d31a9c0f9d2d919081900360200190a25b949350505050565b8154818355818111156110765760008381526020902061107691810190830161108e91905b80821115611e475760008155600101611e33565b509056004f6e6c794f776e6572206d6574686f64732063616c6c6564206279206e6f6e2da165627a7a723058208b4da78ac9f0e3a8ceb59f451b3a3ee4f8bd5cb90947937940865e45aca31c7e0029";

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
      // contractAddress = "0x7fc9cc8410fe8ab9b588d2f95bc21d613fb43718";
      // contractAddress = "0x740b88316c6a3b2738de91cf046c48da746ff0fe"; //2019.5.11
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
