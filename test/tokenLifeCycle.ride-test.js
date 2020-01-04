const Setup = require('../common/setup').setup;
const SmartAccount = require('../common/SmartAccount').SmartAccount

describe('Token', async function () {
  before(async () => {
    all_accounts = {
      dapp: 10 * Setup.WVS,
      existed: 10 * Setup.WVS,
    }

    await setupAccounts(all_accounts);

    const dateOffset = (24 * 60 * 60 * 1000) * Setup.EXP_TOKEN_DAYS
    exp_date = Date.now() - dateOffset - 1

    setup = new Setup(accounts.dapp)
    await setup.generateToken()
    await setup.generateFakeToken()
    await setup.setData(exp_date)
    await setup.setAccountScript()
  })


  context('Expired', async function () {
    it('rejected .updateAssetExpirationDate() before burn all tokens', async () => {
      const iTx = invokeScript({
        dApp: address(setup.dapp_account),
        call: {
          function: "updateAssetExpirationDate"
        }
      }, accounts.existed);

      expect(broadcast(iTx)).to.be.rejectedWith("you have to burn all tokens first")
    })

    context('Burn', async function () {
      it('failed if other asset', async () => {
        const fakeAssetParams = {
          assetId: setup.fake_asset_id,
          quantity: 1,
          senderPublicKey: publicKey(setup.dapp_account),
          fee: 0.005 * Setup.WVS
        }

        const bTx = burn(fakeAssetParams, accounts.existed);
        expect(broadcast(bTx)).to.be.rejectedWith("Transaction is not allowed by account-script")
      })

      it('failed if not all tokens', async () => {
        const assetParams = {
          assetId: setup.asset_id,
          quantity: 1,
          senderPublicKey: publicKey(setup.dapp_account),
          fee: 0.005 * Setup.WVS
        }

        const bTx = burn(assetParams, accounts.existed);
        expect(broadcast(bTx)).to.be.rejectedWith("Transaction is not allowed by account-script")
      })

      it('success if BCC asset', async () => {
        let balance = await assetBalance(setup.asset_id, address(setup.dapp_account))

        const assetParams = {
          assetId: setup.asset_id,
          quantity: balance,
          senderPublicKey: publicKey(setup.dapp_account),
          fee: 0.005 * Setup.WVS
        }

        const bTx = burn(assetParams, accounts.existed);
        await broadcast(bTx)
        await waitForTx(bTx.id)
      })
    })

    it('rejected reissue transaction', async () => {
      const reissueParams = {
        assetId: setup.asset_id,
        quantity: 230 * Setup.WVS,
        senderPublicKey: publicKey(setup.dapp_account),
        fee: 1.004 * Setup.WVS,
        reissuable: true
      }

      const rTx = reissue(reissueParams, setup.dapp_account);

      expect(broadcast(rTx)).to.be.rejectedWith("Transaction is not allowed by account-script")
    })
  })

  context('NOT expired [after .updateAssetExpirationDate() execution]', async function () {
    const newBalance = 123 * Setup.WVS
    
    before(async () => {
      dApp = new SmartAccount(setup.dapp_account, setup.asset_id)
      await dApp.updateAssetExpirationDate(accounts.existed)
    })

    it('asset balance has been zeroed', async function () {
      let balance = await assetBalance(setup.asset_id, address(setup.dapp_account))
      expect(balance).eq(0)
    })

    context('Reissue', async function () {
      it('failed if other asset', async () => {
        const reissueParams = {
          assetId: setup.fake_asset_id,
          quantity: newBalance,
          senderPublicKey: publicKey(setup.dapp_account),
          fee: 1.004 * Setup.WVS,
          reissuable: true
        }

        const rTx = reissue(reissueParams, setup.dapp_account);
        expect(broadcast(rTx)).to.be.rejectedWith("Transaction is not allowed by account-script")
      })

      it('success if BCC asset', async () => {
        const reissueParams = {
          assetId: setup.asset_id,
          quantity: newBalance,
          senderPublicKey: publicKey(setup.dapp_account),
          fee: 1.004 * Setup.WVS,
          reissuable: true
        }

        const rTx = reissue(reissueParams, setup.dapp_account);
        await broadcast(rTx)
        await waitForTx(rTx.id)
      })
    })

    it('its to early to execute .updateAssetExpirationDate again', async () => {
      const iTx = invokeScript({
        dApp: address(setup.dapp_account),
        call: {
          function: "updateAssetExpirationDate"
        }
      }, accounts.existed);

      expect(broadcast(iTx)).to.be.rejectedWith("too early to continue")
    })

    it('rejected burn transaction', async () => {
      let balance = await assetBalance(setup.asset_id, address(setup.dapp_account))

      const assetParams = {
        assetId: setup.asset_id,
        quantity: balance,
        senderPublicKey: publicKey(setup.dapp_account),
        fee: 0.005 * Setup.WVS
      }

      const bTx = burn(assetParams, accounts.existed);

      expect(broadcast(bTx)).to.be.rejectedWith("Transaction is not allowed by account-script")
    })



  })
  
  
})