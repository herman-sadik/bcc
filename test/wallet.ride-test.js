const Setup = require('../common/setup').setup;
// import { publicKey } from '@waves/ts-lib-crypto'

const getAccountCreationPriceKey = require('../common/helpers').getAccountCreationPriceKey;
const getDeviceCreationPriceKey = require('../common/helpers').getDeviceCreationPriceKey;
const getAssetIdKey = require('../common/helpers').getAssetIdKey;
const getAssetExpirationDateKey = require('../common/helpers').getAssetExpirationDateKey;

describe('wallet test suite', async function () {

    this.timeout(100000);
    let setup = new Setup()
    
    context('data records', async function () {
      before(async function () {
        await setup.generateAccounts({ dapp: 10 * Setup.WVS, existed: 10 * Setup.WVS })
        await setup.generateToken()
        await setup.setData()
        await setup.setAccountScript()
      });

      it('#NOT_EXISTED should be null', async function () {
        let res = await accountDataByKey("NOT_EXISTED_FOOFOOFOOOOO", address(accounts.dapp))
        expect(res).be.null
      })

      it('#asset_id', async function () {
        let res = await accountDataByKey(getAssetIdKey(), address(accounts.dapp))
        expect(res).not.be.null
        expect(res.type).eq('string')
      })

      it('#asset_expiration_date', async function () {
        let res = await accountDataByKey(getAssetExpirationDateKey(), address(accounts.dapp))
        expect(res).not.be.null
        expect(res.type).eq('integer')
      })

      it('#account_creation_price', async function () {
        let res = await accountDataByKey(getAccountCreationPriceKey(), address(accounts.dapp))
        expect(res).not.be.null
        expect(res.type).eq('integer')
      })

      it('#device_creation_price', async function () {
        let res = await accountDataByKey(getDeviceCreationPriceKey(), address(accounts.dapp))
        expect(res).not.be.null
        expect(res.type).eq('integer')
      })

    })

    context('functions', async function () {
      it('.createAccount')
      it('.createDevice')

    })


    /*
    * @TODO - REFACTOR !!!
    */
    context('burn transactions', async function () {
      context('FAILED', async function () {
        let setup = new Setup()

        before(async function () {
          await setup.generateAccounts({ dapp: 10 * Setup.WVS, existed: 10 * Setup.WVS })
          await setup.generateToken()
          await setup.setData()
          await setup.setAccountScript()
        });

        
        it('asset not expired', async function () {
          const assetParams = {
            assetId: setup.asset_id,
            quantity: 1,
            senderPublicKey: publicKey(setup.accounts.dapp),
            fee: 0.005 * Setup.WVS
          }

          const bTx = burn(assetParams, setup.accounts.existed);
          
          expect(broadcast(bTx)).to.be.rejectedWith("Transaction is not allowed by account-script")
        })
      })

      context('SUCCESSED', async function () {
        let setup = new Setup()

        before(async function () {
          const dateOffset = (24 * 60 * 60 * 1000) * 365 // Year ago
          await setup.generateAccounts({ dapp: 10 * Setup.WVS, existed: 10 * Setup.WVS })
          await setup.generateToken()
          await setup.generateFakeToken()
          await setup.setData(Date.now() - dateOffset)
          await setup.setAccountScript()
        });

        it('rejected other assets then BCC', async function () {
          const fakeAssetParams = {
            assetId: setup.fake_asset_id,
            quantity: 1,
            senderPublicKey: publicKey(setup.accounts.dapp),
            fee: 0.005 * Setup.WVS
          }

          const bTx = burn(fakeAssetParams, setup.accounts.existed);
          expect(broadcast(bTx)).to.be.rejectedWith("Transaction is not allowed by account-script")
        })

        it('rejected - not all bcc tokens', async function () {
          const assetParams = {
            assetId: setup.asset_id,
            quantity: 2,
            senderPublicKey: publicKey(setup.accounts.dapp),
            fee: 0.005 * Setup.WVS
          }

          const bTx = burn(assetParams, setup.accounts.existed);
          expect(broadcast(bTx)).to.be.rejectedWith("Transaction is not allowed by account-script")
        })

        it('success', async function () {
          let balance = await assetBalance(setup.asset_id, address(setup.accounts.dapp))
          
          const assetParams = {
            assetId: setup.asset_id,
            quantity: balance,
            senderPublicKey: publicKey(setup.accounts.dapp),
            fee: 0.005 * Setup.WVS
          }

          const bTx = burn(assetParams, setup.accounts.existed);
          await broadcast(bTx)
        })

      })

    })


  context('reissue transactions', async function () {
    context('before .ctrlAssetExpiration()', async function () {
      before(async function () {
        const dateOffset = (24 * 60 * 60 * 1000) * 365 // Year ago
        await setup.generateAccounts({ dapp: 10 * Setup.WVS, existed: 10 * Setup.WVS })
        await setup.generateToken()
        await setup.generateFakeToken()
        await setup.setData(Date.now() - dateOffset)
        await setup.setAccountScript()
      });


    })

    context('after .ctrlAssetExpiration()', async function () {

    })
    
  })

})