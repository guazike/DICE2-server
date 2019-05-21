var mongoose = require( 'mongoose' );
var Schema   = mongoose.Schema;

var Record = new Schema(
{
    "commit": {type: String},
    "gambler": {type: String, index: true},
    "mask": Number,
    "betAmount": String,
    "totalWin": String,
    "betWin": String,
    "betTX": {type: String, unique: true},
    "settleTX": String,
    "secretNumber": String,
    "sha3_secretNumber": String,
    "commitLastBlock": Number,
    "sha3_betBlockHash_secretNumber": String,
    "diceResultIndex": Number,
    "jeckpot": String,
    "blockNumber": Number,
    "gameIndex": {type: Number, index: true},
});

module.exports.Record = mongoose.model('Record', Record);

mongoose.connect('mongodb://diceserver:etz123456@localhost:39462/betgames', {useMongoClient:true});
mongoose.set('debug', false);
