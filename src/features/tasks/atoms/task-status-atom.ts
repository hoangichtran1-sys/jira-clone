import { atom } from "jotai";
import { TaskStatus } from "../types";

export const taskStatusAtom = atom<TaskStatus>(TaskStatus.BACKLOG);
