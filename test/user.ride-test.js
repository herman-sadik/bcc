const Setup = require('../common/setup').setup
const getUserBalanceKey = require('../common/helpers').getUserBalanceKey
const getUserBalanceExpirationKey = require('../common/helpers').getUserBalanceExpirationKey

describe('BCC dApp - USER', async function () {

  this.timeout(100000);
  let setup = new Setup()

  before(async function () {
    await setup.generateAccounts()
    await setup.generateToken()
    await setup.generateFakeToken()
    await setup.setData()
    await setup.transferTokens(accounts.existed, 100)
    await setup.transferTokens(accounts.new, 100)
    await setup.transferTokens(accounts.poor, 10)
    await setup.transferTokens(accounts.new, 100, setup.fake_asset_id)
    await setup.setAccountScript()
    await setup.createAccount('existed', Setup.ACCOUNT_CREATION_PRICE)
  });


  describe(".createAccount", async function () {

    context('FAILED', async function () {
      it('payment in WAVES', async function () {
        const iTxCreateAccount = invokeScript({
          dApp: address(accounts.dapp),
          call: { function: "createAccount" },
          payment: [{ assetId: null, amount: Setup.ACCOUNT_CREATION_PRICE }]
        }, accounts.new);

        expect(broadcast(iTxCreateAccount)).to.be.rejectedWith("payment in bad tokens")
      })

      it('payment in other custom token', async function () {
        const iTxCreateAccount = invokeScript({
          dApp: address(accounts.dapp),
          call: { function: "createAccount" },
          payment: [{ assetId: setup.fake_asset_id, amount: Setup.ACCOUNT_CREATION_PRICE }]
        }, accounts.new);

        expect(broadcast(iTxCreateAccount)).to.be.rejectedWith("payment in bad tokens")
      })

      it('payment amount less than account creation price', async function () {
        const toSmallAmount = Setup.ACCOUNT_CREATION_PRICE - 1
        const iTxCreateAccount = invokeScript({
          dApp: address(accounts.dapp),
          call: { function: "createAccount" },
          payment: [{ assetId: setup.asset_id, amount: toSmallAmount }]
        }, accounts.new);

        expect(broadcast(iTxCreateAccount)).to.be.rejectedWith("amount cannot be less than account creation price")
      })
      it('user already exist', async function () {
        const iTxCreateAccount = invokeScript({
          dApp: address(accounts.dapp),
          call: { function: "createAccount" },
          payment: [{ assetId: setup.asset_id, amount: Setup.ACCOUNT_CREATION_PRICE }]
        }, accounts.existed);

        expect(broadcast(iTxCreateAccount)).to.be.rejectedWith("user already exist")
      })

    })

    context('SUCCESS', async function () {
      const amount = Setup.ACCOUNT_CREATION_PRICE + 1
      let userBalanceKey = null
      
      before(async function () {
        const iTxCreateAccount = invokeScript({
          dApp: address(accounts.dapp),
          call: { function: "createAccount" },
          payment: [{ assetId: setup.asset_id, amount: amount }]
        }, accounts.new);

        await broadcast(iTxCreateAccount)
        await waitForTx(iTxCreateAccount.id);

        userBalanceKey = getUserBalanceKey(address(accounts.new))
        userBalance = await accountDataByKey(userBalanceKey, address(accounts.dapp))

        userBalanceExpirationKey = getUserBalanceExpirationKey(address(accounts.new))
        userBalanceExpiration = await accountDataByKey(userBalanceExpirationKey, address(accounts.dapp))


      });

      it('#user_balance', async function () {
        expect(userBalance).not.be.null
      })

      it('overpayment has been added to #user_balance', async function () {
        expect(userBalance.value).eq(1)
      })

      it('valid #user_balance_expiration', async function () {

      })

    })

  })
  
});
