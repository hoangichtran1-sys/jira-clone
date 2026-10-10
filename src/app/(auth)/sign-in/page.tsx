import { SignInCard } from "@/features/auth/components/sign-in-card";
import { requireUnauth } from "@/lib/auth-utils";

const Page = async () => {
    await requireUnauth();

    return <SignInCard />;
};

export default Page;
