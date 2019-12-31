const Setup = require('../common/setup').setup
const getUserBalanceKey = require('../common/helpers').getUserBalanceKey

describe('BCC dApp - TOKEN', async function () {

  this.timeout(100000);
  let setup = new Setup()

  describe(".issueAsset", async function () {

    context('FAILED', async function () {
      let iTx

      before(async function () {
        const creationDate = Date.now() - (29 * (24 * 60 * 60 * 1000) + (2 * 60 * 60 * 1000) )   // 29 days and 2h ago
        await setup.generateAccounts()
        await setup.generateToken()
        await setup.setData(creationDate)
        await setup.transferTokens(accounts.existed, 100)
        await setup.setAccountScript()
        await setup.createAccount('existed', Setup.ACCOUNT_CREATION_PRICE)

        iTx = invokeScript({
          dApp: address(accounts.dapp),
          call: { function: "issueAsset" },
        }, accounts.existed);

      });

      it('too early', async function () {
        expect(broadcast(iTx)).to.be.rejectedWith("too early")
      })
    })

    context('SUCCESSED', async function () {
      let iTx

      before(async function () {
        const creationDate = Date.now() - (31 * (24 * 60 * 60 * 1000) + (2 * 60 * 60 * 1000))   // 31 days and 2h ago
        await setup.generateAccounts()
        await setup.generateToken()
        await setup.setData(creationDate)
        await setup.transferTokens(accounts.existed, 100)
        await setup.setAccountScript()
        await setup.createAccount('existed', Setup.ACCOUNT_CREATION_PRICE)

        iTx = invokeScript({
          dApp: address(accounts.dapp),
          call: { function: "issueAsset" },
        }, accounts.existed);

      });

      it('executed', async function () {
        expect(broadcast(iTx)).to.be.rejectedWith("OK")
      })
    })

  })

});
