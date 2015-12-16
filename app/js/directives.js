(function(){

angular.module('app').directive('a',function(){
	return {
		link:function($scope,$element,$attributes){
			$element.on("click",function(e){
				if(!$attributes.href || $attributes.href.indexOf('#')===0 || $attributes.href==='.') return

				if(!confirm('You are now leaving SafeMarket. This may be an attempt to deanonymize you. Continue?'))
					e.preventDefault()
			})
		}
	}
})

angular.module('app').directive('billboard',function(helpers,safemarket){
	return {
		templateUrl:'billboard.html'
		,scope:{
			text:'=billboard'
		},link:function($scope,$element,$attributes){
			$scope.$watch('text',function(){
				$scope.words = $scope.text ? $scope.text.split(' ') : []
			})

			$scope.hrefForWord = function(word){
				if(word[0]!='@') return null
				
				var alias = word.substr(1)

				if(validate({alias:alias},{word:{type:'alias'}})) return null

				var addr = AliasReg.getAddr(alias)
					,type = safemarket.utils.getTypeOfAlias(alias)
					,url = helpers.getUrl(type,addr)

				return url
			}
		}
	}
})

angular.module('app').directive('forum',function(){
	return {
		templateUrl:'forum.html'
		,controller:'ForumController'
		,scope:{
			forum:'='
		}
	}
})

angular.module('app').directive('comment',function(user){
	return {
		templateUrl:'comment.html'
		,scope:{
			comment:'='
			,isRepliable:'=commentIsRepliable'
		}
		,link:function($scope,$element,$attributes){
			$scope.isHidden = user.data.hiddenCommentIds.indexOf($scope.comment.id)!==-1
			$scope.toggleIsHidden = function(){
				if(!$scope.isHidden){
					user.data.hiddenCommentIds.push($scope.comment.id)
				}
				else{
					var hiddenCommentIdIndex = user.data.hiddenCommentIds.indexOf($scope.comment.id)
					user.data.hiddenCommentIds.splice(hiddenCommentIdIndex,1)
				}
				user.save()
				$scope.$parent.showReplies = false
				$scope.isHidden = !$scope.isHidden
			}
		}
	}
})

angular.module('app').directive('addComment',function(){
	return {
		templateUrl:'addComment.html'
		,scope:true
		,controller:'AddCommentController'
		,link:function($scope,$element,$attributes){
			$scope.commentsGroup = $scope.$eval($attributes.addComment)
		}
	}
})

angular.module('app').directive('gas',function(safemarket,user){
	return {
		templateUrl:'gas.html'
		,scope:{
			gas:'='
		},link:function(scope,element,attributes){
			scope.$watch('gas',function(){
				scope.costInEther = web3.fromWei(web3.eth.gasPrice,'ether').times(scope.gas)
				scope.userCurrency = user.data.currency
				scope.costInUserCurrency = safemarket.utils.convertCurrency(scope.costInEther,{from:'ETH',to:user.data.currency})
			})
		}
	}
})

angular.module('app').directive('amounts',function(utils){
	return {
		templateUrl:'amounts.html'
		,scope:{
			value:'='
			,from:'='
			,to:'='
		},link:function($scope){
			$scope.amounts = {}

			$scope.$watchGroup(["value","from","to"],function(){
				if(typeof $scope.value === 'string' || typeof $scope.value === 'number')
					var value = new BigNumber($scope.value || 0)
				else
					var value = angular.copy($scope.value  || 0)

				if(!$scope.from || !$scope.to || value===undefined) return
				$scope.to.forEach(function(currency){
					$scope.amounts[currency] = utils.convertCurrency(value,{from:$scope.from,to:currency})
				})
			})
		}
	}
})

angular.module('app').directive('timestamp',function(){
	return {
		scope:{timestamp:'='}
		,templateUrl:'timestamp.html'
		,link:function($scope){
			$scope.timestampMs = 0
			$scope.$watch('timestamp',function(){
				if(!$scope.timestamp) return
				$scope.timestampMs = parseInt($scope.timestamp.toString())*1000
			})
		}
	}
})

angular.module('app').directive('key',function(){
	return {
		scope:{key:'='}
		,templateUrl:'key.html'
	}
})

angular.module('app').directive('collapsable',function(){
	return {
		scope:{
			"isCollapsed":"="
		},link:function(scope,element,attributes){
			if(scope.isCollapsed)
				element.addClass('isCollapsed')
			else
				element.removeClass('isCollapsed')

			element.on('click',function(event){
				if(event.target.nodeName!=='TBODY') return
				element.toggleClass('isCollapsed')
			})
		}
	}
})

angular.module('app').directive('orderBook',function(){
	return {
		templateUrl:'orderBook.html'
		,controller:'OrderBookController'
		,scope:{filter:'=orderBook'}
	}
})

angular.module('app').directive('aliasBar',function(){
	return {
		templateUrl:'bar.html'
		,controller:'BarController'
		,scope:{alias:'@aliasBar'}
	}
})

angular.module('app').directive('aliasInput', function(growl) {
  	return {
    	require: 'ngModel',
    	link: function (scope, element, attr, ngModelCtrl) {
      		ngModelCtrl.$parsers.push(function(text) {
        		var transformedInput = text.toLowerCase().replace(/[^a-z0-9]/g, '');
        		if(transformedInput !== text) {
           			ngModelCtrl.$setViewValue(transformedInput);
            		ngModelCtrl.$render();
            		growl.addErrorMessage('Aliases consist entirely of lower case letters')
        		}
        		return transformedInput;  // or return Number(transformedInput)
      		});
    	}
  	}; 
});

angular.module('app').directive('numericInput', function(growl) {
	return {
        require: 'ngModel',
        link: function (scope, element, attr, ngModelCtrl) {  
        	ngModelCtrl.$parsers.push(function(text) {
        		var transformedInput = text.replace(/[^0-9.]/g, "");
        		if(transformedInput !== text) {
           			ngModelCtrl.$setViewValue(transformedInput);
            		ngModelCtrl.$render();
            		growl.addErrorMessage('Numeric input only')
        		}
        		return transformedInput;  // or return Number(transformedInput)
      		});         
        }
    };
});

angular.module('app').directive('aliasValidator', function(safemarket) {
  	return {
  		scope:{
  			alias:'=aliasValidator'
  			,type:'@aliasType'
  		},link: function ($scope) {
      		$scope.$watch('alias',function(alias){
      			if($scope.type)
      				$scope.isValid = safemarket.utils.getTypeOfAlias(alias) === $scope.type
      			else
      				$scope.isValid = safemarket.utils.isAliasAvailable(alias)
      		})
    	},templateUrl:'aliasValidator.html'
  	}; 
});

angular.module('app').directive('alias', function(safemarket,helpers) {
  	return {
  		scope:{
  			addr:'=alias'
  		},link: function ($scope) {
  			$scope.$watch('addr',function(){
	      		$scope.alias = safemarket.utils.getAlias($scope.addr)
	      		$scope.type = safemarket.utils.getTypeOfAlias($scope.alias)
	      		$scope.url = helpers.getUrl($scope.type,$scope.addr)
  			
	      		if(!$scope.type)
	      			$scope.isValid = false
	      		else
	      			$scope.isValid = true
  			})
    	},templateUrl:'alias.html'
  	}; 
});

angular.module('app').directive('tabUrl',function(helpers){
	return {
		require: '^tabset'
		,link: { pre: function($scope,$element,$attributes,$controller){

			$scope.$parent.slugs = $scope.$parent.slugs || []

			var tabIndex = $scope.$parent.slugs.length
				,args = $scope.$eval($attributes.tabUrl)
				,type = args[0]
				,addr = args[1]
				,slug = args[2]
				,url = helpers.getUrl(type,addr,slug)

			$scope.$parent.slugs.push(slug)


			if(url===window.location.hash)
				$controller.select($scope.$parent.tabs[tabIndex])

			$scope.$parent.tabs[tabIndex].onSelect=function(){
				window.location.hash = url
			}
			
		}}
	}	
})

})();