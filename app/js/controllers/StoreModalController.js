(function(){

	angular.module('app').controller('StoreModalController',function($scope,$filter,safemarket,ticker,growl,$modal,$modalInstance,store,user,helpers){

		$scope.currencies = Object.keys(ticker.rates)
		$scope.user = user
		$scope.markets = []

		$scope.disputeSecondsOptions = [
			{value:'0'}
			,{value:'86400'}
			,{value:'172800'}
			,{value:'259200'}
			,{value:'604800'}
			,{value:'1209600'}
			,{value:'1814400'}
			,{value:'2592000'}
		]

		$scope.disputeSecondsOptions.forEach(function(disputeSecondsOption){
			disputeSecondsOption.label = $filter('disputeSeconds')(disputeSecondsOption.value)
		})

		if(store){
			$scope.isEditing = true
			$scope.alias = store.alias
			$scope.name = store.meta.name
			$scope.currency = store.meta.currency
			$scope.percentAffiliateRaw = store.affiliatePercentage
			$scope.products = store.meta.products
			$scope.disputeSeconds = store.meta.disputeSeconds
			$scope.info = store.meta.info
			$scope.isOpen = store.meta.isOpen
			$scope.transports = store.meta.transports || []
			$scope.minTotal = store.meta.minTotal

			if(store.meta.marketAddrs)
			store.meta.marketAddrs.forEach(function(marketAddr){
				$scope.markets.push({alias:safemarket.utils.getAlias(marketAddr)})
			})

		}else{
			$scope.currency = user.data.currency
			$scope.percentAffiliateRaw = ".5"
			$scope.products = []
			$scope.disputeSeconds = "1209600"
			$scope.isOpen = true
			$scope.transports = []
			$scope.minTotal = '0'
		}

		var multipler = Math.pow(10,10)
		$scope.$watch('percentAffiliateRaw',function(percentAffiliateRaw){
			$scope.percentAffiliate = new BigNumber(parseInt(percentAffiliateRaw*multipler)).div(multipler)
			$scope.percentStoreOwner = $scope.percentAffiliate.minus(1).times(-1)
		})

		$scope.cancel = function(){
			$modalInstance.dismiss('cancel')
		}

		function addProduct(){
			$scope.products.push({
				id:BigNumber.random().times('100000000').round().toString()
			})
		}
		$scope.addProduct = addProduct

		function addTransport(){
			$scope.transports.push({
				id:BigNumber.random().times('100000000').round().toString()
			})
		}
		$scope.addTransport = addTransport

		$scope.submit = function(){
			var alias = $scope.alias.trim().replace(/(\r\n|\n|\r)/gm,"")
			,affiliatePercentage=parseFloat($scope.percentAffiliateRaw)
			,meta = {
				name:$scope.name
				,currency:$scope.currency
				,affiliatePercentage:$scope.percentAffiliateRaw
				,products:$scope.products
				,disputeSeconds:$scope.disputeSeconds
				,isOpen:!!$scope.isOpen
				,info:$scope.info
				,marketAddrs:[]
				,transports:$scope.transports
				,minTotal:$scope.minTotal
			}

			$scope.markets.forEach(function(market){
				meta.marketAddrs.push(AliasReg.getAddr(market.alias))
			})


			try{
				safemarket.Store.check(alias,affiliatePercentage,meta)
			}catch(e){
				growl.addErrorMessage(e)
				console.error(e)
				return
			}

			if(store){
				var estimatedGas = store.contract.setMeta.estimateGas(meta)
				,doContinue = helpers.confirmGas(estimatedGas)

				if(!doContinue) return;

				$scope.isSyncing = true

				store
				.setMeta(meta)
				.then(function(store){
					$scope.isSyncing = false
					$modalInstance.close(store)
				},function(error){
					$scope.error = error
					$scope.isSyncing = false
				}).catch(function(error){
					console.error(error)
				})
			}else{

				if(!safemarket.utils.isAliasAvailable(alias)){
					return growl.addErrorMessage('@'+alias+' is already taken')
				}

				var estimatedGas = Store.estimateCreationGas(alias,affiliatePercentage,meta)
				,doContinue = helpers.confirmGas(estimatedGas)

				if(!doContinue) return

				$scope.isSyncing = true
				console.log(affiliatePercentage);
				Store.create(alias,affiliatePercentage,meta)
				.then(function(store){
					user.data.storeAddrs.push(store.addr)
					user.save()
					$modalInstance.dismiss()
				},function(error){
					$scope.error = error
					$scope.isSyncing = false
				}).catch(function(error){
					console.error(error)
				})

			}
		}
	})

})();