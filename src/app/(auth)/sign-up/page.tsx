import { SignUpCard } from "@/features/auth/components/sign-up-card";
import { requireUnauth } from "@/lib/auth-utils";

const Page = async () => {
    await requireUnauth();

    return <SignUpCard />;
};

export default Page;
