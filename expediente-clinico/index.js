const express = require('express');
const { verificarPermiso } = require('./permisos');
const Redis = require('ioredis');


const redis = new Redis({ host: 'redis', port: 6379 });

const app = express();
app.use(express.json());

app.get('/expediente/:id', async (req, res) => {
    const { id } = req.params;

    const tienePermiso = await verificarPermiso(id);
    if (!tienePermiso) {
        await redis.xadd('solicitudes-permiso', '*',
            'expedienteId', id,
            'accion', 'consulta',
            'timestamp', new Date().toISOString()
        );
        return res.status(403).json({ error: 'Acceso denegado, permiso solicitado' });
    }

    res.json({
        id,
        nombre: "Paciente Simulado",
        edad: 35,
        diagnostico: "Hipertensión",
        notas: "Control mensual"
    });
});

app.post('/expediente/:id', async (req, res) => {
    const { id } = req.params;
    const datos = req.body;

    const tienePermiso = await verificarPermiso(id);
    if (!tienePermiso) return res.status(403).json({ error: 'Acceso denegado' });

    res.json({
        mensaje: `Información agregada al expediente ${id} (simulada)`,
        datosRecibidos: datos
    });
});

const PORT = 3003;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
