contract Keystore{

	event Key(address indexed addr, bytes data);

	function setKey(bytes data){
		Key(tx.origin, data);
	}

}

contract Organization{

	address owner;

	Member[] members;

	struct Member{
		address addr;
		bool isActive;
	}

	function Organization(){
		owner = msg.sender;
	}

	function setOwner(address _owner){
		if(msg.sender != owner) return;
		owner = _owner;
	}

	function proxy(uint memberIndex, address contractAddr, bytes4 abiSignature, bytes data){
		if(msg.sender != members[memberIndex].addr) return;
		contractAddr.call(abiSignature, data);
	}

}

contract Market{
	address admin;
	event Meta(bytes meta);

	function Market(bytes meta){
		admin = tx.origin;
		Meta(meta);
	}

	function getAdmin() constant returns(address){
		return admin;
	}
	
	function setMeta(bytes meta){
		if(tx.origin!=admin) return;
		Meta(meta);
	}

}

contract Order{
	address buyer;
	address merchant;
	address admin;
	uint fee;
	uint disputeSeconds;
	uint status;
	uint received;
	uint timestamp;
	uint shippedAt;

	event Meta(bytes meta);
	event Message(address indexed sender, bytes text);
	event Update(address indexed sender, uint indexed status);

	uint constant initialized = 0;
	uint constant cancelled = 1;
	uint constant shipped = 2;
	uint constant finalized = 3;
	uint constant disputed = 4;
	uint constant resolved = 5;

	function Order(
		bytes _meta
		,address _merchant
		,address _admin
		,uint _fee
		,uint _disputeSeconds
	){
		buyer = tx.origin;
		merchant = _merchant;
		admin = _admin;
		fee = _fee;
		disputeSeconds = _disputeSeconds;
		timestamp = now;
		Meta(_meta);
	}

	function addMessage(bytes text){
		if(tx.origin != buyer && tx.origin != merchant && tx.origin != admin)
			return;

		Message(tx.origin, text);
	}

	function(){
		received += msg.value;
	}

	function getBuyer() constant returns(address){
		return buyer;
	}

	function getMerchant() constant returns(address){
		return merchant;
	}

	function getAdmin() constant returns(address){
		return admin;
	}

	function getFee() constant returns(uint){
		return fee;
	}

	function getStatus() constant returns(uint){
		return status;
	}

	function getReceived() constant returns(uint){
		return received;
	}

	function getTimestamp() constant returns(uint){
		return timestamp;
	}

	function addUpdate(uint _status) private{
		status = _status;
		Update(tx.origin,_status);
	}

	function cancel(){

		if(status != initialized)
			return;

		if(tx.origin != buyer && tx.origin != merchant)
			return;

		var isSent = buyer.send(this.balance);
		if(!isSent) return;

		addUpdate(cancelled);
	}

	function markAsShipped(){

		if(status !=  initialized)
			return;

		if(tx.origin != merchant)
			return;

		shippedAt = now;
		addUpdate(shipped);
	}

	function finalize(){

		if(status !=  shipped)
			return;

		if(tx.origin != buyer && tx.origin != merchant)
			return;

		if(tx.origin == merchant && now - shippedAt < disputeSeconds)
			return;

		var isSent = merchant.send(this.balance);
		if(!isSent) return;
		
		addUpdate(finalized);
	}

	function dispute(){
		if(tx.origin != buyer)
			return;

		if(status != shipped)
			return;

		if(now - shippedAt > disputeSeconds)
			return;

		if(admin==0)
			return;

		addUpdate(disputed);
	}

	function resolve(uint buyerAmount){
		if(status!=disputed)
			return;

		if(tx.origin != admin)
			return;

		if(buyerAmount>0)
			buyer.send(buyerAmount);

		var merchantAmount = this.balance-buyerAmount;

		if(merchantAmount>0)
			merchant.send(merchantAmount);

		addUpdate(resolved);
	}
}



contract Store{
    address merchant;
    event Meta(bytes meta);

    function Store(bytes meta){
        merchant = tx.origin;
        Meta(meta);
    }
    
    function getMerchant() constant returns(address){
    	return merchant;
    }

    function setMeta(bytes meta){
		if(tx.origin!=merchant) return;
		Meta(meta);
	}
}