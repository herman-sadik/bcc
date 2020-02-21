const Setup = require('../common/setup').setup;

const getAccountCreationPriceKey = require('../common/helpers').getAccountCreationPriceKey;
const getDeviceCreationPriceKey = require('../common/helpers').getDeviceCreationPriceKey;
const getAssetIdKey = require('../common/helpers').getAssetIdKey;
const getDappStartDateKey = require('../common/helpers').getDappStartDateKey;
const getAssetExpirationDateKey = require('../common/helpers').getAssetExpirationDateKey;

describe('dApp Setup', async function () {

  this.timeout(100000);

  before(async () => {
    all_accounts = {
      dapp: 10 * Setup.WVS,
    }

    await setupAccounts(all_accounts);

    setup = new Setup(accounts.dapp)
    await setup.generateToken()
    await setup.setData()
    await setup.setAccountScript()
  })


  context('data records', async () => {

    it('#NOT_EXISTED should be null', async () => {
      let res = await accountDataByKey("NOT_EXISTED_FOOFOOFOOOOO", address(setup.dapp_account))
      expect(res).be.null
    })

    it('#asset_id', async () => {
      let res = await accountDataByKey(getAssetIdKey(), address(setup.dapp_account))
      expect(res).not.be.null
      expect(res.type).eq('string')
    })

    it('#dapp_start_date', async () => {
      let res = await accountDataByKey(getDappStartDateKey(), address(setup.dapp_account))
      expect(res).not.be.null
      expect(res.type).eq('integer')
      expect(res.value).eq(1577833200000) // # 01.01.2020 00:00, TimeZone: local
    })

    it('#asset_expiration_date', async () => {
      let res = await accountDataByKey(getAssetExpirationDateKey(), address(setup.dapp_account))
      expect(res).not.be.null
      expect(res.type).eq('integer')
    })

    it('#account_creation_price', async () => {
      let res = await accountDataByKey(getAccountCreationPriceKey(), address(setup.dapp_account))
      expect(res).not.be.null
      expect(res.type).eq('integer')
    })

    it('#device_creation_price', async () => {
      let res = await accountDataByKey(getDeviceCreationPriceKey(), address(setup.dapp_account))
      expect(res).not.be.null
      expect(res.type).eq('integer')
    })

  })

  context('functions', async () => {
    it('.createAccount')
    it('.createDevice')

  })

})