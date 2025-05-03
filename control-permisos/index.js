// control-permisos.js
const Redis = require('ioredis');
const redis = new Redis({ host: 'redis', port: 6379 });

// Simulación: permisos en memoria
const permisos = new Map();
// Por ejemplo: expediente 1234 accesible
permisos.set("1234", true);

async function escucharVerificaciones() {
    console.log("Servicio de permisos escuchando...");

    while (true) {
        try {
            const data = await redis.xread(
                'BLOCK', 0, // espera indefinida
                'STREAMS', 'verificacion-permisos', '$'
            );

            const eventos = data[0][1];
            for (const [_, values] of eventos) {
                const evento = {};
                for (let i = 0; i < values.length; i += 2) {
                    evento[values[i]] = values[i + 1];
                }

                const { requestId, expedienteId } = evento;
                const permitido = permisos.get(expedienteId) ? 'true' : 'false';

                console.log(`Verificando permiso para expediente ${expedienteId} → ${permitido}`);

                await redis.xadd("respuesta-permisos", "*",
                    "requestId", requestId,
                    "permitido", permitido
                );
            }

        } catch (err) {
            console.error("Error al leer stream:", err);
        }
    }
}

escucharVerificaciones();
