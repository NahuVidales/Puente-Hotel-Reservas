#!/bin/bash

echo "🚀 Generando datos históricos para el restaurante..."

cd backend

echo "📦 Instalando dependencias necesarias..."
npm install bcrypt @types/bcrypt

echo "🔧 Generando cliente de Prisma..."
npx prisma generate

echo "📊 Ejecutando script de datos históricos..."
npm run prisma:seed-historico

echo "✅ ¡Datos históricos generados exitosamente!"
echo "🔍 Puedes verificar los datos con: npm run prisma:studio"