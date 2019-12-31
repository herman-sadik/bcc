# BCC decentralized application
## How it works

BCC Tokens have their 30 day life cycle determined according to `asset_expiration_date`. After this date the account script allow to
- burn tokens which are remained,
- user balances in the dApp are zeroed, 
- and then new tokens enter to the circulation. 

While adding account to dApp user have to attach payment of BCC tokens. Amount is determined in `account_creation_price`  data record. Overpayment will be automatically assigned to user balance.
After successful account creation process in dApp will be create following records:

- `USER_ADDRESS_usr_balance`
- `USER_ADDRESS_usr_balance_expiration`

Last key will be responsible for keeping 30 day tokens life cycle in user account . After timestamp from this field user balance will be zeroed.

Created user is able to adding new devices and make a reservations.
Price for creating new device is determined in `device_creation_price` and this time user will not attach the payment but have to have sufficient balance in dApp to proceed.
After successful device creation process in dApp will be create following records:

- `DEVICE_ADDRESS_dev_price`
- `DEVICE_ADDRESS_dev_balance`

Only enough founds in user account balance in the BCC dApp allows to make a device reservation. 
Reservation period is for one day. For example if user reserved device in monday evening then the end of reservation will be in the same day at 23:59

The number of tokens which are issued every 30 days is determined by the number and price of available devices. 


### TODO
- handle user and device blocking
- tests refactor
- use Sponsorship tokens
- handle 1 month tokens life cycle instead of 30 days.
