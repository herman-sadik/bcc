class Setup {
  static get WVS() { return 10 ** 8; }
  static get EXP_TOKEN_DAYS() { return 30 } // How many days token is valid. Same value should be in SmartAccount
  static get ACCOUNT_CREATION_PRICE() { return 10 * (10 ** 8); } 
  static get DEVICE_CREATION_PRICE() { return 25 * (10 ** 8); } // Should be greater then ACCOUNT_CREATION_PRICE !
  

  constructor() {
    this.asset_id
    this.fake_asset_id
    this.accounts
  }

  /*
  * Generate dapp account and other test users
  */
  async generateAccounts(acc) {
    if (acc == undefined) {
      acc = {
        dapp: 10 * Setup.WVS,
        existed: 10 * Setup.WVS,
        existed_dev: 10 * Setup.WVS,
        new: 11 * Setup.WVS,
        poor: 0.01 * Setup.WVS,
      }
    }


    this.accounts = await setupAccounts(acc);

    return this.accounts
  }

  // TOKEN ISSUE ---------------------------------------------------
  async generateToken() {
    const tokenParams = {
      name: "SmartKey",
      quantity: 100000 * Setup.WVS,
      decimals: 8,
      reissuable: true,
      description: "Tokens needed to cooperate with BCC dApp"
    }

    const signedIssueTx = issue(tokenParams, this.accounts.dapp)
    let tx = await broadcast(signedIssueTx);

    await waitForTx(tx.id);
    this.asset_id = tx.id
    console.log('[DEBUG] SmartKey tokens has been created | tx_id: ', this.asset_id)

    return this.asset_id
  }

  async transferTokens(to, amount, token_id) {
    if (token_id === undefined) {
      token_id = this.asset_id
    }
    const txObj = {
      amount: amount * Setup.WVS,
      recipient: address(to),
      assetId: token_id
    }

    let txTransfer = await broadcast(transfer(txObj, accounts.dapp))
    await waitForTx(txTransfer.id)
    console.log('[DEBUG] + ' + amount + ' tokens (' + token_id + ') has been transfered to ', to)
  }

 
  // SET INFO ------------------------------------------------------------
  async setData(exp_date) {
    if (exp_date == undefined) {
      const dateOffset = (24 * 60 * 60 * 1000) * Setup.EXP_TOKEN_DAYS
      exp_date = Date.now() + dateOffset
    }

    const dataArr = { data: [ { key: "asset_id", value: this.asset_id },
                              { key: "asset_expiration_date", value: exp_date },
                              { key: "account_creation_price", value: Setup.ACCOUNT_CREATION_PRICE },
                              { key: "device_creation_price", value: Setup.DEVICE_CREATION_PRICE }
                            ]
    }

    let txInfo = await broadcast(data(dataArr, this.accounts.dapp))
    await waitForTx(txInfo.id)

    console.log('[DEBUG] asset_id and account_creation_price data entry has been set | tx_id: ' + txInfo.id)
  }

  /*
   * Create valid account in dapp needed for tests
   * 
   */
  async createAccount(accountKey, amount = 0) {
    const caller = this.accounts[accountKey]
    
    const iTx = invokeScript({
      dApp: address(accounts.dapp),
      call: {
        function: "createAccount",
      },
      payment: [{ assetId: this.asset_id, amount: amount }]
    }, caller);

    await broadcast(iTx)
    await waitForTx(iTx.id);
    console.log('[DEBUG] Account ' + caller + '  (' + address(caller) +  ') has been created in dApp | tx_id: ' + iTx.id)
  }

  /*
   * Create valid account in dapp needed for tests
   * 
   */
  async createDevice(accountKey, deviceAddress = "TEST_DEVICE_ADDRESS", amount = 0) {
    const caller = this.accounts[accountKey]

    const iTx = invokeScript({
      dApp: address(accounts.dapp),
      call: {
        function: "createDevice",
        args: [{ type: 'string', value: deviceAddress }, { type: 'integer', value: amount }]
      }
    }, caller);

    await broadcast(iTx)
    await waitForTx(iTx.id);
    console.log('[DEBUG] Account ' + caller + '  (' + address(caller) + ') has been created in dApp | tx_id: ' + iTx.id)
  }


  // SET ACCOUNT SCRIPT -------------------------------------------------------
  async setAccountScript() {
    const script = compile(file('bcc.ride'));
    const ssTx = setScript({ script }, accounts.dapp);
    
    await broadcast(ssTx);
    await waitForTx(ssTx.id)
    console.log('[DEBUG] Script has been set in dApp | tx_id: ' + ssTx.id)
  }

  /*
   *
   * Generate fake token needed in tests and save it in this.fake_asset_id
   * 
  */
  async generateFakeToken() {
    const tokenParams = {
      name: "FakeSmartKey",
      quantity: 100000 * Setup.WVS,
      decimals: 8,
      reissuable: true,
      description: "Fake Tokens needed to test BCC dApp"
    }

    const signedIssueTx = issue(tokenParams, this.accounts.dapp)
    let tx = await broadcast(signedIssueTx);

    await waitForTx(tx.id);
    this.fake_asset_id = tx.id
    console.log('[DEBUG] FakeSmartKey tokens has been created | tx_id: ', this.fake_asset_id)
  }
}

module.exports.setup = Setup;