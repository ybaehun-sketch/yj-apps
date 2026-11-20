import { queryOptions } from "@tanstack/react-query";
import { listStories } from "./stories.functions";

export const storiesQuery = queryOptions({ queryKey: ["stories"], queryFn: () => listStories() });
