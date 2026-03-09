import { loadMarkdown } from "@/lib/load-markdown";
import { PrivacyView } from "@/features/legacy/components/privacy-view"

const Page = () => {
  const content = loadMarkdown("privacy-policy.md");

  return (
    <PrivacyView content={content} />
  )
}

export default Page