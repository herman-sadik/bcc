const Setup = require('../common/setup').setup;
const SmartAccount = require('../common/SmartAccount').SmartAccount
const getDappStartDateKey = require('../common/helpers').getDappStartDateKey
const getUserBalanceKey = require('../common/helpers').getUserBalanceKey
const getDeviceBalanceKey = require('../common/helpers').getDeviceBalanceKey
const getDeviceReservationKey = require('../common/helpers').getDeviceReservationKey

describe('Reservation', async function () {

  this.timeout(100000);
  let setup
  let dApp
  const today = Date.now()
  const tomorrow = today + (24 * 60 * 60 * 1000)
  const day_after_tomorrow = tomorrow + (24 * 60 * 60 * 1000)
  const yesterday = today - (24 * 60 * 60 * 1000)


  before(async () => {
    const poor_balance = Setup.ACCOUNT_CREATION_PRICE + 4
    correctReserveDate = 

    all_accounts = {
      dapp: 10 * Setup.WVS,
      dapp_expired: 10 * Setup.WVS,
      pre_existed_usr: 10 * Setup.WVS, // user which will have expired balance
      existed_usr: 10 * Setup.WVS,
      not_existed_usr: 10 * Setup.WVS,
      poor_usr: 10 * Setup.WVS,
      existed_device: 10 * Setup.WVS,
      pre_existed_device: 123 * Setup.WVS,
      not_existed_device: 10 * Setup.WVS,
    }

    await setupAccounts(all_accounts);

    setup = new Setup(accounts.dapp)
    await setup.generateToken()
    await setup.setData()
    await setup.transferTokens(accounts.existed_usr, 100)
    await setup.transferTokens(accounts.poor_usr, poor_balance / (10**8))

    dApp = new SmartAccount(setup.dapp_account, setup.asset_id)
    await dApp.rawCreateExpiredAccount(accounts.pre_existed_usr, Setup.ACCOUNT_CREATION_PRICE * 30)
    await dApp.rawCreateReservation(accounts.pre_existed_usr, accounts.pre_existed_device, day_after_tomorrow)

    await setup.setAccountScript()

    await dApp.createAccount(accounts.existed_usr, Setup.ACCOUNT_CREATION_PRICE * 10)
    await dApp.createAccount(accounts.poor_usr, poor_balance)

    await dApp.createDevice(accounts.existed_usr, address(accounts.existed_device), 1 * Setup.WVS)
  })

  context('rejected if', async () => {
    it('user does not exist', async () => {
      const iTx = invokeScript({
        dApp: address(setup.dapp_account),
        call: { 
          function: "reserve",
          args: [{ type: 'string', value: address(accounts.existed_device) }, { type: 'integer', value: tomorrow }]
        },
      }, accounts.not_existed_usr);

      expect(broadcast(iTx)).to.be.rejectedWith("user does not exist")
    })
    it('device does not exist', async () => {
      const iTx = invokeScript({
        dApp: address(setup.dapp_account),
        call: {
          function: "reserve",
          args: [{ type: 'string', value: address(accounts.not_existed_device) }, { type: 'integer', value: tomorrow }]
        },
      }, accounts.existed_usr);

      expect(broadcast(iTx)).to.be.rejectedWith("device does not exist")
    })
    
    it('user balance expired', async () => {
      const iTx = invokeScript({
        dApp: address(setup.dapp_account),
        call: {
          function: "reserve",
          args: [{ type: 'string', value: address(accounts.existed_device) }, { type: 'integer', value: tomorrow }]
        },
      }, accounts.pre_existed_usr);

      expect(broadcast(iTx)).to.be.rejectedWith("balance expired")
    })

    it('not sufficient funds on balance', async () => {
      const iTx = invokeScript({
        dApp: address(setup.dapp_account),
        call: {
          function: "reserve",
          args: [{ type: 'string', value: address(accounts.existed_device) }, { type: 'integer', value: tomorrow }]
        },
      }, accounts.poor_usr);

      expect(broadcast(iTx)).to.be.rejectedWith("not sufficient funds")
    })

    it('date is less then startDate', async () => {
      const dAppStartDate = await accountDataByKey(getDappStartDateKey(), address(setup.dapp_account))
      const beforeDappStartDate = dAppStartDate.value - (24 * 60 * 60 * 1000)

      const iTx = invokeScript({
        dApp: address(setup.dapp_account),
        call: {
          function: "reserve",
          args: [{ type: 'string', value: address(accounts.existed_device) }, { type: 'integer', value: beforeDappStartDate }]
        },
      }, accounts.existed_usr);

      expect(broadcast(iTx)).to.be.rejectedWith("too early date given")
    })

    it('date is less then today', async () => {
      const iTx = invokeScript({
        dApp: address(setup.dapp_account),
        call: {
          function: "reserve",
          args: [{ type: 'string', value: address(accounts.existed_device) }, { type: 'integer', value: yesterday }]
        },
      }, accounts.existed_usr);

      expect(broadcast(iTx)).to.be.rejectedWith("too early date given")
    })

    it('reservation for given day already exist', async () => {
      const iTx = invokeScript({
        dApp: address(setup.dapp_account),
        call: {
          function: "reserve",
          args: [{ type: 'string', value: address(accounts.pre_existed_device) }, { type: 'integer', value: day_after_tomorrow }]
        },
      }, accounts.existed_usr);

      expect(broadcast(iTx)).to.be.rejectedWith("reservation for given day already exist")
    })
  })

  context('success', async () => {
    let userBalanceBefore
    let deviceBalanceBefore

    before(async () => {
      userBalanceBefore = await accountDataByKey(getUserBalanceKey(address(accounts.existed_usr)), address(setup.dapp_account))
      deviceBalanceBefore = await accountDataByKey(getDeviceBalanceKey(address(accounts.existed_device)), address(setup.dapp_account))

      await dApp.reserve(accounts.existed_usr, address(accounts.existed_device), tomorrow)
    })

    it("#USER_ADDRESS_usr_balance has been charged", async () => {
      let result = await accountDataByKey(getUserBalanceKey(address(accounts.existed_usr)), address(setup.dapp_account))

      expect(result).not.be.null
      expect(result.type).eq('integer')
      expect(result.value).lte(userBalanceBefore.value)
    })

    it("#DEVICE_ADDRESS_dev_balance has been updated", async () => {
      let result = await accountDataByKey(getDeviceBalanceKey(address(accounts.existed_device)), address(setup.dapp_account))

      expect(result).not.be.null
      expect(result.type).eq('integer')
      expect(result.value).gte(deviceBalanceBefore.value)
    })

    it("#DEVICE_ADDRESS_dev_reservation_DAY_NUMBER has renter addr as value", async () => {
      const key = getDeviceReservationKey(address(accounts.existed_device), tomorrow)
      let result = await accountDataByKey(key, address(setup.dapp_account))
      
      expect(result).not.be.null
      expect(result.type).eq('string')
      expect(result.value).eq(address(accounts.existed_usr))
    })

  })

})
