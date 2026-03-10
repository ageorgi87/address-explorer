-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "departements" (
    "code" TEXT NOT NULL,
    "nom" TEXT NOT NULL,

    CONSTRAINT "departements_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "communes" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "codePostal" TEXT NOT NULL,
    "departementCode" TEXT NOT NULL,

    CONSTRAINT "communes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "voies" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "communeId" TEXT NOT NULL,

    CONSTRAINT "voies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "numeros" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "suffixe" TEXT,
    "lat" DOUBLE PRECISION NOT NULL,
    "lon" DOUBLE PRECISION NOT NULL,
    "voieId" TEXT NOT NULL,

    CONSTRAINT "numeros_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "communes_departementCode_idx" ON "communes"("departementCode");

-- CreateIndex
CREATE INDEX "communes_nom_idx" ON "communes"("nom");

-- CreateIndex
CREATE INDEX "voies_communeId_idx" ON "voies"("communeId");

-- CreateIndex
CREATE INDEX "voies_nom_idx" ON "voies"("nom");

-- CreateIndex
CREATE INDEX "numeros_voieId_idx" ON "numeros"("voieId");

-- AddForeignKey
ALTER TABLE "communes" ADD CONSTRAINT "communes_departementCode_fkey" FOREIGN KEY ("departementCode") REFERENCES "departements"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voies" ADD CONSTRAINT "voies_communeId_fkey" FOREIGN KEY ("communeId") REFERENCES "communes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "numeros" ADD CONSTRAINT "numeros_voieId_fkey" FOREIGN KEY ("voieId") REFERENCES "voies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

