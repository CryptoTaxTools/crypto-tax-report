## Compound Transactions


##### Mint

Property | Data Type | Allowed Value | Required
------------ | ------------- | ------------- | -------------
tx_id | String | Any String | Yes
tx_type | String | `'COMPOUND_MINT'` | Yes
timestamp | String | ISO 8601 DateTime String | Yes
c_token_code | String | Any String | Yes
c_token_amount | String | Any String | Yes
supplied_code | String | Any String | Yes
supplied_amount | String | Any String | Yes
fee_code | String | Any String | No
fee_amount | String | Any String | No

##### Borrow

Property | Data Type | Allowed Value | Required
------------ | ------------- | ------------- | -------------
tx_id | String | Any String | Yes
tx_type | String | `'COMPOUND_BORROW'` | Yes
timestamp | String | ISO 8601 DateTime String | Yes
borrow_code | String | Any String | Yes
borrow_amount | String | Any String | Yes
fee_code | String | Any String | No
fee_amount | String | Any String | No

##### Redeem

Property | Data Type | Allowed Value | Required
------------ | ------------- | ------------- | -------------
tx_id | String | Any String | Yes
tx_type | String | `'COMPOUND_REDEEM'` | Yes
timestamp | String | ISO 8601 DateTime String | Yes
c_token_code | String | Any String | Yes
c_token_amount | String | Any String | Yes
redeem_code | String | Any String | Yes
redeem_amount | String | Any String | Yes
fee_code | String | Any String | No
fee_amount | String | Any String | No

##### Repay Borrow

Property | Data Type | Allowed Value | Required
------------ | ------------- | ------------- | -------------
tx_id | String | Any String | Yes
tx_type | String | `'COMPOUND_REPAYBORROW'` | Yes
timestamp | String | ISO 8601 DateTime String | Yes
repay_code | String | Any String | Yes
repay_amount | String | Any String | Yes
fee_code | String | Any String | No
fee_amount | String | Any String | No

##### Liquidate Borrow, Borrower Impact

Property | Data Type | Allowed Value | Required
------------ | ------------- | ------------- | -------------
tx_id | String | Any String | Yes
tx_type | String | `'COMPOUND_LIQUIDATEBORROW_BORROWER'` | Yes
timestamp | String | ISO 8601 DateTime String | Yes
liquidate_code | String | Any String | Yes
liquidate_amount | String | Any String | Yes
fee_code | String | Any String | No
fee_amount | String | Any String | No

##### Liquidate Borrow, Liquidator Impact

Property | Data Type | Allowed Value | Required
------------ | ------------- | ------------- | -------------
tx_id | String | Any String | Yes
tx_type | String | `'COMPOUND_LIQUIDATEBORROW_LIQUIDATOR'` | Yes
timestamp | String | ISO 8601 DateTime String | Yes
repay_code | String | Any String | Yes
repay_amount | String | Any String | Yes
seize_code | String | Any String | Yes
seize_amount | String | Any String | Yes
fee_code | String | Any String | No
fee_amount | String | Any String | No
