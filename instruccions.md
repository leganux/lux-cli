me vas  a ayudar a crear un cli con nodeJS que va a ayudar a generar proyectos,  vistas (microforntends), y modulos de la API en MEVN (mongoose, Express, Vue 3, NodeJS) 
vas a usar  commander readline, y demas herramientas  para generar el CLI 

Comandos 

1 configure: Este comando creara una carpeta .lux en la carpeta del usuario ~/.lux y dentro gusrdara un archivo JSON con el API-Key de OpenAI o de Deppseek y debera guardar un parametro que le haya preguntado al usuario que IA prefiere si deepseek o  open ai (default) ese archivo se usara en comndos mas adelantes

2 generate-project: este primero te preguntara la ruta de la carpeta donde se va a generar el proyecto  por defecto sera la ruta actual ./, posteriormente en esa ruta creara 2 carpetas una llamada frontend y otra llamada backend  
        en la carpeta de fron end  debera bajar y descomprimir https://github.com/leganux/leganux-vue3-microfrontends/archive/refs/heads/main.zip o clonar https://github.com/leganux/leganux-vue3-microfrontends.git para ello debes verificar si esta git isntalado

        en la carpeta de backend deberas bajar https://github.com/leganux/express-ts-base/archive/refs/heads/main.zip oclonar https://github.com/leganux/express-ts-base.git  

        para ambas carpetas des asegurarte que los archivos queden sobre la raiz 

        Ahora le vas a preguntar al usuario  sobre de que tarta su proyecto y generar los archivos JSON de los modulos tal y como lo hace el script -> /Users/leganuxm4/Documents/GitHub/lux-cli/ia-file-generator.js toma como ejemplo eso

        al final vas a tener 3 carpetas 
        - generated_runners: incluye los archivos JSON generados por la IA que serviran para crear los modulos
        - frontend: El codigo clonado de frontend
        - backend: El codigo clonado del backend

        A continuacion con los aarchivos que genero la IA los vas a ir recorriendo 1 a uno con es script de ./generator-cli.js  que esta en este proyecto  con este se van a generar los modulos de  backend nuevos. Modifica el  script generator-cli.js para que los modulos los genere dentro de la carpeta backend que escogio el usuario, ese script esta preparado para generar los modulos de bakend con todo lo necesario <userdefinedpath>/backend/src/modules/

        para finalizar vas a generar los frontends del dashboard de vue  para lo cual igual que en el paso anterior se va a ir recorriendo cada JSON generado por la IA y se va a ejecutar con el script ./create-microfrontend.js que esta en al carpeta de este proyecto.  el microfrontend generado dbes de asefurate que se ponga sobre <userdefinedpath>/frontend/src/_frontends/dashboard/

        con esto terminaria este comando... En caso de que una carpeta no exista deberias crearla en base a la estructura deseada. y en caso de que ya exista el modulo deberas preguntar al suario si desea a no crearlo  y si no saltar al siguiente

3 generate-block: primero preguntara por la raiz del proyecto,  con base en el ejemplo anterior del comando antes mencionado este preguntara por la descripcion de un bloque nuevo  y no de todo un sistema, con eso la IA va a crear solo un JSON y va a ejecutar para ese unico JSON el fronend generato y el backend generator script           

4 generate-module: primero preguntara por la raiz del proyecto,  con base en el ejemplo anterior del comando antes mencionado este preguntara por la descripcion de un bloque nuevo  y no de todo un sistema, con eso la IA va a crear solo un JSON y va a ejecutar para ese unico JSON solo el backend generator script    

5 generate-microfrontend: primero preguntara por la raiz del proyecto,  con base en el ejemplo anterior del comando antes mencionado este preguntara por la descripcion de un bloque nuevo  y no de todo un sistema, con eso la IA va a crear solo un JSON y va a ejecutar para ese unico JSON solo el backend generator script    

6 executor:  primero preguntara por la raiz del proyecto,  despues preguntara por la ruta de un archivo JSON de definicion que el usuario pudo haber relizado a mano, y despues preguntara si se va a crear  backen, fronend o los 2  y con base en eso se van a crear los modulos o front end en base a la elecion del usuario por  defaul sera both

7 generate-website-microfrontend:  dejar un TODO para hacer despues


Necesito que las funciones del CLI las separes para que sea mas entendible y que el cLI sea facil de usar  y tenga colores o emiticonos y tambaien que al final actualices el README del CLI para explicar como usarlo  con npm link y sus usos 



  ahora necesito que en el comando  generate-website-microfrontend  primero preguntara por la raiz del proyecto,luego el nombre del mudulo, despues pedira una descripcion de que pantalla desea relizar que tipo de pagina y  en la ruta  <userdefinedpath>/frontend/src/_frontends/website cree la carpeta config.ts 
  y una carpeta views  
  con  <viewnameBootstrap.vue> y  <viewnameFomantic.vue>  y a la IA se le  pasara la descricion de que se desea hacer en esa pantalla  y primero  pedira el codigo VUE3 setup component de la vista de  bootstrap y posteriormente el de  fomantic que deberean ser iguale spero solo cambiando el framework de diseño en este proyecto del cli ./home es una carpeta de ejemplo de como se debe crear los archivos  y la configuracion del nuevo microforntend de  vista 