'use client'
import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Route, Stop, Location } from './types'
import {theme} from './theme'
import { retailerById } from '@/lib/retailers'

const apiKey = process.env.NEXT_PUBLIC_CARTO_API;

function getIsDark() {
    return document.documentElement.getAttribute('data-theme') === 'dark' ||
        (document.documentElement.getAttribute('data-theme') !== 'light' &&
            window.matchMedia?.('(prefers-color-scheme: dark)').matches);
}

function tileUrlFor(isDark: boolean) {
    const tileSet = isDark ? 'dark_all' : 'rastertiles/voyager';
    return `https://{s}.basemaps.cartocdn.com/${tileSet}/{z}/{x}/{y}{r}.png?key=${apiKey}`;
}

export default function Map({route, start, stops}: {route : Route, start: Location, stops : Stop[]}) {
    const tileLayerRef = useRef<L.TileLayer | null>(null);

    useEffect(() => {
        // Guards
        if (!route || !start) return;
        // Set up. No initial view here, fitBounds below sizes the map to
        // the actual route instead of a fixed coordinate every time.
        const map = L.map('map');

        const tileLayer = L.tileLayer(tileUrlFor(getIsDark()), {
            maxZoom: 18, //arbitrary
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attributions">CARTO</a>' // exactly what was suggested from CARTO
        }).addTo(map);
        tileLayerRef.current = tileLayer;

        // Draw polylines
        route.legs.forEach((leg) => {
            L.polyline(leg.coords, {
                color: theme.colours.kcGreenLight,
                weight: 4,
                opacity: 1
            }).addTo(map);
        });

        // Draw start marker
        createHomeMarker(start.lat, start.lng, theme.colours.kcGreenLight).addTo(map);

        // Draw stop markers
        stops.forEach((stop, index) => {
            createNumberedMarker(stop.lat, stop.lng, retailerById(stop.retailer).color, index + 1).addTo(map);
        });

        // Frame the whole route (start, every stop, and the actual driven
        // path) instead of a fixed zoom on a fixed point, so a trip across
        // town is fully visible and a short local trip isn't zoomed out
        // to nothing.
        const boundsPoints: L.LatLngExpression[] = [
            [start.lat, start.lng],
            ...stops.map((stop): L.LatLngExpression => [stop.lat, stop.lng]),
            ...route.legs.flatMap((leg) => leg.coords as L.LatLngExpression[]),
        ];
        if (boundsPoints.length > 0) {
            map.fitBounds(L.latLngBounds(boundsPoints), { padding: [36, 36], maxZoom: 16 });
        } else {
            map.setView([start.lat, start.lng], 14);
        }

        // Clean up
        return () => { map.remove(); tileLayerRef.current = null; }
    }, [route, start, stops]);

    // Keep tiles in sync with theme changes without rebuilding the map
    useEffect(() => {
        const updateTiles = () => {
            tileLayerRef.current?.setUrl(tileUrlFor(getIsDark()));
        };

        const observer = new MutationObserver(updateTiles);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

        // Covers OS-level scheme changes for users who haven't set data-theme explicitly
        const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
        mq?.addEventListener('change', updateTiles);

        return () => {
            observer.disconnect();
            mq?.removeEventListener('change', updateTiles);
        };
    }, []);

    return <div id="map" style={{ height: '100%', width: '100%', zIndex: 0 }}></div>
}

function createCircleMarker(lat: number, lng: number, col: string) {
    return L.circleMarker([lat, lng], {
        fillColor: col,
        color: theme.colours.kcGreenDark,
        fillOpacity: 1.0,
        radius: 12
    });
}

function createHomeMarker(lat: number, lng: number, col: string) { 
    const circle = createCircleMarker(lat, lng, col);
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

function createNumberedMarker(lat: number, lng: number, col: string, num: number) {
    const circle = createCircleMarker(lat, lng, col);
    const icon = L.divIcon({
        html: `<div style="
                width: 14px; height: 14px;
                display: flex; align-items: center; justify-content: center;
                "><span style="
                color: ${theme.colours.kcCreamLight};
                font-size: 11px; font-weight: bold; line-height: 1;
                ">${num}</span></div>`,
        className: "",
        iconSize: [14, 14],
        iconAnchor: [7, 7]
    });

    const marker = L.marker([lat, lng], {
        icon,
        interactive: false
    });

    return L.layerGroup([circle, marker]);
}
