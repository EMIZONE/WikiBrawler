# Bitácora de Decisiones

## 1. ¿Por qué usar un id único en lugar de identificar al personaje por su nombre? ¿Qué pasaría si dos personajes se llaman igual? 
El sistema asigna un identificador basado en la fecha y hora de registro. Usar el nombre causaría que personajes homónimos se sobreescriban o confundan al modificarlos o eliminarlos. Un ID único garantiza que cada registro se gestione de forma independiente.

## 2. ¿Conviene guardar todo el arreglo en una sola clave de localStorage o un personaje por clave? 
Los personajes se agrupan bajo la clave `nexus_characters` (así se llamaba antes el trabajo). Esto facilita extraer y guardar toda la colección mediante una sola instrucción. La desventaja es que cualquier cambio menor obliga a reescribir toda la lista, pero para la magnitud del proyecto es el método más práctico.

## 3. ¿La búsqueda debe ejecutarse en cada tecla o al presionar Enter? ¿Cómo cambia la experiencia con 10 vs. 1,000 personajes? 
La aplicación filtra resultados de manera automática al modificar el texto. Para un catálogo pequeño, esto brinda una navegación ágil. 

Con miles de registros, este método saturaría los recursos del navegador al redibujar la interfaz constantemente; en ese caso, sería óptimo editar el código para buscar al presionar Enter (o implementar una función de *debounce*).

## 4. ¿Qué ocurre si alguien modifica manualmente localStorage desde la consola y deja un JSON inválido? 
El código cuenta con un mecanismo que intercepta fallos de lectura al iniciar. Si detecta datos corruptos, elimina la información inválida de la memoria y carga los datos de muestra originales, evitando que la aplicación deje de funcionar.

## 5. ¿Qué pasa si la URL de la imagen no existe? 
Tiene un comportamiento de respaldo. Si no se proporciona un archivo de imagen, la cuadrícula muestra un icono y el texto "[ Sin Imagen ]". En los detalles, si la imagen falla al cargar, el sistema la sustituye automáticamente por una versión alternativa precargada para evitar errores en la interfaz.