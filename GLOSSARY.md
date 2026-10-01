# E-Book Store Domain

The commercial and fulfillment domain for an online electronic book store where customers purchase digital licenses, simulate transfer payments, and download authenticated reading files, while store administrators manage the catalog, verify transactions, and monitor business analytics.

## Language

### Catalog & Publishing

**Book**:
A commercially published digital publication offered for sale to customers.
_Avoid_: Product, item, title, listing

**Author**:
The individual writer or creator credited with producing a book.
_Avoid_: Writer, creator, contributor

**Publisher**:
The corporate organization or publishing house that licenses and distributes a book.
_Avoid_: Vendor, distributor, supplier, company

**Category**:
A thematic genre or subject taxonomy used to classify books.
_Avoid_: Genre, tag, department, section

### Customers & Orders

**User**:
An authenticated account holder in the system with an assigned role as customer or administrator.
_Avoid_: Account, member, profile

**Customer**:
A user who searches, adds books to a cart, places orders, and accesses digital library books.
_Avoid_: Buyer, client, shopper

**Cart**:
A temporary holding area containing books selected by a customer prior to initiating checkout.
_Avoid_: Basket, bag

**Order**:
A binding commercial agreement initiated by a customer to purchase one or more books.
_Avoid_: Transaction, checkout, purchase

**OrderItem**:
A specific book line item within an order, capturing the price agreed at checkout.
_Avoid_: Line item, order line, product entry

**Coupon**:
A promotional voucher providing a fixed or percentage price reduction on qualifying orders.
_Avoid_: Promo code, discount code, voucher

### Payment & Fulfillment

**Payment**:
A customer-submitted financial settlement record containing payment proof and verification lifecycle.
_Avoid_: Transaction, remittance, slip, wire

**PaymentSlip**:
The visual evidence of a bank transfer uploaded by a customer to substantiate a payment.
_Avoid_: Receipt, transfer image, proof

**UserLibrary**:
The digital repository of books permanently owned by a customer following successful payment approval.
_Avoid_: Bookshelf, collection, my books

**DownloadToken**:
A secure, time-limited, and quota-constrained credential granting authorized download of an e-book file.
_Avoid_: Link, download URL, access key

**DownloadLog**:
An immutable audit entry recorded each time an e-book file is transmitted to a user.
_Avoid_: Access history, download history, telemetry
