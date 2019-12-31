const Setup = require('../common/setup').setup
const getDeviceBalanceKey = require('../common/helpers').getDeviceBalanceKey;
const getDevicePriceKey = require('../common/helpers').getDevicePriceKey;

describe('BCC dApp - DEVICE', async function () {

  this.timeout(100000);
  let setup = new Setup()
  

  before(async function () {
    await setup.generateAccounts()
    await setup.generateToken()
    await setup.setData()
    await setup.transferTokens(accounts.existed, 100)
    await setup.transferTokens(accounts.new, 100)
    await setup.transferTokens(accounts.poor, 25)
    await setup.setAccountScript()
    await setup.createAccount('existed', Setup.ACCOUNT_CREATION_PRICE + (3 * Setup.DEVICE_CREATION_PRICE))
    await setup.createAccount('poor', Setup.ACCOUNT_CREATION_PRICE + 1)
    await setup.createDevice('existed', address(accounts.existed_device), 1)
  });


  describe(".createDevice", async function () {

    context('FAILED', async function () {

      it('creator has not dApp account', async function () {
        const iTx = invokeScript({
          dApp: address(accounts.dapp),
          call: {
            function: "createDevice",
            args: [{ type: 'string', value: address(accounts.new) }, { type: 'integer', value: 1 * Setup.WVS }]
          }
        }, accounts.new);

        expect(broadcast(iTx)).to.be.rejectedWith("not allowed")
      })

      it('creator has not sufficient funds', async function () {
        const iTx = invokeScript({
          dApp: address(accounts.dapp),
          call: {
            function: "createDevice",
            args: [{ type: 'string', value: address(accounts.new) }, { type: 'integer', value: 1 * Setup.WVS }]
          }
        }, accounts.poor);

        expect(broadcast(iTx)).to.be.rejectedWith("not sufficient funds")
      })
      
      it('device already exist', async function () {
        const iTxOneMore = invokeScript({
          dApp: address(accounts.dapp),
          call: {
            function: "createDevice",
            args: [{ type: 'string', value: address(accounts.existed_device) }, { type: 'integer', value: 1 * Setup.WVS }]
          }
        }, accounts.existed);

        expect(broadcast(iTxOneMore)).to.be.rejectedWith("device already exist")
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
          dApp: address(accounts.dapp),
          call: { 
            function: "createDevice",
            args: [{ type: 'string', value: address(accounts.new) }, { type: 'integer', value: devicePrice }]
          }
        }, accounts.existed);

        await broadcast(iTx)
        await waitForTx(iTx.id);

        deviceBalanceKey = getDeviceBalanceKey(address(accounts.new))
        devicePriceKey = getDevicePriceKey(address(accounts.new))

        balanceRes = await accountDataByKey(deviceBalanceKey, address(accounts.dapp))
        priceRes = await accountDataByKey(devicePriceKey, address(accounts.dapp))
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
