(function(){

angular.module('app').factory('OrderBookEntry',function($q,utils,Order){

	function OrderBookEntry(result){
		this.result = result
		this.orderAddr = result.args.orderAddr
		this.storeAddr = result.args.storeAddr
		this.submarketAddr = result.args.submarketAddr
		this.usesSubmarket = this.submarketAddr !== utils.nullAddr
		this.timestamp = web3.eth.getBlock(result.blockNumber).timestamp
		this.status = Order.contractFactory.at(this.orderAddr).getStatus().toNumber()
	}

	OrderBookEntry.fetch = function(filters){
		var orderBookEntries = []
			,deferred = $q.defer()
			,filters = filters || {}

		OrderBook.Entry(filters,{fromBlock:0,toBlock:'latest'}).get(function(error,results){
			results.forEach(function(result){
				orderBookEntries.push(new OrderBookEntry(result))
			})
			deferred.resolve(orderBookEntries)
		})

		return deferred.promise
	}

	return OrderBookEntry
})

})();