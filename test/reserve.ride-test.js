const Setup = require('../common/setup').setup;
const SmartAccount = require('../common/SmartAccount').SmartAccount

describe('Reservation', async function () {

  this.timeout(100000);
  let setup
  let dApp
  const today = Date.now()
  const tomorrow = today + (24 * 60 * 60 * 1000)
  const yesterday = today - (24 * 60 * 60 * 1000)

  before(async () => {
    const poor_balance = Setup.ACCOUNT_CREATION_PRICE + 4
    correctReserveDate = 

    all_accounts = {
      dapp: 10 * Setup.WVS,
      dapp_expired: 10 * Setup.WVS,
      existed_usr: 10 * Setup.WVS,
      not_existed_usr: 10 * Setup.WVS,
      poor_usr: 10 * Setup.WVS,
      existed_device: 10 * Setup.WVS,
      not_existed_device: 10 * Setup.WVS,
    }

    await setupAccounts(all_accounts);

    setup = new Setup(accounts.dapp)
    await setup.generateToken()
    await setup.setData()
    await setup.transferTokens(accounts.existed_usr, 100)
    await setup.transferTokens(accounts.poor_usr, poor_balance / (10**8))
    await setup.setAccountScript()

    dApp = new SmartAccount(setup.dapp_account, setup.asset_id)
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
    it('user balance expired')
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
    it('date is less then startDate')
    it('date is less then today')
    it('reservation for given day already exist')
  })

  context('success', async () => {
    before(async () => {
      // @TODO DAY NUMBER in JS
      await dApp.reserve(accounts.existed_usr, address(accounts.existed_device), tomorrow)
    })
    it("#USER_ADDRESS_usr_balance has been charged", async () => {})
    it("#DEVICE_ADDRESS_dev_balance has been updated", async () => { })
    it("#DEVICE_ADDRESS_dev_reservation_DAY_NUMBER has renter addr as value", async () => { })
    


  })

})


// if (userExists == false) then throw ("user does not exist")
//   else if (deviceExists == false) then throw ("device does not exist")
//   else if (isUserBalanceExpired(userAddress)) then throw ("balance expired")
//   else if (userBalance < devicePrice) then throw ("not sufficient funds")
//   else if (date < startDate) then throw ("too early date given") # refactor
//   else if (getDeviceReservationValue(deviceAddress, dayNr) != NONE) then throw ("reservation for given day already exist")