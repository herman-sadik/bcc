const Setup = require('../common/setup').setup
const SmartAccount = require('../common/SmartAccount').SmartAccount
const getDeviceBalanceKey = require('../common/helpers').getDeviceBalanceKey;
const getDevicePriceKey = require('../common/helpers').getDevicePriceKey;

describe('BCC dApp - DEVICE', async function () {

  this.timeout(100000);
  let setup
  let dApp

  before(async () => {
    all_accounts = {
      dapp: 10 * Setup.WVS,
      expired_dapp: 10 * Setup.WVS,
      existed: 10 * Setup.WVS,
      existed_device: 1 * Setup.WVS,
      new: 11 * Setup.WVS,
      poor: 0.02 * Setup.WVS,
      // existed_dev: 10 * Setup.WVS,
      // expired: 21 * Setup.WVS,
    }

    await setupAccounts(all_accounts);

    setup = new Setup(accounts.dapp)
    await setup.generateToken()
    await setup.generateFakeToken()
    await setup.setData()
    await setup.transferTokens(accounts.existed, 100) // move to dApp
    await setup.transferTokens(accounts.poor, Setup.ACCOUNT_CREATION_PRICE / Setup.WVS)
    await setup.transferTokens(accounts.new, 100)
    await setup.transferTokens(accounts.new, 100, setup.fake_asset_id)
    await setup.setAccountScript()

    dApp = new SmartAccount(setup.dapp_account, setup.asset_id)
    await dApp.createAccount(accounts.poor, Setup.ACCOUNT_CREATION_PRICE )
    await dApp.createAccount(accounts.existed, Setup.ACCOUNT_CREATION_PRICE * 10)
    await dApp.createDevice(accounts.existed, address(accounts.existed_device), 1 * Setup.WVS)


    const dateOffset = (24 * 60 * 60 * 1000) * Setup.EXP_TOKEN_DAYS
    exp_date = Date.now() - dateOffset - 1

    expired_setup = new Setup(accounts.expired_dapp)
    await expired_setup.generateToken()
    await expired_setup.setData(exp_date)
    await expired_setup.transferTokens(accounts.existed, 100) // move to dApp
    await expired_setup.setAccountScript()

    expired_dApp = new SmartAccount(expired_setup.dapp_account, expired_setup.asset_id)
    await expired_dApp.createAccount(accounts.existed, Setup.ACCOUNT_CREATION_PRICE * 10)
  });


  describe(".createDevice", async function () {

    context('FAILED', async function () {

      it('creator has not dApp account', async function () {
        const iTx = invokeScript({
          dApp: address(setup.dapp_account),
          call: {
            function: "createDevice",
            args: [{ type: 'string', value: address(accounts.new) }, { type: 'integer', value: 1 * Setup.WVS }]
          }
        }, accounts.new);

        expect(broadcast(iTx)).to.be.rejectedWith("not allowed")
      })

      it('creator has not sufficient funds', async function () {
        const iTx = invokeScript({
          dApp: address(setup.dapp_account),
          call: {
            function: "createDevice",
            args: [{ type: 'string', value: address(accounts.new) }, { type: 'integer', value: 1 * Setup.WVS }]
          }
        }, accounts.poor);

        expect(broadcast(iTx)).to.be.rejectedWith("not sufficient funds")
      })

            
      it('device already exist', async function () {
        const iTxOneMore = invokeScript({
          dApp: address(setup.dapp_account),
          call: {
            function: "createDevice",
            args: [{ type: 'string', value: address(accounts.existed_device) }, { type: 'integer', value: 1 * Setup.WVS }]
          }
        }, accounts.existed);

        expect(broadcast(iTxOneMore)).to.be.rejectedWith("device already exist")
      })

      it('creator has expired balance', async function () {
        const iTx = invokeScript({
          dApp: address(expired_setup.dapp_account),
          call: {
            function: "createDevice",
            args: [{ type: 'string', value: address(accounts.new) }, { type: 'integer', value: 1 * Setup.WVS }]
          }
        }, accounts.existed);

        expect(broadcast(iTx)).to.be.rejectedWith("balance expired")
      })

      // context('params', async function () {
      
      // })
    })
    
    context('SUCCESS', async function () {
      let balanceRes
      let priceRes
      const devicePrice = 1 * Setup.WVS

      before(async function () {
        const iTx = invokeScript({
          dApp: address(setup.dapp_account),
          call: { 
            function: "createDevice",
            args: [{ type: 'string', value: address(accounts.new) }, { type: 'integer', value: devicePrice }]
          }
        }, accounts.existed);

        await broadcast(iTx)
        await waitForTx(iTx.id);

        deviceBalanceKey = getDeviceBalanceKey(address(accounts.new))
        devicePriceKey = getDevicePriceKey(address(accounts.new))

        balanceRes = await accountDataByKey(deviceBalanceKey, address(setup.dapp_account))
        priceRes = await accountDataByKey(devicePriceKey, address(setup.dapp_account))
      });

      it('balance key has been added', async function () {
        expect(balanceRes).not.be.null
        expect(balanceRes.value).eq(0)
      })

      it('price key has been added', async function () {
        expect(priceRes).not.be.null
        expect(priceRes.value).eq(devicePrice)
      })

    })

  })
});
