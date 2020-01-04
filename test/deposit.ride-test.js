const Setup = require('../common/setup').setup
const SmartAccount = require('../common/SmartAccount').SmartAccount

const getUserBalanceKey = require('../common/helpers').getUserBalanceKey
const getUserBalanceExpirationKey = require('../common/helpers').getUserBalanceExpirationKey
const getAssetExpirationDateKey = require('../common/helpers').getAssetExpirationDateKey

describe('Deposit tokens', async function () {
  this.timeout(100000);
  let setup
  let dApp
  let exp_date
  let dateOffset

  before(async () => {
    all_accounts = {
      dapp: 10 * Setup.WVS,
      dapp_expired: 10 * Setup.WVS,
      existed: 10 * Setup.WVS,
      new: 10 * Setup.WVS,
    }

    await setupAccounts(all_accounts);

    dateOffset = (24 * 60 * 60 * 1000) * Setup.EXP_TOKEN_DAYS
    exp_date = Date.now() - dateOffset - 1

    exp_setup = new Setup(accounts.dapp)
    await exp_setup.generateToken()
    await exp_setup.generateFakeToken()
    await exp_setup.setData(exp_date)
    await exp_setup.transferTokens(accounts.new, 100)
    await exp_setup.transferTokens(accounts.existed, 100)
    await exp_setup.transferTokens(accounts.existed, 100, exp_setup.fake_asset_id)
    await exp_setup.setAccountScript()

    exp_dApp = new SmartAccount(exp_setup.dapp_account, exp_setup.asset_id)
    await exp_dApp.createAccount(accounts.existed, Setup.ACCOUNT_CREATION_PRICE + 100)

    dateOffset = (24 * 60 * 60 * 1000) * (Setup.EXP_TOKEN_DAYS - 10) 
    exp_date = Date.now() - dateOffset

    setup = new Setup(accounts.dapp_expired)
    await setup.generateToken()
    await setup.setData(exp_date)
    await setup.transferTokens(accounts.existed, 100)
    await setup.setAccountScript()

    dApp = new SmartAccount(setup.dapp_account, setup.asset_id)
    await dApp.createAccount(accounts.existed, Setup.ACCOUNT_CREATION_PRICE + 100)
  })

  it('rejected if account does not exist', async () => {
    const iTx = invokeScript({
      dApp: address(exp_setup.dapp_account),
      call: { function: "deposit" },
      payment: [{ assetId: exp_setup.asset_id, amount: 100 * Setup.WVS }]
    }, accounts.new);

    expect(broadcast(iTx)).to.be.rejectedWith("not allowed")
  })

  it('rejected if payment in WAVES', async () => {
    const iTx = invokeScript({
      dApp: address(exp_setup.dapp_account),
      call: { function: "deposit" },
      payment: [{ assetId: null, amount: 1 * Setup.WVS }]
    }, accounts.existed);

    expect(broadcast(iTx)).to.be.rejectedWith("payment in bad tokens")
  })

  it('rejected if payment in other asset then BCC', async () => {
    const iTx = invokeScript({
      dApp: address(exp_setup.dapp_account),
      call: { function: "deposit" },
      payment: [{ assetId: exp_setup.fake_asset_id, amount: 1 * Setup.WVS }]
    }, accounts.existed);

    expect(broadcast(iTx)).to.be.rejectedWith("payment in bad tokens")
  })

  // ---------------------------------------------------------------------------------------------------
  context('on account with expired asset balance', async () => {
    const amount = 1.89 * Setup.WVS

    before(async () => {
      const iTx = invokeScript({
        dApp: address(setup.dapp_account),
        call: { function: "deposit" },
        payment: [{ assetId: setup.asset_id, amount: amount }]
      }, accounts.existed);

      await broadcast(iTx)
      await waitForTx(iTx.id);
    })

    it('#USER_ADDRESS_usr_balance has been changed', async () => {
      /*
        Zeroed and filled with amount attached in payment
      */
      const userBalanceKey = getUserBalanceKey(address(accounts.existed))
      userBalance = await accountDataByKey(userBalanceKey, address(setup.dapp_account))

      expect(userBalance.value).eq(amount)
    })
    it('#USER_ADDRESS_usr_balance_expiration has been updated', async () => {
      let userBalanceExpirationKey = getUserBalanceExpirationKey(address(accounts.existed))

      let assetExpirationDate = await accountDataByKey(getAssetExpirationDateKey(), address(setup.dapp_account))
      let userBalanceExpiration = await accountDataByKey(userBalanceExpirationKey, address(setup.dapp_account))
      expect(userBalanceExpiration.value).eq(assetExpirationDate.value)
    })
  })

  context('on account with NOT expired asset balance', async () => {
    const amount = 5
    let userBalanceKey
    let userBalanceExpirationKey
    let beforeUserBalance
    let beforeUserBalanceExp

    before(async () => {
      userBalanceKey = getUserBalanceKey(address(accounts.existed))
      userBalanceExpirationKey = getUserBalanceExpirationKey(address(accounts.existed))

      beforeUserBalance = await accountDataByKey(userBalanceKey, address(setup.dapp_account))
      beforeUserBalanceExp = await accountDataByKey(userBalanceExpirationKey, address(setup.dapp_account))

      await dApp.deposit(accounts.existed, amount)
    })

    it('#USER_ADDRESS_usr_balance_expiration is NOT updated', async () => {
      let newUserBalanceExp = await accountDataByKey(userBalanceExpirationKey, address(setup.dapp_account))

      expect(beforeUserBalanceExp.value).eq(newUserBalanceExp.value)
    })

    it('#USER_ADDRESS_usr_balance has been changed', async () => {
      /*
        NOT Zeroed. Amount attached in payment is added to current balance
      */
      let newUserBalance = await accountDataByKey(userBalanceKey, address(setup.dapp_account))

      expect(newUserBalance.value).eq(beforeUserBalance.value + amount)

    })
  })
})