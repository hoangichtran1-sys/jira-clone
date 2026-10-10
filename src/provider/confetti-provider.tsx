"use client";

import { confettiState } from "@/features/subscriptions/atoms/confetti-state";
import { useAtom } from "jotai";
import ReactConfetti from "react-confetti";

export const ConfettiProvider = () => {
    const [isOpenConfetti, setIsOpenConfetti] = useAtom(confettiState);

    if (!isOpenConfetti) return null;

    return (
        <ReactConfetti
            className="pointer-events-none z-100"
            numberOfPieces={500}
            recycle={false}
            onConfettiComplete={() => setIsOpenConfetti(false)}
        />
    );
};
