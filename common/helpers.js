const wvs = 10 ** 8;
const startDate = 1577833200000 // # 01.01.2020 00: 00, TimeZone: local

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

const getDappStartDateKey = () => {
  return "dapp_start_date"
}

const getAssetExpirationDateKey = () => {
  return "asset_expiration_date"
}

const dayNumber = (timestamp) => {
  const dayNo =  (timestamp - startDate) / (24 * 60 * 60 * 1000)
  
  return Math.floor(dayNo)
}

const getDeviceReservationKey = (addr, timestamp) => {
  return addr + "_dev_reservation_" + dayNumber(timestamp)
}


module.exports.getAccountCreationPriceKey = getAccountCreationPriceKey;
module.exports.getDeviceCreationPriceKey = getDeviceCreationPriceKey;
module.exports.getAssetIdKey = getAssetIdKey;
module.exports.getDappStartDateKey = getDappStartDateKey;
module.exports.getAssetExpirationDateKey = getAssetExpirationDateKey;
module.exports.getDeviceBalanceKey = getDeviceBalanceKey
module.exports.getDevicePriceKey = getDevicePriceKey
module.exports.getUserBalanceKey = getUserBalanceKey;
module.exports.getUserBalanceExpirationKey = getUserBalanceExpirationKey;
module.exports.getDeviceReservationKey = getDeviceReservationKey;
module.exports.wvs = wvs;
