import { useEffect, useState } from "react";

interface UseEntitySearchProps<
    T extends {
        search: string;
    },
> {
    params: T;
    setParams: (params: T) => void;
    debounceMs?: number;
}

export function useEntitySearch<
    T extends {
        search: string;
    },
>({ params, setParams, debounceMs = 500 }: UseEntitySearchProps<T>) {
    const [localSearch, setLocalSearch] = useState(params.search);

    useEffect(() => {
        if (localSearch === "" && params.search !== "") {
            setParams({
                ...params,
                search: "",
            });
            return;
        }

        const timer = setTimeout(() => {
            if (localSearch !== params.search) {
                setParams({
                    ...params,
                    search: localSearch,
                });
            }
        }, debounceMs);

        return () => clearTimeout(timer);
    }, [localSearch, params, setParams, debounceMs]);

    useEffect(() => {
        setLocalSearch(params.search);
    }, [params.search]);

    return {
        searchValue: localSearch,
        onSearchChange: setLocalSearch,
    };
}
