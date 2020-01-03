class Setup {
  static get WVS() { return 10 ** 8; }
  static get EXP_TOKEN_DAYS() { return 30 } // How many days token is valid. Same value should be in SmartAccount
  static get ACCOUNT_CREATION_PRICE() { return 10 * (10 ** 8); } 
  static get DEVICE_CREATION_PRICE() { return 25 * (10 ** 8); } // Should be greater then ACCOUNT_CREATION_PRICE !
  

  constructor(dapp_account, debug = true) {
    this.asset_id
    this.fake_asset_id
    this.dapp_account = dapp_account
    this.debug = debug
    this.dd(' =================== ' + address(dapp_account) + ' =================')
  }


  /*
   * Display debug msg if debuging is enabled
   */
  dd(msg, msg_type = "DEBUG") {
    if (this.debug) {
      console.log('[' + msg_type + '] ' + msg )
    }
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

    const signedIssueTx = issue(tokenParams, this.dapp_account)
    let tx = await broadcast(signedIssueTx);

    await waitForTx(tx.id);
    this.asset_id = tx.id
    this.dd('SmartKey tokens has been created | tx_id: ' + this.asset_id)

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

    let txTransfer = await broadcast(transfer(txObj, this.dapp_account))
    await waitForTx(txTransfer.id)
    this.dd(amount + ' tokens (' + token_id + ') has been transfered to ' + to)
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

    let txInfo = await broadcast(data(dataArr, this.dapp_account))
    await waitForTx(txInfo.id)

    this.dd('asset_id and account_creation_price data entry has been set | tx_id: ' + txInfo.id)
  }


  // SET ACCOUNT SCRIPT -------------------------------------------------------
  async setAccountScript() {
    const script = compile(file('bcc.ride'));
    const ssTx = setScript({ script }, this.dapp_account);
    
    await broadcast(ssTx);
    await waitForTx(ssTx.id)
    this.dd('Script has been set in dApp | tx_id: ' + ssTx.id)
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

    const signedIssueTx = issue(tokenParams, this.dapp_account)
    let tx = await broadcast(signedIssueTx);

    await waitForTx(tx.id);
    this.fake_asset_id = tx.id
    this.dd('FakeSmartKey tokens has been created | tx_id: ', this.fake_asset_id)
  }


  async burnAllTokens(dapp, caller ) {
    let balance = await assetBalance(this.asset_id, address(dapp))

    const assetParams = {
      assetId: this.asset_id,
      quantity: balance,
      senderPublicKey: publicKey(dapp),
      fee: 0.005 * Setup.WVS
    }

    const bTx = burn(assetParams, caller);
    await broadcast(bTx)
    await waitForTx(bTx.id)

  }
}

module.exports.setup = Setup;