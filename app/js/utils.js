(function(){

	angular.module('safemarket').service('utils',function(ticker,$q,$timeout,$interval){

		utils = this
		

		function convertObjectToHex(object){
			var objectBytes = msgpack.pack(object);
			return '0x'+cryptocoin.convertHex.bytesToHex(objectBytes)
		}

		function convertHexToObject(hex){
			try{
				var objectBytes = cryptocoin.convertHex.hexToBytes(hex)
				return msgpack.unpack(objectBytes)
			}catch(e){
				return null
			}
		}

		function convertCurrency(amount,currencies){

			var deferred = $q.defer()

			if(typeof amount!=='string')
				amount = amount.toString()

			
			check({
				amount:amount
				,from:currencies.from
				,to:currencies.to
			},{
				amount:{presence:true,type:'string',numericality:{}}
				,from:{presence:true,inclusion:Object.keys(ticker.rates),type:'string'}
				,to:{presence:true,inclusion:Object.keys(ticker.rates),type:'string'}
			})

			amount = 
				(new BigNumber(amount))
					.div(ticker.rates[currencies.from])
					.times(ticker.rates[currencies.to])

			return amount
		}

		function waitForTx(txHex, duration, pause){

			utils.waitForTxCount++
			console.log('waitForTx',txHex)

			var deferred = $q.defer()
				,duration = duration ? duration : (1000*60)
				,pause = pause ? pause : (1000*3)
				,timeStart = Date.now()
				,interval = $interval(function(){

					console.log('waiting...')

					var tx = web3.eth.getTransactionReceipt(txHex)

					if(tx){
						console.log('tx',tx)
						$interval.cancel(interval)
						$timeout.cancel(timeout)
						deferred.resolve(tx)
						utils.waitForTxCount--
					}


				},pause)
				,timeout = $timeout(function(){
					$interval.cancel(interval)
					deferred.reject('Transaction not found after '+duration+'ms')
					utils.waitForTxCount--
				},duration)

			return deferred.promise

		}

		function waitForTxs(txHexes){
			var deferred = $q.defer()
				,completedCount = 0

			if(txHexes.length === 0)
				$timeout(function(){
					deferred.reject('No transactions to wait for')
				},1)

			txHexes.forEach(function(txHex){
				waitForTx(txHex)
					.then(function(){
						completedCount++
						if(completedCount===txHexes.length)
							deferred.resolve()
					},function(error){
						deferred.reject(error)
					}).catch(function(error){
						deferred.reject(error)
					})
			})

			return deferred.promise
		}

		function check(data,constraints,prefix){

			if(!data)
				throw 'data is not an object'
				
			var dataKeys = Object.keys(data)
			    ,constraintKeys = Object.keys(constraints)

			constraintKeys.forEach(function(key){
				if(!constraints[key].type)
					throw key+' must be constrained by type'
			})

			dataKeys.forEach(function(key){
			    if(constraintKeys.indexOf(key)===-1)
				    delete data[key]
			})  

			var errors = validate(data,constraints)

			if(errors===undefined || errors===null)
				return null

			var error = errors[Object.keys(errors)[0]][0]

			error = prefix ? prefix+' '+error : error

		    throw error
		}

		angular.merge(this,{
			convertObjectToHex:convertObjectToHex
			,convertHexToObject:convertHexToObject
			,convertCurrency:convertCurrency
			,waitForTx:waitForTx
			,waitForTxs:waitForTxs
			,check:check
			,nullAddress:'0x'+Array(21).join('00')
			,waitForTxCount:0
		})
		
	})



}());

validate.validators.exists = function(value, options, key, attributes) {
	if(options===true)
		if(value === null || value === undefined)
			return value+' is '+(typeof value)
		else
			return null
	else
		if(value === null || value === undefined)
			return null
		else
			return value+' is '+(typeof value)
};


validate.validators.type = function(value, options, key, attributes) {
	if(value === null || value === undefined) return null

	if(options==='array')
    	return typeof Array.isArray(value) ? null : 'is not an array'

    if(options==='identity')
    	return _.startsWith(value,'0x') && value.length===132 ? null : 'is not a valid identity'

    if(options==='address')
    	return _.startsWith(value,'0x') && value.length===42 ? null : 'is not a valid address'

	return typeof value===options ? null : 'is not a '+options
};

validate.validators.startsWith = function(value, options, key, attributes) {
  if(!value) return null
	return _.startsWith(_.trim(value),options) ? null : 'should start with '+options
};

validate.validators.endsWith = function(value, options, key, attributes) {
  if(!value) return null
  return _.endsWith(_.trim(value),options) ? null : 'should end with '+options
};