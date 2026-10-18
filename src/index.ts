import app from './app.js';

// [Migración TS] Punto de entrada del proyecto (src/index.ts), como el
// ejemplo de la cátedra: `npm run dev` lo levanta con nodemon + tsx y
// reinicia automáticamente al tocar cualquier archivo .ts de src/.
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor de la Distribuidora corriendo en http://localhost:${PORT}`);
});
