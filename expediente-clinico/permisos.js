const Redis = require('ioredis');
const redis = new Redis({ host: 'redis', port: 6379 });
const { v4: uuidv4 } = require('uuid');

async function verificarPermiso(expedienteId) {
    const requestId = uuidv4();

    // Emitir evento al stream
    await redis.xadd('verificacion-permisos', '*',
        'tipoEvento', 'verificar-permiso',
        'requestId', requestId,
        'expedienteId', expedienteId
    );

    // Esperar la respuesta desde el stream
    const timeoutMs = 3000;
    const startTime = Date.now();

    while (Date.now() - startTime < timeoutMs) {
        const response = await redis.xread(
            'BLOCK', 1000,
            'STREAMS', 'respuesta-permisos', '0'
        );

        if (response) {
            const events = response[0][1];
            for (const [_, fields] of events) {
                const data = {};
                for (let i = 0; i < fields.length; i += 2) {
                    data[fields[i]] = fields[i + 1];
                }

                if (data.requestId === requestId) {
                    return data.permitido === 'true';
                }
            }
        }
    }

    console.log("Tiempo de espera agotado sin respuesta del servicio de permisos.");
    return false;
}

module.exports = { verificarPermiso };

