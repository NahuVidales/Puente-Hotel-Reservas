"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const index_1 = require("../index");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Obtener parámetros de capacidad (todos los usuarios autenticados)
router.get('/', auth_middleware_1.verificarToken, async (req, res) => {
    try {
        const parametros = await index_1.prisma.parametrosCapacidadRestaurante.findFirst();
        if (!parametros) {
            return res.status(404).json({ error: 'Parámetros no configurados.' });
        }
        const capacidadTotal = parametros.capacidadFrente + parametros.capacidadGaleria + parametros.capacidadSalon;
        res.json({
            parametros: {
                ...parametros,
                capacidadTotal,
                diasApertura: ['Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
                turnos: ['ALMUERZO', 'CENA']
            }
        });
    }
    catch (error) {
        console.error('Error al obtener parámetros:', error);
        res.status(500).json({ error: 'Error al obtener parámetros.' });
    }
});
// Actualizar parámetros (solo responsables)
router.put('/', auth_middleware_1.verificarToken, auth_middleware_1.verificarResponsable, async (req, res) => {
    try {
        const { capacidadFrente, capacidadGaleria, capacidadSalon, anticipacionMaximaDias } = req.body;
        const parametrosExistentes = await index_1.prisma.parametrosCapacidadRestaurante.findFirst();
        if (!parametrosExistentes) {
            return res.status(404).json({ error: 'Parámetros no configurados.' });
        }
        const parametrosActualizados = await index_1.prisma.parametrosCapacidadRestaurante.update({
            where: { id: parametrosExistentes.id },
            data: {
                ...(capacidadFrente !== undefined && { capacidadFrente }),
                ...(capacidadGaleria !== undefined && { capacidadGaleria }),
                ...(capacidadSalon !== undefined && { capacidadSalon }),
                ...(anticipacionMaximaDias !== undefined && { anticipacionMaximaDias })
            }
        });
        res.json({
            mensaje: 'Parámetros actualizados correctamente.',
            parametros: parametrosActualizados
        });
    }
    catch (error) {
        console.error('Error al actualizar parámetros:', error);
        res.status(500).json({ error: 'Error al actualizar parámetros.' });
    }
});
exports.default = router;
//# sourceMappingURL=parametros.routes.js.map