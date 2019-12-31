const getUserBalanceKey = (addr) => {
  return addr + "_usr_balance"
}

const getUserBalanceExpirationKey = (addr) => {
  return addr + "_usr_balance_expiration"
}

const getDeviceBalanceKey = (addr) => {
  return addr + "_dev_balance"
}

const getDevicePriceKey = (addr) => {
  return addr + "_dev_price"
}

const getAccountCreationPriceKey = () => {
  return "account_creation_price"
}


const getDeviceCreationPriceKey = () => {
  return "device_creation_price"
}

const getAssetIdKey = () => {
  return "asset_id"
}

const getAssetExpirationDateKey = () => {
  return "asset_expiration_date"
}



const wvs = 10 ** 8;

module.exports.getAccountCreationPriceKey = getAccountCreationPriceKey;
module.exports.getDeviceCreationPriceKey = getDeviceCreationPriceKey;
module.exports.getAssetIdKey = getAssetIdKey;
module.exports.getAssetExpirationDateKey = getAssetExpirationDateKey;
module.exports.getDeviceBalanceKey = getDeviceBalanceKey
module.exports.getDevicePriceKey = getDevicePriceKey
module.exports.getUserBalanceKey = getUserBalanceKey;
module.exports.getUserBalanceExpirationKey = getUserBalanceExpirationKey;
module.exports.wvs = wvs;
