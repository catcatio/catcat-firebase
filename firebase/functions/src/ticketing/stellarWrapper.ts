import * as StellarSdk from 'stellar-sdk'

const stellarWrapperFactory = (server: StellarSdk.Server, masterSigner: StellarSdk.Keypair) => {

  const safeMemoText = (text = '') => {
    return (!text || text.length <= 28)
      ? StellarSdk.Memo.text(text || '')
      : StellarSdk.Memo.text(text.substring(0, 28))
  }

  const getErrorCode = (err) => {
    try {
      const code = err.response.data.extras.result_codes
      return code.operations
        ? code.operations.join(', ')
        : code.transaction
          ? code.transaction.toString()
          : err
    }
    catch (error) {
      return err
    }
  }

  const doBookTicket = (masterAccount, masterAsset, user, event, amount, memo) => {
    return server.loadAccount(masterAccount.publicKey())
      .then(account => {
        const transaction = new StellarSdk.TransactionBuilder(account)
          .addOperation(StellarSdk.Operation.changeTrust({
            asset: event.asset,
            source: user.publicKey()
          }))
          .addOperation(StellarSdk.Operation.payment({
            destination: user.publicKey(),
            asset: masterAsset,
            amount: `${amount}`
          }))
          .addOperation(StellarSdk.Operation.manageOffer({
            selling: event.asset,
            buying: masterAsset,
            amount: `${amount}`,
            price: amount,
            source: event.distributor.publicKey()
          } as any))
          .addOperation(StellarSdk.Operation.manageOffer({
            selling: masterAsset,
            buying: event.asset,
            amount: `${amount}`,
            price: amount,
            source: user.publicKey()
          } as any))
          .addMemo(safeMemoText(`${memo ? memo : `book:${event.asset.getCode()}`}`))
          .build()

        transaction.sign(masterSigner)
        return server.submitTransaction(transaction)
      })
      .then((result) => {
        return result.hash
      })
      .catch((error) => {
        const errMsg = `Something went wrong! (doBookTicket): ${getErrorCode(error)}`
        console.warn(errMsg)
        throw new Error(errMsg)
      })
  }


  const makeOffer = (srcKey: StellarSdk.Keypair, sellingAsset: StellarSdk.Asset, buyingAsset: StellarSdk.Asset, sellingAmount: number = 1, buyingPrice: number = 1, memo: string = '') => {
    const options: StellarSdk.Operation.ManageOfferOptions = {
      selling: sellingAsset,
      buying: buyingAsset,
      amount: `${sellingAmount}`,
      price: buyingPrice,
      source: srcKey.publicKey()
    } as StellarSdk.Operation.ManageOfferOptions

    return server.loadAccount(masterSigner.publicKey())
      .then((account: StellarSdk.Account) => {
        const transaction = new StellarSdk.TransactionBuilder(account)
          .addOperation(StellarSdk.Operation.manageOffer(options))
          .addMemo(safeMemoText(memo || `${sellingAsset.getCode()} -> ${buyingAsset.getCode()}`))
          .build()
        transaction.sign(masterSigner || srcKey)
        return server.submitTransaction(transaction)
      })
      .then((result) => {
        console.log(`Success! Results (makeOffer): ${result._links.transaction.href}`)
        return result.hash
      })
      .catch((error) => {
        const errMsg = `Something went wrong! (makeOffer): ${getErrorCode(error)}`
        console.warn(error.stack)
        throw new Error(errMsg)
      })
  }

  const parseTxAction = (memoText) => {
    if (!memoText) return null

    const chunks = memoText.split(':')
    if (chunks.length !== 3) return null

    return { action: chunks[0], eventId: chunks[1], ticketId: chunks[2] }
  }

  const queryTransactionMemo = (txId) => {
    return server.transactions()
      .transaction(txId)
      .call()
      .then((result: any) =>
        result.memo
      )
  }

  const queryTransactionAction = async (tx) => {
    const memo = await queryTransactionMemo(tx)
      .catch(() => '')

    return parseTxAction(memo)
  }

  const transfer = (srcKey, desPublicKey, amount, asset = StellarSdk.Asset.native(), memo = null) => {
    return server.loadAccount(desPublicKey)
      .catch(err => {
        throw err
      })
      .then(() => server.loadAccount(srcKey.publicKey()))
      .then((account) => {
        const transaction = new StellarSdk.TransactionBuilder(account)
          .addOperation(StellarSdk.Operation.payment({
            destination: desPublicKey,
            asset: asset,
            amount: `${amount}`
          }))
          .addMemo(safeMemoText(memo ? memo : `Tx: ${Date.now()}`))
          .build()
        transaction.sign(masterSigner || srcKey)
        return server.submitTransaction(transaction)
      })
      .then((result) => {
        // console.log(`Success! Results (transfer): ${result._links.transaction.href}`)
        return result.hash
      })
          .catch((error) => {
            const errMsg = `Something went wrong! (transfer): ${getErrorCode(error)}`
            console.warn(errMsg)
            throw new Error(errMsg)
          })
      }

  const getBalanceInfo = (publickeyStr) => {
      return server.loadAccount(publickeyStr)
        .then(account => account.balances
          .map(balance => {
            return {
              code: balance.asset_type === 'native' ? 'XLM' : balance.asset_code,
              balance: parseFloat(balance.balance),
              issuer: balance.asset_type === 'native' ? '' : balance.asset_issuer,
            }
          }))
        .catch(err => console.log(err) || null)
    }

    return {
      makeOffer,
      doBookTicket,
      queryTransactionAction,
      transfer,
      getBalanceInfo
    }

  }

  export default stellarWrapperFactory