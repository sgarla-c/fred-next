/*
  Warnings:

  - The primary key for the `CLAIM` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `CLAIM_AMT` on the `CLAIM` table. All the data in the column will be lost.
  - You are about to drop the column `CLAIM_DT` on the `CLAIM` table. All the data in the column will be lost.
  - You are about to drop the column `CLAIM_ID` on the `CLAIM` table. All the data in the column will be lost.
  - You are about to drop the column `CLAIM_STATUS` on the `CLAIM` table. All the data in the column will be lost.
  - You are about to drop the column `CLAIM_TYPE` on the `CLAIM` table. All the data in the column will be lost.
  - You are about to drop the column `INVC_ID` on the `CLAIM` table. All the data in the column will be lost.
  - You are about to alter the column `CLAIM_NBR` on the `CLAIM` table. The data in that column could be lost. The data in that column will be cast from `VarChar(50)` to `VarChar(15)`.
  - You are about to drop the column `INV_LINE_TOTAL` on the `INVC` table. All the data in the column will be lost.
  - You are about to drop the column `PO_ID` on the `INVC` table. All the data in the column will be lost.
  - You are about to drop the column `RENTAL_ID` on the `INVC` table. All the data in the column will be lost.
  - You are about to drop the column `INVC_LN_AMT` on the `INVC_LN` table. All the data in the column will be lost.
  - You are about to drop the column `INVC_LN_DSCR` on the `INVC_LN` table. All the data in the column will be lost.
  - You are about to drop the column `INVC_LN_NBR` on the `INVC_LN` table. All the data in the column will be lost.
  - You are about to drop the column `INVC_LN_QTY` on the `INVC_LN` table. All the data in the column will be lost.
  - You are about to drop the column `INVC_LN_UOM` on the `INVC_LN` table. All the data in the column will be lost.
  - You are about to drop the column `LAST_UPDT_BY` on the `INVC_LN` table. All the data in the column will be lost.
  - You are about to drop the column `LAST_UPDT_DT` on the `INVC_LN` table. All the data in the column will be lost.
  - Made the column `CLAIM_NBR` on table `CLAIM` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "CLAIM" DROP CONSTRAINT "CLAIM_INVC_ID_fkey";

-- DropForeignKey
ALTER TABLE "INVC" DROP CONSTRAINT "INVC_PO_ID_fkey";

-- DropForeignKey
ALTER TABLE "INVC_LN" DROP CONSTRAINT "INVC_LN_INVC_ID_fkey";

-- AlterTable
ALTER TABLE "CLAIM" DROP CONSTRAINT "CLAIM_pkey",
DROP COLUMN "CLAIM_AMT",
DROP COLUMN "CLAIM_DT",
DROP COLUMN "CLAIM_ID",
DROP COLUMN "CLAIM_STATUS",
DROP COLUMN "CLAIM_TYPE",
DROP COLUMN "INVC_ID",
ADD COLUMN     "CLAIM_ADDL_CMNT" VARCHAR(500),
ADD COLUMN     "CLAIM_DSCR" VARCHAR(500),
ADD COLUMN     "CLAIM_NM" VARCHAR(500),
ADD COLUMN     "CLAIM_PAID_DT" DATE,
ADD COLUMN     "CLAIM_SETLMT_AMT" DECIMAL(10,2),
ADD COLUMN     "CLAIM_STAT" VARCHAR(100),
ADD COLUMN     "CLAIM_STAT_CMNT" VARCHAR(500),
ADD COLUMN     "CONTRACT_NBR" VARCHAR(50),
ADD COLUMN     "DIST_NM" VARCHAR(50),
ADD COLUMN     "EML_REJCT_DT" DATE,
ADD COLUMN     "LAST_FOLUP_DT" DATE,
ADD COLUMN     "OCC_CLAIM_NBR" VARCHAR(25),
ADD COLUMN     "OCC_CONCLUSION" VARCHAR(100),
ADD COLUMN     "OCC_NOTIF_DT" DATE,
ADD COLUMN     "ON_RENT_FLAG" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "PO_ID" INTEGER,
ADD COLUMN     "RENTAL_ID" INTEGER,
ADD COLUMN     "RENT_COORD_USER_ID" VARCHAR(50),
ADD COLUMN     "TITLE_43_CLAIM" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "TXDOT_RCVD_DT" DATE,
ADD COLUMN     "VENDR_ADDR_1" VARCHAR(50),
ADD COLUMN     "VENDR_ADDR_2" VARCHAR(50),
ADD COLUMN     "VENDR_CLAIM_DT" DATE,
ADD COLUMN     "VENDR_CNTCT_NM" VARCHAR(50),
ADD COLUMN     "VENDR_CNTCT_PHN_NBR" VARCHAR(15),
ADD COLUMN     "VENDR_CNTCT_TTL" VARCHAR(50),
ADD COLUMN     "VENDR_NM" VARCHAR(50),
ALTER COLUMN "CLAIM_NBR" SET NOT NULL,
ALTER COLUMN "CLAIM_NBR" SET DATA TYPE VARCHAR(15),
ADD CONSTRAINT "CLAIM_pkey" PRIMARY KEY ("CLAIM_NBR");

-- AlterTable
ALTER TABLE "INVC" DROP COLUMN "INV_LINE_TOTAL",
DROP COLUMN "PO_ID",
DROP COLUMN "RENTAL_ID",
ADD COLUMN     "CLAIM_NBR" VARCHAR(15),
ADD COLUMN     "ENTRY_DT" DATE,
ADD COLUMN     "FIN_ID" VARCHAR(25),
ADD COLUMN     "FIN_NOTES" VARCHAR(255),
ADD COLUMN     "FIN_RSPNBL" VARCHAR(50),
ADD COLUMN     "FIN_STAMP_DT" DATE,
ADD COLUMN     "FIN_STAT" VARCHAR(25),
ADD COLUMN     "FOD_NOTES" VARCHAR(255),
ADD COLUMN     "INVC_STAT" VARCHAR(50),
ADD COLUMN     "RCPT_DT" DATE,
ADD COLUMN     "RCPT_NBR" VARCHAR(50),
ADD COLUMN     "RENT_COORD_RSPNBL" VARCHAR(50),
ADD COLUMN     "SRVC_START_DT" DATE,
ADD COLUMN     "SRVC_STOP_DT" DATE;

-- AlterTable
ALTER TABLE "INVC_LN" DROP COLUMN "INVC_LN_AMT",
DROP COLUMN "INVC_LN_DSCR",
DROP COLUMN "INVC_LN_NBR",
DROP COLUMN "INVC_LN_QTY",
DROP COLUMN "INVC_LN_UOM",
DROP COLUMN "LAST_UPDT_BY",
DROP COLUMN "LAST_UPDT_DT",
ADD COLUMN     "INVC_FISCAL_YR" VARCHAR(4),
ADD COLUMN     "ITEM_AMT" DECIMAL(10,2),
ADD COLUMN     "PO_ID" INTEGER,
ADD COLUMN     "RENTAL_ID" INTEGER,
ALTER COLUMN "INVC_ID" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "INVC_LN" ADD CONSTRAINT "INVC_LN_INVC_ID_fkey" FOREIGN KEY ("INVC_ID") REFERENCES "INVC"("INVC_ID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "INVC_LN" ADD CONSTRAINT "INVC_LN_PO_ID_fkey" FOREIGN KEY ("PO_ID") REFERENCES "PO"("PO_ID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "INVC_LN" ADD CONSTRAINT "INVC_LN_RENTAL_ID_fkey" FOREIGN KEY ("RENTAL_ID") REFERENCES "RENTAL"("RENTAL_ID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CLAIM" ADD CONSTRAINT "CLAIM_RENTAL_ID_fkey" FOREIGN KEY ("RENTAL_ID") REFERENCES "RENTAL"("RENTAL_ID") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CLAIM" ADD CONSTRAINT "CLAIM_PO_ID_fkey" FOREIGN KEY ("PO_ID") REFERENCES "PO"("PO_ID") ON DELETE SET NULL ON UPDATE CASCADE;
