-- =============================================
-- Run this script ONCE in SQL Server Management Studio
-- against the hllSystem database to enable
-- supply transfer transaction history.
-- =============================================

USE hllSystem;
GO

IF NOT EXISTS (
  SELECT 1 FROM INFORMATION_SCHEMA.TABLES
  WHERE TABLE_NAME = 'SupplyTransactions'
)
BEGIN
  CREATE TABLE SupplyTransactions (
    TransactionId     INT IDENTITY(1,1) PRIMARY KEY,
    SupplyId          INT NULL,                          -- soft reference to OfficeSupplies.Id
    ActionType        NVARCHAR(50)  NOT NULL,
    QuantityChanged   INT           NOT NULL,
    PreviousQuantity  INT           NOT NULL,
    NewQuantity       INT           NOT NULL,
    DestinationSection NVARCHAR(100) NULL,
    Remarks           NVARCHAR(500) NULL,
    CreatedBy         NVARCHAR(100) NULL,
    CreatedAt         DATETIME      NOT NULL DEFAULT GETDATE()
  );

  PRINT 'SupplyTransactions table created successfully.';
END
ELSE
BEGIN
  PRINT 'SupplyTransactions table already exists — no action taken.';
END
GO
