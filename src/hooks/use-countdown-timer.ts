import { useCallback, useEffect, useState } from "react";

const DURATION_SECONDS = 5 * 60;

export const useCountdownTimer = () => {
    const [expiresAt, setExpiresAt] = useState<number | null>(() => {
        if (typeof window !== "undefined") {
            return Number(sessionStorage.getItem("otp_expires_at")) ?? null;
        }
        return null;
    });
    const [timeLeft, setTimeLeft] = useState(0);

    const startTimer = useCallback(() => {
        const now = Date.now();
        const expiration = now + DURATION_SECONDS * 1000;

        setExpiresAt(expiration);
        setTimeLeft(DURATION_SECONDS);
        sessionStorage.setItem("otp_expires_at", String(expiration));
    }, []);

    useEffect(() => {
        if (!expiresAt) return;

        const interval = setInterval(() => {
            const now = Date.now();
            const diff = Math.ceil((expiresAt - now) / 1000);

            if (diff <= 0) {
                setTimeLeft(0);
                setExpiresAt(null); // Reset khi hết giờ
                clearInterval(interval);
                sessionStorage.removeItem("otp_expires_at");
            } else {
                setTimeLeft(diff);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [expiresAt]);

    return {
        timeLeft,
        hasEnded: timeLeft <= 0,
        startTimer,
    };
};
