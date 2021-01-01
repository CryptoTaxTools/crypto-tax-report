## Fee Notes
Miscellaneous notes on fee treatment.

### Fees in captial assets
If a fee is a capital asset (meaning: not the same asset code as local_currency), the report will generate a new sale record. In some cases this may not be desirable. For example, if you trade USD for ETH and pay a fee in ETH, you might prefer to have one ETH transaction with the ETH fee already subtracted from the amount received. If this is the case, you should do this calculation before creating the transaction inputs into the tax report.
