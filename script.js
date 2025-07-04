// Variáveis globais
let map;
let currentBasemap = 'osm';
let layers = {};
let isFullscreen = false;

// Configuração dos mapas de fundo (apenas 3)
const basemaps = {
    osm: {
        name: 'OpenStreetMap',
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    },
    satellite: {
        name: 'Satélite',
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attribution: '© Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
        maxZoom: 19
    },
    topo: {
        name: 'Topográfico',
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
        attribution: '© Esri — Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012',
        maxZoom: 19
    }
};

// Inicialização do mapa
function initMap() {
    console.log('Inicializando mapa...');
    
    // Criar o mapa sem nenhum basemap ativo inicialmente
    map = L.map('map', {
        center: [-15.7801, -47.9292], // Brasília, Brasil
        zoom: 5,
        zoomControl: false, // Desabilitar controles padrão do Leaflet
        attributionControl: true
    });

    console.log('Mapa criado:', map);

    // Adicionar controles de zoom personalizados
    L.control.zoom({
        position: 'bottomright'
    }).addTo(map);

    // Adicionar controle de escala
    L.control.scale({
        position: 'bottomleft',
        metric: true,
        imperial: false
    }).addTo(map);

    // Adicionar todos os basemaps marcados por padrão
    addInitialBasemaps();

    // Event listeners
    setupEventListeners();
    
    // Carregar camadas GeoJSON
    loadGeoJSONLayers();
    
    console.log('WebGIS inicializado com sucesso!');
}

function addInitialBasemaps() {
    document.querySelectorAll('.basemap-checkbox').forEach(cb => {
        if (cb.checked) {
            addBasemap(cb.dataset.basemap);
        }
    });
}

// Adicionar/remover basemap
function addBasemap(basemapKey) {
    const basemap = basemaps[basemapKey];
    if (basemap) {
        if (!layers[basemapKey]) {
            layers[basemapKey] = L.tileLayer(basemap.url, {
                attribution: basemap.attribution,
                maxZoom: basemap.maxZoom
            });
        }
        if (!map.hasLayer(layers[basemapKey])) {
            layers[basemapKey].addTo(map);
        }
        // Re-adiciona as camadas de dados para garantir que fiquem acima
        bringDataLayersToFront();
    }
}

function removeBasemap(basemapKey) {
    if (layers[basemapKey] && map.hasLayer(layers[basemapKey])) {
        map.removeLayer(layers[basemapKey]);
        // Re-adiciona as camadas de dados para garantir que fiquem acima
        bringDataLayersToFront();
    }
}

function bringDataLayersToFront() {
    if (layers.limiteTotal && map.hasLayer(layers.limiteTotal)) {
        layers.limiteTotal.bringToFront();
    }
    if (layers.limiteZonas && map.hasLayer(layers.limiteZonas)) {
        layers.limiteZonas.bringToFront();
    }
    if (layers.pontos && map.hasLayer(layers.pontos)) {
        layers.pontos.bringToFront();
    }
}

// Configurar event listeners
function setupEventListeners() {
    console.log('Configurando event listeners...');
    
    // Controles de mapa de fundo (checkboxes)
    document.querySelectorAll('.basemap-checkbox').forEach(cb => {
        cb.addEventListener('change', function() {
            if (this.checked) {
                addBasemap(this.dataset.basemap);
            } else {
                removeBasemap(this.dataset.basemap);
            }
        });
    });

    // Controles de camadas
    document.getElementById('layer-limite-total').addEventListener('change', function() {
        if (this.checked) {
            if (layers.limiteTotal) map.addLayer(layers.limiteTotal);
        } else {
            if (layers.limiteTotal) map.removeLayer(layers.limiteTotal);
        }
    });
    // Event listeners individuais para cada zona
    document.getElementById('layer-zona-sisal').addEventListener('change', function() {
        if (this.checked) {
            if (layers['zona-sisal']) map.addLayer(layers['zona-sisal']);
        } else {
            if (layers['zona-sisal']) map.removeLayer(layers['zona-sisal']);
        }
    });
    document.getElementById('layer-zona-baixo-sul').addEventListener('change', function() {
        if (this.checked) {
            if (layers['zona-baixo-sul']) map.addLayer(layers['zona-baixo-sul']);
        } else {
            if (layers['zona-baixo-sul']) map.removeLayer(layers['zona-baixo-sul']);
        }
    });
    document.getElementById('layer-zona-vale-jiquirica').addEventListener('change', function() {
        if (this.checked) {
            if (layers['zona-vale-do-jiquirica']) map.addLayer(layers['zona-vale-do-jiquirica']);
        } else {
            if (layers['zona-vale-do-jiquirica']) map.removeLayer(layers['zona-vale-do-jiquirica']);
        }
    });
    document.getElementById('layer-zona-piemonte-paraguacu').addEventListener('change', function() {
        if (this.checked) {
            if (layers['zona-piemonte-do-paraguacu']) map.addLayer(layers['zona-piemonte-do-paraguacu']);
        } else {
            if (layers['zona-piemonte-do-paraguacu']) map.removeLayer(layers['zona-piemonte-do-paraguacu']);
        }
    });
    document.getElementById('layer-zona-bacia-jacuipe').addEventListener('change', function() {
        if (this.checked) {
            if (layers['zona-bacia-do-jacuipe']) map.addLayer(layers['zona-bacia-do-jacuipe']);
        } else {
            if (layers['zona-bacia-do-jacuipe']) map.removeLayer(layers['zona-bacia-do-jacuipe']);
        }
    });
    document.getElementById('layer-zona-litoral-norte').addEventListener('change', function() {
        if (this.checked) {
            if (layers['zona-litoral-norte-e-agreste-baiano']) map.addLayer(layers['zona-litoral-norte-e-agreste-baiano']);
        } else {
            if (layers['zona-litoral-norte-e-agreste-baiano']) map.removeLayer(layers['zona-litoral-norte-e-agreste-baiano']);
        }
    });
    document.getElementById('layer-zona-portal-sertao').addEventListener('change', function() {
        if (this.checked) {
            if (layers['zona-portal-do-sertao']) map.addLayer(layers['zona-portal-do-sertao']);
        } else {
            if (layers['zona-portal-do-sertao']) map.removeLayer(layers['zona-portal-do-sertao']);
        }
    });
    document.getElementById('layer-zona-reconcavo').addEventListener('change', function() {
        if (this.checked) {
            if (layers['zona-reconcavo']) map.addLayer(layers['zona-reconcavo']);
        } else {
            if (layers['zona-reconcavo']) map.removeLayer(layers['zona-reconcavo']);
        }
    });
    document.getElementById('layer-zona-medio-rio-contas').addEventListener('change', function() {
        if (this.checked) {
            if (layers['zona-medio-rio-de-contas']) map.addLayer(layers['zona-medio-rio-de-contas']);
        } else {
            if (layers['zona-medio-rio-de-contas']) map.removeLayer(layers['zona-medio-rio-de-contas']);
        }
    });
    document.getElementById('layer-zona-metropolitano-salvador').addEventListener('change', function() {
        if (this.checked) {
            if (layers['zona-metropolitano-de-salvador']) map.addLayer(layers['zona-metropolitano-de-salvador']);
        } else {
            if (layers['zona-metropolitano-de-salvador']) map.removeLayer(layers['zona-metropolitano-de-salvador']);
        }
    });
    document.getElementById('layer-pontos').addEventListener('change', function() {
        console.log('Evento de mudança na camada pontos:', this.checked);
        if (this.checked) {
            if (layers.pontos) map.addLayer(layers.pontos);
        } else {
            if (layers.pontos) map.removeLayer(layers.pontos);
        }
    });

    // Controle separado para rótulos dos pontos
    document.getElementById('layer-pontos-labels').addEventListener('change', function() {
        console.log('Evento de mudança nos rótulos dos pontos:', this.checked);
        if (this.checked) {
            // Adicionar rótulos dos pontos
            if (layers.pointLabels) {
                console.log('Adicionando', layers.pointLabels.length, 'rótulos dos pontos');
                layers.pointLabels.forEach(label => {
                    if (!map.hasLayer(label)) map.addLayer(label);
                });
            } else {
                console.log('Nenhum rótulo de ponto encontrado em layers.pointLabels');
            }
        } else {
            // Remover rótulos dos pontos
            if (layers.pointLabels) {
                console.log('Removendo', layers.pointLabels.length, 'rótulos dos pontos');
                layers.pointLabels.forEach(label => {
                    if (map.hasLayer(label)) map.removeLayer(label);
                });
            }
        }
    });

    // Controles do mapa
    document.getElementById('zoom-in').addEventListener('click', function() {
        map.zoomIn();
    });

    document.getElementById('zoom-out').addEventListener('click', function() {
        map.zoomOut();
    });

    document.getElementById('home-btn').addEventListener('click', function() {
        // Retornar à visualização inicial (Brasília)
        map.setView([-15.7801, -47.9292], 5);
    });

    // Botão de tela cheia
    document.getElementById('fullscreen-btn').addEventListener('click', function() {
        toggleFullscreen();
    });

    // Eventos do mapa
    map.on('mousemove', function(e) {
        const lat = e.latlng.lat.toFixed(6);
        const lng = e.latlng.lng.toFixed(6);
        document.getElementById('coordinates').textContent = `${lat}, ${lng}`;
    });

    map.on('zoomend', function() {
        const zoom = map.getZoom();
        document.getElementById('zoom-level').textContent = zoom;
        
        // Calcular escala aproximada
        const scale = calculateScale(zoom);
        document.getElementById('scale').textContent = scale;
    });

    // Evento de clique no mapa
    map.on('click', function(e) {
        const lat = e.latlng.lat.toFixed(6);
        const lng = e.latlng.lng.toFixed(6);
        document.getElementById('coordinates').textContent = `${lat}, ${lng}`;
    });
    
    console.log('Event listeners configurados!');
}

// Calcular escala aproximada
function calculateScale(zoom) {
    const scales = {
        1: '1:500000000',
        2: '1:250000000',
        3: '1:150000000',
        4: '1:70000000',
        5: '1:35000000',
        6: '1:15000000',
        7: '1:10000000',
        8: '1:4000000',
        9: '1:2000000',
        10: '1:1000000',
        11: '1:400000',
        12: '1:200000',
        13: '1:100000',
        14: '1:50000',
        15: '1:25000',
        16: '1:12000',
        17: '1:6000',
        18: '1:3000',
        19: '1:1500'
    };
    
    return scales[zoom] || '1:1000000';
}

// Toggle tela cheia
function toggleFullscreen() {
    const container = document.querySelector('.container');
    
    if (!isFullscreen) {
        container.classList.add('fullscreen');
        document.getElementById('fullscreen-btn').innerHTML = '<i class="fas fa-compress"></i> Sair da Tela Cheia';
        isFullscreen = true;
    } else {
        container.classList.remove('fullscreen');
        document.getElementById('fullscreen-btn').innerHTML = '<i class="fas fa-expand"></i> Tela Cheia';
        isFullscreen = false;
    }
    
    // Redimensionar mapa
    setTimeout(() => {
        map.invalidateSize();
    }, 100);
}

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM carregado, inicializando WebGIS...');
    initMap();
});

// Função para exportar dados (opcional)
function exportData() {
    console.log('Função de exportação não implementada');
}

// Função para imprimir mapa (opcional)
function printMap() {
    window.print();
}

// Controle de carregamento das camadas para garantir que hideAllExceptLimiteTotalAndSatelite só rode após todas carregarem
let loadedLimiteTotal = false;
let loadedLimiteZonas = false;
let loadedPontos = false;
function tryHideAllExceptLimiteTotalAndSatelite() {
    if (loadedLimiteTotal && loadedLimiteZonas && loadedPontos) {
        hideAllExceptLimiteTotalAndSatelite();
    }
}

// Carregar camadas GeoJSON
function loadGeoJSONLayers() {
    // Limite Total
    fetch('data/tcl_limite_total.geojson')
        .then(resp => {
            if (!resp.ok) throw new Error('Erro ao carregar tcl_limite_total.geojson: ' + resp.status);
            return resp.json();
        })
        .then(data => {
            layers.limiteTotal = L.geoJSON(data, {
                style: {
                    color: '#ff0000', // vermelho
                    weight: 3,
                    opacity: 1,
                    fillColor: '#ff0000',
                    fillOpacity: 0 // totalmente transparente
                },
                onEachFeature: function(feature, layer) {
                    if (feature.properties) {
                        layer.bindPopup(`
                            <div class='popup-content'>
                                <h4>Limite Total</h4>
                                <pre>${JSON.stringify(feature.properties, null, 2)}</pre>
                            </div>
                        `);
                    }
                }
            }).addTo(map);
            bringDataLayersToFront();
            loadedLimiteTotal = true;
            tryHideAllExceptLimiteTotalAndSatelite();
            // Ajustar zoom para mostrar o limite total
            if (data.features && data.features.length > 0) {
                map.fitBounds(layers.limiteTotal.getBounds(), { padding: [0, 0] });
            }
        })
        .catch(err => {
            console.error('Erro ao carregar Limite Total:', err);
            alert('Erro ao carregar Limite Total: ' + err.message);
        });

    // Limite Zonas
    fetch('data/tcl_limite_zonas.geojson')
        .then(resp => {
            if (!resp.ok) throw new Error('Erro ao carregar tcl_limite_zonas.geojson: ' + resp.status);
            return resp.json();
        })
        .then(data => {
            // Agrupar features por NM_TI
            const zonasPorNome = {};
            data.features.forEach(feature => {
                const nmTi = feature.properties.NM_TI;
                if (!zonasPorNome[nmTi]) {
                    zonasPorNome[nmTi] = [];
                }
                zonasPorNome[nmTi].push(feature);
            });
            // Criar layer group para cada zona
            Object.keys(zonasPorNome).forEach(nmTi => {
                const zonaId = nmTi.toLowerCase()
                    .replace(/\s+/g, '-')
                    .replace(/[çã]/g, 'c')
                    .replace(/[áàâ]/g, 'a')
                    .replace(/[éèê]/g, 'e')
                    .replace(/[íìî]/g, 'i')
                    .replace(/[óòô]/g, 'o')
                    .replace(/[úùû]/g, 'u');
                const layerGroup = L.layerGroup();
                zonasPorNome[nmTi].forEach(feature => {
                    const layer = L.geoJSON(feature, {
                        style: {
                            color: '#000000',
                            weight: 2,
                            opacity: 1,
                            fillColor: '#000000',
                            fillOpacity: 0
                        },
                        onEachFeature: function(feature, layer) {
                            if (feature.properties) {
                                // Adicionar popup
                                layer.bindPopup(`
                                    <div class='popup-content'>
                                        <h4>Limite Zona</h4>
                                        <p><strong>NM_TI:</strong> ${feature.properties.NM_TI || 'N/A'}</p>
                                        <pre>${JSON.stringify(feature.properties, null, 2)}</pre>
                                    </div>
                                `);
                                // Adicionar rótulo com NM_TI
                                if (feature.properties.NM_TI) {
                                    const center = layer.getBounds().getCenter();
                                    const label = L.marker(center, {
                                        icon: L.divIcon({
                                            className: 'zone-label',
                                            html: `<div style=\"padding: 2px 6px; font-size: 12px; font-weight: bold; color: #fff;\">${feature.properties.NM_TI}</div>`,
                                            iconSize: [100, 20],
                                            iconAnchor: [50, 10]
                                        })
                                    });
                                    layerGroup.addLayer(label);
                                }
                            }
                        }
                    });
                    layerGroup.addLayer(layer);
                });
                // Armazenar o layer group
                layers[`zona-${zonaId}`] = layerGroup;
                layerGroup.addTo(map);
            });
            bringDataLayersToFront();
            loadedLimiteZonas = true;
            tryHideAllExceptLimiteTotalAndSatelite();
        })
        .catch(err => {
            console.error('Erro ao carregar Limite Zonas:', err);
            alert('Erro ao carregar Limite Zonas: ' + err.message);
        });

    // Pontos
    fetch('data/pontos_tcl.geojson')
        .then(resp => {
            if (!resp.ok) throw new Error('Erro ao carregar pontos_tcl.geojson: ' + resp.status);
            return resp.json();
        })
        .then(data => {
            layers.pontos = L.geoJSON(data, {
                pointToLayer: function(feature, latlng) {
                    return L.circleMarker(latlng, {
                        radius: 4,
                        fillColor: '#ff0000',
                        color: 'transparent',
                        weight: 0,
                        opacity: 1,
                        fillOpacity: 0.8
                    });
                },
                onEachFeature: function(feature, layer) {
                    if (feature.properties) {
                        layer.bindPopup(`
                            <div class='popup-content'>
                                <h4>Ponto</h4>
                                <pre>${JSON.stringify(feature.properties, null, 2)}</pre>
                            </div>
                        `);
                        // Adicionar rótulo com código
                        if (feature.properties.Codigo) {
                            const label = L.marker(layer.getLatLng(), {
                                icon: L.divIcon({
                                    className: 'point-label',
                                    html: `<div style=\"padding: 2px 4px; font-size: 10px; font-weight: bold; color: #000;\">${feature.properties.Codigo}</div>`,
                                    iconSize: [80, 16],
                                    iconAnchor: [40, 20]
                                })
                            });
                            if (!layers.pointLabels) layers.pointLabels = [];
                            layers.pointLabels.push(label);
                        }
                    }
                }
            }).addTo(map);
            bringDataLayersToFront();
            loadedPontos = true;
            tryHideAllExceptLimiteTotalAndSatelite();
        })
        .catch(err => {
            console.error('Erro ao carregar Pontos:', err);
            alert('Erro ao carregar Pontos: ' + err.message);
        });
}

// Após carregar todas as camadas, remova todas as camadas do mapa que não sejam Limite Total e Satélite
function hideAllExceptLimiteTotalAndSatelite() {
    // Basemaps
    Object.keys(layers).forEach(key => {
        if (key !== 'satellite' && key !== 'limiteTotal') {
            if (map.hasLayer(layers[key])) {
                map.removeLayer(layers[key]);
            }
        }
    });
    // Zonas
    Object.keys(layers).forEach(key => {
        if (key.startsWith('zona-')) {
            if (map.hasLayer(layers[key])) {
                map.removeLayer(layers[key]);
            }
        }
    });
    // Pontos
    if (layers.pontos && map.hasLayer(layers.pontos)) {
        map.removeLayer(layers.pontos);
    }
    // Rótulos dos pontos
    if (layers.pointLabels) {
        layers.pointLabels.forEach(label => {
            if (map.hasLayer(label)) map.removeLayer(label);
        });
    }
}

L.tileLayer('https://tiles.opendem.info/tiles/asterh/{z}/{x}/{y}.png', {
    attribution: 'ASTER GDEM, OpenDEM',
    maxZoom: 15
}).addTo(map); 