# 💈 Adam Barber Club

Bienvenido al repositorio oficial de **Adam Barber Club**. Este proyecto es una plataforma web diseñada para gestionar la presencia digital de la barbería, permitiendo a los clientes conocer los servicios y gestionar sus citas de manera sencilla y eficiente.

## 📝 Descripción del Proyecto

Adam Barber Club es una aplicación web moderna y responsiva que ofrece una experiencia de usuario optimizada para el agendamiento de turnos. El objetivo principal es brindar una interfaz profesional donde los clientes puedan visualizar la disponibilidad y reservar sus citas sin complicaciones.

### Características Principales:
- **Interfaz Responsiva**: Adaptable a dispositivos móviles, tablets y computadoras.
- **Sistema de Reservas**: Flujo intuitivo para la selección de servicios y horarios.
- **Diseño Profesional**: Estética alineada con la imagen de marca de una barbería de alta calidad.

> **Nota Técnica**: El sistema de reservas utiliza `localStorage` para realizar pruebas de disponibilidad de forma local. Esto permite simular la gestión de turnos en el navegador del usuario sin necesidad de una base de datos externa durante la fase de despliegue inicial.

---

## 🚀 Guía de Inicio para Principiantes

Si eres nuevo en el desarrollo web y quieres desplegar este proyecto en la web, sigue estos pasos detallados para subir tu sitio a GitHub y activarlo mediante GitHub Pages.

### 1. Crear una cuenta en GitHub
1. Visita [github.com](https://github.com/).
2. Haz clic en el botón **Sign up** (Registrarse).
3. Sigue las instrucciones: introduce tu correo electrónico, crea una contraseña y elige un nombre de usuario.
4. Verifica tu cuenta a través del correo electrónico que recibirás.

### 2. Crear un nuevo repositorio
1. Una vez iniciada la sesión, haz clic en el icono **+** en la esquina superior derecha y selecciona **New repository**.
2. En **Repository name**, escribe el nombre de tu proyecto (por ejemplo: `adam-barber-club`).
3. Asegúrate de que el repositorio esté configurado como **Public**.
4. Haz clic en el botón **Create repository**.

### 3. Subir los archivos del proyecto
Tienes dos formas de hacer esto:

#### Opción A: Carga Directa (Sencilla)
1. En la pantalla principal de tu repositorio recién creado, busca la frase *"uploading an existing file"*.
2. Arrastra y suelta todos los archivos y carpetas de tu proyecto localmente hacia la ventana del navegador.
3. Escribe un mensaje de commit (ej. "Subiendo archivos iniciales") y haz clic en **Commit changes**.

#### Opción B: Usando Git (Recomendada para desarrolladores)
1. Abre una terminal en la carpeta de tu proyecto.
2. Inicializa el repositorio: `git init`
3. Agrega los archivos: ` add .`
4. Crea el primer commit: `git commit -m "Primer commit"`
5. Vincula tu repositorio local con GitHub (copia la URL de tu repo):
   `git remote add origin https://github.com/TU_USUARIO/adam-barber-club.git`
6. Sube los archivos: `git push -u origin main`

### 4. Activar GitHub Pages
Para que tu sitio sea visible para todo el mundo en una URL pública:
1. Ve a la pestaña **Settings** (Configuración) de tu repositorio en GitHub.
2. En el menú lateral izquierdo, haz clic en **Pages**.
3. En la sección **Build and deployment** $\rightarrow$ **Branch**, selecciona la rama `main` (o `master`) y la carpeta `/(root)`.
4. Haz clic en **Save**.
5. Espera unos minutos y GitHub te proporcionará la URL donde podrás ver tu sitio web en vivo.

---

© 2026 Adam Barber Club. Todos los derechos reservados.
git