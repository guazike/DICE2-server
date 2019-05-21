var mongoose = require( 'mongoose' );
var Schema   = mongoose.Schema;

var Record = new Schema(
{
    "commit": {type: String, index: {unique: true}},
    "gambler": {type: String, index: true},
    "mask": String,
    "betAmount": String,
    "totalWin": String,
    "betWin": String,
    "betTX": {type: String, unique: true},
    "settleTX": String,
    "secretNumber": String,
    "sha3_secretNumber": String,
    "commitLastBlock": String,
    "sha3_betBlockHash_secretNumber": String,
    "diceResultIndex": Number,
    "jeckpot": String,
    "blockNumber": Number,
});

module.exports.Record = mongoose.model('Record', Record);

mongoose.connect('mongodb://diceserver:etz123456@localhost:39462/betgames', {useMongoClient:true});
mongoose.set('debug', false);
