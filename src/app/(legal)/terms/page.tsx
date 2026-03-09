import { loadMarkdown } from "@/lib/load-markdown";
import { TermsView } from "@/features/legacy/components/terms-view";

const Page = () => {
    const content = loadMarkdown("terms-of-service.md");

    return <TermsView content={content} />;
};

export default Page;
