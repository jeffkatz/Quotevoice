import { useEffect } from 'react';
import { useBlocker } from 'react-router-dom';

export function useUnsavedChanges(isDirty: boolean) {
    // Handle Window Close / Refresh
    // Handle Window Close / Refresh - Disabled to allow Close button to always work
    /*
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isDirty) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isDirty]);
    */

    // Handle Navigation
    const blocker = useBlocker(
        ({ currentLocation, nextLocation }) =>
            isDirty && currentLocation.pathname !== nextLocation.pathname
    );

    useEffect(() => {
        if (blocker.state === "blocked") {
            const leave = window.confirm("You have unsaved changes. Are you sure you want to leave without saving?");
            if (leave) {
                blocker.proceed();
            } else {
                blocker.reset();
            }
        }
    }, [blocker]);
}
