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

  return {
    makeOffer
  }

}

export default stellarWrapperFactory