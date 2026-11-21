'use client'
import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { ApiStore } from '@/lib/stores'
import { retailerById } from '@/lib/retailers'
import { theme } from '@/app/mapdisplay/theme'
import { distanceKm } from '@/lib/geo'
import { start } from 'repl'

const apiKey = process.env.NEXT_PUBLIC_CARTO_API;
const START_ZOOM = 14; //arbitrary
//const DEFAULT_RADIUS_KM = 2;

function getIsDark() {
    return document.documentElement.getAttribute('data-theme') === 'dark' ||
        (document.documentElement.getAttribute('data-theme') !== 'light' &&
            window.matchMedia?.('(prefers-color-scheme: dark)').matches);
}

function tileUrlFor(isDark: boolean) {
    const tileSet = isDark ? 'dark_all' : 'rastertiles/voyager';
    return `https://{s}.basemaps.cartocdn.com/${tileSet}/{z}/{x}/{y}{r}.png?key=${apiKey}`;
}

interface Props {
    stores: ApiStore[];
    selectedIds: string[];
    onToggle: (id: string) => void;
    startCoords: { lat: number; lng: number} | null;
    radiusKm: number;
}

function createHomeMarker(lat: number, lng: number, col: string) { 
    const circle = L.circleMarker([lat, lng], {
        fillColor: col,
        color: theme.colours.kcGreenDark,
        fillOpacity: 1.0,
        radius: 12
    });

    const icon = L.divIcon({
        html: `<svg xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                width="14" 
                height="14" 
                fill="${theme.colours.kcCreamLight}">
                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
                </svg>`,
        className: "home-icon",
        iconSize: [14, 14],
        iconAnchor: [7, 7]
    });

    const marker = L.marker([lat, lng], {
        icon,
        interactive: false
    });

    return L.layerGroup([circle, marker]);
}

function storeIcon(colour: string, selected: boolean, isDark: boolean, inRadius: boolean) {
    const size = 20;
    const unselectedFill = isDark ? '#666666' : theme.colours.kcCreamLight;
    const tick = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="12" height="12" fill="${theme.colours.kcCreamLight}"><path d="M9 16.2l-3.5-3.5L4 14.2 9 19.2 20 8.2l-1.5-1.5z"/></svg>`;
    return L.divIcon({
        html: `<div style="
            width:${size}px; height:${size}px; border-radius:50%;
            display:flex; align-items:center; justify-content:center;
            background:${selected ? colour : unselectedFill};
            border:2px solid ${colour};
            box-shadow:0 1px 3px rgba(0,0,0,0.3);
            opacity:${selected ? 1 : inRadius ? 1 : 0.45};
        ">${selected ? tick : ''}</div>`,
        className: '',
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
    })
}

function isWithinRadius(store: ApiStore, startCoords: { lat: number; lng: number} | null, radiusKm: number): boolean {
    if (!startCoords || store.latitude == null || store.longitude == null) return true;
    return distanceKm(startCoords, { lat: store.latitude, lng: store.longitude}) <= radiusKm;
}

export default function StoreMap({ stores, selectedIds, onToggle, startCoords, radiusKm }: Props) {
    const [isDark, setIsDark] = useState(() => getIsDark());
    const mapRef = useRef<L.Map | null>(null);
    const tileLayerRef = useRef<L.TileLayer | null>(null);
    const markersRef = useRef<Record<string, L.Marker>>({});
    const homeMarkerRef = useRef<L.LayerGroup | null>(null);
    const circleRef = useRef<L.Circle | null>(null);
    const onToggleRef = useRef(onToggle);
    onToggleRef.current = onToggle;

    useEffect(() => {
        const withCoords = stores.filter((store) => {
            return store.latitude != null && store.longitude != null;
        });

        if (withCoords.length === 0) return;

        const map = L.map('store-map');
        mapRef.current = map;
        const tileLayer = L.tileLayer(tileUrlFor(getIsDark()), {
            maxZoom: 18,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attributions">CARTO</a>'
        }).addTo(map);
        tileLayerRef.current = tileLayer;

        const markers: Record<string, L.Marker> = {};
        withCoords.forEach((store) => {
            const colour = retailerById(store.retailer).color;
            const marker = L.marker([store.latitude, store.longitude], {
                icon: storeIcon(colour, selectedIds.includes(store.id), isDark, isWithinRadius(store, startCoords, radiusKm)),
            });
            marker.on('click', () => onToggleRef.current(store.id));
            marker.addTo(map);
            markers[store.id] = marker;
        });
        markersRef.current = markers;
        
        if (startCoords) {
            const homeMarker = createHomeMarker(startCoords.lat, startCoords.lng, theme.colours.kcGreenLight);
            homeMarker.addTo(map);
            homeMarkerRef.current = homeMarker;
            map.setView([startCoords.lat, startCoords.lng], START_ZOOM);
        } else {
            map.fitBounds(
                L.latLngBounds(withCoords.map((s): L.LatLngExpression => [s.latitude, s.longitude])),
                { padding: [36, 36], maxZoom: 15 }
            );
        }

        return () => {
            map.remove();
            mapRef.current = null;
            tileLayerRef.current = null;
            markersRef.current = {};
            homeMarkerRef.current = null;
            circleRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [stores]);

    useEffect(() => {
        const map = mapRef.current;
        if (!map || !startCoords) return;
        map.setView([startCoords.lat, startCoords.lng], START_ZOOM);

        if (homeMarkerRef.current) {
            map.removeLayer(homeMarkerRef.current);
        }
        const homeMarker = createHomeMarker(startCoords.lat, startCoords.lng, theme.colours.kcGreenLight);
        homeMarker.addTo(map);
        homeMarkerRef.current = homeMarker;
    }, [startCoords]);

    useEffect(() => {
        stores.forEach((store) => {
            const marker = markersRef.current[store.id];
            if (!marker) return;
            marker.setIcon(storeIcon(retailerById(store.retailer).color, selectedIds.includes(store.id), isDark, isWithinRadius(store, startCoords, radiusKm)));
        });
    }, [selectedIds, stores, isDark, startCoords, radiusKm]);

    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        circleRef.current?.remove();
        circleRef.current = null;
        if (!startCoords) return;

        circleRef.current = L.circle([startCoords.lat, startCoords.lng], {
            radius: radiusKm * 1000,
            color: theme.colours.kcGreenLight,
            weight: 2,
            fillColor: theme.colours.kcGreenLight,
            fillOpacity: 0.12,
        }).addTo(map);
    }, [startCoords, radiusKm]);

    useEffect(() => {
        const updateTheme = () => {
            tileLayerRef.current?.setUrl(tileUrlFor(getIsDark()));
            setIsDark(getIsDark());
        };
        const observer = new MutationObserver(updateTheme);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
        const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
        mq?.addEventListener('change', updateTheme);
        return () => {
            observer.disconnect();
            mq?.removeEventListener('change', updateTheme);
        };
    }, []);

    return <div id="store-map" style={{ height: '100%', width: '100%', zIndex: 0 }}></div>;
}
