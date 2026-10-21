/* ========================================== */
/* LÓGICA PRINCIPAL DE WIKIBRAWLER            */
/* ========================================== */

const STORAGE_KEY = 'nexus_characters';
const JSON_SEED_URL = './json/personajes.json';

let currentRenderedList = []; // Guarda la lista actual para las flechas de navegación
let currentDetailId = null;   // ID del personaje abierto en el modal de detalles

// Al iniciar la página, lee el archivo JSON si el navegador está vacío
async function getCharacters() {
    let data = localStorage.getItem(STORAGE_KEY);
    if (data) {
        try {
            return JSON.parse(data);
        } catch (e) {
            console.error("Error al analizar los datos guardados, reiniciando semilla.", e);
            localStorage.removeItem(STORAGE_KEY);
        }
    }

    try {
        const response = await fetch(JSON_SEED_URL);
        if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
        const seedData = await response.json();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(seedData));
        return seedData;
    } catch (error) {
        console.error("No se pudo cargar el archivo JSON de la semilla:", error);
        return [];
    }
}

function saveCharacters(characters) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(characters));
}

// Configuración de temas visuales y fuentes por juego
function getThemeConfig(juego) {
    const themes = {
        'Overwatch': { border: 'theme-overwatch', bg: 'bg-overwatch', badgeFont: 'badge-overwatch' },
        'Super Smash Bros': { border: 'theme-smash', bg: 'bg-smash', badgeFont: 'badge-smash' },
        'Marvel Rivals': { border: 'theme-marvel', bg: 'bg-marvel', badgeFont: 'badge-marvel' },
        'Mortal Kombat': { border: 'theme-mk', bg: 'bg-mk', badgeFont: 'badge-mk' },
        'Deadlock': { border: 'theme-deadlock', bg: 'bg-deadlock', badgeFont: 'badge-deadlock' }
    };
    return themes[juego] || { border: 'theme-custom', bg: 'bg-custom', badgeFont: 'badge-custom' };
}

// Renderizar la cuadrícula de tarjetas de personajes
async function renderGrid(charactersToRender = null) {
    let characters;
    try {
        characters = charactersToRender || await getCharacters();
    } catch (e) {
        console.error("No se pudo renderizar la cuadrícula debido a un error.", e);
        characters = [];
    }
    
    // Blindaje: Asegurar estrictamente que 'characters' sea un array
    if (!Array.isArray(characters)) {
        characters = [];
    }

    // Guardar lista actual para la navegación por flechas en el modal
    currentRenderedList = characters;
    
    const grid = document.getElementById('characterGrid');
    const emptyState = document.getElementById('emptyState');
    const countTag = document.getElementById('resultsCount');

    if (!grid || !countTag || !emptyState) return;

    grid.innerHTML = '';
    countTag.textContent = `${characters.length} Personajes`;
    emptyState.classList.toggle('is-hidden', characters.length > 0);

    characters.forEach(char => {
        const theme = getThemeConfig(char.juego);
        const col = document.createElement('div');
        col.className = 'column is-12-mobile is-6-tablet is-4-desktop';

        // Validar si existe una imagen webp para mostrarla desde la carpeta imagenes/
        const imageContent = char.imagen 
            ? `<img src="./images/${char.imagen}" alt="${char.nombre}" style="width: 100%; height: 100%; object-fit: cover;">`
            : `<i class="fa-solid fa-image fa-4x mb-2"></i><span class="is-size-7">[ Sin Imagen ]</span>`;

        col.innerHTML = `
            <div class="character-card ${theme.border}" onclick="viewDetail('${char.id}')">
                <div class="image-placeholder" style="overflow: hidden;">
                    ${imageContent}
                </div>
                <div class="p-4 card-body-content">
                    <div class="is-flex is-justify-content-space-between is-align-items-center mb-2">
                        <span class="game-badge ${theme.bg} ${theme.badgeFont}">${char.juego}</span>
                        <span class="tag is-dark is-size-7">${char.rol}</span>
                    </div>
                    <h3 class="title-font is-size-4 has-text-white mb-1">${char.nombre}</h3>
                    <p class="is-size-7 has-text-grey-light">${char.origen || 'Origen Desconocido'}</p>
                </div>
            </div>
        `;
        grid.appendChild(col);
    });
}

// Filtrar, buscar y ordenar personajes globalmente
async function handleSearch() {
    const query = document.getElementById('searchInput')?.value.toLowerCase().trim() || '';
    const selectedGame = document.getElementById('gameFilter')?.value;
    const sortOrder = document.getElementById('sortFilter')?.value;
    const allCharacters = await getCharacters();

    let filtered = allCharacters.filter(char => {
        const matchesQuery = !query || 
            (char.nombre && char.nombre.toLowerCase().includes(query)) || 
            (char.juego && char.juego.toLowerCase().includes(query)) || 
            (char.rol && char.rol.toLowerCase().includes(query)) || 
            (char.origen && char.origen.toLowerCase().includes(query));
        
        const matchesGame = !selectedGame || char.juego === selectedGame;
        return matchesQuery && matchesGame;
    });

    if (sortOrder === 'asc') {
        filtered.sort((a, b) => a.nombre.localeCompare(b.nombre));
    } else if (sortOrder === 'desc') {
        filtered.sort((a, b) => b.nombre.localeCompare(a.nombre));
    }

    renderGrid(filtered);
}

// Restablecer todos los filtros y opciones de búsqueda
function resetFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('gameFilter').value = '';
    document.getElementById('sortFilter').value = '';
    renderGrid();
}

// Control de apertura y cierre de modales con animaciones personalizadas
function openModal(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.remove('is-closing');
    el.style.display = 'flex';
    requestAnimationFrame(() => el.classList.add('is-active'));
}

function closeModal(id) {
    const el = document.getElementById(id);
    if (!el) return;
    
    el.classList.add('is-closing');
    el.classList.remove('is-active');

    setTimeout(() => {
        el.classList.remove('is-closing');
        el.style.display = 'none';
    }, 250);
}

// Mostrar la ventana de detalles con la distribución actual
async function viewDetail(id) {
    const characters = await getCharacters();
    const char = characters.find(c => c.id === id);
    if (!char) return alert("Personaje no encontrado.");

    currentDetailId = id;
    updateDetailModalContent(char);
    
    const cardBox = document.getElementById('detailModalCardBox');
    cardBox.className = 'modal-card detail-modal-card';
    
    openModal('detailModal');
}

// Actualizar el contenido de la tarjeta de detalles
function updateDetailModalContent(char) {
    const theme = getThemeConfig(char.juego);
    document.getElementById('detailName').textContent = char.nombre;
    document.getElementById('detailOrigin').textContent = char.origen || 'No especificado';
    document.getElementById('detailId').textContent = char.id;
    document.getElementById('detailDescription').textContent = char.descripcion || 'Sin descripción disponible.';
    document.getElementById('detailClassBadge').textContent = char.rol;

    const badge = document.getElementById('detailBadge');
    badge.textContent = char.juego;
    badge.className = `game-badge ${theme.bg} ${theme.badgeFont}`;

    const imgTag = document.getElementById('detailImgTag');
    const placeholderIcon = document.getElementById('detailPlaceholderIcon');

    if (char.imagen) {
        // Construye la ruta de la variante -close basada en la imagen principal (-portrait)
        const imagenClose = char.imagen.replace('-portrait.webp', '-close.webp');
        
        imgTag.style.display = 'block';
        placeholderIcon.style.display = 'none';

        // Intenta cargar la variante -close; si falla, recurre a la imagen principal (-portrait)
        imgTag.onerror = function() {
            imgTag.src = `./images/${char.imagen}`;
            imgTag.onerror = null; // Evita bucles infinitos si tampoco encuentra la principal
        };

        imgTag.src = `./images/${imagenClose}`;
    } else {
        imgTag.src = '';
        imgTag.style.display = 'none';
        placeholderIcon.style.display = 'flex';
    }

    document.getElementById('btnEditFromDetail').onclick = () => { closeModal('detailModal'); openEditModal(char.id); };
    document.getElementById('btnDeleteFromDetail').onclick = () => { closeModal('detailModal'); deleteCharacter(char.id); };
}

// Navegar entre personajes mediante flechas laterales con animación de deslizamiento
function navigateDetail(direction) {
    if (!currentDetailId || currentRenderedList.length === 0) return;
    
    const currentIndex = currentRenderedList.findIndex(c => c.id === currentDetailId);
    if (currentIndex === -1) return;

    let newIndex = currentIndex + direction;
    if (newIndex < 0) {
        newIndex = currentRenderedList.length - 1;
    } else if (newIndex >= currentRenderedList.length) {
        newIndex = 0;
    }

    const nextChar = currentRenderedList[newIndex];
    if (nextChar) {
        const cardBox = document.getElementById('detailModalCardBox');
        const outAnim = direction > 0 ? 'slide-out-left' : 'slide-out-right';
        const inAnim = direction > 0 ? 'slide-in-right' : 'slide-in-left';

        cardBox.className = `modal-card detail-modal-card ${outAnim}`;

        setTimeout(() => {
            currentDetailId = nextChar.id;
            updateDetailModalContent(nextChar);
            cardBox.className = `modal-card detail-modal-card ${inAnim}`;
            
            setTimeout(() => {
                cardBox.className = 'modal-card detail-modal-card';
            }, 300);
        }, 280);
    }
}

// Abrir modal de creación
function openCreateModal() {
    document.getElementById('formModalTitle').textContent = 'Agregar Nuevo Personaje';
    document.getElementById('characterForm').reset();
    document.getElementById('characterId').value = '';
    openModal('formModal');
}

// Abrir modal de edición
async function openEditModal(id) {
    const characters = await getCharacters();
    const char = characters.find(c => c.id === id);
    if (!char) return alert("Personaje no encontrado.");

    document.getElementById('formModalTitle').textContent = 'Editar Personaje';
    document.getElementById('characterId').value = char.id;
    document.getElementById('inputNombre').value = char.nombre;
    document.getElementById('inputJuego').value = char.juego;
    document.getElementById('inputRol').value = char.rol;
    document.getElementById('inputOrigen').value = char.origen || '';
    document.getElementById('inputDescripcion').value = char.descripcion || '';
    document.getElementById('inputImagen').value = char.imagen || '';

    openModal('formModal');
}

// Procesar formulario de creación o edición
async function handleFormSubmit(event) {
    event.preventDefault();

    const id = document.getElementById('characterId').value;
    const nombre = document.getElementById('inputNombre').value.trim();
    const juego = document.getElementById('inputJuego').value;
    const rol = document.getElementById('inputRol').value.trim();
    const origen = document.getElementById('inputOrigen').value.trim();
    const descripcion = document.getElementById('inputDescripcion').value.trim();
    const imagen = document.getElementById('inputImagen').value.trim();

    if (!nombre || !rol || !juego) return alert('Por favor, complete los campos obligatorios.');

    let characters = await getCharacters();

    if (id) {
        characters = characters.map(c => c.id === id ? { ...c, nombre, juego, rol, origen, descripcion, imagen } : c);
    } else {
        const newChar = { id: Date.now().toString(), nombre, juego, rol, origen, descripcion, imagen };
        characters.unshift(newChar);
    }

    saveCharacters(characters);
    closeModal('formModal');
    renderGrid();
}

// Eliminar personaje
async function deleteCharacter(id) {
    if (!id || !confirm('¿Está seguro de eliminar este personaje?')) return;
    let characters = await getCharacters();
    const updated = characters.filter(c => c.id !== id);
    saveCharacters(updated);
    renderGrid();
}

// Inicializar aplicación al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    renderGrid();
});