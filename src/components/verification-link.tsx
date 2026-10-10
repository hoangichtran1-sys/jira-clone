import {
    Container,
    Head,
    Heading,
    Html,
    Section,
    Tailwind,
    Text,
    Link,
} from "@react-email/components";

export function VerificationLinkEmail({
    link,
    expires,
}: {
    link: string;
    expires: Date;
}) {
    return (
        <Html>
            <Tailwind>
                <Head />
                <Container className="container px-20 font-sans">
                    <Heading className="text-xl font-bold mb-4">
                        Verify Email
                    </Heading>
                    <Text className="text-sm">
                        Please click the following link to verify your email.
                    </Text>
                    <Section className="text-center">
                        <Link href={link} className="font-semibold">
                            Verification link
                        </Link>
                        <Text>
                            (This link is valid for{" "}
                            {Math.ceil((+expires - Date.now()) / (60 * 1000))}{" "}
                            minutes)
                        </Text>
                    </Section>
                </Container>
            </Tailwind>
        </Html>
    );
}
