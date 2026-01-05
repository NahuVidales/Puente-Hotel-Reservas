-- CreateTable
CREATE TABLE "usuarios" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "rol" TEXT NOT NULL DEFAULT 'CLIENTE',
    "fechaCreacion" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaActualizacion" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "reservas" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "clienteId" INTEGER NOT NULL,
    "fecha" DATETIME NOT NULL,
    "turno" TEXT NOT NULL,
    "zona" TEXT NOT NULL,
    "cantidadPersonas" INTEGER NOT NULL,
    "observaciones" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'RESERVADA',
    "fechaCreacion" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaUltimaModificacion" DATETIME NOT NULL,
    CONSTRAINT "reservas_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "comentarios_reserva" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "reservaId" INTEGER NOT NULL,
    "textoComentario" TEXT NOT NULL,
    "fechaComentario" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "comentarios_reserva_reservaId_fkey" FOREIGN KEY ("reservaId") REFERENCES "reservas" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "parametros_capacidad" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "capacidadFrente" INTEGER NOT NULL DEFAULT 30,
    "capacidadGaleria" INTEGER NOT NULL DEFAULT 200,
    "capacidadSalon" INTEGER NOT NULL DEFAULT 500,
    "anticipacionMaximaDias" INTEGER NOT NULL DEFAULT 30
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");
