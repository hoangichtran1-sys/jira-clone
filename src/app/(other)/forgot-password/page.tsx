import { ForgotPassword } from "@/features/auth/components/forgot-password";
import { requireUnauth } from "@/lib/auth-utils";

export default async function Page() {
   await requireUnauth();  
 
    return (
        <div className="flex min-h-svh w-full items-center justify-center">
            <div className="w-full h-full">
                <ForgotPassword />
            </div>
        </div>
    );
}
