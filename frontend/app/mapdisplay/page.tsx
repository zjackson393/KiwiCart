'use client'
import {useState} from 'react'
import {useEffect} from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import type { Route } from './types'
import styles from './mapdisplay.module.css'
import Icon from '@/app/components/Icon'
import { ProtectedRoute } from "@/auth/ProtectedRoute";
import { getSelectedRoute, saveTripSummary } from '@/lib/cart'
import { saveRouteSnapshot, clearRouteSnapshot } from '@/lib/offlineRoute'
import WorkflowProgress from '@/app/workflow/WorkflowProgress'
import SlideStage from '@/app/workflow/SlideStage'
import { Journey, toMapRoute, lineTotalCents } from './journey'

const Map = dynamic(() => import('./map'), { ssr: false});

export default function KiwicartMapping() {
    const router = useRouter();
    const [route, setRoute] = useState<Route | null>(null);
    const [status, setStatus] = useState<'loading' | 'missing' | 'ready'>('loading');
    const [checkedItems, setCheckedItems] = useState<boolean[][]>([]);
    const start = route?.start;
    const stops = route?.stops ?? [];

    useEffect(() => {
        let cancelled = false;
        getSelectedRoute()
        .then((apiRoute) => {
            if (cancelled) return;
            if (!apiRoute) {
                clearRouteSnapshot();
                setStatus('missing');
                return;
            }
            saveRouteSnapshot(apiRoute);
            const mapped = toMapRoute(apiRoute);
            setRoute(mapped);
            setCheckedItems(mapped.stops.map((stop) => stop.items.map(() => false)));
            setStatus('ready');
        })
        .catch(() => {
            if (!cancelled) setStatus('missing');

        });
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        if (status === 'missing') {
            router.replace('/routechoice');
        }
    }, [status, router]);

    useEffect(() => {
        if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').catch(() => {});
        }
    }, []);

    function toggleItem(stopIndex: number, itemIndex: number) {
        setCheckedItems((prev) => {
            const next = prev.map((arr) => [...arr]);
            next[stopIndex][itemIndex] = !next[stopIndex][itemIndex];
            return next;
        });
    }

    async function handleFinishTrip() {
        if (!route) return;
        const spentCents = checkedItems.reduce((total, stopChecks, si) => {
            return total + stopChecks.reduce((stopTotal, isChecked, ii) => {
                return isChecked ? stopTotal + lineTotalCents(stops[si].items[ii]) : stopTotal;
            }, 0);
        }, 0);
        const spent = spentCents / 100;
        const duration = route.legs.reduce((sum, leg) => sum + (leg?.duration ?? 0), 0);

        await saveTripSummary({
            duration,
            stopCount: stops.length,
            spent,
        });

        router.push('/complete');
    }

    return (
        <ProtectedRoute>
            <div>
                <WorkflowProgress current={3} unlockedUpTo={3} />
                <SlideStage>
                    <div style={{ height: '300px', width: '100%' }}>
                        {route && start && <Map route={route} start={start} stops={stops}/>}
                    </div>
                    {route && (
                        <div className={styles.offlineRow}>
                            <a href="/offline" className={styles.offlineLink}>Use offline</a>
                        </div>
                    )}
                    {route
                        ? <Journey route={route} checkedItems={checkedItems} onToggleItem={toggleItem} />
                        : <p style={{ padding: '24px', textAlign: 'center' }}>Loading your trip…</p>}
                    {route && (
                        <div className={styles.tripCompleteBar}>
                            <button type="button" className={styles.tripCompleteBtn} onClick={handleFinishTrip}>
                                Finish trip <Icon name="check" size={16} />
                            </button>
                        </div>
                    )}
                </SlideStage>
            </div>
        </ProtectedRoute>
    );
}
