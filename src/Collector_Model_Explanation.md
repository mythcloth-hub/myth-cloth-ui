# Collector Purchase and Collection Model Explanation

## Overview

The model separates two different concepts:

1.  **What the collector owns today**
2.  **How the collector acquired those items**

This avoids mixing the current collection state with historical purchase
information.

The entities are:

    CollectorCollectionFigurine
    ---------------------------
    figurine
    quantity
    condition


    CollectorPurchase
    ---------------------------
    orderDate
    store
    orderNumber
    currency
    totalAmount
    shippingStatus
    trackingNumber
    carrier


    CollectorPurchaseFigurine
    ---------------------------
    purchase
    figurine
    quantity
    pricePaid
    purchaseType

------------------------------------------------------------------------

# 1. CollectorCollectionFigurine

## Purpose

This table represents the current state of the collector's collection.

It answers:

> "What figurines do I own right now?"

Example:

  id   collection_id   figurine_id   quantity   condition
  ---- --------------- ------------- ---------- -----------
  1    10              1001          1          SEALED
  2    10              1002          2          SEALED
  3    10              1003          1          OPENED

------------------------------------------------------------------------

## Example explanation

### Siegfried EX

    figurine_id = 1001
    quantity = 1
    condition = SEALED

The collector owns:

    Siegfried EX
    Quantity: 1
    Condition: Sealed

The box has not been opened.

------------------------------------------------------------------------

### Pegasus EX

    figurine_id = 1002
    quantity = 2
    condition = SEALED

The collector owns two copies.

Instead of storing:

  figurine
  ------------
  Pegasus EX
  Pegasus EX

we store:

  figurine     quantity
  ------------ ----------
  Pegasus EX   2

The quantity represents duplicates.

------------------------------------------------------------------------

### Athena EX

    figurine_id = 1003
    quantity = 1
    condition = OPENED

The collector opened the figure and probably displays it.

------------------------------------------------------------------------

# 2. CollectorPurchase

## Purpose

This table stores purchase history.

It answers:

> "When and where did I buy something?"

Example:

  -------------------------------------------------------------------------------------------------------------------
  id      orderDate    store       orderNumber   currency   totalAmount   shippingStatus   trackingNumber   carrier
  ------- ------------ ----------- ------------- ---------- ------------- ---------------- ---------------- ---------
  500     2026-06-01   Yoyakunow   YY12345       JPY        45000         DELIVERED        DHL001           DHL

  -------------------------------------------------------------------------------------------------------------------

------------------------------------------------------------------------

This represents a real order:

    Store: Yoyakunow
    Order: YY12345
    Date: 2026-06-01
    Total: 45000 JPY
    Status: Delivered

The purchase does not directly store the figures.

The next table connects the order with the purchased items.

------------------------------------------------------------------------

# 3. CollectorPurchaseFigurine

## Purpose

This table connects purchases with figurines.

It answers:

> "Which figurines were included in this purchase?"

Example:

  id    purchase_id   figurine_id   quantity   pricePaid   purchaseType
  ----- ------------- ------------- ---------- ----------- --------------
  900   500           1001          1          20000       PREORDER
  901   500           1002          1          25000       RETAIL

------------------------------------------------------------------------

The purchase:

    Yoyakunow
    Order YY12345
    45000 JPY

contained:

    Siegfried EX
    Price: 20000 JPY
    Type: PREORDER


    Pegasus EX
    Price: 25000 JPY
    Type: RETAIL

------------------------------------------------------------------------

# Complete flow example

The collector buys two figures.

## Step 1 - Create purchase

Create:

    CollectorPurchase

with:

    store = Yoyakunow
    orderNumber = YY12345
    currency = JPY
    totalAmount = 45000
    status = DELIVERED

------------------------------------------------------------------------

## Step 2 - Add purchased figures

Create:

    CollectorPurchaseFigurine

records:

  purchase   figurine       quantity   price
  ---------- -------------- ---------- -------
  YY12345    Siegfried EX   1          20000
  YY12345    Pegasus EX     1          25000

------------------------------------------------------------------------

## Step 3 - Update collection

Before:

    Siegfried EX
    quantity = 0

After receiving:

    Siegfried EX
    quantity = 1
    condition = SEALED

The collection now represents reality.

------------------------------------------------------------------------

# Why separate purchases and collection?

Because they change differently.

Example:

A collector buys:

    Pegasus EX
    Quantity: 2

Later:

-   Opens one
-   Keeps one sealed

The purchase history does not change.

Only the collection changes:

    Pegasus EX
    quantity = 2
    condition = MIXED

------------------------------------------------------------------------

# Final idea

Think of it this way:

## CollectorCollectionFigurine

The album.

It shows:

-   What you own
-   How many
-   Current condition

## CollectorPurchase

The receipts.

It shows:

-   Where you bought it
-   When
-   Shipping
-   Order information

## CollectorPurchaseFigurine

The receipt details.

It shows:

-   Which figures were inside the order
-   Price per figure
-   Purchase type

This structure scales well for a collectible tracking application.
