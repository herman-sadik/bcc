const Setup = require('./setup').setup
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