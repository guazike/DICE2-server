pragma solidity ^0.4.24;

// * dice2.win - fair games that pay Ether. Version 5.
//
// * Ethereum smart contract, deployed at 0xD1CEeeeee83F8bCF3BEDad437202b6154E9F5405.
//
// * Uses hybrid commit-reveal + block hash random number generation that is immune
//   to tampering by players, house and miners. Apart from being fully transparent,
//   this also allows arbitrarily high bets.
//
// * Refer to https://dice2.win/whitepaper.pdf for detailed description and proofs.

contract ETZ_Dice {
    //todo secret signer
    /// *** Constants section

    // Bets lower than this amount do not participate in jackpot rolls (and are
    // not deducted JACKPOT_FEE).
    uint constant MIN_JACKPOT_BET = 100000000000000000000;//100 ether;

    // Chance to win jackpot (currently 0.1%) and fee deducted into jackpot fund.
    uint constant JACKPOT_MODULO = 1000;
    uint constant JACKPOT_FEE = 1000000000000000000;//1 ether;

    // There is minimum and maximum bets.
    uint constant MIN_BET = 10000000000000000000;//10 ether;
    uint constant MAX_AMOUNT = 5000000000000000000000;//2000 ether;

    // Modulo is a number of equiprobable outcomes in a game:
    //  - 2 for coin flip
    //  - 6 for dice
    //  - 6*6 = 36 for double dice
    //  - 100 for etheroll
    //  - 37 for roulette
    //  etc.
    // It's called so because 256-bit entropy is treated like a huge integer and
    // the remainder of its division by modulo is considered bet outcome.
    uint constant MAX_MODULO = 100;

    // For modulos below this threshold rolls are checked against a bit mask,
    // thus allowing betting on any combination of outcomes. For example, given
    // modulo 6 for dice, 101000 mask (base-2, big endian) means betting on
    // 4 and 6; for games with modulos higher than threshold (Etheroll), a simple
    // limit is used, allowing betting on any outcome in [0, N) range.
    //
    // The specific value is dictated by the fact that 256-bit intermediate
    // multiplication result allows implementing population count efficiently
    // for numbers that are up to 42 bits, and 40 is the highest multiple of
    // eight below 42.
    uint constant MAX_MASK_MODULO = 40;

    // EVM BLOCKHASH opcode can query no further than 256 blocks into the
    // past. Given that settleBet uses block hash of placeBet as one of
    // complementary entropy sources, we cannot process bets older than this
    // threshold. On rare occasions dice2.win croupier may fail to invoke
    // settleBet in this timespan due to technical issues or extreme Ethereum
    // congestion; such bets can be refunded via invoking refundBet.
    uint constant BET_EXPIRATION_BLOCKS = 120;

    // Standard contract ownership transfer.
    address public owner;
    address private nextOwner;
    // The address corresponding to a private key used to sign placeBet commits.
    address public secretSigner;

    // Adjustable max bet profit. Used to cap bets against dynamic odds.
    uint public maxProfit = 5000 ether;

    // Accumulated jackpot fund.
    uint128 public jackpotSize;

    // Funds that are locked in potentially winning bets. Prevents contract from
    // committing to bets it cannot pay out.
    uint128 public lockedInBets;
    mapping(uint=>uint) private MAX_MASK;

    uint public undealBetNum = 0;
    //list of unSettle commit
    uint256[] public dealFailList;

    uint[] bitMap = [1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768,
    65536, 131072, 262144, 524288, 1048576, 2097152, 4194304, 8388608, 16777216, 33554432, 67108864,
    134217728, 268435456, 536870912, 1073741824, 2147483648, 4294967296, 8589934592, 17179869184, 34359738368];


    bytes constant prefix = "\x19Ethereum Signed Message:\n32";

    // A structure representing a single bet.
    struct Bet {
        // Wager amount in wei.
        uint amount;
        // Modulo of a game.
        uint8 modulo;
        // Block number of placeBet tx.
        uint256 placeBlockNumber;
        // Bit mask representing winning bet outcomes (see MAX_MASK_MODULO comment).
        uint40 mask;
        // Address of a gambler, used to pay out winning bets.
        address gambler;
        //store win amount
        uint winAmount;
    }

    // Mapping from commits to all currently active & processed bets.
    mapping (uint => Bet) public bets;

    address[] public cooAddress;



    // This event is emitted in placeBet to record commit in the logs.
    event OnPlaceBet(uint256 indexed commit, address indexed gambler, uint8 indexed modulo, uint40 mask, uint256 amount, uint256 playceBlock);
    // Events that are issued to make statistic recovery easier.
    event FailedPayment(address indexed beneficiary, uint256 amount);
    event Payment(address beneficiary, uint256 totalAmount, uint256 amount);
    event SettleBetPayment(uint256 indexed commit, address indexed gambler, uint256 indexed totalAmount, uint256 amount, uint256 reveal, uint256 entropy, uint256 dice);
    event LogRefundBet(uint256 indexed commit, address indexed gambler, uint256 indexed totalAmount, uint256 unlockAmount);
    // event JackpotPayment(address indexed gambler, uint256 amount);
    // event Released(address,uint);

    // event TestLog(uint8 indexed flag, uint indexed dicePower, uint40 indexed mask, uint diceWin);

    // Constructor. Deliberately does not take any parameters.
    constructor () public {
        owner = msg.sender;
        cooAddress.push(msg.sender);
        MAX_MASK[uint(2)] = 2;
        MAX_MASK[uint(6)] = 62;
        MAX_MASK[uint(36)] = 68719476734;
        MAX_MASK[uint(100)] = 97;
    }

    // Standard modifier on methods invokable only by contract owner.
    modifier onlyOwner {
        require (msg.sender == owner, "OnlyOwner methods called by non-owner.");
        _;
    }

    modifier onlyCOO() {
        bool isCOO=false;
        for(uint256 i=0; i<cooAddress.length; i++){
            if(msg.sender == cooAddress[i]){
                isCOO = true;
                break;
            }
        }
        require(isCOO);
        _;
    }

    // @param _newCOO The address of the new COO
    function addCOO(address _newCOO) external onlyOwner {
        // if(cooAddress.length>2)//cooAddress maxnum :3
        //     return;
        require(_newCOO != address(0));
        cooAddress.push(_newCOO);
    }

    // Standard contract ownership transfer implementation,
    function approveNextOwner(address _nextOwner) external onlyOwner {
        require (_nextOwner != owner, "Cannot approve current owner.");
        nextOwner = _nextOwner;
    }

    function acceptNextOwner() external {
        require (msg.sender == nextOwner, "Can only accept preapproved new owner.");
        owner = nextOwner;
        cooAddress.push(nextOwner);
    }

    // Fallback function deliberately left empty. It's primary use case
    // is to top up the bank roll.
    function () public payable {
    }

    // See comment for "secretSigner" variable.
    function setSecretSigner(address newSecretSigner) external onlyOwner {
        secretSigner = newSecretSigner;
    }

    // Change the croupier address.
    // function setCroupier(address newCroupier) external onlyOwner {
    //     croupier = newCroupier;
    // }

    // Change max bet reward. Setting this to zero effectively disables betting.
    function setMaxProfit(uint _maxProfit) public onlyOwner {
        require (_maxProfit <= MAX_AMOUNT, "maxProfit should be a sane number.");
        maxProfit = _maxProfit;
    }

    // This function is used to bump up the jackpot fund. Cannot be used to lower it.
    function increaseJackpot(uint increaseAmount) external onlyOwner {
        require (increaseAmount <= address(this).balance, "Increase amount larger than balance.");
        require (jackpotSize + lockedInBets + increaseAmount <= address(this).balance, "Not enough funds.");
        jackpotSize += uint128(increaseAmount);
    }

    // Funds withdrawal to cover costs of dice2.win operation.
    function withdrawFunds(address beneficiary, uint withdrawAmount, uint8 safe) external onlyOwner {
        if(safe == 0){
            sendFunds(beneficiary, withdrawAmount, withdrawAmount);
            return;
        }
        require (withdrawAmount <= address(this).balance, "Increase amount larger than balance.");
        require (jackpotSize + lockedInBets + withdrawAmount <= address(this).balance, "Not enough funds.");
        sendFunds(beneficiary, withdrawAmount, withdrawAmount);
    }

    // Contract may be destroyed only when there are no ongoing bets,
    // either settled or refunded. All funds are transferred to contract owner.
    function kill() external onlyOwner {
        require (lockedInBets == 0, "All bets should be processed (settled or refunded) before self-destruct.");
        selfdestruct(owner);
    }

    function isCOO(address addr) private view returns (bool){
        bool flag=false;
        for(uint256 i=0; i<cooAddress.length; i++){
            if(addr == cooAddress[i]){
                flag = true;
                break;
            }
        }
        return flag;
    }

    /// *** Betting logic

    // Bet states:
    //  amount == 0 && gambler == 0 - 'clean' (can place a bet)
    //  amount != 0 && gambler != 0 - 'active' (can be settled or refunded)
    //  amount == 0 && gambler != 0 - 'processed' (can clean storage)
    //
    //  NOTE: Storage cleaning is not implemented in this contract version; it will be added
    //        with the next upgrade to prevent polluting Ethereum state with expired bets.

    // Bet placing transaction - issued by the player.
    //  betMask         - bet outcomes bit mask for modulo <= MAX_MASK_MODULO,
    //                    [0, betMask) for larger modulos.
    //  modulo          - game modulo.
    //  commitLastBlock - number of the maximum block where "commit" is still considered valid.
    //  commit          - Keccak256 hash of some secret "reveal" random number, to be supplied
    //                    by the dice2.win croupier bot in the settleBet transaction. Supplying
    //                    "commit" ensures that "reveal" cannot be changed behind the scenes
    //                    after placeBet have been mined.
    //  r, s            - components of ECDSA signature of (commitLastBlock, commit). v is
    //                    guaranteed to always equal 27.
    //
    // Commit, being essentially random 256-bit number, is used as a unique bet identifier in
    // the 'bets' mapping.
    //
    // Commits are signed with a block limit to ensure that they are used at most once - otherwise
    // it would be possible for a miner to place a bet with a known commit/reveal pair and tamper
    // with the blockhash. Croupier guarantees that commitLastBlock will always be not greater than
    // placeBet block number plus BET_EXPIRATION_BLOCKS. See whitepaper for details.
    function placeBet(uint betMask, uint modulo, uint commitLastBlock, uint commit, uint8 v, bytes32 r, bytes32 s) external payable {
        // Check that the bet is in 'clean' state.
        Bet storage bet = bets[commit];
        require (bet.gambler == address(0), "Bet should be in a 'clean' state.");

        // Validate input data ranges.
        uint amount = msg.value;
        require (modulo > 1 && modulo <= MAX_MODULO, "Modulo should be within range.");
        require (amount >= MIN_BET && amount <= MAX_AMOUNT, "Amount should be within range.");
        require (betMask > 0 && betMask <= MAX_MASK[modulo], "Mask should be within range.");

        // Check that commit is valid - it has not expired and its signature is valid.
        require (block.number <= commitLastBlock && block.number + 300 > commitLastBlock, "Commit has expired.");
        require(secretSigner == ecrecover(keccak256(abi.encodePacked(prefix, keccak256(abi.encodePacked(commitLastBlock, commit)))), v, r, s));
        // address crecoverAddr = ecrecover(keccak256(abi.encodePacked(prefix, keccak256(abi.encodePacked(commitLastBlock, commit)))), v, r, s);
        // require(isCOO(crecoverAddr) , "ECDSA signature is not valid.");

        // Winning amount and jackpot increase.
        uint possibleWinAmount;
        uint jackpotFee;

        (possibleWinAmount, jackpotFee) = getDiceWinAmount(amount, modulo, betMask);

        // Enforce max profit limit.
        require (possibleWinAmount <= amount + maxProfit, "maxProfit limit violation.");

        // Lock funds.
        lockedInBets += uint128(possibleWinAmount);
        jackpotSize += uint128(jackpotFee);

        // Check whether contract has enough funds to process this bet.
        require (jackpotSize + lockedInBets <= address(this).balance, "Cannot afford to lose this bet.");

        // Store bet parameters on blockchain.
        bet.amount = amount;
        bet.modulo = uint8(modulo);
        bet.placeBlockNumber = block.number;
        bet.mask = uint40(betMask);
        bet.gambler = msg.sender;
        bet.winAmount = possibleWinAmount;
        undealBetNum++;

        // Record commit in logs.
        emit OnPlaceBet(commit, msg.sender, bet.modulo, bet.mask, amount, bet.placeBlockNumber);
    }

    // This is the method used to settle 99% of bets. To process a bet with a specific
    // "commit", settleBet should supply a "reveal" number that would Keccak256-hash to
    // "commit". "placeBlockNum" is the block as seen by croupier; it
    // is additionally asserted to prevent changing the bet outcomes on Ethereum reorgs.
    function settleBet(uint reveal, uint placeBlockNum) external onlyCOO {
        uint commit = uint(keccak256(abi.encodePacked(reveal)));

        Bet storage bet = bets[commit];
        uint placeBlockNumber = bet.placeBlockNumber;

        // Check that bet has not expired yet (see comment to BET_EXPIRATION_BLOCKS).
        require (block.number > placeBlockNumber, "settleBet in the same block as placeBet, or before.");
        require (block.number <= placeBlockNumber + BET_EXPIRATION_BLOCKS, "Blockhash can't be queried by EVM.");
        require (placeBlockNumber == placeBlockNum);

        // Settle bet using reveal and blockHash as entropy sources.
        settleBetCommon(commit, bet, reveal, placeBlockNum);
    }


    // Common settlement code for settleBet & settleBetUncleMerkleProof.
    function settleBetCommon(uint commit, Bet storage bet, uint reveal, uint placeBlockNum) private {
        // Fetch bet parameters into local variables (to save gas).
        uint modulo = bet.modulo;

        // Check that bet is in 'active' state.
        require (bet.amount != 0, "Bet should be in an 'active' state");

        // The RNG - combine "reveal" and blockhash of placeBet using Keccak256. Miners
        // are not aware of "reveal" and cannot deduce it from "commit" (as Keccak256
        // preimage is intractable), and house is unable to alter the "reveal" after
        // placeBet have been mined (as Keccak256 collision finding is also intractable).
        uint entropy = uint(keccak256(abi.encodePacked(reveal, blockhash(placeBlockNum), blockhash(placeBlockNum + 1))));


        // Do a roll by taking a modulo of entropy. Compute winning amount.
        uint dice = entropy % modulo;

        uint diceWinAmount;
        uint _jackpotFee;
        (diceWinAmount, _jackpotFee) = getDiceWinAmount(bet.amount, modulo, bet.mask);

        uint diceWin = 0;
        uint jackpotWin = 0;

        // Determine dice outcome.
        if (modulo <= MAX_MASK_MODULO) {
            // For small modulo games, check the outcome against a bit mask.
            //emit TestLog(1, entropy, bet.mask, dice);
            if ((2 ** dice) & bet.mask != 0) {
                diceWin = diceWinAmount;
                //emit TestLog(2, (2 ** dice), bet.mask, diceWin);
            }
        } else {
            // For larger modulos, check inclusion into half-open interval.
            if (dice < bet.mask) {
                diceWin = diceWinAmount;
            }
        }

        // Unlock the bet amount, regardless of the outcome.
        //lockedInBets -= uint128(diceWinAmount);

        // Roll for a jackpot (if eligible).
        if (bet.amount >= MIN_JACKPOT_BET) {
            // The second modulo, statistically independent from the "main" dice roll.
            // Effectively you are playing two games at once!
            uint jackpotLuckyNum = (entropy / modulo) % JACKPOT_MODULO;
            // Bingo!
            if (jackpotLuckyNum == uint(888)) {
                jackpotWin = jackpotSize;
                jackpotSize = 0;
            }
        }

        // Log jackpot win.
        // if (jackpotWin > 0) {
        //     emit JackpotPayment(bet.gambler, jackpotWin);
        // }

        // Send the funds to gambler.
        uint paymentAmount = diceWin + jackpotWin == 0 ? 1 wei : diceWin + jackpotWin;
        if (bet.gambler.send(paymentAmount)) {
            //delete bets[commit];
            bet.amount = 0;
            lockedInBets -= uint128(diceWinAmount);
            emit SettleBetPayment(commit, bet.gambler, paymentAmount, diceWin, reveal, entropy, dice);
        } else {
            if(paymentAmount>1){
                bet.winAmount = paymentAmount;
                dealFailList.push(commit);
            }else{//ignore fail bet
                bet.amount = 0;
            }
            // emit FailedPayment(bet.gambler, paymentAmount);//t 缓存开奖失败记录
        }
        undealBetNum--;
    }

    function dealFailNum() public view returns(uint){
        return dealFailList.length;
    }


    // Refund transaction - return the bet amount of a roll that was not processed in a
    // due timeframe. Processing such blocks is not possible due to EVM limitations (see
    // BET_EXPIRATION_BLOCKS comment above for details). In case you ever find yourself
    // in a situation like this, just contact the dice2.win support, however nothing
    // precludes you from invoking this method yourself.
    function refundBet(uint commit) external {
        // Check that bet is in 'active' state.
        Bet storage bet = bets[commit];
        // Check that bet has already expired.
        require (block.number > bet.placeBlockNumber + BET_EXPIRATION_BLOCKS, "Blockhash can't be queried by EVM.");
        uint amount = bet.amount;
        require (amount != 0, "Bet should be in an 'active' state");
        bet.amount = 0;

        // uint diceWinAmount;
        // uint jackpotFee;
        // (diceWinAmount, jackpotFee) = getDiceWinAmount(amount, bet.modulo, bet.mask);

        // Send the refund.
        uint sendAmount = bet.winAmount;
        if(sendAmount == 0){
            sendAmount = amount;
        }
        bool sendOk = sendFunds(bet.gambler, amount, amount);//2019.5.13 sendAmount=> amount refund more than they bet
        if(sendOk){
            lockedInBets -= uint128(sendAmount);
            //remove failed bet by commit
            uint len = dealFailList.length;
            bool found = false;
            for (uint i = 0; i<len; i++) {
                if(commit == dealFailList[i]){
                    found = true;
                }
                if(found && i<len-1){
                    dealFailList[i] = dealFailList[i+1];
                }
            }
            if(found){
                delete dealFailList[len-1];
                dealFailList.length--;
            }
            emit LogRefundBet(commit, bet.gambler, amount, sendAmount);
            undealBetNum--;
        }else{
            bet.amount = amount;
        }
    }

    // Get the expected win amount after house edge is subtracted.
    function getDiceWinAmount(uint amount, uint modulo, uint betMask) private view returns (uint winAmount, uint jackpotFee) {
        require (betMask > 0 && betMask <= MAX_MASK[modulo], "Win probability out of range.");

        jackpotFee = amount >= MIN_JACKPOT_BET ? JACKPOT_FEE : 0;
        uint betOnTargetNum = 0;
        if(modulo <= MAX_MASK_MODULO){
            for(uint8 i=0; i<bitMap.length; i++){
                if(bitMap[i] & betMask == bitMap[i]){
                    betOnTargetNum++;
                }
                // if(i<bitMap.length-1){
                //     if(betMask<bitMap[i+1])
                //         break;
                // }
            }
        }else{
            betOnTargetNum = betMask;
        }

        //standZoomRate = modulo/betOnTargetNum
        uint fee = amount*modulo/betOnTargetNum*2/100;
        // if(amount<60000000000000000000){//60ether
        //     fee = amount*modulo/betOnTargetNum*2/100;
        // }else if(amount<100000000000000000000){//100ether
        //     fee = amount*modulo/betOnTargetNum*1/100;
        // }else{//0.5%
        //     fee = amount*modulo/betOnTargetNum*5/1000;
        // }
        winAmount = amount*modulo/betOnTargetNum - fee - jackpotFee;
    }

    // Helper routine to process the payment.
    function sendFunds(address beneficiary, uint amount, uint successLogAmount) private returns(bool){
        bool ok = false;
        if (beneficiary.send(amount)) {
            ok = true;
            //emit Released(beneficiary, amount);
            emit Payment(beneficiary, amount, successLogAmount);
        } else {
            emit FailedPayment(beneficiary, amount);
        }
        return ok;
    }

}
