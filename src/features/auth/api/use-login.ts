import { client } from "@/lib/rpc";
import { useMutation } from "@tanstack/react-query";
import { InferRequestType, InferResponseType } from "hono";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type ResponseType = InferResponseType<(typeof client.api.auth.login)["$post"]>;
type RequestType = InferRequestType<(typeof client.api.auth.login)["$post"]>;

type ErrorResponse = {
  error: string;
  type?: string;
};

export const useLogin = () => {
    const router = useRouter();

    const mutation = useMutation<ResponseType, Error, RequestType>({
        mutationFn: async ({ json }) => {
            const response = await client.api.auth.login["$post"]({ json });

            if (!response.ok) {
                const errorBody = (await response.json()) as ErrorResponse;
                throw new Error(errorBody.error)
            }

            return await response.json();
        },
        onSuccess: () => {
            toast.success("Login successfully");
            router.push("/");
        },
        onError: (error) => {
            console.log(error)
            toast.error(error.message);
        },
    });

    return mutation;
};
