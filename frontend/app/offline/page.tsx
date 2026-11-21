'use client'
import { useEffect, useRef, useState } from 'react'
import type { Route } from '@/app/mapdisplay/types'
import { Journey, toMapRoute } from '@/app/mapdisplay/journey'
import { loadRouteSnapshot, routeToString, loadChecks, saveChecks } from '@/lib/offlineRoute'
import SlideStage from '@/app/workflow/SlideStage'

export default function OfflineRoute() {
    const [route, setRoute] = useState<Route | null>(null);
    const [status, setStatus] = useState<'loading' | 'missing' | 'ready'>('loading');
    const [checkedItems, setCheckedItems] = useState<boolean[][]>([]);
    const routeStringRef = useRef('');

    /* eslint-disable react-hooks/set-state-in-effect */
    useEffect(() => {
        const snapshot = loadRouteSnapshot();
        if (!snapshot) {
            setStatus('missing');
            return;
        }
        const mapped = toMapRoute(snapshot);
        setRoute(mapped);
        setCheckedItems(mapped.stops.map((stop) => stop.items.map(() => false)));
        const routeString = routeToString(snapshot);
        routeStringRef.current = routeString;
        setCheckedItems(
            loadChecks(routeString) ?? mapped.stops.map((stop) => stop.items.map(()=>false))
        );
    }, []);
    /* eslint-enable react-hooks/set-state-in-effect */

    function toggleItem(stopIndex: number, itemIndex: number) {
        const next = checkedItems.map((arr) => [...arr]);
        next[stopIndex][itemIndex] = !next[stopIndex][itemIndex];
        setCheckedItems(next);
        saveChecks(routeStringRef.current, next);
    }

    return (
        <div>
            <SlideStage>
                {route ? (
                    <>
                        <div style={{
                            height: '50px',
                            paddingTop: '8px',
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '0 24px',
                            textAlign: 'center',
                            fontSize: '0.85rem',
                            color: 'var(--ink-muted, var(--kcGreenMidText, #3C6B29))',
                            background: 'var(--surface-alt, var(--kcCreamLight))',
                        }}>
                            Map display is not available offline.
                        </div>
                        <Journey route={route} checkedItems={checkedItems} onToggleItem={toggleItem} />
                    </>
                ) : (
                    <p style={{ padding: '24px', textAlign: 'center' }}>
                        {status === 'missing'
                            ? 'No route available. Open your route while online first, then it will be available offline.'
                            : 'Loading your trip…'}
                    </p>
                )}
            </SlideStage>
        </div>
    );
}
