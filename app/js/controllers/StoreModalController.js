/* globals angular, web3, _ */

angular.module('app').controller('StoreModalController', ($scope, $filter, utils, Store, AliasReg, ticker, growl, $modal, $modalInstance, store, user, helpers, constants) => {

  $scope.currencies = Object.keys(ticker.rates)
  $scope.user = user
  $scope.submarkets = []

  $scope.disputeSecondsOptions = [
    { value: '0' },
    { value: '86400' },
    { value: '172800' },
    { value: '259200' },
    { value: '604800' },
    { value: '1209600' },
    { value: '1814400' },
    { value: '2592000' }
  ]

  $scope.disputeSecondsOptions.forEach((disputeSecondsOption) => {
    disputeSecondsOption.label = $filter('disputeSeconds')(disputeSecondsOption.value)
  })

  $scope.addSubmarket = function addSubmarket() {
    $scope.submarkets.push({})
  }

  if (store) {

    $scope.isEditing = true
    $scope.alias = store.alias
    $scope.name = store.meta.name
    $scope.currency = store.currency
    $scope.bufferCentiperun = store.infosphered.data.bufferCentiperun.toNumber()
    $scope.disputeSeconds = store.infosphered.data.disputeSeconds.toString()
    $scope.info = store.meta.info
    $scope.isOpen = store.infosphered.data.isOpen
    $scope.minTotal = store.infosphered.data.minTotal.div(constants.tera).toNumber()
    $scope.affiliateFeeCentiperun = store.infosphered.data.affiliateFeeCentiperun.toNumber()
    $scope.products = _.clone(store.products)
    $scope.transports = _.clone(store.transports)

    // if (store.meta.data.submarketAddrs) {
    //   store.meta.data.submarketAddrs.forEach((submarketAddr) => {
    //     $scope.submarkets.push({ alias: utils.getAlias(submarketAddr) })
    //   })
    // }

  } else {

    $scope.currency = user.getCurrency()
    $scope.bufferCentiperun = 0
    $scope.products = []
    $scope.disputeSeconds = '1209600'
    $scope.isOpen = true
    $scope.transports = []
    $scope.minTotal = 0
    $scope.affiliateFeeCentiperun = 5

  }

  $scope.cancel = function cancel() {
    $modalInstance.dismiss('cancel')
  }

  $scope.addProduct = function addProduct() {
    $scope.products.push({
      id: utils.getRandom().times('100000000').round().toString()
    })
  }

  $scope.addTransport = function addTransport() {
    $scope.transports.push({})
  }

  $scope.submit = function submit() {

    const alias = $scope.alias ? $scope.alias.trim().replace(/(\r\n|\n|\r)/gm, '') : ''
    const meta = {
      name: $scope.name,
      info: $scope.info
    }

    $scope.submarkets.forEach((submarket) => {
      meta.submarketAddrs.push(AliasReg.getAddr(submarket.alias))
    })

    try {
      Store.check(alias, meta)
    } catch (e) {
      growl.addErrorMessage(e)
      return
    }

    const minTotal = constants.tera.times($scope.minTotal)
    const affiliateFeeCentiperun = web3.toBigNumber($scope.affiliateFeeCentiperun)

    if (store) {

      store.set({
        isOpen: $scope.isOpen,
        currency: $scope.currency,
        bufferCentiperun: web3.toBigNumber($scope.bufferCentiperun).toNumber(),
        disputeSeconds: (web3.toBigNumber($scope.disputeSeconds)).toNumber(),
        minTotal,
        affiliateFeeCentiperun
      }, meta, $scope.products, $scope.transports).then(() => {
        store.update().then(() => {
          $modalInstance.close(store)
        })
      })

    } else {

      if (!utils.isAliasAvailable(alias)) {
        return growl.addErrorMessage(`@${alias} is already taken`)
      }

      Store
        .create(user.getAccount(), $scope.isOpen, $scope.currency, $scope.bufferCentiperun, $scope.disputeSeconds, minTotal, affiliateFeeCentiperun, meta, $scope.alias)
        .then((_store) => {
          user.addStore(_store.addr)
          user.save()
          $modalInstance.close()
        }, (error) => {
          $scope.error = error
        })
    }
  }
})
