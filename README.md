Nombre de salas
Sala de juntas F1
Sala de juntas F2
Sala de juntas F3



Motivos
(Escribirlo)

Roles
Admin
Corporativo
RH

Motivo por que necesita la sala
que día necesita la sala de reuniones con su horario de inicio y finalización(Mostras un calendario para elegir, también la hora)
cuantas personas estarán en la sala de reuniones
correo para enviarle que se solicito la reunion 
añadir restricciones para días ya ocupados por otros usuarios
tener la vista del calendario para el usuario y que vea los días disponibles
Usar react y pocketbase
Administrador Vip podrá ver todos los usuarios registrados en el sistema, ponerles el rol Admin, Corporativo, RH, RH podrá ver solicitudes creadas por los usuarios corporativo y abrirlas y saber el motivo de la solicitud y tomar la decisión de aceptar o rechazar
corporativo podrá ver el panel de solicitudes y así mismo crear su propia solicitud, donde al finalizar tendrá que enviarla y alguien de RH deberá aprobarla o denegarla y así mismo darle una razon por la cual se esta rechazando
Diseño minimalista, menu hamburguesa con logo, añadir animaciones limpias, iconos modernos 
El usuario AdminVip solo tendrá la diferencia de los Admin que podrá el añadir el rol y si el vip desea darles también rol AdminVip a esos otros admins o solo admin que tendrá acceso a todo menos a dar roles

admin@test.com AdminPass123456 



Errores, deja elegir mismas solicitudes que se supone que otro usuario ya aparto, salen muchos errores, sale que genera las solicitudes pero en la vista de solicitudes no sale, en POCKETBASE NO VEO NADA donde se guardo la solicitud y el de usuarios

No arroja las salas de reuniones a la hora de querer solicitarlas



Las solicitudes deben mostrar horario en que se hizo la solicitud, para saber cual fue el usuario mas reciente en hacerla y a ese aceptar, añadir filtro para poder ver solicitudes por Sala, restricciones, el correo que se añade para que le llegue la confirmación no funciona, al crear solicitud si ya hay una solicitud pendiente en el mismo dia mostrar advertencia que ya hay una y que puede que se le rechace por que la otra persona la solicito con mas tiempo, en caso de que a alguien ya se le haya aprobado la solicitud ese día debe estar bloqueado, y por ende las solicitudes que tenían el mismo día serán rechazadas, cada usuario podrá ver el estado de su solicitud y claro el motivo del rechazo

Download the React DevTools for a better development experience: https://react.dev/link/react-devtools
:5173/login:1 [DOM] Input elements should have autocomplete attributes (suggested: "current-password"): (More info: https://goo.gl/9p2vKq) null
127.0.0.1:8090/api/collections/users/auth-with-password:1  Failed to load resource: the server responded with a status of 400 (Bad Request)
127.0.0.1:8090/api/collections/users/auth-with-password:1  Failed to load resource: the server responded with a status of 400 (Bad Request)
127.0.0.1:8090/api/collections/users/auth-with-password:1  Failed to load resource: the server responded with a status of 400 (Bad Request)
:5173/register:1 [DOM] Input elements should have autocomplete attributes (suggested: "current-password"): (More info: https://goo.gl/9p2vKq) null



Mejor quitar lo del correo momentáneamente, al crear solicitud debe salir alerta de que debe estar atento para ver el estado de su solicitud, otro error al aceptar solicitud no pasa nada tengo que recargar pagina para que salga aprobado, soluciona eso, añade el logo lo puse en la carpeta Imágenes/Logo y el que esta ahi, los usaurios de RH tienen que tener notificaciones de todo lo que esta llegando o solicitudes canceladas y el por que, si son las que se rechazan automáticamente también, colores principales de la empresa Azul Eléctrico / Azul Rey,  
