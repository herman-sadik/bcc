const Setup = require('../common/setup').setup;
// import { publicKey } from '@waves/ts-lib-crypto'

const getAccountCreationPriceKey = require('../common/helpers').getAccountCreationPriceKey;
const getDeviceCreationPriceKey = require('../common/helpers').getDeviceCreationPriceKey;
const getAssetIdKey = require('../common/helpers').getAssetIdKey;
const getAssetExpirationDateKey = require('../common/helpers').getAssetExpirationDateKey;

describe('wallet test suite', async function () {

  this.timeout(100000);
  let setup = new Setup()

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
    context('before expiration date', async function () {
      before(async function () {
        const dateOffset = (24 * 60 * 60 * 1000) * 3 // 3 days ago
        await setup.generateAccounts({ dapp: 10 * Setup.WVS, existed: 10 * Setup.WVS })
        await setup.generateToken()
        await setup.generateFakeToken()
        await setup.setData(Date.now() - dateOffset)
        await setup.setAccountScript()
      })


      it('valid tx has been rejected', async function () {
        const reissueParams = {
          assetId: setup.asset_id,
          quantity: 230 * Setup.WVS,
          senderPublicKey: publicKey(setup.accounts.dapp),
          fee: 1.004 * Setup.WVS,
          reissuable: true
        }

        const rTx = reissue(reissueParams, setup.accounts.existed);
        
        expect(broadcast(rTx)).to.be.rejectedWith("Transaction is not allowed by account-script")
      })
    })

    context('after expiration date', async function () {
      const dateOffset = (24 * 60 * 60 * 1000) * 31 // 31 days ago
      const assetExpDate = Date.now() - dateOffset

      before(async function () {
        await setup.generateAccounts({ dapp: 10 * Setup.WVS, existed: 10 * Setup.WVS })
        await setup.generateToken()
        await setup.generateFakeToken()
        await setup.setData(assetExpDate)
        await setup.setAccountScript()
      })

      it('reissue other tokens then BCC is not allowed', async function () {
      const fakeAssetReissueParams = {
          assetId: setup.fake_asset_id,
          quantity: 230 * Setup.WVS,
          senderPublicKey: publicKey(setup.accounts.dapp),
          fee: 1.004 * Setup.WVS,
          reissuable: true
        }
        const rTx = reissue(fakeAssetReissueParams, setup.accounts.existed);

        expect(broadcast(rTx)).to.be.rejectedWith("Transaction is not allowed by account-script")
      })

      it('rejected becouse assetQuantity is not zeroed', async function () {
        const reissueParams = {
          assetId: setup.asset_id,
          quantity: 230 * Setup.WVS,
          senderPublicKey: publicKey(setup.accounts.dapp),
          fee: 1.004 * Setup.WVS,
          reissuable: true
        }
        const rTx = reissue(reissueParams, setup.accounts.existed);

        expect(broadcast(rTx)).to.be.rejectedWith("Transaction is not allowed by account-script")
      })

      context('after .updateAssetExpirationDate()', async function () {
        before(async function () {
          // BURN all tokens first
          let balance = await assetBalance(setup.asset_id, address(setup.accounts.dapp))

          const assetParams = {
            assetId: setup.asset_id,
            quantity: balance,
            senderPublicKey: publicKey(setup.accounts.dapp),
            fee: 0.005 * Setup.WVS
          }

          const bTx = burn(assetParams, setup.accounts.existed);
          await broadcast(bTx)
          await waitForTx(bTx.id)


          const iTx = invokeScript({
            dApp: address(accounts.dapp),
            call: {
              function: "updateAssetExpirationDate"
            }
          }, accounts.existed);

          await broadcast(iTx)
          await waitForTx(iTx.id)

        })

        it('asset quantity have to eq 0', async function () {
          let balance = await assetBalance(setup.asset_id, address(setup.accounts.dapp))
          expect(balance).to.eq(0)
        })

        it('new asset expiration date has been set', async function () {
          let newAssetExpDate = await accountDataByKey(getAssetExpirationDateKey(), address(accounts.dapp))
          
          expect(newAssetExpDate.value).not.to.be.lessThan(assetExpDate)
        })

        it('successfull reissied tx', async function () {
          const reissueParams = {
            assetId: setup.asset_id,
            quantity: 230 * Setup.WVS,
            senderPublicKey: publicKey(setup.accounts.dapp),
            fee: 1.004 * Setup.WVS,
            reissuable: true
          }
          const rTx = reissue(reissueParams, setup.accounts.existed);

          await broadcast(rTx)
          await waitForTx(rTx.id)
        })
      })
    })


  })

})