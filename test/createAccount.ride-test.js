const Setup = require('../common/setup').setup
const SmartAccount = require('../common/SmartAccount').SmartAccount
const getUserBalanceKey = require('../common/helpers').getUserBalanceKey
const getUserBalanceExpirationKey = require('../common/helpers').getUserBalanceExpirationKey
const getAssetExpirationDateKey = require('../common/helpers').getAssetExpirationDateKey

describe('BCC dApp - USER', async function () {
  this.timeout(100000);
  let setup
  let dApp

  before(async () => {
    all_accounts = {
      dapp: 10 * Setup.WVS,
      existed: 10 * Setup.WVS,
      new: 11 * Setup.WVS,
      // existed_dev: 10 * Setup.WVS,
      // poor: 0.01 * Setup.WVS,
      // expired: 21 * Setup.WVS,
    }

    await setupAccounts(all_accounts);

    setup = new Setup(accounts.dapp)
    await setup.generateToken()
    await setup.generateFakeToken()
    await setup.setData()
    await setup.transferTokens(accounts.existed, 100) // move to dApp
    await setup.transferTokens(accounts.new, 100)
    await setup.transferTokens(accounts.new, 100, setup.fake_asset_id)
    await setup.setAccountScript()

    dApp = new SmartAccount(accounts.dapp, setup.asset_id)
    await dApp.createAccount(accounts.existed, Setup.ACCOUNT_CREATION_PRICE)
  });


  describe(".createAccount", async () => {
    context('rejected', async () => {
      it('payment in waves', async () => {
        const iTx = invokeScript({
          dApp: address(setup.dapp_account),
          call: { function: "createAccount" },
          payment: [{ assetId: null, amount: Setup.ACCOUNT_CREATION_PRICE }]
        }, accounts.new);

        expect(broadcast(iTx)).to.be.rejectedWith("payment in bad tokens")
      })

      it('payment in other custom tokens', async () => {
        const iTx = invokeScript({
          dApp: address(setup.dapp_account),
          call: { function: "createAccount" },
          payment: [{ assetId: setup.fake_asset_id, amount: Setup.ACCOUNT_CREATION_PRICE }]
        }, accounts.new);

        expect(broadcast(iTx)).to.be.rejectedWith("payment in bad tokens")
      })

      it('payment amount less than account creation price', async () => {
        const toSmallAmount = Setup.ACCOUNT_CREATION_PRICE - 1
        const iTx = invokeScript({
          dApp: address(setup.dapp_account),
          call: { function: "createAccount" },
          payment: [{ assetId: setup.asset_id, amount: toSmallAmount }]
        }, accounts.new);

        expect(broadcast(iTx)).to.be.rejectedWith("amount cannot be less than account creation price")
      })

      it('user already exist', async () => {
        const iTx = invokeScript({
          dApp: address(setup.dapp_account),
          call: { function: "createAccount" },
          payment: [{ assetId: setup.asset_id, amount: Setup.ACCOUNT_CREATION_PRICE }]
        }, accounts.existed);

        expect(broadcast(iTx)).to.be.rejectedWith("user already exist")
      })
    })

    context('success', async () => {
      const amount = Setup.ACCOUNT_CREATION_PRICE + 1
      let userBalance
      let userBalanceExpiration

      before(async () => {
        const iTx = invokeScript({
          dApp: address(setup.dapp_account),
          call: { function: "createAccount" },
          payment: [{ assetId: setup.asset_id, amount: amount }]
        }, accounts.new);

        await broadcast(iTx)
        await waitForTx(iTx.id);

        const userBalanceKey = getUserBalanceKey(address(accounts.new))
        userBalance = await accountDataByKey(userBalanceKey, address(setup.dapp_account))

        const userBalanceExpirationKey = getUserBalanceExpirationKey(address(accounts.new))
        userBalanceExpiration = await accountDataByKey(userBalanceExpirationKey, address(setup.dapp_account))
      });

      it('#user_balance', async () => {
        expect(userBalance).not.be.null
      })

      it('overpayment has been added to #user_balance', async function () {
        expect(userBalance.value).eq(1)
      })

      it('#user_balance_expiration', async () => {
        let assetExpirationDateKey = await accountDataByKey(getAssetExpirationDateKey(), address(setup.dapp_account))
        expect(userBalanceExpiration.value).eq(assetExpirationDateKey.value)
      })
    })
  })
})