const Setup = require('./setup').setup
const getUserBalanceKey = require('./helpers').getUserBalanceKey
const getDeviceBalanceKey = require('./helpers').getDeviceBalanceKey
const getUserBalanceExpirationKey = require('./helpers').getUserBalanceExpirationKey
const getDeviceReservationKey = require('./helpers').getDeviceReservationKey
/*
* 
*/

// let dApp = Base.new(accounts.dapp)
// dApp.createAccount()
// dApp.createDevice()
// dApp.burnAllTokens()
// dApp.reissueTokens()


class SmartAccount {

  constructor(dapp_account, asset_id, debugEnabled = false) {
    this.dapp_account = dapp_account
    this.asset_id = asset_id
    this.debugEnabled = debugEnabled
    this.dd('SmartAccount initialized with dapp_account address: ' + address(dapp_account) + ' and asset_id: ' + asset_id)
  }

  /*
   * Create valid account in dapp_account
   * 
  */
  async createAccount(caller, amount = 0) {
    const iTx = invokeScript({
      dApp: address(this.dapp_account),
      call: {
        function: "createAccount",
      },
      payment: [{ assetId: this.asset_id, amount: amount }]
    }, caller);

    await broadcast(iTx)
    await waitForTx(iTx.id);
    this.dd('Account ' + caller + '  (' + address(caller) + ') has been created in dApp (' + address(this.dapp_account) + ') | tx_id: ' + iTx.id)
  }

/*
 * Create valid account in dapp without invoke the @callable script
 * Method have to be executed before creating SmartAccount !
 * Useful when you would like to run tests on account with expired tokens
 *
*/
  async rawCreateExpiredAccount(caller, balance = 0, balanceExp) {
    if (balanceExp == undefined) {
      const dateOffset = (24 * 60 * 60 * 1000) * Setup.EXP_TOKEN_DAYS * 2
      balanceExp = Date.now() - dateOffset
      this.dd('BalanceExpiration is set to: ' + balanceExp)
    }

    let tx = await broadcast(data({ data: [{ key: getUserBalanceKey(address(caller)), value: balance }, { key: getUserBalanceExpirationKey(address(caller)), value: balanceExp }] }, this.dapp_account))
    
    await broadcast(tx)
    await waitForTx(tx.id);


    this.dd('Account ' + caller + '  (' + address(caller) + ') has been MANUALY created in dApp (' + address(this.dapp_account) + ') | tx_id: ' + tx.id)
  }


  /*
   * Create valid account in dapp without invoke the @callable script
   * Method have to be executed before creating SmartAccount !
   * Useful when you would like to run tests on account with expired tokens
   *
  */
  async rawCreateReservation(caller, deviceAddr, reservationDate = Date.now() ) {
    const payload = { data : [
      { key: getUserBalanceKey(address(caller)), value: 321 * Setup.WVS },
      { key: getDeviceReservationKey(address(deviceAddr), reservationDate), value: address(caller) },
      { key: getDeviceBalanceKey(address(deviceAddr)), value: 123 * Setup.WVS }
    ]}
    
    let tx = await broadcast(data(payload, this.dapp_account))

    await broadcast(tx)
    await waitForTx(tx.id);
    this.dd('Reservation of device ' + address(deviceAddr) + ' has been MANUALY created in dApp (' + address(this.dapp_account) + ') by ' + address(caller) + ' | tx_id: ' + tx.id)
  }


  /*
   * Create valid device in dapp_account
   * 
   */
  async createDevice(caller, deviceAddress = "TEST_DEVICE_ADDRESS", amount = 0) {
    const iTx = invokeScript({
      dApp: address(this.dapp_account),
      call: {
        function: "createDevice",
        args: [{ type: 'string', value: deviceAddress }, { type: 'integer', value: amount }]
      }
    }, caller);

    await broadcast(iTx)
    await waitForTx(iTx.id);
    this.dd('Device ' + deviceAddress + ' has been created in dApp | tx_id: ' + iTx.id)
  }

  async burnAllTokens(caller) {
    let balance = await assetBalance(this.asset_id, address(this.dapp_account))

    const assetParams = {
      assetId: this.asset_id,
      quantity: balance,
      senderPublicKey: publicKey(this.dapp_account),
      fee: 0.005 * Setup.WVS
    }

    const bTx = burn(assetParams, caller);
    await broadcast(bTx)
    await waitForTx(bTx.id)
  }


  async updateAssetExpirationDate(caller) {
    const iTx = invokeScript({
      dApp: address(this.dapp_account),
      call: {
        function: "updateAssetExpirationDate"
      }
    }, caller);

    await broadcast(iTx)
    await waitForTx(iTx.id)

    this.dd('updateAssetExpirationDate has been invoked | tx_id: ' + iTx.id)
  }

  async deposit(caller, amount = 0) {
    const iTx = invokeScript({
      dApp: address(this.dapp_account),
      call: { function: "deposit" },
      payment: [{ assetId: this.asset_id, amount: amount }]
    }, caller);

    await broadcast(iTx)
    await waitForTx(iTx.id);    
  }

  async reserve(caller, deviceAddress, date) {
    const iTx = invokeScript({
      dApp: address(this.dapp_account),
      call: { 
        function: "reserve",
        args: [{ type: 'string', value: deviceAddress }, { type: 'integer', value: date }]
      }
    }, caller);

    await broadcast(iTx)
    await waitForTx(iTx.id);
  }

  /*
  * Display debug msg if debuging is enabled
  */
  dd(msg, msg_type = "DEBUG") {
    if (this.debugEnabled) {
      console.log('[Base::' + msg_type + '] ' + msg)
    }
  }

}

module.exports.SmartAccount = SmartAccount;