import {
    parseAsString,
    parseAsStringLiteral,
    useQueryStates,
    parseAsIsoDateTime,
} from "nuqs";

import { TaskStatus } from "../types";

export const useTaskFilters = () => {
    return useQueryStates({
        projectId: parseAsString.withOptions({ clearOnDefault: true }),
        status: parseAsStringLiteral(Object.values(TaskStatus)).withOptions({
            clearOnDefault: true,
        }),
        assigneeId: parseAsString.withOptions({ clearOnDefault: true }),
        search: parseAsString
            .withDefault("")
            .withOptions({ clearOnDefault: true }),
        startDate: parseAsIsoDateTime.withOptions({ clearOnDefault: true }),
        endDate: parseAsIsoDateTime.withOptions({ clearOnDefault: true }),
    });
};
