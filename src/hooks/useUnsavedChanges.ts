import { useEffect, useState, useCallback } from 'react';
import { useBlocker } from 'react-router-dom';

export function useUnsavedChanges(isDirty: boolean) {
    const [showModal, setShowModal] = useState(false);

    // Handle Navigation
    const blocker = useBlocker(
        ({ currentLocation, nextLocation }) =>
            isDirty && currentLocation.pathname !== nextLocation.pathname
    );

    useEffect(() => {
        if (blocker.state === "blocked") {
            setShowModal(true);
        } else {
            setShowModal(false);
        }
    }, [blocker]);

    const confirmLeave = useCallback(() => {
        if (blocker.state === "blocked") {
            blocker.proceed();
        }
    }, [blocker]);

    const cancelLeave = useCallback(() => {
        if (blocker.state === "blocked") {
            blocker.reset();
        }
    }, [blocker]);

    return { showModal, confirmLeave, cancelLeave };
}
